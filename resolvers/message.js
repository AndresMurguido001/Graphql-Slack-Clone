import { requiresAuth } from '../permissions';

export default {
    Message: {
        user: ({ userId }, args, { models }) => models.User.findOne({ where: { id: userId } }),
    },
    Query: {
        messages: requiresAuth.createResolver( async (parent, args, { models, user }) => await models.Message.findAll({ order: [[ "created_at", "ASC"]] ,where: { channelId: args.channelId }}, { raw: true })),
    },
    Mutation: {
        createMessage: async (parent, args, { models, user }) => {
            try {
                await models.Message.create({...args, userId: user.id})
                return true;
            } catch (error) {
                console.log(error)
                return false;
            }
        },
    }
};