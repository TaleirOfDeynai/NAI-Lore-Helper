// For use as a library.

exports.DEFAULTS = require("./strategies/_naiDefaults");

exports.Building = require("./building");
exports.Matching = require("./matching");
exports.Utils = require("./utils");

exports.Strategies = {
  Fixed: require("./strategies/fixed"),
  DepthDelta: require("./strategies/depthDelta"),
  Scaffold: require("./strategies/scaffold")
};