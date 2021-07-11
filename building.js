const { dew, ident, asArray, is } = require("./utils");
const DEFAULTS = require("./strategies/_naiDefaults");
const matching = require("./matching");

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
    yield matching.evalExp([altKeys, subOp, childKey]);
};

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
    strategy: parentStrategy = defStrategy,
    baseOp = defOp,
    baseKeys: parentBase = [],
    keys: givenKeys,
    text: givenText = [],
    subOp: parentOp = baseOp,
    subEntries: childEntries = []
  } = entry;

  const parentKeys = dew(() => {
    // When a function is provided for a root entry, it can still be a function.
    // In all other cases, we'll have converted it to an array when constructing
    // the child below.
    const theBaseKeys = is.function(parentBase) ? parentBase([]) : parentBase;
    return [...exports.yieldChildKeys(theBaseKeys, baseOp, givenKeys)]
  });

  const entries = asArray(givenText);
  const keys = parentKeys.map((key) => matching.asEscaped(key).toNAI());

  // Get strategy configuration.
  const curConfig = parentStrategy.apply(state, parentStrategy.config);
  // Apply configuration overrides.
  const usedState = dew(() => {
    if (keys.length > 0) return state;

    // If we have no keys, default to activating forcibly.
    const { entry: { forceActivation: _, ...restEntry }, ...restState } = state;
    return { ...restState, entry: { ...restEntry, forceActivation: true } };
  });
  const contextConfig = parentStrategy.context(usedState, curConfig);
  const entryConfig = parentStrategy.entry(usedState, curConfig);

  yield* entries.map((text, i, arr) => {
    const displayName = arr.length === 1 ? name : `${name} (${i + 1} of ${arr.length})`;
    return { ...entryConfig, displayName, text, keys, contextConfig };
  });

  if (childEntries.length === 0) return;

  // Ask the strategy to determine a configuration to build the next `state` for the
  // child entires.  We build an intermediate state from this, which doesn't include
  // the `forceActivation` shenanigans (but the `entryConfig` may still have been
  // affected by it when generated).
  const intermediateState = { ...state, context: contextConfig, entry: entryConfig };
  const nextConfig = parentStrategy.extend(intermediateState, curConfig);
  const nextState = {
    context: parentStrategy.context(intermediateState, nextConfig),
    entry: parentStrategy.entry(intermediateState, nextConfig),
    strategyStack: [...state.strategyStack, parentStrategy],
    depth: state.depth + 1
  };
  const childEntryConfig = { strategy: parentStrategy, subOp: parentOp };

  for (const childEntry of childEntries) {
    const {
      name: childName,
      baseKeys: childBaseKeys = ident,
      ...restOfEntry
    } = childEntry;

    const newEntry = {
      baseOp: parentOp,
      ...restOfEntry,
      name: `${name} - ${childName}`,
      baseKeys: is.function(childBaseKeys) ? childBaseKeys(parentKeys) : childBaseKeys
    };

    yield* exports.yieldEntries(newEntry, nextState, childEntryConfig);
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

  const settings = { ...DEFAULTS.lorebookDefaults, ...givenSettings };

  // Build the initial `context` and `entry` using the strategy.
  const { context, entry } = dew(() => {
    const { strategy } = restConfig;
    if (!strategy) return {};

    const state = {
      context: { ...DEFAULTS.contextDefaults },
      entry: { ...DEFAULTS.entryDefaults },
      strategyStack: [],
      depth: 0
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
    depth: 0
  };
  
  const entries = rootEntries.flatMap(
    (entry) => [...exports.yieldEntries(entry, initState, initEntryConfig)]
  );

  /** @type {NAI.LoreBook} */
  const result = { lorebookVersion: 1, settings, entries };

  return {
    ...result,
    forDisplay() {
      return require("./utils").outputLorebook(result);
    }
  }
};