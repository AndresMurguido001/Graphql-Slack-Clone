import {
  requiresAuth,
  requiresTeamAccess,
  directMessageSub
} from "../permissions";
import { withFilter } from "graphql-subscriptions";
import pubsub from "../pubsub";

const NEW_DIRECT_MESSAGE = "NEW_DIRECT_MESSAGE";

export default {
  Subscription: {
    newDirectMessage: {
      subscribe: directMessageSub.createResolver(
        withFilter(
          () => pubsub.asyncIterator(NEW_DIRECT_MESSAGE),
          (payload, args, { user }) =>
            payload.teamId === args.teamId &&
            ((payload.senderId === user.id &&
              payload.receiverId === args.userId) ||
              (payload.senderId === args.userId &&
                payload.receiverId === user.id))
        )
      )
    }
  },
  DirectMessage: {
    sender: ({ sender, senderId }, args, { models }) => {
      if (sender) {
        return sender;
      }
      return models.User.findOne({ where: { id: senderId } }, { raw: true });
    }
  },
  Query: {
    directMessages: requiresAuth.createResolver(
      async (parent, { teamId, otherUserId }, { models, user }) =>
        await models.DirectMessage.findAll(
          {
            order: [["created_at", "ASC"]],
            where: {
              teamId,
              [models.sequelize.Op.or]: [
                {
                  [models.sequelize.Op.and]: [
                    { receiverId: otherUserId },
                    { senderId: user.id }
                  ]
                },
                {
                  [models.sequelize.Op.and]: [
                    { receiverId: user.id },
                    { senderId: otherUserId }
                  ]
                }
              ]
            }
          },
          { raw: true }
        )
    )
  },
  Mutation: {
    createDirectMessage: async (parent, args, { models, user }) => {
      try {
        const directMessage = await models.DirectMessage.create({
          ...args,
          senderId: user.id
        });
        pubsub.publish(NEW_DIRECT_MESSAGE, {
          teamId: args.teamId,
          receiverId: args.receiverId,
          senderId: user.id,
          newDirectMessage: {
            ...directMessage.dataValues,
            sender: {
              username: user.username
            }
          }
        });

        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    }
  }
};
