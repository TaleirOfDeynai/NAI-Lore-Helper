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
  object: (value) => value && typeof value === "object",
  /** @type {TLG.TypePredicate<any[]>} */
  array: (value) => Array.isArray(value),
  /** @type {TLG.TypePredicate<string>} */
  string: (value) => typeof value === "string",
  /** @type {TLG.TypePredicate<number>} */
  number: (value) => typeof value === "number",
  /** A bare object that inherits from only `Object` or nothing. */
  pojo: exports.dew(() => {
    const POJO_PROTOS = [Object.prototype, null];
    /** @type {TLG.TypePredicate<Object>} */
    const innerFn = (value) => {
      if (!exports.is.object(value)) return false;
      return POJO_PROTOS.includes(Object.getPrototypeOf(value));
    };
    return innerFn;
  })
};

/** Deeply merges multiple POJO objects together. */
exports.deepMerge = exports.dew(() => {
  const { pojo: isPojo } = exports.is;

  /** @type {(...objects: Object[]) => Iterable<string>} */
  function* keysOf(...objects) {
    for (const obj of objects) yield* Object.keys(obj);
  }

  /** @type {(...objects: any[]) => Iterable<[string, Object[]]>} */
  function* pojoValues(...objects) {
    if (!objects.every((obj) => isPojo(obj))) return;

    const keys = new Set(keysOf(...objects));
    keyLoop: for (const key of keys) {
      const values = [];
      objLoop: for (const obj of objects) {
        const value = obj[key];
        if (value == null) continue objLoop;
        if (!isPojo(value)) continue keyLoop;
        values.push(value);
      }

      yield exports.tuple(key, values);
    }
  }

  /** @type {(...objects: Object[]) => Object} */
  const innerFn = (...objects) => {
    const baseObj = Object.assign({}, ...objects);
    for (const [key, values] of pojoValues(...objects)) {
      if (values.length <= 1) continue;
      baseObj[key] = innerFn(...values);
    }
    return baseObj;
  };

  return innerFn;
});

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