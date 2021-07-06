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
    reservedTokens: 0,
    budgetPriority: 800,
    insertionPosition: -1
  },
  entry: {
    searchRange: 2000
  }
});

/**
 * A note for factions.
 * 
 * @type {StrategyFn}
 */
 exports.Faction = (baseConfig = {}) => exports.strategyBuilder(baseConfig, {
  context: {
    reservedTokens: 0,
    budgetPriority: 700,
    insertionPosition: -1
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
 exports.Species = (baseConfig = {}) => exports.strategyBuilder(baseConfig, {
  context: {
    reservedTokens: 0,
    budgetPriority: 600,
    insertionPosition: -1
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
    reservedTokens: 0,
    budgetPriority: 500,
    insertionPosition: -1
  },
  entry: {
    searchRange: 3000
  }
});

/**
 * A note for characters.
 * 
 * @type {StrategyFn}
 */
 exports.Character = (baseConfig = {}) => exports.strategyBuilder(baseConfig, {
  context: {
    reservedTokens: 200,
    budgetPriority: 400,
    insertionPosition: -1
  },
  entry: {
    searchRange: 2000
  }
});

/**
 * Any supporting information for concept/faction/species/place/char entries.
 * A brace is typically used to reinforce an idea or concept that the AI has trouble remembering.
 * Can also be used to emphasize important information, ie character/species appearance, worn
 * clothing and motive.  Also should be used to describe relationships.
 * 
 * @type {StrategyFn}
 */
exports.Brace = (baseConfig = {}) => exports.strategyBuilder(baseConfig, {
  context: {
    reservedTokens: 200,
    budgetPriority: -400,
    insertionPosition: -8
  }
});

/**
 * Used as an Author's Note that describes the story as a whole.
 * Use tags like Genre, Themes, Setting etc.
 * 
 * Previously called "Editor's Note".
 * 
 * Recommendation: only provide one of these.
 * 
 * @type {StrategyFn}
 */
exports.Synopsis = (baseConfig = {}) => exports.strategyBuilder(baseConfig, {
  context: {
    reservedTokens: 200,
    budgetPriority: -500,
    insertionPosition: -8
  },
  entry: {
    forceActivation: true
  }
});

/**
 * Same idea as a brace, but much closer to the front/bottom of
 * context for crucial information that needs to be highly emphasized.
 * 
 * @type {StrategyFn}
 */
exports.Pillar = (baseConfig = {}) => exports.strategyBuilder(baseConfig, {
  context: {
    reservedTokens: 200,
    budgetPriority: -600,
    insertionPosition: -4
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
    prefix: "\n",
    suffix: "\n\n",
    reservedTokens: 3,
    budgetPriority: 100,
    insertionPosition: -1
  },
  entry: {
    forceActivation: true
  }
});

/**
 * A pre-made entry for the signpost, to save some time.
 * 
 * @type {TLG.BuildableEntry}
 */
exports.SignpostEntry = {
  name: "Signpost",
  strategy: exports.Signpost(),
  keys: [],
  text: "***"
};