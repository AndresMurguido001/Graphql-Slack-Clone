"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

exports.default = async () => {
  let maxReconnects = 20;
  let connected = false;
  let sequelize;

  while (!connected && maxReconnects) {
    try {
      sequelize = new _sequelize2.default(process.env.TEST_DB || "slack", "postgres", "postgres", {
        dialect: "postgres",
        operatorsAliases: _sequelize2.default.Op,
        host: process.env.DB_HOST || "localhost",
        define: {
          underscored: true
        }
      });
      connected = true;
    } catch (err) {
      console.log("reconnecting in 5 seconds");
      await sleep(5000);
      maxReconnects -= 1;
    }
  }

  if (!connected) {
    return null;
  }

  const models = {
    User: sequelize["import"]("./user"),
    Team: sequelize["import"]("./team"),
    Channel: sequelize["import"]("./channel"),
    Message: sequelize["import"]("./message"),
    Member: sequelize["import"]("./member"),
    DirectMessage: sequelize["import"]("./directMessage"),
    PCMember: sequelize["import"]("./pcmember")
  };

  Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  models.sequelize = sequelize;
  models.Sequelize = _sequelize2.default;
  models.op = _sequelize2.default.Op;

  return models;
};