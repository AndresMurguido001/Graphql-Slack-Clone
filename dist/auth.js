"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tryLoggingIn = exports.refreshTokens = exports.createTokens = undefined;

var _jsonwebtoken = require("jsonwebtoken");

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _bcryptjs = require("bcryptjs");

var _bcryptjs2 = _interopRequireDefault(_bcryptjs);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const createTokens = exports.createTokens = (user, secret, secret2) => {
  const createToken = _jsonwebtoken2.default.sign({
    user: _lodash2.default.pick(user, ["id", "username"])
  }, secret, {
    expiresIn: "1h"
  });
  const createRefreshToken = _jsonwebtoken2.default.sign({
    user: _lodash2.default.pick(user, ["id"])
  }, secret2, {
    expiresIn: "1d"
  });
  return [createToken, createRefreshToken];
};

const refreshTokens = exports.refreshTokens = async (token, refreshToken, models, SECRET, SECRET2) => {
  let userId = 0;
  try {
    const {
      user: { id }
    } = _jsonwebtoken2.default.decode(refreshToken);
    userId = id;
  } catch (err) {
    return {};
  }
  if (!userId) {
    return {};
  }

  const user = await models.User.findOne({ where: { id: userId }, raw: true });
  if (!user) {
    return {};
  }
  const refreshSecret = user.password + SECRET2;
  try {
    _jsonwebtoken2.default.verify(refreshToken, refreshSecret);
  } catch (err) {
    return {};
  }
  const [newToken, newRefreshToken] = await createTokens(user, SECRET, refreshSecret);
  console.log("NEW-TOKEN FROM AUTH.JS: ", newToken);
  console.log("NEW-REFRESH-TOKEN FROM AUTH.JS: ", newRefreshToken);
  return {
    token: newToken,
    refreshToken: newRefreshToken,
    user
  };
};

const tryLoggingIn = exports.tryLoggingIn = async (email, password, models, SECRET, SECRET2) => {
  const user = await models.User.findOne({ where: { email }, raw: true });
  if (!user) {
    return {
      ok: false,
      errors: [{ path: "email", message: "Invalid Email" }]
    };
  }
  const validPassword = await _bcryptjs2.default.compare(password, user.password);
  if (!validPassword) {
    return {
      ok: false,
      errors: [{ path: "password", message: "Invalid Password" }]
    };
  }
  const refreshTokenSecret = user.password + SECRET2;
  const [token, refreshToken] = createTokens(user, SECRET, refreshTokenSecret);
  return {
    ok: true,
    token,
    refreshToken
  };
};