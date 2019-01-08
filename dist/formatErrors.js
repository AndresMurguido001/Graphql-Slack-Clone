"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatErrors = undefined;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const formatErrors = exports.formatErrors = (e, models) => {
  if (e instanceof models.sequelize.ValidationError) {
    return e.errors.map(x => _lodash2.default.pick(x, ["path", "message"]));
  }
  return [{ path: "name", message: "Something went wrong" }];
};