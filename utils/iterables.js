/// <reference path="./utils-types.d.ts" />
const { dew } = require(".");

/**
 * Tests if something is iterable.  This will include strings, which indeed,
 * are iterable.
 * 
 * @param {any} value 
 * @returns {value is Iterable<any>}
 */
exports.hasIterator = (value) =>
  value != null && typeof value === "object" && Symbol.iterator in value;

/**
 * Creates an object from key-value-pairs.
 * 
 * @template {[string | number, any]} KVP
 * @param {Iterable<KVP>} kvps
 * @returns {UnionToIntersection<FromPairsResult<KVP>>}
 */
exports.fromPairs = (kvps) => {
  /** @type {any} Oh, shove off TS. */
  const result = {};
  for (const [k, v] of kvps) result[k] = v;
  return result;
};

/**
 * Creates an iterable that yields the key-value pairs of an object.
 * 
 * @template {string | number} TKey
 * @template TValue
 * @param {Maybe<Record<TKey, TValue>>} obj
 * @returns {Iterable<[TKey, TValue]>} 
 */
exports.toPairs = function*(obj) {
  if (obj == null) return;
  for(const key of Object.keys(obj)) {
    // @ts-ignore - `Object.keys` is too dumb.
    yield exports.tuple2(key, obj[key]);
  }
};

/**
 * Transforms an iterable with the given function, yielding each result.
 * 
 * @template T
 * @template U
 * @param {Iterable<T>} iterable
 * @param {TransformFn<T, Iterable<U>>} transformFn
 * @returns {Iterable<U>}
 */
exports.flatMap = function* (iterable, transformFn) {
  for (const value of iterable) yield* transformFn(value);
};

/**
 * Flattens the given iterable.  If the iterable contains strings, which
 * are themselves iterable, they will be yielded as-is, without flattening them.
 * 
 * @template {Flattenable<any>} T
 * @param {Iterable<T>} iterable
 * @returns {Iterable<Flattenable<T>>}
 */
exports.flatten = function* (iterable) {
  for (const value of iterable) {
    // @ts-ignore - We pass out non-iterables, as they are.
    if (!exports.hasIterator(value)) yield value;
    // @ts-ignore - We don't flatten strings.
    else if (typeof value === "string") yield value;
    // And now, do a flatten.
    else yield* value;
  }
};

/**
 * Iterates over an array, yielding the current index and item.
 * 
 * @template T
 * @param {T[]} arr
 * @returns {Iterable<[number, T]>}
 */
exports.iterArray = function* (arr) {
  for (let i = 0, lim = arr.length; i < lim; i++)
    yield [i, arr[i]];
};

/**
 * Yields iterables with a number representing their position.  For arrays,
 * this is very similar to a for loop, but you don't increment the index
 * yourself.
 * 
 * @template T
 * @param {Iterable<T>} iter
 * @returns {Iterable<[number, T]>}
 */
exports.iterPosition = function* (iter) {
  if (Array.isArray(iter)) {
    yield* exports.iterArray(iter);
  }
  else {
    let i = 0;
    for (const item of iter) yield [i++, item];
  }
};

/**
 * Yields elements of an iterable in reverse order.  You can limit the
 * number of results yielded by providing `count`.
 * 
 * @template T
 * @param {Iterable<T>} arr
 * @param {number} [count]
 * @returns {Iterable<T>}
 */
 exports.iterReverse = function* (arr, count) {
  if (Array.isArray(arr)) {
    // Ensure `count` is between 0 and the number of items in the array.
    count = Math.max(0, Math.min(arr.length, count ?? arr.length));
    const lim = arr.length - count;
    for (let i = arr.length - 1; i >= lim; i--) yield arr[i];
  }
  else {
    // Either way we gotta cache the values so we can reverse them.
    yield* exports.iterReverse([...arr], count);
  }
};

/**
 * Creates an iterable that transforms values.
 * 
 * @template TIn
 * @template TOut
 * @param {Iterable<TIn>} iterable 
 * @param {TransformFn<TIn, TOut>} transformFn
 * @returns {Iterable<TOut>}
 */
exports.mapIter = function* (iterable, transformFn) {
  for (const value of iterable)
    yield transformFn(value);
};

/**
 * Creates an iterable that transforms values, and yields the result if it is
 * not `undefined`.
 * 
 * @template TIn
 * @template TOut
 * @param {Iterable<TIn>} iterable 
 * @param {CollectFn<TIn, TOut>} collectFn
 * @returns {Iterable<TOut>}
 */
exports.collectIter = function* (iterable, collectFn) {
  for (const value of iterable) {
    const result = collectFn(value);
    if (typeof result !== "undefined") yield result;
  }
};

/**
 * Filters the given iterable to those values that pass a predicate.
 * 
 * @template T
 * @param {Iterable<T>} iterable
 * @param {PredicateFn<T>} predicateFn
 * @returns {Iterable<T>}
 */
 exports.filterIter = function* (iterable, predicateFn) {
  for (const value of iterable)
    if (predicateFn(value))
      yield value;
};

/**
 * Creates an iterable that groups values based on a transformation function.
 * 
 * @template TValue
 * @template TKey
 * @param {Iterable<TValue>} iterable
 * @param {TransformFn<TValue, TKey>} transformFn
 * @returns {Iterable<[TKey, TValue[]]>}
 */
exports.groupBy = function* (iterable, transformFn) {
  /** @type {Map<TKey, TValue[]>} */
  const groups = new Map();
  for (const value of iterable) {
    const key = transformFn(value);
    if (key == null) continue;
    const theGroup = groups.get(key) ?? [];
    theGroup.push(value);
    groups.set(key, theGroup);
  }

  for (const group of groups) yield group;
};

/** @type {<KVP extends [any, any]>(kvp: KVP) => KVP[0]} */
const partitionKeys = ([key]) => key;
/** @type {<KVP extends [any, any]>(kvp: KVP) => KVP[1]} */
const partitionValues = ([, value]) => value;

/**
 * Creates an iterable that groups key-value-pairs when they share the same key.
 * 
 * @template {[any, any]} KVP
 * @param {Iterable<KVP>} iterable
 * @returns {Iterable<PartitionResult<KVP>>}
 */
exports.partition = function* (iterable) {
  for (const [key, values] of exports.groupBy(iterable, partitionKeys)) {
    const group = values.map(partitionValues);
    // @ts-ignore - This is correct.
    yield [key, group];
  }
};

/**
 * Concatenates multiple values and/or iterables together.  Does not iterate
 * on strings, however.
 * 
 * @template T
 * @param  {...(T | Iterable<T>)} others
 * @returns {Iterable<T>}
 */
exports.concat = function* (...others) {
  for (const value of others) {
    if (typeof value === "string") yield value;
    else if (exports.hasIterator(value)) yield* value;
    else yield value;
  }
};

/**
 * Inserts `value` between every element of `iterable`.
 * 
 * @template T
 * @param {T} value 
 * @param {Iterable<T>} iterable
 * @returns {Iterable<T>}
 */
exports.interweave = function* (value, iterable) {
  const iterator = iterable[Symbol.iterator]();
  let prevEl = iterator.next();
  while (!prevEl.done) {
    yield prevEl.value;
    prevEl = iterator.next();
    if (prevEl.done) return;
    yield value;
  }
};

/**
 * Calls the given function on each element of `iterable` and yields the
 * values, unchanged.
 * 
 * @template {Iterable<any>} TIter
 * @param {TIter} iterable 
 * @param {TapFn<ElementOf<TIter>>} tapFn
 * @returns {Iterable<ElementOf<TIter>>}
 */
exports.tapEach = function* (iterable, tapFn) {
  // Clone an array in case the reference may be mutated by the `tapFn`.
  const safedIterable = Array.isArray(iterable) ? [...iterable] : iterable;
  for (const value of safedIterable) {
    tapFn(value);
    yield value;
  }
};

/**
 * Calls the given function on an array materialized from `iterable` and
 * yields the same values, unchanged.
 * 
 * @template {Iterable<any>} TIter
 * @param {TIter} iterable 
 * @param {TapFn<Array<ElementOf<TIter>>>} tapFn
 * @returns {Iterable<ElementOf<TIter>>}
 */
 exports.tapAll = function* (iterable, tapFn) {
  // Materialize the iterable; we can't provide an iterable that is
  // currently being iterated.
  const materialized = [...iterable];
  tapFn(materialized);
  yield* materialized;
};

/** @type {ChainingFn} */
exports.chain = dew(() => {
  const { mapIter, filterIter, collectIter, concat, tapEach, tapAll, flatten } = exports;
  // @ts-ignore - Should be checked.
  const chain = (iterable) => {
    iterable = iterable ?? [];
    /** @type {ChainComposition<any>} */
    const result = {
      // @ts-ignore - Fitting an overloaded method; TS can't handle it.
      map: (transformFn) => chain(mapIter(iterable, transformFn)),
      flatten: () => chain(flatten(iterable)),
      // @ts-ignore - Fitting an overloaded method; TS can't handle it.
      filter: (predicateFn) => chain(filterIter(iterable, predicateFn)),
      // @ts-ignore - Fitting an overloaded method; TS can't handle it.
      collect: (collectFn) => chain(collectIter(iterable, collectFn)),
      concat: (...others) => chain(concat(iterable, ...others)),
      thru: (transformFn) => chain(transformFn(iterable)),
      tap: (tapFn) => chain(tapEach(iterable, tapFn)),
      tapAll: (tapFn) => chain(tapAll(iterable, tapFn)),
      /** @param {TransformFn<any, any>} [xformFn] */
      value: (xformFn) => xformFn ? xformFn(iterable) : iterable,
      toArray: () => [...iterable],
      exec: () => { for (const _ of iterable); }
    };
    return result;
  };
  return chain;
});