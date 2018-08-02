import { requiresAuth, requiresTeamAccess } from "../permissions";
import { withFilter } from "graphql-subscriptions";
import pubsub from "../pubsub";

const NEW_CHANNEL_MESSAGE = "NEW_CHANNEL_MESSAGE";

export default {
  Subscription: {
    newChannelMessage: {
      subscribe: requiresTeamAccess.createResolver(
        withFilter(
          (parent, { channelId }, { models, user }) =>
            pubsub.asyncIterator(NEW_CHANNEL_MESSAGE),
          (payload, args) => payload.channelId === args.channelId
        )
      )
    }
  },
  Message: {
    url: parent =>
      parent.url ? `http://localhost:8080/${parent.url}` : parent.url,
    user: ({ user, userId }, args, { models }) => {
      if (user) {
        return user;
      }
      return models.User.findOne({ where: { id: userId } }, { raw: true });
    }
  },
  Query: {
    messages: requiresAuth.createResolver(
      async (parent, { channelId, cursor }, { models, user }) => {
        const channel = await models.Channel.findOne({
          where: { id: channelId },
          raw: true
        });
        if (!channel.public) {
          const member = await models.PCMember.findOne({
            raw: true,
            where: { channelId, userId: user.id }
          });
          if (!member) {
            throw new Error("You are not a member of this private channel");
          }
        }
        const options = {
          order: [["created_at", "DESC"]],
          where: { channelId },
          limit: 35
        };
        if (cursor) {
          options.where.created_at = {
            [models.op.lt]: cursor
          };
        }
        return await models.Message.findAll(options, { raw: true });
      }
    )
  },
  Mutation: {
    createMessage: async (parent, { file, ...args }, { models, user }) => {
      try {
        const messageData = args;
        if (file) {
          messageData.filetype = file.type;
          messageData.url = file.path;
        }
        const message = await models.Message.create({
          ...messageData,
          url: messageData.url,
          filetype: messageData.filetype,
          userId: user.id
        });
        console.log("MESSAGEDATA", messageData);
        const asyncFunc = async () => {
          const currentUser = await models.User.findOne({
            where: {
              id: user.id
            }
          });

          pubsub.publish(NEW_CHANNEL_MESSAGE, {
            channelId: args.channelId,
            newChannelMessage: {
              ...message.dataValues,
              user: currentUser.dataValues
            }
          });
        };
        asyncFunc();
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    }
  }
};
