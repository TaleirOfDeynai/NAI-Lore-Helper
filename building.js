const { dew, ident, asArray, is } = require("./utils");
const { chain, iterReverse, iterPosition } = require("./utils/iterables");
const DEFAULTS = require("./strategies/_naiDefaults");
const matching = require("./matching");

/**
 * The default `BuilderSettings`.
 * 
 * @type {TLG.BuilderSettings}
 */
const tlgBuilderConfigDefaults = {
  reversedTextIteration: false
};

/**
 * The default `BuildableEntryConfig` for `BuildableEntry`.
 * 
 * @type {Required<TLG.BuildableEntryConfig>}
 */
const tlgBuildableDefaults = {
  strategy: require("./strategies/fixed").Fixed({}),
  subOp: matching.AND
};

/**
 * 
 * @param {TLG.BuildableEntry["keys"]} parentKeys
 * @param {TLG.Matching.PhraseOperator} subOp
 * @param {TLG.BuildableEntry["keys"]} childKeys
 * @returns {Iterable<TLG.Matching.PhraseOperand>}
 */
exports.yieldChildKeys = function*(parentKeys = [], subOp, childKeys) {
  if (parentKeys.length === 0) {
    yield* childKeys;
    return;
  }
  if (childKeys.length === 0) {
    yield* parentKeys;
    return;
  }
  
  const altKeys = dew(() => {
    if (parentKeys.length === 1) return parentKeys[0];
    return matching.ALT(...parentKeys);
  });

  for (const childKey of childKeys)
    yield matching.evalExp([childKey, subOp, altKeys]);
};

/**
 * @param {string} name
 * @param {TLG.Config.State} state
 * @param {Object} input
 * @param {TLG.Config.Strategy<string, any>} input.strategy
 * @param {any} input.config
 * @param {string[]} input.text
 * @param {string[]} input.keys
 * @returns {{ context: NAI.ContextConfig, entries: Iterable<NAI.LoreEntry> }}
 */
exports.entriesByText = (name, state, input) => {
  const { strategy, config, keys } = input;

  // Apply configuration overrides.
  const usedState = dew(() => {
    if (keys.length > 0) return state;

    // If we have no keys, default to activating forcibly.
    const { entry: { forceActivation: _, ...restEntry }, ...restState } = state;
    return { ...restState, entry: { ...restEntry, forceActivation: true } };
  });
  const contextConfig = strategy.context(usedState, config);
  const entryConfig = strategy.entry(usedState, config);

  const textCount = input.text.length;
  const entryIterator = chain(input.text)
    .thru(iterPosition)
    .thru(state.reversedTextIteration ? iterReverse : ident)
    .map(([i, text]) => {
      const displayName = textCount === 1 ? name : `${name} (${i + 1} of ${textCount})`;
      return { ...entryConfig, displayName, text, keys, contextConfig };
    })
    .value();
  
  // Return the `contextConfig` too, as the sub-entries rely on it.
  return { context: contextConfig, entries: entryIterator };
};

/**
 * @param {string} name
 * @param {TLG.Config.State} state
 * @param {Object} input
 * @param {TLG.Config.Strategy<string, any>} input.strategy
 * @param {any} input.config
 * @param {NAI.ContextConfig} input.context
 * @param {TLG.Matching.PhraseOperator} input.subOp
 * @param {TLG.BuildableEntry[]} input.entries
 * @param {TLG.Matching.PhraseOperand[]} input.keys
 * @returns {{ entries: Iterable<NAI.LoreEntry> }}
 */
exports.entriesByChildren = (name, state, input) => {
  if (input.entries.length === 0) return { entries: [] };

  const { strategy } = input;

  // Ask the strategy to determine a configuration to build the next `state` for
  // the child entires.  We build an intermediate state that doesn't have the
  // forced-activation shenanigans.
  const intermediateState = {
    ...state,
    context: input.context,
    entry: strategy.entry(state, input.config)
  };

  const nextConfig = strategy.extend(intermediateState, input.config);
  const nextState = {
    context: strategy.context(intermediateState, nextConfig),
    entry: strategy.entry(intermediateState, nextConfig),
    strategyStack: [...state.strategyStack, strategy],
    depth: state.depth + 1,
    reversedTextIteration: state.reversedTextIteration
  };
  const childEntryConfig = { strategy, subOp: input.subOp };

  const entriesOut = chain(input.entries)
    .map((subEntry) => {
      const {
        name: childName,
        baseKeys: childBaseKeys = ident,
        ...restOfEntry
      } = subEntry;
  
      return {
        baseOp: input.subOp,
        ...restOfEntry,
        name: `${name} - ${childName}`,
        baseKeys: is.function(childBaseKeys) ? childBaseKeys(input.keys) : childBaseKeys
      };
    })
    .map((newEntry) => exports.yieldEntries(newEntry, nextState, childEntryConfig))
    .flatten()
    .value();

  return { entries: entriesOut };
}

/**
 * 
 * @param {TLG.BuildableEntry} entry
 * @param {TLG.Config.State} state
 * @param {Required<TLG.BuildableEntryConfig>} defaultsForEntry
 * @returns {Iterable<NAI.LoreEntry>}
 */
exports.yieldEntries = function*(entry, state, defaultsForEntry) {
  const { subOp: defOp, strategy: defStrategy } = defaultsForEntry;

  const {
    name,
    strategy = defStrategy,
    baseOp = defOp,
    baseKeys = [],
    keys: givenKeys,
    text: givenText = [],
    subOp = baseOp,
    subEntries: childEntries = []
  } = entry;

  const composedKeys = dew(() => {
    // When a function is provided for a root entry, it can still be a function.
    // In all other cases, we'll have converted it to an array when constructing
    // the child below.
    const theBaseKeys = is.function(baseKeys) ? baseKeys([]) : baseKeys;
    return [...exports.yieldChildKeys(theBaseKeys, baseOp, givenKeys)]
  });

  const text = asArray(givenText);
  const keys = composedKeys.map((key) => matching.asEscaped(key).toNAI());

  // Get strategy configuration.
  const curConfig = strategy.apply(state, strategy.config);

  const byText = exports.entriesByText(name, state, {
    strategy,
    text, keys,
    config: curConfig
  });

  const byChildren = exports.entriesByChildren(name, state, {
    strategy, subOp,
    config: curConfig,
    context: byText.context,
    entries: childEntries,
    keys: composedKeys
  });

  if (state.reversedTextIteration) {
    yield* byChildren.entries;
    yield* byText.entries;
  }
  else {
    yield* byText.entries;
    yield* byChildren.entries;
  }
};

/**
 * 
 * @param {TLG.BuilderConfig} config
 * @returns {NAI.LoreBook & TLG.WithDisplay}
 */
exports.buildEntries = (config) => {
  const { entries: rootEntries, settings: givenSettings, ...restConfig } = config;
  const initEntryConfig = { ...tlgBuildableDefaults, ...restConfig };

  const resolvedSettings = {
    ...DEFAULTS.lorebookDefaults,
    ...tlgBuilderConfigDefaults,
    ...givenSettings
  };

  const { reversedTextIteration, ...settings } = resolvedSettings;

  // Build the initial `context` and `entry` using the strategy.
  const { context, entry } = dew(() => {
    const { strategy } = restConfig;
    if (!strategy) return {};

    const state = {
      context: { ...DEFAULTS.contextDefaults },
      entry: { ...DEFAULTS.entryDefaults },
      strategyStack: [],
      depth: 0,
      reversedTextIteration
    };

    const config = strategy.apply(state, strategy.config);
    const context = strategy.context(state, config);
    const entry = strategy.entry(state, config);
    return { context, entry };
  });

  /** @type {TLG.Config.State} */
  const initState = {
    context: { ...DEFAULTS.contextDefaults, ...context },
    entry: { ...DEFAULTS.entryDefaults, ...entry },
    strategyStack: [],
    depth: 0,
    reversedTextIteration
  };
  
  const entries = rootEntries.flatMap(
    (entry) => [...exports.yieldEntries(entry, initState, initEntryConfig)]
  );

  /** @type {NAI.LoreBook} */
  const result = { lorebookVersion: 2, settings, entries };

  return {
    ...result,
    forDisplay() {
      return require("./utils").outputLorebook(result);
    }
  }
};