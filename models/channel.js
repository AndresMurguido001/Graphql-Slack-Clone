export default (sequelize, DataTypes) => {
    let Channel = sequelize.define('channel', {
        name: {
            type: DataTypes.STRING,
            public: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        }
    });

    Channel.associate = (models) => {
        //1:M
        Channel.belongsTo(models.Team, {            
            foreignKey: {
                name: "teamId",
                field: "team_id"
            }
        });
        //N:M
        Channel.belongsToMany(models.User, {
            through: "channel_member",
            foreignKey: {
                name: "channelId",
                field: "channel_id"
            }
        })                  
    };

        return Channel;
};