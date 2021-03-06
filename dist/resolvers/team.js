"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _formatErrors = require("../formatErrors");

var _permissions = require("../permissions");

exports.default = {
  Query: {
    getTeamMembers: _permissions.requiresAuth.createResolver((parent, { teamId }, { models }) => {
      return models.sequelize.query("select * from users as u join members as m on m.user_id = u.id where m.team_id = ?", {
        replacements: [teamId],
        model: models.User,
        raw: true
      });
    })
  },
  Mutation: {
    createTeam: _permissions.requiresAuth.createResolver(async (parent, args, { models, user }) => {
      try {
        const response = await models.sequelize.transaction(async transaction => {
          const team = await models.Team.create(_extends({}, args), { transaction });
          await models.Channel.create({
            name: "general",
            public: true,
            teamId: team.id
          }, { transaction });
          await models.Member.create({
            userId: user.id,
            admin: true,
            teamId: team.id
          }, { transaction });
          return team;
        });
        return {
          ok: true,
          team: response
        };
      } catch (error) {
        return {
          ok: false,
          errors: (0, _formatErrors.formatErrors)(error, models)
        };
      }
    }),
    addTeamMember: _permissions.requiresAuth.createResolver(async (parent, { email, teamId }, { models, user }) => {
      try {
        const memberPromise = models.Member.findOne({ where: { teamId, userId: user.id } }, { raw: true });
        const userToAddPromise = models.User.findOne({ where: { email } }, { raw: true });
        const [member, userToAdd] = await Promise.all([memberPromise, userToAddPromise]);
        if (!member.admin) {
          return {
            ok: false,
            errors: [{
              path: "email",
              message: "Only the team owner can add members."
            }]
          };
        }
        if (!userToAdd) {
          return {
            ok: false,
            errors: [{
              path: "email",
              message: "Could not find user with this email."
            }]
          };
        }
        await models.Member.create({ userId: userToAdd.id, teamId });
        return {
          ok: true
        };
      } catch (error) {
        return {
          ok: false,
          errors: (0, _formatErrors.formatErrors)(error, models)
        };
      }
    })
  },
  Team: {
    channels: ({ id }, args, { channelLoader }) => channelLoader.load(id),
    directMessageMembers: ({ id }, args, { models, user }) => models.sequelize.query("select distinct on (u.id) u.id, u.username from users as u join direct_messages as dm on (u.id = dm.sender_id) or (u.id = receiver_id) where (:currentUserId = dm.sender_id or :currentUserId = dm.receiver_id) and dm.team_id = :teamId", {
      replacements: {
        currentUserId: user.id,
        teamId: id
      },
      model: models.User,
      raw: true
    })
  }
};