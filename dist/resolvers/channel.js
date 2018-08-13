"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _formatErrors = require("../formatErrors");

var _permissions = require("../permissions");

exports.default = {
  Query: {
    allChannels: async (parent, args, { models }) => models.Channel.findAll()
  },
  Mutation: {
    getOrCreateChannel: _permissions.requiresAuth.createResolver(async (parent, { members, teamId }, { models, user }) => {
      const member = await models.Member.findOne({ where: { teamId, userId: user.id } }, { raw: true });
      if (!member) {
        throw new Error("You are not a member");
      }

      const allMembers = [...members, user.id];

      //check if channel exists with members
      // array_agg(pc.user_id) <- concats into array pc.user_id
      const [data, result] = await models.sequelize.query(`
          select c.id, c.name 
          from channels as c, pcmembers pc
          where pc.channel_id = c.id and c.dm = true and c.public = false and c.team_id = ${teamId}
          group by c.id, c.name 
          having array_agg(pc.user_id) @> Array[${allMembers.join(",")}] and count(pc.user_id) = ${allMembers.length}
        `, { raw: true });
      console.log(data, result);
      if (data.length) {
        return data[0];
      }

      const users = await models.User.findAll({
        raw: true,
        where: { id: { [models.sequelize.Op.in]: members } }
      });

      const name = users.map(u => u.username).join(", ");

      const channelId = await models.sequelize.transaction(async transaction => {
        const channel = await models.Channel.create({ name, public: false, dm: true, teamId }, {
          transaction
        });
        const cId = channel.dataValues.id;
        const pcmembers = allMembers.map(m => ({
          userId: m,
          channelId: cId
        }));
        console.log(channel);
        await models.PCMember.bulkCreate(pcmembers, { transaction });
        return cId;
      });
      return {
        id: channelId,
        name
      };
    }),
    createChannel: _permissions.requiresAuth.createResolver(async (parent, args, { models, user }) => {
      try {
        const member = await models.Member.findOne({ where: { teamId: args.teamId, userId: user.id } }, { raw: true });
        if (!member.admin) {
          return {
            ok: false,
            errors: [{
              path: "name",
              message: "You must be the owner to add and delete channels."
            }]
          };
        }
        const response = await models.sequelize.transaction(async transaction => {
          const channel = await models.Channel.create(args, {
            transaction
          });
          if (!args.public) {
            const members = args.members.filter(m => m.id !== user.id);
            members.push(user.id);
            await models.PCMember.bulkCreate(args.members.map(m => ({
              userId: m,
              channelId: channel.id
            })), { transaction });
          }
          return channel;
        });
        return {
          ok: true,
          channel: response
        };
      } catch (error) {
        return {
          ok: false,
          errors: (0, _formatErrors.formatErrors)(error, models)
        };
      }
    })
  }
};