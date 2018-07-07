import { formatErrors } from "../formatErrors";

export default {
    Query: {
        allChannels: async (parent, args, { models }) => models.Channel.findAll(),            
    },
    Mutation: {
        createChannel: async (parent, args, { models }) => {
            try {
                const channel = await models.Channel.create(args);
                return {
                    ok: true,
                    channel
                };
            } catch (error) {
                return {
                    ok: false,
                    errors: formatErrors(error)
                }
            }

        }
    }  
};