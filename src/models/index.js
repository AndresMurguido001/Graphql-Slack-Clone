import Sequelize from "sequelize";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default async () => {
  let maxReconnects = 20;
  let connected = false;

  const sequelize = new Sequelize(
    process.env.TEST_DB || "slack",
    "postgres",
    "postgres",
    {
      dialect: "postgres",
      operatorsAliases: Sequelize.Op,
      host: process.env.DB_HOST || "localhost",
      define: {
        underscored: true
      }
    }
  );
  while (!connected && maxReconnects) {
    try {
      await sequelize.authenticate();
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
  models.Sequelize = Sequelize;
  models.op = Sequelize.Op;

  return models;
};
