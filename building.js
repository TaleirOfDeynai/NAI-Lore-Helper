const { dew, ident, asArray, is } = require("./utils");
const matching = require("./matching");

/**
 * The default `ContextConfig` for `LoreEntry`.
 * 
 * @type {NAI.ContextConfig}
 */
const naiContextDefaults = {
  prefix: "",
  suffix: "\n",
  tokenBudget: 2048,
  reservedTokens: 0,
  budgetPriority: 400,
  trimDirection: "trimBottom",
  insertionType: "newline",
  insertionPosition: -1
};

/**
 * The default `LoreEntryConfig` for `LoreEntry`.
 * 
 * @type {NAI.LoreEntryConfig}
 */
const naiEntryDefaults = {
  searchRange: 1000,
  enabled: true,
  forceActivation: false
};

/**
 * 
 * @param {TLG.BuildableEntry["keys"]} parentKeys
 * @param {TLG.PhraseOperator} subOp
 * @param {TLG.BuildableEntry["keys"]} childKeys
 * @returns {Iterable<TLG.PhraseOperand>}
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
 * @param {NAI.ContextConfig} defaultsForContext
 * @param {NAI.LoreEntryConfig} defaultsForEntry
 * @returns {Iterable<NAI.LoreEntry>}
 */
exports.yieldEntries = function*(entry, defaultsForContext, defaultsForEntry) {
  const {
    name,
    baseKeys: parentBase = [],
    baseOp: rootOp = matching.AND,
    keys: givenKeys,
    text: givenText = [],
    subEntries: childEntries = [],
    subOp: parentOp = rootOp,
    priorityDelta = -1,
    contextConfig: contextOverrides,
    ...entryOverrides
  } = entry;

  const parentKeys = dew(() => {
    // When a function is provided for a root entry, it can still be a function.
    // In all other cases, we'll have converted it to an array when constructing
    // the child below.
    const theBaseKeys = is.function(parentBase) ? parentBase([]) : parentBase;
    return [...exports.yieldChildKeys(theBaseKeys, rootOp, givenKeys)]
  });

  const entries = asArray(givenText);
  const keys = parentKeys.map((key) => matching.asEscaped(key).toNAI());

  // Apply configuration overrides.
  const contextConfig = { ...defaultsForContext, ...contextOverrides };
  // If we have no keys, default to activating forcibly.
  const forceActivation = keys.length === 0;
  const entryConfig = { ...defaultsForEntry, forceActivation, ...entryOverrides };

  yield* entries.map((text, i, arr) => {
    const displayName = arr.length === 1 ? name : `${name} (${i + 1} of ${arr.length})`;
    return { ...entryConfig, displayName, text, keys, contextConfig };
  });

  if (childEntries.length === 0) return;

  // We don't want to propagate the `forceActivation` override, if present.
  const childEntryConfig = { ...defaultsForEntry, ...entryOverrides };
  // If a `priorityDelta` was set, we apply it here for the child entries.
  const childPriority = contextConfig.budgetPriority + priorityDelta;
  const childContextConfig = { ...contextConfig, budgetPriority: childPriority };

  for (const childEntry of childEntries) {
    const {
      name: childName,
      baseKeys: childBase = ident,
      subOp = parentOp,
      ...restOfEntry
    } = childEntry;

    const newEntry = {
      priorityDelta,
      baseOp: parentOp,
      ...restOfEntry,
      baseKeys: is.function(childBase) ? childBase(parentKeys) : childBase,
      subOp,
      name: `${name} - ${childName}`
    };

    yield* exports.yieldEntries(newEntry, childContextConfig, childEntryConfig);
  }
};

/**
 * 
 * @param {Object} config
 * @param {Partial<NAI.ContextConfig>} [config.contextConfig]
 * @param {Partial<NAI.LoreEntryConfig>} [config.entryConfig]
 * @param {TLG.BuildableEntry[]} config.entries
 * @returns {NAI.LoreBook}
 */
exports.buildEntries = (config) => {
  const initContextConfig = { ...naiContextDefaults, ...config.contextConfig };
  const initEntryConfig = { ...naiEntryDefaults, ...config.entryConfig };
  
  const entries = config.entries.flatMap(
    (entry) => [...exports.yieldEntries(entry, initContextConfig, initEntryConfig)]
  );

  return { entries, lorebookVersion: 1 };
};