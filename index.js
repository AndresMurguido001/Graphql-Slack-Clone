import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import sequelize from 'sequelize';

import models from "./models";

import typeDefs from './schema';
import resolvers from './resolvers';


const schema = makeExecutableSchema({
    typeDefs,
    resolvers
})

const app = express();
const graphqlEndPoint = "/graphql";
app.use(graphqlEndPoint, bodyParser.json(), graphqlExpress({ schema }));
app.use('/graphiql', graphiqlExpress({ endpointURL: graphqlEndPoint }));

models.sequelize.sync().then((x) => {
    app.listen(8080);
})