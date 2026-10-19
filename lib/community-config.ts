const flag = process.env.NEXT_PUBLIC_USE_COMMUNITY_FALLBACKS;

export const communityConfig = {
  useFallbacks: flag !== "false",
  artificialDelayMs: 120,
};

export type CommunityRuntimeMode = "fallback" | "api";
export const communityRuntimeMode: CommunityRuntimeMode = communityConfig.useFallbacks ? "fallback" : "api";
