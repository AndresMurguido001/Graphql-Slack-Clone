export default `
    type Team {
        id: Int!
        name: String!
        members: [User!]!
        channels: [Channel!]!
        directMessageMembers: [User!]!
        admin: Boolean!
    }    
    type CreateTeamResponse {
        ok: Boolean!
        team: Team       
        errors: [Error!]        
    }

    type Query {
        allTeams: [Team!]!
        invitedToTeams: [Team!]!
        getTeamMembers(teamId: Int!): [User!]!
    }
    type VoidResponse {
        ok: Boolean!
        errors: [Error!]
    }
    type Mutation {
        createTeam(name: String!): CreateTeamResponse!
        addTeamMember(email: String!, teamId: Int!): VoidResponse!
    }
`;
