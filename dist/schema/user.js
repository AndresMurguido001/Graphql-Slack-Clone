"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = `    
    type User {
        id: Int!
        email: String!
        username: String!
        teams: [Team!]!        
    }
    type RegisterResponse {
        ok: Boolean!
        user: User
        errors: [Error!]        
    }
    type LoginResponse {
        ok: Boolean!        
        errors: [Error!]        
        token: String
        refreshToken: String
    }
    type Query {
        me: User!
        allUsers: [User!]!
        getUser(userId: Int!): User
    }
    type Mutation {
        registerUser(username: String!, email: String!, password: String!): RegisterResponse!
        login(email: String!, password: String!): LoginResponse!
    }
`;