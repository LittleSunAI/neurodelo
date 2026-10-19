import { defaultXpTransactions } from "../services/platform-gateway";
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
async function main() {
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    assert(String(input) === "/api/v1/recognition/xp/reverse", "Отмена XP должна идти через наш Recognition API");
    assert(init?.method === "POST", "Корректировка XP должна использовать POST");
    const transaction = defaultXpTransactions[0];
    return new Response(JSON.stringify({
      original: { ...transaction, status: "reversed" },
      reversal: { ...transaction, id: "api-reversal", kind: "reversal", amount: -transaction.amount, heroXp: -transaction.heroXp, communityPoints: -transaction.communityPoints, reversalOfId: transaction.id },
      audit: { id: "api-audit", action: "xp-reversed", targetId: transaction.id, actorName: "API test", reason: "contract", createdAt: "now" },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  const { platformGateway } = await import("../services/platform-gateway");
  assert(platformGateway.mode === "api", "После отключения fallback должен включаться API-режим");
  const result = await platformGateway.reverseXpTransaction({ transaction: defaultXpTransactions[0], reason: "contract", actorName: "API test" });
  assert(result.reversal.amount < 0, "API должен вернуть обратную XP-операцию");
  console.log(JSON.stringify({ mode: platformGateway.mode, serverProxyPath: "/api/v1/recognition/xp/reverse", responseContract: "ok" }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
