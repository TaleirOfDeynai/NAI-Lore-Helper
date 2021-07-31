/** The primitive data-types. */
type Primitives = number | string | boolean | Function | {};

type DefinedOf<T extends {}> = {
  [K in keyof T]?: T[K] extends undefined ? never : T[K];
};

type Maybe<T> = T | null | undefined;

namespace NAI {

  interface ContextConfig {
    prefix: string;
    suffix: string;
    tokenBudget: number;
    reservedTokens: number;
    budgetPriority: number;
    trimDirection: "trimBottom" | "trimTop" | "doNotTrim";
    insertionType: "newline" | "sentence" | "token";
    maximumTrimType: "newline" | "sentence" | "token";
    insertionPosition: number;
  }

  interface LoreEntryConfig {
    searchRange: number;
    enabled: boolean;
    forceActivation: boolean;
    keyRelative: boolean;
    nonStoryActivatable: boolean;
  }

  interface LoreBookConfig {
    orderByKeyLocations: boolean;
  }

  interface LoreEntry extends LoreEntryConfig {
    text: string;
    displayName: string;
    keys: string[];
    contextConfig: ContextConfig;
    lastUpdatedAt?: number;
  }

  interface LoreBook {
    lorebookVersion: 2;
    settings: LoreBookConfig;
    entries: LoreEntry[];
  }

}

namespace TLG {

  type TypePredicate<T> = (value: any) => value is T;

  namespace Matching {
    interface EscapedRegex {
      isEscaped: true;
      toNAI(): string;
      toString(): string;
    }
  
    type Phrase = string | RegExp | PhraseExp | EscapedRegex;
    type BinaryOperator = (left: Phrase, right: Phrase) => EscapedRegex;
  
    interface ExtBinaryOperator {
      (): BinaryOperator;
      isExtBinaryOp: true;
    }
  
    type PhraseOperator = BinaryOperator | ExtBinaryOperator;
    type PhraseOperand = Phrase | PhraseExp;
  
    type PhraseExp = [PhraseOperand, PhraseOperator, PhraseOperand];
  }

  namespace Config {
    type NaiConfig = NAI.ContextConfig | NAI.LoreEntryConfig;

    /**
     * A common interface for minimum configuration needed by the entry builder to
     * construct `NAI.LoreEntry` instances.
     */
    interface CommonConfig {
      /** The current context configuration. */
      context: NAI.ContextConfig;

      /** The current entry configuration. */
      entry: NAI.LoreEntryConfig;
    }

    interface State extends CommonConfig {
      /**
       * A list of strategies already applied by ancestor `TLG.BuildableEntry`.
       * 
       * Strategies can use this to see what other strategies have already been applied to
       * the `context` and `entry` configuration provided by `State`.
       */
      strategyStack: Strategy<string, any>[];

      /**
       * The current depth in the `TLG.BuildableEntry` tree.
       * 
       * The root entries will have a depth of `0`.
       */
      depth: number;
    }

    interface StrategyMethod<TStrategyConfig, TConfig extends NaiConfig> {
      /**
       * A method that builds either a `NAI.ContextConfig` or `NAI.LoreEntryConfig`.
       * 
       * @param state
       * The current state from the entry builder.
       * @param strategyConfig
       * The finalized strategy configuration.
       */
      (state: State, strategyConfig: TStrategyConfig): TConfig;
    }

    /**
     * Represents a method of manipulating the `context` and `entry` configuration
     * as the entry builder traverses the `entries` of `TLG.BuilderConfig`.
     */
    interface Strategy<TType extends string, TStrategyConfig> {
      /** 
       * The type of this strategy.  Strategies can use this to see what other strategies
       * have already been applied to the `context` and `entry` configuration.
       */
      type: TType;

      /**
       * The configuration provided to the strategy, initially.
       */
      config: Partial<TStrategyConfig>;

      /**
       * Applies the strategy to the current state, producing a finalized configuration
       * to be passed to `context` and `entry`.
       */
      apply: (state: State, currentConfig: Partial<TStrategyConfig>) => TStrategyConfig;

      /**
       * Extends the strategy for the next state, producing a finalized configuration
       * to be passed to `context` and `entry`.
       */
      extend: (state: State, currentConfig: Partial<TStrategyConfig>) => TStrategyConfig;

      /**
       * Outputs a finalized `NAI.ContextConfig` for an entry.
       */
      context: StrategyMethod<TStrategyConfig, NAI.ContextConfig>;

      /**
       * Outputs a finalized `NAI.LoreEntryConfig` for an entry.
       */
      entry: StrategyMethod<TStrategyConfig, NAI.LoreEntryConfig>;
    }
  }

  interface BuildableEntryConfig {
    /**
     * The strategy to use when processing this entry.
     * 
     * Strategies provide a method of manipulating the `context` and `entry` configuration
     * as the entry builder traverses the `entries` of `BuilderConfig`.
     */
    strategy?: Config.Strategy<string, any>;

    /**
     * The operator that related `subEntries` will use to combine their parent's
     * keys with their own.  This will be provided to the `subEntries` as their
     * default `rootOp`, if it is not set.
     * 
     * Defaults to the value of `rootOp`.
     */
     subOp?: Matching.PhraseOperator;
  }

  interface BuildableEntry extends BuildableEntryConfig {
    /**
     * The name for this entry.
     */
    name: string;

    /**
     * The keys inherited from the parent.  This is set to whatever keys were
     * ultimately used to output the parent entries.
     * 
     * You can also override this with a new array retain a parent-child relationship,
     * but refocus the keys for this entry.
     * 
     * When this is a function, it will receive the parent keys, allowing you to
     * manipulate or add to the keys without fully replacing them.
     */
    baseKeys?: Matching.PhraseOperand[] | ((baseKeys: Matching.PhraseOperand[]) => Matching.PhraseOperand[]);

    /**
     * The operator that will be used to join the `baseKeys` with the `keys`.
     * 
     * Defaults to `AND`.
     */
    baseOp?: Matching.PhraseOperator;

    /**
     * The keys for the entry.  May be an empty array, but must be present.
     */
    keys: Matching.PhraseOperand[];

    /**
     * A string or several strings that will each be converted into an entry.
     */
    text?: string | string[];

    /**
     * Other entries that are related to this entry.
     * 
     * Each sub-entry will require the keys of this entry to match, using the
     * operator specified in `subOp`, in order for them to match.
     */
    subEntries?: BuildableEntry[];
  }

  interface BuilderConfig {
    /**
     * The default strategy to use when an entry in `entries` does not provide one.
     * 
     * Strategies provide a method of manipulating the `context` and `entry` configuration
     * as the entry builder traverses the `entries` of `TLG.BuilderConfig`.
     */
    strategy?: Config.Strategy<string, any>;

    /**
     * Settings for the lorebook itself.
     */
    settings?: Partial<NAI.LoreBookConfig>;

    /**
     * The list of `TLG.BuildableEntry` to build `NAI.LoreEntry` from.
     */
    entries: BuildableEntry[];
  }

  interface WithDisplay {
    /** Shorthand to convert to a JSON string for RunKit. */
    forDisplay(): string;
  }

}