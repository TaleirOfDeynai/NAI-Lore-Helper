const LoreHelper = require("novelai-lorebook-helper");

/**
 * This is a very basic example of how to use this script to produce a lorebook with
 * fairly complex keyword matching.
 */

/**
 * These are keyword helper functions.  They convert simple strings into
 * regular-expressions that can be composed using operators more easily.  This library
 * calls such a regular-expression a "phrase".
 * 
 * - `LIT` creates an exact-match phrase.
 * - `PRE` creates a prefix phrase, meaning the start of the string must match.
 * - `POST` creates a postfix phrase, meaning the end of the string must match.
 * - `OPEN` creates a phrase that will match any part of a word; it is open-ended.
 * - `REGEX` creates a phrase from a NovelAI regular-expression string, discarding 
 *   flags.
 * 
 * If you provide a raw string into an entry's `keys`, it will default to using `PRE`,
 * so using that helper directly is seldom necessary.
 */
const { LIT, PRE, POST, OPEN, REGEX } = LoreHelper.Matching;

/**
 * These are phrase operators.  They take multiple phrases (usually only two) and
 * combine them in some way.  Usually, they constrain when and how phrases must
 * appear in association to each other.
 * 
 * `NEAR` and `BEYOND` are special in that they can take options to indicate how
 * many words apart the two phrases need to be.
 */
const {
  /**
   * Constructs a phrase expression, with two phrases and one of the operators
   * below: `EXP("left", AND, "right")`
   */
  EXP,
  /**
   * Creates a phrase that matches any of the provided phrases; it's basically
   * like an "or".  It is the only operator that can receive more than two phrases.
   */
  ALT,
  /**
   * Ensures that two phrases do or do not appear together somewhere in the
   * search text. `AND` is the default for `subOp`, if it is left unspecified.
   */
  AND, EXCLUDING,
  /** These constrain by proximity. */
  WITH, NEAR,
  /** These ensure phrases are separated from each other by some amount of words. */
  WITHOUT, BEYOND
} = LoreHelper.Matching;

/**
 * The library has a few configuration strategies to make configuring your
 * lorebook easier.
 * 
 * The `DepthDelta` strategy gives control over how the priority and search range is
 * changed  as it traverses into deeper and more specific sub-entries.
 */
const { DepthDelta } = LoreHelper.Strategies;

/**
 * A predefined `DepthDelta` configuration for very important entries.
 * These will be inserted on the 8th line from the latest input and reserve
 * their space.
 */
const stateConfig = {
  context: {
    prefix: "[Note: ",
    suffix: "]\n",
    reservedTokens: 2048,
    budgetPriority: -200,
    insertionPosition: -8
  },
  entry: {
    searchRange: 1024
  }
};

/**
 * Here we define some shorthand accessors for common sets of keys.  You do not
 * need to do this, but I find it makes using and tweaking keys defining concepts
 * easier.
 */
const keys = {
  /** A concept for social/cultural stuff. */
  social: ["society", "culture", "live"],
  /** A concept for religion. */
  religion: [
    /\breligi(on|ous)\b/, /\bgods?\b/, /\bdeit(y|ies)\b/,
    "lore", "myth", LIT("follower"), "church", "temple"
  ],
  /** Some concepts associated with a species in the world. */
  vulpine: ["vulpine", "fox", "vixen"],
  deynai: [LIT("deynai"), LIT("deynian")],
  trunai: [LIT("trunai"), LIT("trunian")]
};

const loreBook = LoreHelper.Building.buildEntries({
  /**
   * Here we specify the default strategy for the whole lorebook.  A strategy
   * determines how the context and entry configuration will change each time it
   * progresses into a nested entry inside of `subEntries`.
   * 
   * Here we use the `DepthDelta` strategy, giving it some initial configuration.
   */
  strategy: DepthDelta({
    context: {
      /**
       * These settings are good for prose entries with a 2048 context-size and the
       * bulk of the entries positioned at the top of the context.
       */
      prefix: "• ",
      suffix: "\n"
    },
    entry: {
      searchRange: 2048
    },
    /**
     * Along with the usual configuration that NovelAI supports, `DepthDelta` also has
     * extra options that affect nested entries.  `priorityDelta` and `searchDelta` are
     * added to `context.budgetPriority` and `entry.searchRange`, respectively, each
     * time it descends deeper into the tree.
     * 
     * These values here are actually the defaults; I'm only demonstrating them here.
     * These settings should allow more specific entries, those nested in more general
     * entries and therefore harder to match, to be more dominant in the context.
     */
    priorityDelta: 1,
    searchDelta: 1024
  }),
  /** This is where your root entries go.  Each entry is an object in this array. */
  entries: [
    {
      name: "Story Header",
      /**
       * Root entries with empty `keys` will have Force Activation enabled by default.
       * You must specify a `forceActivation` property to override this behavior.
       */
      keys: [],
      text: "Theme: fantasy"
    },
    {
      name: "Definition: Kemon",
      keys: [
        /** This matches the literal word `"kemon"`, exactly. */
        LIT("kemon"),
        /**
         * It also provides a regular-expression literal to match various forms of
         * "-folk".  Bear in mind, flags are ignored.  This system always uses
         * case-insensitive matching, because it needs to construct complex, nested
         * regular-expressions.  Honoring case-sensitivity is simply not practical.
         */
        /\b(beast|furred|scaled)-folk\b/
      ],
      text: "The word \"kemon\" is a term that collectively refers to the furred and scaled races of the world."
    },
    {
      name: "Character: Taleir",
      keys: [LIT("taleir")],
      /**
       * This entry demonstrates multiple `text` entries.  Each of these pieces of
       * text will be emitted as their own entry with the same keys and configuration.
       * This makes it easier for the system to discard entries when the context
       * becomes crowded.
       */
      text: [
        "The main character is Taleir, an adventurous vulpine girl.  Her hair is disheveled and neck length.  Taleir's fur is rust colored with white fur running down from her chest and across her stomach and on her tail's tip.  She has brown markings on her feet and the tips of her ears.  Taleir is a former rogue who has come to the city of Jasco to find more legitimate work.",
        "Taleir carries the gear needed for her current job or task in her backpack.  She keeps her weapons and potions at the ready with a baldric across her chest.  She relies primarily on speed and stealth, but is adept with her dagger and throwing knives when they're called for."
      ],
      /**
       * Sub-entries will combine the parent entry's keys together with the keys of
       * each nested entry.  The way this combination is performed is specified with
       * `subOp`, which defaults to `AND`.
       */
      subEntries: [
        {
          /**
           * The name of a sub-entry is appended to the parent's name.
           * In this case, these entries will be emitted as:
           *   `"Character: Taleir - Backstory"`
           * 
           * Additionally, in order to make it more likely that the name is unique to
           * ease re-importing a lorebook after making changes, if `text` is an array
           * with more than one entry, it will additionally have something like
           * `"(1 of 3)"` added to it as well.
           */
          name: "Backstory",
          strategy: DepthDelta({
            context: {
              /**
               * In this case, we want to reduce the priority compared to the parent
               * (which has a default of 400), as background information isn't
               * incredibly important.
               */
              budgetPriority: 200
            }
          }),
          /**
           * Here we specify an empty set of `keys`.  This means these entries will
           * only use the keys of the parent.  All other aspects of nesting are still
           * applied, such as name construction and applying the `delta` configurations.
           */
          keys: [],
          text: [
            "Taleir has some notoriety as The Ghost of Mentesa Hold, due to her origins within that slave trading outpost.  Most people do not believe the story, but those who have met some of the slaves she freed believe it.",
            "Taleir was once a rogue in Ancester and was adept at quietly acquiring things and information by contract.  She no longer wants to follow that conflicting and immoral path, so left for Jasco where kemon like her have better opportunities."
          ]
        },
        {
          name: "Jasco Unfamiliarity",
          /**
           * Here we apply that `stateConfig` defined earlier.  The `DepthDelta` strategy
           * will inherit the `priorityDelta` and `searchDelta` from ancestor `DepthDelta`
           * strategies.
           */
          strategy: DepthDelta(stateConfig),
          keys: [LIT("jasco")],
          text: "This is Taleir's first time in Jasco and may become lost in its streets."
        }
      ]
    },
    {
      name: "Character: Rook",
      keys: [
        LIT("rook"),
        /**
         * Rook is a resident of Jasco, so if Jasco is mentioned, let's remind the AI what
         * characters inhabit that city.
         */
        LIT("jasco"),
        /**
         * Here we use a phrase expression to combine two different phrases together.
         * We want this entry to match if the word "jeweler" is used on the same line as
         * something suggesting the location is within the city.
         * 
         * Phrase expressions are always arrays of three elements, with the phrase operator
         * appearing between the two phrases.  The `EXP` helper constructs these expressions
         * in a way that will keep TypeScript from raising false errors.
         * 
         * You can also just call the phrase operators as functions too.
         * This would be equivalent:
         *   `WITH("jeweler", ALT("city", "shop", "street", "town"))`
         * 
         * But, using this form means you can use an operator that takes options, like
         * `NEAR`, without needing to specify those options, choosing to use the defaults.
         */
        EXP("jeweler", WITH, ALT("city", "shop", "street", "town"))
      ],
      text: "Rook is a male otter and a jeweler in the city of Jasco.",
      /**
       * This sets the default method of combining the parent `keys` with the `keys`
       * of sub-entries.  You can override this default on a case-by-case basis with
       * `baseOp` on the sub-entry.
       */
      subOp: WITH,
      subEntries: [
        {
          name: "Interest",
          /**
           * Here we do something special.  I only want this entry to appear if "rook"
           * is matched, but not "jasco" or that "jeweler" business in the parent.
           * The `baseKeys` and `baseOp` properties are usually set by the parent and
           * used to pass information about the `keys` and `subOp` of its ancestors
           * to nested entries, but you can completely override this with these properties.
           */
          baseKeys: [LIT("rook")],
          keys: [/\bhobb(y|ies)\b/, /\bcloth(es|ing)\b/, "tailor"],
          text: "Rook has secretly been practicing tailoring in his basement workshop, designing ornate clothing.  He still sees himself as a novice and is reluctant to show off his work."
        }
      ]
    },
    {
      name: "Species - Vulpine",
      /** We'll make use of those shorthand accessors here. */
      keys: keys.vulpine,
      text: "The Vulpine are a species of kemon resembling foxes.  Foxes are cunning and swift, while still generally helpful and kind.",
      subOp: WITH,
      subEntries: [
        {
          name: "Physical",
          /**
           * Another set of empty keys, so the parent's keys will be used.
           * In this case, we will not reduce `contextConfig.budgetPriority`, as these
           * qualities are more likely to affect the course of the story, especially
           * for the main character.
           */
          keys: [],
          text: [
            "Vulpine stand roughly waist high compared to an adult human.  Foxes are shorter than humans.",
            "Vulpine are weaker than most other species, but have exceptional dexterity and awareness."
          ]
        },
        {
          name: "Social",
          keys: keys.social,
          text: [
            "Vulpine live together in isolated, close-knit groups of two to three families, supporting each other.",
            "Vulpine are less commonly found in cities, but those with unusual upbringing are more comfortable within the sprawl."
          ]
        },
        /**
         * This entry will demonstrate a very complicated composition and some advanced
         * features.
         * 
         * The vulpine have two deities, Deynai and Trunai.  We want to be able to provide
         * this information when foxes are mentioned in a religious context or the name of
         * one of their gods is mentioned.
         */
        {
          name: "Religion",
          /**
           * The parent specified a `subOp` of `WITH`, but I want this entry, and only
           * this entry, to use `AND` instead.  Note that the `baseOp` will be used as
           * the `subOp` for nested entries unless you tell it otherwise by setting
           * this entry's `subOp` property.
           */
          baseOp: AND,
          keys: keys.religion,
          /**
           * We're skipping `text` this time, only using this to configure the nested
           * entries.
           */
          subEntries: [
            {
              name: "Deynai",
              /**
               * We're going to build quite a complex matcher here.  `baseKeys` accepts
               * a function which can receive the parent's keys and manipulate them however
               * you need.
               */
              baseKeys: (baseKeys) => [
                /**
                 * In this case, we only want to match the `keys.religion` stuff when
                 * it does not appear with one of the names of the vulpine deities.
                 * This allows these entries to match a generic phrase like, "a vulpine
                 * walks out of a church," and inject information about their religion
                 * into context.
                 */
                ...baseKeys.map((k) => EXP(k, EXCLUDING, ALT(...keys.deynai, ...keys.trunai))),
                /**
                 * But we have two deities.  If this specific deity is mentioned, the
                 * context will be focused on that deity instead, helping to reduce the
                 * likelihood of a "lore dump" that dominates the context with too much
                 * information about the vulpine religion.
                 */
                ...keys.deynai
                /**
                 * In more basic terms, the constructed keys can be summed up as:
                 * - (`keys.vulpine` AND `keys.religion`) EXCLUDING (`keys.deynai` OR `keys.trunai`)
                 * - "deynai"
                 * - "deynian"
                 */
              ],
              /** We're actually using `baseKeys` as the primary key source. */
              keys: [],
              text: [
                "Deynai is the vulpine goddess of procreation and life, representing the female sex.",
                "In vulpine myth, Deynai gave birth to the world and all life upon it.",
                /** Something to allow the AI to pull Trunai into context, if it sees fit. */
                "Deynai's myth is closely tied to Trunai, her mate."
              ]
            },
            {
              /** And now, an entry for Trunai, which is very similar. */
              name: "Trunai",
              baseKeys: (baseKeys) => [
                ...baseKeys.map((k) => EXP(k, EXCLUDING, ALT(...keys.deynai, ...keys.trunai))),
                ...keys.trunai
              ],
              keys: [],
              text: [
                "Trunai is the vulpine god of love and devotion, representing the male sex.",
                "In vulpine myth, Trunai's boundless love for Deynai helped to shape the world into what it is today.",
                "Trunai's myth is closely tied to Deynai, his mate."
              ]
            }
          ]
        }
      ]
    }
  ]
});

// Have RunKit display the result.
loreBook.forDisplay();