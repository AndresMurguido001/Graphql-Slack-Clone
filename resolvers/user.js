import { tryLoggingIn } from "../auth";
import { formatErrors } from "../formatErrors";
import { requiresAuth } from "../permissions";
import member from "../models/member";

export default {
  User: {
    teams: async (parent, args, { models, user }) =>
      models.sequelize.query(
        "select * from teams as team join members as member on team.id = member.team_id where member.user_id = ?",
        {
          replacements: [user.id],
          model: models.Team,
          raw: true
        }
      )
  },
  Query: {
    me: requiresAuth.createResolver(
      (parent, { id }, { models, user }) =>
        models.User.findOne({ where: { id: user.id } }),
      { raw: true }
    ),
    getUser: requiresAuth.createResolver(
      (parent, { userId }, { models, user }) =>
        models.User.findOne({ where: { id: userId } }),
      { raw: true }
    ),
    allUsers: (parent, args, { models }) => models.User.findAll()
  },
  Mutation: {
    login: (parent, { email, password }, { models, SECRET, SECRET2 }) =>
      tryLoggingIn(email, password, models, SECRET, SECRET2),
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
          errors: formatErrors(error, models)
        };
      }
    }
  }
};
