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