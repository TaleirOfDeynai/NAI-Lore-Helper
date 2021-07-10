/**
 * The default `ContextConfig` for `LoreEntry`.
 * 
 * @type {NAI.ContextConfig}
 */
exports.contextDefaults = {
  prefix: "",
  suffix: "\n",
  tokenBudget: 2048,
  reservedTokens: 0,
  budgetPriority: 400,
  trimDirection: "trimBottom",
  insertionType: "newline",
  maximumTrimType: "sentence",
  insertionPosition: -1
};

/**
 * The default `LoreEntryConfig` for `LoreEntry`.
 * 
 * @type {NAI.LoreEntryConfig}
 */
exports.entryDefaults = {
  searchRange: 1024,
  enabled: true,
  forceActivation: false,
  keyRelative: false,
  nonStoryActivatable: false
};

/**
 * The default `LoreBookConfig` for a `LoreBook`.
 * 
 * @type {NAI.LoreBookConfig}
 */
exports.lorebookDefaults = {
  orderByKeyLocations: false
};