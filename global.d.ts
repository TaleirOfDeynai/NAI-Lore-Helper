/** The primative data-types. */
type Primatives = number | string | boolean | Function | {};

namespace NAI {

  interface ContextConfig {
    prefix: string;
    suffix: string;
    tokenBudget: number;
    reservedTokens: number;
    budgetPriority: number;
    trimDirection: "trimBottom" | "trimTop" | "doNotTrim";
    insertionType: "newline" | "sentence" | "token";
    insertionPosition: number;
  }

  interface LoreEntryConfig {
    searchRange: number;
    enabled: boolean;
    forceActivation: boolean;
  }

  interface LoreEntry extends LoreEntryConfig {
    text: string;
    displayName: string;
    keys: string[];
    contextConfig: ContextConfig;
    lastUpdatedAt?: number;
  }

  interface LoreBook {
    lorebookVersion: 1;
    entries: LoreEntry[];
  }

}

namespace TLG {

  type TypePredicate<T> = (value: any) => value is T;

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

  interface BuildableEntryConfig extends Partial<NAI.LoreEntryConfig> {
    /**
     * The operator that related `subEntries` will use to combine their parent's
     * keys with their own.  This will be provided to the `subEntries` as their
     * default `rootOp`, if it is not set.
     * 
     * Defaults to the value of `rootOp`.
     */
     subOp?: PhraseOperator;

    /**
     * Changes the priority of sub-entries by this much.  A negative value will
     * reduce the priority and a positive value will increase it.
     * 
     * Defaults to `-1`, making the priority of children slightly lower than the parent.
     */
     priorityDelta?: number;
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
    baseKeys?: PhraseOperand[] | ((baseKeys: PhraseOperand[]) => PhraseOperand[]);

    /**
     * The operator that will be used to join the `baseKeys` with the `keys`.
     * 
     * Defaults to `AND`.
     */
    baseOp?: PhraseOperator;

    /**
     * The keys for the entry.  May be an empty array, but must be present.
     */
    keys: PhraseOperand[];

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

    /**
     * Overrides to the default context config.
     */
    contextConfig?: Partial<NAI.ContextConfig>;
  }

}