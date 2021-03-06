"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = `
    type Channel {
        id: Int!
        name: String!
        messages: [Message!]!
        public: Boolean!
        users: [User!]!
        dm: Boolean!
    }
    type ChannelResponse {
        ok: Boolean!
        channel: Channel
        errors: [Error!]
    }
    type Query {
        allChannels: [Channel!]!
    }
    type DMChannelResponse {
        id: Int!
        name: String!
    }
    type Mutation {
        createChannel(teamId: Int!, name: String!, public: Boolean=false, members: [Int!]): ChannelResponse
        getOrCreateChannel(teamId: Int!, members: [Int!]!): DMChannelResponse!
    }
`;