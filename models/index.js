import Sequelize from "sequelize";

var sequelize = new Sequelize(
  process.env.TEST_DB || "slack",
  "postgres",
  "postgres",
  {
    dialect: "postgres",
    operatorsAliases: Sequelize.Op,
    define: {
      underscored: true
    }
  }
);
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

export default models;
