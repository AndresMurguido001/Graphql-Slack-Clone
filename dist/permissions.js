"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
const createResolver = resolver => {
  const baseResolver = resolver;
  baseResolver.createResolver = childResolver => {
    const newResolver = async (parent, args, context, info) => {
      await resolver(parent, args, context, info);
      return childResolver(parent, args, context, info);
    };
    return createResolver(newResolver);
  };
  return baseResolver;
};

const requiresAuth = exports.requiresAuth = createResolver((parent, args, { user }) => {
  if (!user || !user.id) {
    throw new Error("You must be authenticated to continue");
  }
});
const requiresTeamAccess = exports.requiresTeamAccess = createResolver(async (parent, { channelId }, { user, models }) => {
  if (!user || !user.id) {
    throw new Error("You must be authenticated to continue");
  }
  // check if part of the team
  const channel = await models.Channel.findOne({ where: { id: channelId } });
  const member = await models.Member.findOne({
    where: { teamId: channel.teamId, userId: user.id }
  });
  if (!member) {
    throw new Error("You have to be a member of the team to subcribe to it's messages");
  }
});

const directMessageSub = exports.directMessageSub = createResolver(async (parent, { teamId, userId }, { user, models }) => {
  if (!user || !user.id) {
    throw new Error("You must be authenticated to continue");
  }
  // check if part of the team
  const members = await models.Member.findAll({
    where: {
      teamId,
      [models.sequelize.Op.or]: [{
        userId: user.id
      }, {
        userId
      }]
    }
  });
  if (members.length !== 2) {
    throw new Error("Something went wrong!");
  }
});