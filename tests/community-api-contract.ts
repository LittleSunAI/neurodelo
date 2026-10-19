export {};
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

async function main() {
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    assert(String(input) === "/api/v1/community/translate", "Перевод должен идти через наш community API");
    assert(init?.method === "POST", "Перевод должен использовать POST");
    return new Response(JSON.stringify({ text: "API translation" }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  const { communityGateway } = await import("../services/community-gateway");
  assert(communityGateway.mode === "api", "После отключения fallback должен включаться API-режим");
  const result = await communityGateway.translate("Hello", "en", "ru");
  assert(result === "API translation", "API-ответ должен проходить через контракт перевода");
  console.log(JSON.stringify({ mode: communityGateway.mode, serverProxyPath: "/api/v1/community/translate", responseContract: "ok" }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
