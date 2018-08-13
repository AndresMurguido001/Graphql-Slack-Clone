"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  let Message = sequelize.define("message", {
    text: DataTypes.STRING,
    url: DataTypes.STRING,
    filetype: DataTypes.STRING
  }, {
    indexes: [{
      fields: ["created_at"]
    }]
  });

  Message.associate = models => {
    //1:M
    Message.belongsTo(models.User, {
      foreignKey: {
        name: "userId",
        field: "user_id"
      }
    });
    Message.belongsTo(models.Channel, {
      foreignKey: {
        name: "channelId",
        field: "channel_id"
      }
    });
  };

  return Message;
};