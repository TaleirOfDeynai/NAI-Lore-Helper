const { dew, tuple, is } = require("./utils");

/** All characters. */
const AC = "[\\s\\S]";
/** Word boundary. */
const B = "\\b";
/** Not word or line-break. */
const NWLB = "[^\\w\\n]";
/** Open ended. */
const OE = "\\w*?";

/**
 * Adds a flag that marks a function as an extended binary operator.
 * 
 * Extended binary operators can be given options to vary their behavior.
 * 
 * @template {() => TLG.BinaryOperator} TFn
 * @param {TFn} fn
 * @returns {TFn & { isExtBinaryOp: true }}
 */
const asExtBinaryOp = (fn) => {
  // @ts-ignore
  fn.isExtBinaryOp = true;
  // @ts-ignore
  return fn;
};

/**
 * Makes a string safe to be used in a RegExp matcher.
 * 
 * @param {string} value
 * @returns {string}
 */
exports.escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const reNaiRegex = /^\/(.*)\/[ismu]*$/;
/**
 * Determines if the value is a NovelAI regular-expression string.
 * 
 * @param {*} value 
 * @returns 
 */
exports.isNaiRegex = (value) => reNaiRegex.test(value);

/**
 * Determines if the value is an escaped regular-expression part.
 * 
 * @param {any} value 
 * @returns {value is TLG.EscapedRegex}
 */
exports.isEscaped = (value) => {
  if (value == null) return false;
  if (!is.object(value)) return false;
  if (!is.function(value.toNAI)) return false;
  return value.isEscaped === true;
};

/**
 * Determines if the value is a phrase expression.
 * 
 * @param {any} value 
 * @returns {value is TLG.PhraseExp}
 */
exports.isPhraseExp = (value) => {
  if (!is.array(value)) return false;
  if (value.length !== 3) return false;
  if (!is.function(value[1])) return false;
  return true;
};

/**
 * Determines if the value is an extended binary operator.
 * 
 * @param {any} value 
 * @returns {value is TLG.ExtBinaryOperator}
 */
exports.isExtBinaryOperator = (value) => {
  if (!is.function(value)) return false;
  return "isExtBinaryOp" in value && value.isExtBinaryOp === true;
};

/**
 * Evaluates a 3-tuple phrase expression.
 * 
 * @param {TLG.PhraseExp} exp
 * @returns {TLG.EscapedRegex}
 */
exports.evalExp = (exp) => {
  const [left, op, right] = exp;
  const theOp = exports.isExtBinaryOperator(op) ? op() : op;
  return theOp(left, right);
};

/**
 * Wraps a string in an object that indicates it is an escaped regular-expression pattern.
 * 
 * @param {string} pattern 
 * @returns {TLG.EscapedRegex}
 */
exports.toEscaped = (pattern) => {
  return {
    isEscaped: true,
    toNAI: () => `/${pattern}/i`,
    toString: () => pattern
  };
};

/**
 * Coerces the given `TLG.Phrase` into a `TLG.EscapedRegex`.
 * - `RegExp` - The `source` property is used, however, flags are discarded.
 * - `TLG.PhraseExp` - Evaluates the phrase expression and returns the result.
 * - `TLG.EscapedRegex` - Returned as-is.
 * - `string` - Converted using `PRE`.
 * 
 * @param {TLG.Phrase} phrase 
 * @returns {TLG.EscapedRegex}
 */
exports.asEscaped = (phrase) => {
  if (phrase instanceof RegExp) return this.toEscaped(`(?:${phrase.source})`);
  if (exports.isPhraseExp(phrase)) return exports.evalExp(phrase);
  if (exports.isEscaped(phrase)) return phrase;
  return exports.PRE(phrase);
}

/**
 * Creates an exact-match phrase.
 * 
 * @param {string} word 
 * @returns {TLG.EscapedRegex}
 */
exports.LIT = (word) => exports.toEscaped(`${B}${exports.escapeRegExp(word)}${B}`);

/**
 * Creates an prefix phrase, where the tail-end of the word is open-ended.
 * 
 * This is the default conversion from `string` to `TLG.EscapedRegex`.
 * 
 * @param {string} word 
 * @returns {TLG.EscapedRegex}
 */
exports.PRE = (word) => exports.toEscaped(`${B}${exports.escapeRegExp(word)}`);

/**
 * Creates an postfix phrase, where the leading-end of the word is open-ended.
 * 
 * @param {string} word 
 * @returns {TLG.EscapedRegex}
 */
exports.POST = (word) => exports.toEscaped(`${OE}${exports.escapeRegExp(word)}${B}`);

/**
 * Creates an open-ended phrase, where both ends of the word are open-ended.
 * 
 * @param {string} word 
 * @returns {TLG.EscapedRegex}
 */
exports.OPEN = (word) => exports.toEscaped(`${OE}${exports.escapeRegExp(word)}`);

/**
 * Creates a phrase from a NovelAI regular-expression string, to help with migrating
 * pre-existing lorebooks.
 * 
 * Note: only the pattern of the regular-expression will be used.  Any flags specified
 * will be discarded due to script limitations.
 * 
 * @param {string} regex 
 */
exports.REGEX = (regex) => {
  const match = reNaiRegex.exec(regex);
  if (match) return match[1];
  throw new Error(`Not compatible with NovelAI's regular-expressions: ${regex}`);
};

/**
 * Constructs a phrase expression.
 * 
 * This exists primarily for type-safety and to make TypeScript happy when it fails
 * to infer `TLG.PhraseExp` from array literals in certain situations.
 * 
 * @param {TLG.Phrase} left 
 * @param {TLG.PhraseOperator} op 
 * @param {TLG.Phrase} right 
 * @returns {TLG.PhraseExp}
 */
exports.EXP = (left, op, right) => tuple(left, op, right);

/**
 * Matches at least one of the given alternatives.
 * 
 * @param  {...TLG.Phrase} alternates 
 * @returns {TLG.EscapedRegex}
 */
exports.ALT = (...alternates) => {
  alternates = alternates.map((alt) => exports.asEscaped(alt));
  return exports.toEscaped(`(?:${alternates.join("|")})`);
}

/**
 * Matches `left` when `right` appears together with it, within the searched text.
 * 
 * @param {TLG.Phrase} left
 * @param {TLG.Phrase} right
 * @returns {TLG.EscapedRegex}
 * 
 */
exports.AND = (left, right) => {
  const reLeft = exports.asEscaped(left);
  const reRight = exports.asEscaped(right);
  return exports.toEscaped(`(?:${reRight}(?:(?=${AC}*?${reLeft})|(?<=${reLeft}${AC}*?)))`);
};

/**
 * Matches `left` when `right` does NOT appear together with it, within the searched text.
 * 
 * @param {TLG.Phrase} left
 * @param {TLG.Phrase} right
 * @returns {TLG.EscapedRegex}
 * 
 */
 exports.EXCLUDING = (left, right) => {
  const reLeft = exports.asEscaped(left);
  const reRight = exports.asEscaped(right);
  return exports.toEscaped(`(?:${reLeft}(?<!${reRight}${AC}*?)(?!${AC}*?${reRight}))`);
};

/**
 * Matches `left` when `right` appears together with it, within a single line.
 * 
 * @param {TLG.Phrase} left
 * @param {TLG.Phrase} right
 * @returns {TLG.EscapedRegex}
 */
exports.WITH = (left, right) => {
  const reLeft = exports.asEscaped(left);
  const reRight = exports.asEscaped(right);
  return exports.toEscaped(`(?:${reRight}(?:(?<=${reLeft}.*?)|(?=.*?${reLeft})))`);
};

/**
 * Matches `left` when `right` does NOT appear together with it, within a single line.
 * 
 * @param {TLG.Phrase} left
 * @param {TLG.Phrase} right
 * @returns {TLG.EscapedRegex}
 */
exports.WITHOUT = (left, right) => {
  const reLeft = exports.asEscaped(left);
  const reRight = exports.asEscaped(right);
  return exports.toEscaped(`(?:${reLeft}(?<!${reRight}.*?)(?!.*?${reRight}))`);
};

exports.NEAR = asExtBinaryOp(
  /**
   * Creates an operator that can match two phrases when they are in proximity to each other.
   * 
   * Supports options for range (defaults to 10 words) and whether the search can extends
   * beyond a single line (default is to disallow it).
   * 
   * @param {number | [number, number]} [range]
   * How near the two words must.
   * - `number` - Within the given number of words.
   * - `[number, number]` - Within this range of words.
   * @param {boolean} [sameLine]
   * Whether to constrain the search to a single line.  Defaults to `true`.
   * @returns {TLG.BinaryOperator}
   */
  (range = 10, sameLine = true) => {
    const [lo, hi] = dew(() => {
      checks: {
        if (is.number(range)) {
          if (range <= 0) return [0, 0];
          return [0, range];
        }
        if (!is.array(range)) break checks;
        if (range.length !== 2) break checks;
        return [Math.min(range[0], range[1]), Math.max(range[0], range[1])];
      }
      throw new TypeError(`Not valid for \`range\`: ${range}`);
    });

    /** @type {TLG.BinaryOperator} */
    const matcher = (left, right) => {
      const reLeft = exports.asEscaped(left);
      const reRight = exports.asEscaped(right);
      const NW = sameLine ? NWLB : "\\W";
      const sep = `(?:${NW}+\\w+){${lo},${hi}}?\\W+`
      const behind = `(?:(?:${reRight}${sep})${reLeft})`;
      const ahead = `(?:${reLeft}(?:${sep}${reRight}))`;
      return exports.toEscaped(`(?:${behind}|${ahead})`);
    };

    return matcher;
  }
);

exports.BEYOND = asExtBinaryOp(
  /**
   * Creates an operator that can match two phrases when they are NOT in proximity to each other.
   * 
   * Supports options for range (defaults to 10 words) and whether the search can extends beyond
   * a single line (default is to disallow it).
   * 
   * @param {number} [distance]
   * How distant the two words must be.
   * @param {boolean} [sameLine]
   * Whether to constrain the search to a single line.  Defaults to `true`.
   * @returns {TLG.BinaryOperator}
   */
  (distance = 10, sameLine = true) => {
    /** @type {TLG.BinaryOperator} */
    const matcher = (left, right) => {
      const reLeft = exports.asEscaped(left);
      const reRight = exports.asEscaped(right);
      const NW = sameLine ? NWLB : "\\W";
      const sep = `(?:${NW}+\\w+){${distance},}?\\W+`
      const behind = `(?:(?:${reRight}${sep})${reLeft})`;
      const ahead = `(?:${reLeft}(?:${sep}${reRight}))`;
      return exports.toEscaped(`(?:${behind}|${ahead})`);
    };
  
    return matcher;
  }
);