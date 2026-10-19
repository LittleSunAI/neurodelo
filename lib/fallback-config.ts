export const fallbackConfig = {
  enabled: process.env.NEXT_PUBLIC_USE_FALLBACKS !== "false",
  storageKey: "neurodelo-platform-state-v12",
  previousStorageKey: "neurodelo-platform-state-v11",
  legacyStorageKey: "neurodelo-platform-state-v10",
  oldestStorageKey: "neurodelo-platform-state-v9",
  ancientStorageKey: "neurodelo-platform-state-v8",
  authStorageKey: "neurodelo-auth-session-v1",
  authAuditKey: "neurodelo-auth-audit-v1",
  artificialDelayMs: 220,
  durableLocalState: process.env.NEXT_PUBLIC_USE_DURABLE_LOCAL_STATE !== "false",
} as const;

export type RuntimeMode = "fallback" | "api";
export const runtimeMode: RuntimeMode = fallbackConfig.enabled ? "fallback" : "api";
