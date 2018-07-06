import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import path from 'path';
import { fileLoader, mergeTypes, mergeResolvers } from 'merge-graphql-schemas';
import cors from "cors";
import jwt from 'jsonwebtoken';
import { refreshTokens } from "./auth"
import models from "./models";

//merge all files in schema directory to create typedefs
const types = fileLoader(path.join(__dirname, './schema'));
const typeDefs = mergeTypes(types, { all: true });
//merge all files in resolvers directory to create resolvers
const resolverFiles = fileLoader(path.join(__dirname, './resolvers'));
const resolvers = mergeResolvers(resolverFiles, { all: true });

const SECRET = "lksdlkajsdljasldkjasldj";
const SECRET2 = "poiuyghjikmnbvfrtgcvfd";

const schema = makeExecutableSchema({
    typeDefs,
    resolvers
})

const app = express();
app.use(cors("*"));

const addUser = async (req, res, next) => {
    const token = req.headers['x-token'];
    if (token) {
        try {            
            const { user } = jwt.verify(token, SECRET);
            req.user = user; 
            console.log(user)                                              
        } catch (err) {
            const refreshToken = req.headers['x-refresh-token'];
            const newTokens = await refreshTokens(token, refreshToken, models, SECRET, SECRET2);
            if (newTokens.token && newTokens.refreshToken) {
                res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
                res.set('x-token', newTokens.token);
                res.set('x-refresh-token', newTokens.refreshToken);
            }
        req.user = newTokens.user;    
        }
    }
    next();
};
app.use(addUser);
const graphqlEndPoint = "/graphql";
app.use(graphqlEndPoint,
        bodyParser.json(),
        graphqlExpress(req => ({
                        schema,
                        context: {
                            models, 
                            user: req.user,
                            SECRET,
                            SECRET2
                        },
                    }),
));                   
app.use('/graphiql',
        graphiqlExpress({
                endpointURL: graphqlEndPoint 
            }));

models.sequelize.sync().then((x) => {
    app.listen(8080);
})