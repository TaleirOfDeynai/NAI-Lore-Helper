export interface UniqueConfig {
  /**
   * Changes the priority of sub-entries by this much.  A negative value will
   * reduce the priority and a positive value will increase it.
   * 
   * Defaults to `-1`, making the priority of children slightly lower than the parent.
   */
   priorityDelta: number;

   /**
    * Changes the search-range of sub-entries by this much.  A negative value will
    * reduce the range to a minimum value of `512` and a positive value will increase
    * it to a maximum of `10000`.
    * 
    * Defaults to `0`, meaning no change in search-range.
    */
   searchDelta: number;
}

export interface DepthDeltaConfig extends Partial<UniqueConfig> {
  context?: Partial<NAI.ContextConfig>;
  entry?: Partial<NAI.LoreEntryConfig>;
}

export type DepthDeltaStrategy = TLG.Config.Strategy<"DepthDelta", DepthDeltaConfig>;