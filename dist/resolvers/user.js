"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _auth = require("../auth");

var _formatErrors = require("../formatErrors");

var _permissions = require("../permissions");

var _member = require("../models/member");

var _member2 = _interopRequireDefault(_member);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  User: {
    teams: async (parent, args, { models, user }) => models.sequelize.query("select * from teams as team join members as member on team.id = member.team_id where member.user_id = ?", {
      replacements: [user.id],
      model: models.Team,
      raw: true
    })
  },
  Query: {
    me: _permissions.requiresAuth.createResolver((parent, { id }, { models, user }) => models.User.findOne({ where: { id: user.id } }), { raw: true }),
    getUser: _permissions.requiresAuth.createResolver((parent, { userId }, { models, user }) => models.User.findOne({ where: { id: userId } }), { raw: true }),
    allUsers: (parent, args, { models }) => models.User.findAll()
  },
  Mutation: {
    login: (parent, { email, password }, { models, SECRET, SECRET2 }) => (0, _auth.tryLoggingIn)(email, password, models, SECRET, SECRET2),
    registerUser: async (parent, args, { models }) => {
      try {
        let newUser = await models.User.create(args);
        return {
          ok: true,
          user: newUser
        };
      } catch (error) {
        console.log(error);
        return {
          ok: false,
          errors: (0, _formatErrors.formatErrors)(error, models)
        };
      }
    }
  }
};