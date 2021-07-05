/** @typedef {Partial<NAI.ContextConfig>} FixedContextConfig */
/** @typedef {Partial<NAI.LoreEntryConfig>} FixedEntryConfig */
/** @typedef {Partial<{ context: FixedContextConfig, entry: FixedEntryConfig }>} FixedStrategyConfig */
/** @typedef {TLG.Config.Strategy<"Fixed", FixedStrategyConfig>} FixedStrategy */

/**
 * Creates a strategy that will apply a basic, static configuration to the current
 * `TLG.BuildableEntry` and its children.
 * 
 * For when you're not looking to do anything fancy.
 * 
 * @param {FixedStrategyConfig} [baseConfig]
 * @returns {FixedStrategy}
 */
exports.Fixed = (baseConfig = {}) => {
  return {
    type: "Fixed",
    config: baseConfig,
    apply(_state, currentConfig) {
      return currentConfig;
    },
    extend(_state, currentConfig) {
      return currentConfig;
    },
    context(state, strategyConfig) {
      return { ...state.context, ...strategyConfig.context };
    },
    entry(state, strategyConfig) {
      return { ...state.entry, ...strategyConfig.entry };
    }
  };
};