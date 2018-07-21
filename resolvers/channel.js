import { formatErrors } from "../formatErrors";
import { requiresAuth } from '../permissions';

export default {
    Query: {
        allChannels: async (parent, args, { models }) => models.Channel.findAll(),            
    },
    Mutation: {
        createChannel: requiresAuth.createResolver(async (parent, args, { models, user }) => {
            try {
                const member = await models.Member.findOne({ where: { teamId: args.teamId, userId: user.id }}, { raw: true });
                if (!member.admin){
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