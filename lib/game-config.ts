export const gameConfig = {
  fallbackEnabled: process.env.NEXT_PUBLIC_USE_GAME_FALLBACKS !== "false",
  artificialDelayMs: 180,
  engineVersion: "advanced-foundation-v2",
} as const;

export type GameRuntimeMode = "fallback" | "api";
export const gameRuntimeMode: GameRuntimeMode = gameConfig.fallbackEnabled ? "fallback" : "api";
