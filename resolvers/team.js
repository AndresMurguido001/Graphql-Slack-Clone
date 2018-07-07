import { formatErrors } from "../formatErrors";
import { requiresAuth } from '../permissions';
export default {
    Query: {
        allTeams: requiresAuth.createResolver(async (parent, args, { models, user }) =>            
            models.Team.findAll({ where: { owner: user.id } }, { raw: true })),
            
        },       
    Mutation: {
        createTeam: requiresAuth.createResolver(async (parent, args, { models, user }) => {
            try { 
                const team = await models.Team.create({...args, owner: user.id});
                models.Channel.create({ name: "general", public: true, teamId: team.id });                
                return {
                    ok: true                    
                };
            } catch (error) {                               
                return {
                    ok: false,
                    errors: formatErrors(error, models)
                };
            }
        }),
    },
    Team: {
        channels: ({ id }, args, { models }) => models.Channel.findAll({ where: { teamId: id } }),
    }
};