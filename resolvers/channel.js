import { formatErrors } from "../formatErrors";
import { requiresAuth } from '../permissions';

export default {
    Query: {
        allChannels: async (parent, args, { models }) => models.Channel.findAll(),            
    },
    Mutation: {
        createChannel: requiresAuth.createResolver(async (parent, args, { models, user }) => {
            try {
                const team = await models.Team.findOne({ where: { id: args.teamId }}, { raw: true });
                if (team.owner !== user.id){
                    return {
                        ok: false,
                        errors: [
                            {
                                path: "name",
                                message: "You must be the owner to add and delete channels."
                            }
                        ]
                    }
                }
                const channel = await models.Channel.create(args);
                return {
                    ok: true,
                    channel
                };
            } catch (error) {
                return {
                    ok: false,
                    errors: formatErrors(error, models),
                }
            }

        }),
    }  
};