import express from "express";
import bodyParser from "body-parser";
import { graphqlExpress, graphiqlExpress } from "apollo-server-express";
import { makeExecutableSchema } from "graphql-tools";
import path from "path";
import { fileLoader, mergeTypes, mergeResolvers } from "merge-graphql-schemas";
import cors from "cors";
import jwt from "jsonwebtoken";
import { refreshTokens } from "./auth";
import getModels from "./models";
import formidable from "formidable";
import Dataloader from "dataloader";
import { channelBatcher } from "./batchFunctions";

//Subscriptions setup
import { createServer } from "http";
import { execute, subscribe } from "graphql";
import { SubscriptionServer } from "subscriptions-transport-ws";

//merge all files in schema directory to create typedefs
const types = fileLoader(path.join(__dirname, "./schema"));
const typeDefs = mergeTypes(types, { all: true });
//merge all files in resolvers directory to create resolvers
const resolverFiles = fileLoader(path.join(__dirname, "./resolvers"));
const resolvers = mergeResolvers(resolverFiles, { all: true });

const SECRET = "lksdlkajsdljasldkjasldj";
const SECRET2 = "poiuyghjikmnbvfrtgcvfd";

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

const app = express();
app.use(cors("*"));
//FILE MIDDLEWARE

const uploadDir = "files";

const fileMiddleware = (req, res, next) => {
  if (!req.is("multipart/form-data")) {
    return next();
  }

  const form = formidable.IncomingForm({
    uploadDir
  });

  form.parse(req, (error, { operations }, files) => {
    if (error) {
      console.log(error);
    }

    const document = JSON.parse(operations);

    if (Object.keys(files).length) {
      const {
        file: { type, path: filePath }
      } = files;
      document.variables.file = {
        type,
        path: filePath
      };
    }

    req.body = document;
    next();
  });
};

const graphqlEndPoint = "/graphql";

app.use("/files", express.static("files"));

const server = createServer(app);

getModels().then(models => {
  if (!models) {
    console.log("Could not connect to db");
    return;
  }
  const addUser = async (req, res, next) => {
    const token = req.headers["x-token"];

    if (token) {
      try {
        const { user } = jwt.verify(token, SECRET);
        req.user = user;
      } catch (err) {
        const refreshToken = req.headers["x-refreshtoken"];
        const newTokens = await refreshTokens(
          token,
          refreshToken,
          models,
          SECRET,
          SECRET2
        );
        if (newTokens.token && newTokens.refreshToken) {
          res.set("Access-Control-Expose-Headers", "x-token, x-refreshToken");
          res.set("x-token", newTokens.token);
          res.set("x-refreshToken", newTokens.refreshToken);
        }
        req.user = newTokens.user;
      }
    }
    next();
  };

  app.use(addUser);

  app.use(
    graphqlEndPoint,
    bodyParser.json(),
    fileMiddleware,
    graphqlExpress(req => ({
      schema,
      context: {
        models,
        user: req.user,
        SECRET,
        SECRET2,
        channelLoader: new Dataloader(ids =>
          channelBatcher(ids, models, req.user)
        ),
        serverUrl: `${req.protocol}://${req.get("host")}`
      }
    }))
  );

  app.use(
    "/graphiql",
    graphiqlExpress({
      endpointURL: graphqlEndPoint,
      subscriptionsEndpoint: "ws://localhost:8080/subscriptions"
    })
  );

  models.sequelize.sync().then(x => {
    server.listen(8080, () => {
      new SubscriptionServer(
        {
          execute,
          subscribe,
          schema,
          onConnect: async ({ token, refreshToken }, webSocket) => {
            if (token && refreshToken) {
              try {
                let { user } = jwt.verify(token, SECRET);
                return { models, user };
              } catch (err) {
                const newTokens = await refreshToken(
                  token,
                  refreshToken,
                  SECRET,
                  SECRET2
                );
                user = newTokens.user;
                return { user, models };
              }
              if (!user) {
                throw new Error("Invalid Tokens!");
              }
            }
            return { models };
          }
        },
        {
          server: server,
          path: "/subscriptions"
        }
      );
    });
  });
});
