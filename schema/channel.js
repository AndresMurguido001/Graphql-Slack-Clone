export default `
    type Channel {
        id: Int!
        name: String!
        messages: [Message!]!
        public: Boolean!
        users: [User!]!
    }
    type ChannelResponse {
        ok: Boolean!
        channel: Channel
        errors: [Error!]
    }
    type Query {
        allChannels: [Channel!]!
    }
    type Mutation {
        createChannel(teamId: Int!, name: String!, public: Boolean=false): ChannelResponse
    }
`