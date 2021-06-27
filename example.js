const { getName, outputLorebook } = require("./utils");
const matching = require("./matching");
const { buildEntries } = require("./building");

// This is a very basic example of how to use this script to produce a lorebook with fairly
// complex keyword matching.

// In order to run this example, run `node ./example.js` from the command-line or terminal.
// It will generate a file called `example.lorebook` in the same directory that can be imported
// into NovelAI.

/**
 * These are keyword helper functions.  They convert simple strings into regular-expressions
 * that can be composed using operators more easily.  This library calls such a regular-expression
 * a "phrase".
 * 
 * - `LIT` creates an exact-match phrase.
 * - `PRE` creates a prefix phrase, meaning the start of the string must match.
 * - `POST` creates a postfix phrase, meaning the end of the string must match.
 * - `OPEN` creates a phrase that will match any part of a word; it is open-ended.
 * 
 * If you provide a raw string into an entry's `keys`, it will default to using `PRE`, so using
 * that helper directly is seldom necessary.
 */
const { LIT, PRE, POST, OPEN } = matching;

/**
 * These are phrase operators.  They take multiple phrases (usually only two) and combine them
 * in some way.  Usually, they constrain when and how phrases must appear in association to
 * each other.
 * 
 * `NEAR` and `BEYOND` are special in that they can take options to indicate how many words
 * apart the two phrases need to be.
 * 
 * Check `matching.js` for more detailed descriptions of how they work.
 */
const {
  /**
   * Creates a phrase that matches any of the provided phrases; it's basically like an "or".
   * It is the only operator that can receive more than two phrases.
   */
  ALT,
  /**
   * Ensures that two phrases appear together within the search text.
   * This is the default for `subOp`, if it is left unspecified.
   */
  AND,
  /** These constrain by proximity. */
  WITH, NEAR,
  /** These ensure phrases are separated from each other by some measure. */
  WITHOUT, BEYOND
} = matching;

// A predefined configuration for very important entries.
// These will be inserted on the 8th line from the latest input and reserve their space.
const stateConfig = {
  contextConfig: {
    prefix: "[Note: ",
    suffix: "]\n",
    reservedTokens: 2048,
    budgetPriority: -200,
    insertionPosition: -8
  },
  searchRange: 1024
};

const loreBook = buildEntries({
  // Here we specify the configuration for the whole lorebook.  The defaults are always the
  // same as a new lorebook entry in NovelAI, so you need only provide overrides versus those.
  contextConfig: {
    prefix: "• ",
    suffix: "\n"
  },
  entryConfig: {
    searchRange: 8192
  },
  // This is where your entries go.  Each entry is an object in this array.
  entries: [
    {
      name: "Story Header",
      // Root entries with empty `keys` will have Force Activation enabled by default.
      keys: [],
      text: "Theme: fantasy"
    },
    {
      name: "Definition: Kemon",
      keys: [
        // This matches the literal word `"kemon"`, exactly.
        LIT("kemon"),
        // It also provides a regular-expression literal to match various forms of "-folk".
        // Bear in mind, flags are ignored.  This system always uses case-insensitive
        // matching, because of how it constructs complex regular-expressions.
        // Honoring case-sensitivity is simply not practical.
        /\b(beast|furred|scaled)-folk\b/
      ],
      text: "The word \"kemon\" is a term that collectively refers to the furred and scaled races of the world."
    },
    {
      name: "Character: Taleir",
      keys: [LIT("taleir")],
      // This entry demonstrates multiple `text` entries.  Each of these pieces of
      // text will be emitted as their own entry with the same keys.  This makes it
      // easier for the system to discard entries when the context becomes crowded.
      text: [
        "The main character is Taleir, an adventurous fox girl.  Her hair is disheveled and neck length.  Taleir's fur is rust colored with white fur running down from her chest and across her stomach and on her tail's tip.  She has brown markings on her feet and the tips of her ears.  Taleir is a former rogue who has come to the city of Jasco to find more legitimate work.",
        "Taleir carries the gear needed for her current job or task in her backpack.  She keeps her weapons and potions at the ready with a baldric across her chest.  She relies primarily on speed and stealth, but is adept with her dagger and throwing knives when they're called for."
      ],
      // Sub-entries will combine the parent entry's keys together with the keys of
      // each child entry.  The way this combination is performed is specified with
      // `subOp`, which defaults to `AND`.
      subEntries: [
        {
          // The name of a sub-entry is appended to the parent's name.
          // In this case, these wntries will be emitted as `"Character: Taleir - Backstory"`.
          // Additionally, in order to make it more likely that the name is unique to
          // ease re-importing a lorebook after making changes, if `text` is an array
          // with more than one entry, it will additionally have something like `"(1 of 3)"`
          // added to it as well.
          name: "Backstory",
          // Here we specify an empty set of `keys`.  This means these entries will
          // only use the keys of the parent.  Why make these a sub-entry?  By default,
          // the priority of sub-entries is reduced by `1` compared to the parent.
          // You can alter this behavior with `priorityDelta`, which is `-1` by default.
          keys: [],
          text: [
            "Taleir has some notoriety as The Ghost of Mentesa Hold, due to her origins within that slave trading outpost.  Most people do not believe the story, but those who have met some of the slaves she freed believe it.",
            "Taleir was once a rogue in Ancester and was adept at quietly acquiring things and information by contract.  She no longer wants to follow that conflicting and immoral path, so left for Jasco where kemon like her have better opportunities."
          ]
        },
        {
          name: "Jasco Unfamiliarity",
          keys: [LIT("jasco")],
          text: "This is Taleir's first time in Jasco and may become lost in its streets.",
          // Here we apply that `stateConfig` defined earlier.  The way entry configuration works
          // is the child will inherit the configuration of the parent, but the child can specify
          // new values that will act as overrides.
          //
          // This trick of using a spread-operator can save you a lot of copying and pasting when
          // you want only a few entries to work in a special way.
          ...stateConfig
        }
      ]
    },
    {
      name: "Character: Rook",
      keys: [
        LIT("rook"),
        // Rook is a resident of Jasco, so if Jasco is mentioned, let's remind the AI what characters
        // inhabit that city.
        LIT("jasco"),
        // Here we use a phrase expression to combine two different phrases together.
        // We want this entry to match if the word "jeweler" is used on the same line as something
        // suggesting the location is within the city.
        //
        // Phrase expressions are always arrays of three elements, with the phrase operator appearing
        // between the two phrases.
        //
        // You can also just call the phrase operators as functions too.  This would be equivalent:
        // `WITH("jeweler", ALT("city", "shop", "street", "town"))`
        //
        // But, using this form means you can use an operator that takes options, like `NEAR`, without
        // needing to specify those options, choosing to use the defaults.
        ["jeweler", WITH, ALT("city", "shop", "street", "town")]
      ],
      text: "Rook is a male otter and a jeweler in the city of Jasco.",
      // This sets the default method of combining the parent `keys` with the `keys` of sub-entries.
      // You can override this default on a case-by-case basis with `baseOp` on the sub-entry.
      subOp: WITH,
      subEntries: [
        {
          name: "Interest",
          // Here we do something special.  I only want this entry to appear if "rook" is matched, but
          // not "jasco" or that "jeweler" business in the parent.  You can override the `baseKeys`
          // and `baseOp` to explicitly state what keys are combined with `keys` and in what way.
          baseKeys: [LIT("rook")],
          keys: [/\bhobb(y|ies)\b/, /\bcloth(es|ing)\b/, "tailor"],
          text: "Rook has secretly been practicing tailoring in his basement workshop, designing ornate clothing.  He still sees himself as a novice and is reluctant to show off his work."
        }
      ]
    }
  ]
});

// This all just writes the output to the filesystem.
// It will use the name `example.lorebook`, since this file is called `example.js`.
outputLorebook(getName(__filename), loreBook);