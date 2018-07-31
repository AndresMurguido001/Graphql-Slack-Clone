import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import _ from "lodash";

export const createTokens = (user, secret, secret2) => {
  const createToken = jwt.sign(
    {
      user: _.pick(user, ["id", "username"])
    },
    secret,
    {
      expiresIn: "1h"
    }
  );
  const createRefreshToken = jwt.sign(
    {
      user: _.pick(user, ["id"])
    },
    secret2,
    {
      expiresIn: "1d"
    }
  );
  return [createToken, createRefreshToken];
};

export const refreshTokens = async (
  token,
  refreshToken,
  models,
  SECRET,
  SECRET2
) => {
  let userId = 0;
  try {
    const {
      user: { id }
    } = jwt.decode(refreshToken);
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
    jwt.verify(refreshToken, refreshSecret);
  } catch (err) {
    return {};
  }
  const [newToken, newRefreshToken] = await createTokens(
    user,
    SECRET,
    refreshSecret
  );
  return {
    token: newToken,
    refreshToken: newRefreshToken,
    user
  };
};

export const tryLoggingIn = async (
  email,
  password,
  models,
  SECRET,
  SECRET2
) => {
  const user = await models.User.findOne({ where: { email }, raw: true });
  if (!user) {
    return {
      ok: false,
      errors: [{ path: "email", message: "Invalid Email" }]
    };
  }
  const validPassword = await bcrypt.compare(password, user.password);
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
