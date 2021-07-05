const { dew, dropUndefProps } = require("../utils");

/** @typedef {import("./depthDelta.types").UniqueConfig} UniqueConfig */
/** @typedef {import("./depthDelta.types").DepthDeltaConfig} DepthDeltaConfig */
/** @typedef {import("./depthDelta.types").DepthDeltaStrategy} DepthDeltaStrategy */

/** Default values for this strategy's unique configuration. */
const DEFAULTS = {
  priorityDelta: 1,
  searchDelta: 1024
};

/**
 * Type-guard checking to see if a strategy instance is a `DepthDeltaStrategy`.
 * 
 * @param {TLG.Config.Strategy<string, unknown>} value
 * @returns {value is DepthDeltaStrategy}
 */
const isDepthDelta = (value) =>
  value.type === "DepthDelta";

/**
 * Determines if this exact instance of `DepthDeltaStrategy` has already been added
 * to the given `strategyStack`.
 * 
 * @param {TLG.Config.State["strategyStack"]} stack 
 * @param {DepthDeltaStrategy} self 
 * @returns {boolean}
 */
const isInstanceInStack = (stack, self) =>
  stack.includes(self);

/**
 * Runs through the `strategyStack` of a state, pulling out the most recent values
 * for `priorityDelta` and `searchDelta` from ancestor `DepthDeltaStrategy` instances.
 * 
 * @param {TLG.Config.State["strategyStack"]} stack
 * @returns {Partial<UniqueConfig>}
 */
const getInheritedUnique = (stack) => {
  const configs = stack
    .filter(isDepthDelta)
    .map(({ config }) => config)
    .map(({ priorityDelta, searchDelta }) => ({ priorityDelta, searchDelta }))
    .map(dropUndefProps);

  /** @type {Partial<UniqueConfig>} */
  let result = {};
  for (const config of configs)
    result = { ...result, ...config };

  return result;
};

/**
 * Internal function to construct a `DepthDeltaStrategy` from a set of format-specific
 * defaults.  This is used just to simplify things for the exported methods.
 * 
 * @param {Partial<DepthDeltaConfig>} baseConfig
 * @param {Partial<UniqueConfig>} [defaults]
 * @returns {DepthDeltaStrategy}
 */
exports.strategyBuilder = (baseConfig = {}, defaults) => {
  const theDefaults = { ...DEFAULTS, ...defaults };

  /**
   * Applies the configured `priorityDelta` against the current context configuration.
   * This returns a new context configuration for the strategy with the delta applied.
   * 
   * @param {NAI.ContextConfig} curContext
   * @param {Partial<NAI.ContextConfig> | undefined} configContext
   * @param {Partial<UniqueConfig>} unique
   * @returns {Partial<NAI.ContextConfig>}
   */
  const extendContext = (curContext, configContext, unique) => {
    const { priorityDelta = theDefaults.priorityDelta } = unique;
    const budgetPriority = curContext.budgetPriority + priorityDelta;

    return { ...configContext, budgetPriority };
  };

  /**
   * Applies the configured `searchDelta` to the current entry configuration.
   * This returns a new entry configuration for the strategy with the delta applied.
   * 
   * @param {NAI.LoreEntryConfig} curEntry
   * @param {Partial<NAI.LoreEntryConfig> | undefined} configEntry
   * @param {Partial<UniqueConfig>} unique
   * @returns {Partial<NAI.LoreEntryConfig>}
   */
  const extendEntry = (curEntry, configEntry, unique) => {
    const { searchDelta = theDefaults.searchDelta } = unique;
    const searchRange = curEntry.searchRange + searchDelta;

    return { ...configEntry, searchRange };
  };

  /** @type {DepthDeltaStrategy} */
  const self = {
    type: "DepthDelta",
    config: baseConfig,
    apply(state, currentConfig) {
      const { context, entry, ...configUnique } = currentConfig;
      const inheritedUnique = getInheritedUnique(state.strategyStack);
      const finalUnique = { ...inheritedUnique, ...configUnique };

      if (!isInstanceInStack(state.strategyStack, self))
        return dropUndefProps({ context, entry, ...finalUnique });

      // If this strategy has been applied previously, we should inherit the `budgetPriority`
      // and `searchRange` from the state instead, as they would already have been applied.
      const fixedContext = dew(() => {
        if (!context) return context;
        const { budgetPriority: _, ...restContext } = context;
        return Object.keys(restContext).length > 0 ? restContext : undefined;
      });

      const fixedEntry = dew(() => {
        if (!entry) return entry;
        const { searchRange: _, ...restEntry } = entry;
        return Object.keys(restEntry).length > 0 ? restEntry : undefined;
      });

      return dropUndefProps({ context: fixedContext, entry: fixedEntry, ...finalUnique });
    },
    extend(state, currentConfig) {
      const { context: curContext, entry: curEntry } = state;
      const { context: configContext, entry: configEntry, ...finalUnique } = currentConfig;
      const context = extendContext(curContext, configContext, finalUnique);
      const entry = extendEntry(curEntry, configEntry, finalUnique);

      return dropUndefProps({ context, entry, ...finalUnique });
    },
    context(state, strategyConfig) {
      return { ...state.context, ...strategyConfig.context };
    },
    entry(state, strategyConfig) {
      return { ...state.entry, ...strategyConfig.entry };
    }
  };

  return self;
};

/**
 * Creates a strategy that will increase `context.budgetPriority` and `entry.searchRange` by
 * a fixed amount every time the entry builder descends into a sub-entry of the tree.
 * 
 * @param {Partial<DepthDeltaConfig>} [baseConfig]
 * @returns {DepthDeltaStrategy}
 */
exports.DepthDelta = (baseConfig) => exports.strategyBuilder(baseConfig);