"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  let PCMember = sequelize.define("pcmember", {});
  return PCMember;
};