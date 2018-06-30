import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import path from 'path';
import { fileLoader, mergeTypes, mergeResolvers } from 'merge-graphql-schemas';
import cors from "cors";

import models from "./models";

//merge all files in schema directory to create typedefs
const types = fileLoader(path.join(__dirname, './schema'));
const typeDefs = mergeTypes(types, { all: true });
//merge all files in resolvers directory to create resolvers
const resolverFiles = fileLoader(path.join(__dirname, './resolvers'));
const resolvers = mergeResolvers(resolverFiles, { all: true });

const schema = makeExecutableSchema({
    typeDefs,
    resolvers
})

const app = express();
app.use(cors("*"));
const graphqlEndPoint = "/graphql";
app.use(graphqlEndPoint,
        bodyParser.json(),
        graphqlExpress({
                        schema,
                        context: {
                            models, 
                            user: {
                                id: 1
                            },
                        },
                    }));
app.use('/graphiql',
        graphiqlExpress({
                endpointURL: graphqlEndPoint 
            }));

models.sequelize.sync().then((x) => {
    app.listen(8080);
})