export const gitConfig = {
  enabled: process.env.NEXT_PUBLIC_USE_GIT_FALLBACKS !== "false",
  artificialDelayMs: 260,
  apiBasePath: "/api/v1/git",
} as const;

export type GitRuntimeMode = "fallback" | "api";
export const gitRuntimeMode: GitRuntimeMode = gitConfig.enabled ? "fallback" : "api";
