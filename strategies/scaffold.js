const { dropUndefProps } = require("../utils");
const { strategyBuilder: depthDeltaBuilder } = require("./depthDelta");

/** @typedef {import("./depthDelta.types").DepthDeltaConfig} DepthDeltaConfig */
/** @typedef {import("./depthDelta.types").DepthDeltaStrategy} DepthDeltaStrategy */
/** @typedef {import("./scaffold.types").StrategyFn} StrategyFn */

/** Override default values for this strategy's `DepthDelta` usage. */
const DEPTH_DELTA_DEFAULTS = {
  priorityDelta: 0,
  searchDelta: 0
};

const CONTEXT_DEFAULTS = {
  prefix: "[ ",
  suffix: "]\n"
};

/**
 * Internal function to construct a `DepthDeltaStrategy` from a set of format-specific
 * defaults.  This is used just to simplify things for the exported methods.
 * 
 * @param {Partial<DepthDeltaConfig>} baseConfig 
 * @param {Partial<DepthDeltaConfig>} defaults
 * @returns {DepthDeltaStrategy}
 */
exports.strategyBuilder = (baseConfig, defaults) => {
  const { context, entry, ...restConfig } = baseConfig;

  const theConfig = {
    ...restConfig,
    context: dropUndefProps({ ...CONTEXT_DEFAULTS, ...defaults.context, ...context }),
    entry: dropUndefProps({ ...defaults.entry, ...entry })
  };

  return depthDeltaBuilder(theConfig, DEPTH_DELTA_DEFAULTS);
};

/**
 * A note for broader world concepts.
 * 
 * @type {StrategyFn}
 */
exports.Concept = (baseConfig = {}) => exports.strategyBuilder(baseConfig, {
  context: {
    reservedTokens: 100,
    budgetPriority: -200,
    insertionPosition: -10
  },
  entry: {
    searchRange: 5000
  }
});

/**
 * A note for races and species.
 * 
 * @type {StrategyFn}
 */
exports.Race = (baseConfig = {}) => exports.strategyBuilder(baseConfig, {
  context: {
    reservedTokens: 100,
    budgetPriority: -300,
    insertionPosition: -10
  },
  entry: {
    searchRange: 2000
  }
});

/**
 * A note for locations and places.
 * 
 * @type {StrategyFn}
 */
exports.Place = (baseConfig = {}) => exports.strategyBuilder(baseConfig, {
  context: {
    reservedTokens: 100,
    budgetPriority: -400,
    insertionPosition: -10
  },
  entry: {
    searchRange: 3000
  }
});

/**
 * A note for factions.
 * 
 * @type {StrategyFn}
 */
exports.Faction = (baseConfig = {}) => exports.strategyBuilder(baseConfig, {
  context: {
    reservedTokens: 100,
    budgetPriority: -500,
    insertionPosition: -10
  },
  entry: {
    searchRange: 3000
  }
});

/**
 * Used as an Author's Note that describes the story as a whole.
 * Use tags like Genre, Themes, Setting, etc.
 * 
 * Recommendation: only provide one of these.
 * 
 * @type {StrategyFn}
 */
exports.Overview = (baseConfig = {}) => exports.strategyBuilder(baseConfig, {
  context: {
    reservedTokens: 200,
    budgetPriority: -600,
    insertionPosition: -8
  },
  entry: {
    forceActivation: true
  }
});

/**
 * A note for factions.
 * 
 * @type {StrategyFn}
 */
exports.IrregularRace = (baseConfig = {}) => exports.strategyBuilder(baseConfig, {
  context: {
    reservedTokens: 200,
    budgetPriority: -650,
    insertionPosition: -7
  },
  entry: {
    searchRange: 5000
  }
});

/**
 * A note for characters.
 * 
 * @type {StrategyFn}
 */
exports.Character = (baseConfig = {}) => exports.strategyBuilder(baseConfig, {
  context: {
    reservedTokens: 100,
    budgetPriority: -700,
    insertionPosition: -6
  },
  entry: {
    searchRange: 3000
  }
});

/**
 * Configuration for the signpost, specifically, in case you wish to provide a custom one.
 * 
 * Recommendation: only provide one of these.
 * 
 * @type {StrategyFn}
 */
exports.Signpost = (baseConfig = {}) => exports.strategyBuilder(baseConfig, {
  context: {
    reservedTokens: 200,
    budgetPriority: -1000,
    insertionPosition: -2
  },
  entry: {
    forceActivation: true
  }
});

/**
 * A pre-made entry for the `***` signpost, to save some time.
 * 
 * @type {TLG.BuildableEntry}
 */
exports.SignpostEntry = {
  name: "Signpost",
  strategy: exports.Signpost({
    context: {
      prefix: "\n",
      suffix: "\n\n",
      budgetPriority: -1001
    }
  }),
  keys: [],
  text: "***"
};