import Sequelize from 'sequelize';


var sequelize = new Sequelize("slack", "postgres", "postgres", {
    dialect: "postgres"
});
const models = {
    User: sequelize['import']('./user'),
    Team: sequelize['import']('./team'),
    Channel: sequelize['import']('./channel'),
    Message: sequelize['import']('./message'),
};

Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
    models[modelName].associate(models);
    }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

export default models;