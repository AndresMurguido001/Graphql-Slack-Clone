export default `    
    type User {
        id: Int!
        email: String!
        username: String!
        teams: [Team!]!        
    }
    
    type Query {
        getUser(id: Int!): User!
        allUsers: [User!]!
    }
    type Mutation {
        registerUser(username: String!, email: String!, password: String!): Boolean!
    }
`