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
 * Outputs a lorebook to the file system.
 * 
 * @param {string} name 
 * @param {NAI.LoreBook} obj 
 */
exports.outputLorebook = (name, obj) => {
  const fs = require("fs");

  fs.writeFile(
    `./${name}.lorebook`,
    JSON.stringify(obj, undefined, 2),
    (err) => {
      if (err) console.error(err);
    }
  );
};