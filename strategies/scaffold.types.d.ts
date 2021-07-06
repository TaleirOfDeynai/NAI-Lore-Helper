import type { DepthDeltaConfig, DepthDeltaStrategy } from "./depthDelta.types";

export type StrategyFn = (baseConfig?: Partial<DepthDeltaConfig>) => DepthDeltaStrategy;