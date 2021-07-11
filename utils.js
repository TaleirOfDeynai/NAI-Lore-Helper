/**
 * IIFE helper.
 * 
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
exports.dew = (fn) => fn();

/**
 * The identity function.
 * 
 * @template T
 * @param {T} value 
 * @returns {T}
 */
exports.ident = (value) => value;

/**
 * Coerces a value to an array.
 * 
 * @template T
 * @param {T | T[]} value
 * @returns {T[]}
 */
exports.asArray = (value) => Array.isArray(value) ? value : [value];

/**
 * Creates a strongly-typed tuple of any size, but supports only simpler
 * primatives: `number`, `string`, `boolean`, functions, and plain objects.
 * 
 * @template {readonly Primatives[]} T
 * @param {T} args
 * @returns {[...T]}
 */
// @ts-ignore - The `readonly` modifier is only used to infer literal types.
exports.tuple = (...args) => args;

/**
 * @template {{}} TObj
 * @param {TObj} obj 
 * @returns {DefinedOf<TObj>}
 */
exports.dropUndefProps = (obj) => {
  /** @type {any} */
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "undefined") continue;
    result[k] = v;
  }
  return result;
};

/** Helpers for type-guards. */
exports.is = {
  /** @type {TLG.TypePredicate<Function>} */
  function: (value) => typeof value === "function",
  /** @type {TLG.TypePredicate<Object>} */
  object: (value) => typeof value === "object",
  /** @type {TLG.TypePredicate<any[]>} */
  array: (value) => Array.isArray(value),
  /** @type {TLG.TypePredicate<string>} */
  string: (value) => typeof value === "string",
  /** @type {TLG.TypePredicate<number>} */
  number: (value) => typeof value === "number" 
};

/**
 * Extracts a name from a file path.  Pass in `__filename` to get the nam
 * 
 * @param {string} filePath 
 * @returns {string}
 */
exports.getName = (filePath) => {
  const path = require("path");
  const ext = path.extname(filePath) || undefined;
  return path.basename(filePath, ext);
};

/**
 * Converts a lorebook to a user-readable JSON representation.
 * 
 * @param {NAI.LoreBook} lorebook 
 * @returns {string}
 */
exports.outputLorebook = (lorebook) => JSON.stringify(lorebook, undefined, 2);

/**
 * Saves a lorebook to the file system.
 * 
 * @param {string} name 
 * @param {NAI.LoreBook} lorebook 
 */
exports.saveLorebook = (name, lorebook) => {
  const fs = require("fs");

  fs.writeFile(
    `./${name}.lorebook`,
    exports.outputLorebook(lorebook),
    (err) => {
      if (err) console.error(err);
    }
  );
};