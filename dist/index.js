"use strict";

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _apolloServerExpress = require("apollo-server-express");

var _graphqlTools = require("graphql-tools");

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _mergeGraphqlSchemas = require("merge-graphql-schemas");

var _cors = require("cors");

var _cors2 = _interopRequireDefault(_cors);

var _jsonwebtoken = require("jsonwebtoken");

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _auth = require("./auth");

var _models = require("./models");

var _models2 = _interopRequireDefault(_models);

var _formidable = require("formidable");

var _formidable2 = _interopRequireDefault(_formidable);

var _dataloader = require("dataloader");

var _dataloader2 = _interopRequireDefault(_dataloader);

var _batchFunctions = require("./batchFunctions");

var _http = require("http");

var _graphql = require("graphql");

var _subscriptionsTransportWs = require("subscriptions-transport-ws");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//merge all files in schema directory to create typedefs
const types = (0, _mergeGraphqlSchemas.fileLoader)(_path2.default.join(__dirname, "./schema"));

//Subscriptions setup

const typeDefs = (0, _mergeGraphqlSchemas.mergeTypes)(types, { all: true });
//merge all files in resolvers directory to create resolvers
const resolverFiles = (0, _mergeGraphqlSchemas.fileLoader)(_path2.default.join(__dirname, "./resolvers"));
const resolvers = (0, _mergeGraphqlSchemas.mergeResolvers)(resolverFiles, { all: true });

const SECRET = "lksdlkajsdljasldkjasldj";
const SECRET2 = "poiuyghjikmnbvfrtgcvfd";

const schema = (0, _graphqlTools.makeExecutableSchema)({
  typeDefs,
  resolvers
});

const app = (0, _express2.default)();
app.use((0, _cors2.default)("*"));
//FILE MIDDLEWARE

const uploadDir = "files";

const fileMiddleware = (req, res, next) => {
  if (!req.is("multipart/form-data")) {
    return next();
  }

  const form = _formidable2.default.IncomingForm({
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

app.use("/files", _express2.default.static("files"));

const server = (0, _http.createServer)(app);

(0, _models2.default)().then(models => {
  if (!models) {
    console.log("Could not connect to db");
    return;
  }
  const addUser = async (req, res, next) => {
    const token = req.headers["x-token"];

    if (token) {
      try {
        const { user } = _jsonwebtoken2.default.verify(token, SECRET);
        req.user = user;
      } catch (err) {
        const refreshToken = req.headers["x-refreshtoken"];
        const newTokens = await (0, _auth.refreshTokens)(token, refreshToken, models, SECRET, SECRET2);
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

  app.use(graphqlEndPoint, _bodyParser2.default.json(), fileMiddleware, (0, _apolloServerExpress.graphqlExpress)(req => ({
    schema,
    context: {
      models,
      user: req.user,
      SECRET,
      SECRET2,
      channelLoader: new _dataloader2.default(ids => (0, _batchFunctions.channelBatcher)(ids, models, req.user)),
      serverUrl: `${req.protocol}://${req.get("host")}`
    }
  })));

  app.use("/graphiql", (0, _apolloServerExpress.graphiqlExpress)({
    endpointURL: graphqlEndPoint,
    subscriptionsEndpoint: "ws://localhost:8080/subscriptions"
  }));

  models.sequelize.sync().then(x => {
    server.listen(8080, () => {
      new _subscriptionsTransportWs.SubscriptionServer({
        execute: _graphql.execute,
        subscribe: _graphql.subscribe,
        schema,
        onConnect: async ({ token, refreshToken }, webSocket) => {
          if (token && refreshToken) {
            try {
              let { user } = _jsonwebtoken2.default.verify(token, SECRET);
              return { models, user };
            } catch (err) {
              const newTokens = await refreshToken(token, refreshToken, SECRET, SECRET2);
              user = newTokens.user;
              return { user, models };
            }
            if (!user) {
              throw new Error("Invalid Tokens!");
            }
          }
          return { models };
        }
      }, {
        server: server,
        path: "/subscriptions"
      });
    });
  });
});