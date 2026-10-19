export const moderationConfig = {
  enabled: process.env.NEXT_PUBLIC_USE_MODERATION_FALLBACKS !== "false",
  artificialDelayMs: 180,
} as const;

export type ModerationRuntimeMode = "fallback" | "api";
export const moderationRuntimeMode: ModerationRuntimeMode = moderationConfig.enabled ? "fallback" : "api";
