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
  forceActivation: false
};