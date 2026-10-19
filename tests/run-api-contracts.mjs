import { spawnSync } from "node:child_process";
import process from "node:process";
import path from "node:path";
const cases = [
  ["tests/community-api-contract.ts", { NEXT_PUBLIC_USE_COMMUNITY_FALLBACKS: "false" }],
  ["tests/game-api-contract.ts", { NEXT_PUBLIC_USE_GAME_FALLBACKS: "false" }],
  ["tests/git-api-contract.ts", { NEXT_PUBLIC_USE_GIT_FALLBACKS: "false" }],
  ["tests/hero-image-api-contract.ts", { NEXT_PUBLIC_USE_HERO_IMAGE_FALLBACKS: "false" }],
  ["tests/moderation-api-contract.ts", { NEXT_PUBLIC_USE_MODERATION_FALLBACKS: "false" }],
  ["tests/recognition-api-contract.ts", { NEXT_PUBLIC_USE_FALLBACKS: "false" }],
];
for (const [file, extra] of cases) {
  const result = spawnSync(process.execPath, [path.resolve("node_modules/tsx/dist/cli.mjs"), file], { stdio: "inherit", env: { ...process.env, ...extra } });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log("API PROVIDER CONTRACTS: OK");
