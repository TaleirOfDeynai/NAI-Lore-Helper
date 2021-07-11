// For use as a library.

exports.DEFAULTS = require("./strategies/_naiDefaults");

exports.Building = require("./building");
exports.Matching = require("./matching");
exports.Utils = require("./utils");

const { Fixed } = require("./strategies/fixed");
const { DepthDelta } = require("./strategies/depthDelta");

// TS is being weird about a direct destructure with a rest operator.
const ScaffoldModule = require("./strategies/scaffold");
const { strategyBuilder: _, ...Scaffold } = ScaffoldModule;

exports.Strategies = {
  Fixed,
  DepthDelta,
  Scaffold
};