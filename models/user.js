export default (sequelize, DataTypes) => {
    let User = sequelize.define('user', {
        username: { 
            type: DataTypes.STRING,
            unique: true,
            validate: {
                isAlphanumeric: {
                    args: true,
                    msg: "Username must contain only letters and numbers"
                },
                len: {
                    args: [3,20],
                    msg: "Username must be between 3 and 20 characters"
                }                
            }
        },
        email: { 
            type: DataTypes.STRING,
            unique: true,
            validate: {
                isEmail: {
                    args: true,
                    msg: "Must be a valid email"
                }              
            }
        },
        password: DataTypes.STRING,                            
    });

    User.associate = (models) => {
        User.belongsToMany(models.Team, {
            through: "member",
            foreignKey: {
                name: "userId",
                field: "user_id"
            }
        });
        //N:M
        User.belongsToMany(models.Channel, {
            through: "channel_member",
            foreignKey: {
                name: "userId",
                field: "user_id"
            }
        });
    };

        return User;
};