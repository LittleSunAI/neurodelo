import { gameGateway } from "../services/game-gateway";
import { defaultHeroProgression } from "../services/platform-gateway";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

async function main() {
  assert(gameGateway.mode === "api", "Game gateway должен переключаться в API-режим");
  const calls: string[] = [];
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async (input: string | URL | Request) => {
    calls.push(String(input));
    return new Response(JSON.stringify(defaultHeroProgression), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  await gameGateway.equipItem(defaultHeroProgression, "weapon-debug-blade");
  assert(calls[0]?.includes("/api/v1/game/equipment/equip"), "API-режим должен обращаться к игровому маршруту");
  console.log(JSON.stringify({ mode: gameGateway.mode, apiRoute: calls[0], status: "ok" }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
