import { defaultState } from "../services/platform-gateway";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    assert(String(input) === "/api/v1/git/connect", "Git API должен вызываться только через наш /api/v1/git gateway");
    assert(init?.method === "POST", "Подключение Git-профиля должно использовать POST");
    return new Response(JSON.stringify({
      ...defaultState.git,
      profile: {
        provider: "github",
        username: "api-user",
        displayName: "API User",
        status: "connected",
        connectedAt: "now",
        scopes: ["read:user", "public_repo"],
      },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;

  const { gitGateway } = await import("../services/git-gateway");
  assert(gitGateway.mode === "api", "После отключения Git fallback должен включаться API-режим");
  const connected = await gitGateway.connectProfile(defaultState.git, defaultState.profile);
  assert(connected.profile?.username === "api-user", "API-ответ должен проходить через контракт GitIntegrationState");

  console.log(JSON.stringify({ mode: gitGateway.mode, serverProxyPath: "/api/v1/git/connect", responseContract: "ok" }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
