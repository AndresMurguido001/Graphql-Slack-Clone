import { formatErrors } from "../formatErrors";
import { requiresAuth } from '../permissions';
export default {
    Mutation: {
        createTeam: requiresAuth.createResolver(async (parent, args, { models, user }) => {
            try { 
                console.log(user);
                await models.Team.create({...args, owner: user.id})
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
    }
};