import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const buildId = path.join(root, ".next", "BUILD_ID");
if (!existsSync(buildId)) throw new Error("Сначала выполните npm run build");

function assert(condition, message) { if (!condition) throw new Error(message); }
function waitForExit(child) { return new Promise((resolve) => child.once("exit", resolve)); }
async function waitForServer(origin) {
  let lastError;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try { const response = await fetch(`${origin}/api/v1/health`, { cache: "no-store" }); if (response.ok) return; }
    catch (error) { lastError = error; }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Сервер не запустился: ${lastError ?? "timeout"}`);
}
function startServer(port, dataDirectory) {
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    cwd: root,
    env: { ...process.env, NODE_ENV: "production", PERSISTENCE_DRIVER: "file", NEURODELO_DATA_DIR: dataDirectory, APP_ORIGIN: origin, ALLOWED_ORIGINS: origin, COOKIE_SECURE: "false" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  return { child, origin, output: () => output };
}
async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([waitForExit(child), new Promise((resolve) => setTimeout(resolve, 5000))]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

const directory = mkdtempSync(path.join(os.tmpdir(), "neurodelo-runtime-restart-"));
const port = 3200 + Math.floor(Math.random() * 500);
let first; let second;
try {
  first = startServer(port, directory);
  await waitForServer(first.origin);
  const email = `restart-${Date.now()}@example.com`;
  const register = await fetch(`${first.origin}/api/v1/auth/register`, { method: "POST", headers: { Origin: first.origin, "Content-Type": "application/json" }, body: JSON.stringify({ email, name: "Restart User", password: "RestartStrong123", remember: true }) });
  assert(register.ok, `Регистрация завершилась HTTP ${register.status}`);
  const setCookie = register.headers.get("set-cookie") || "";
  const cookie = setCookie.split(";")[0];
  assert(cookie.includes("neurodelo_session="), "Сервер должен вернуть session cookie");
  const state = { profile: { name: "Persisted after restart" }, preferences: {}, projects: [], notifications: [] };
  const put = await fetch(`${first.origin}/api/v1/local-state`, { method: "PUT", headers: { Origin: first.origin, Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(state) });
  assert(put.ok, `Сохранение состояния завершилось HTTP ${put.status}`);
  await stopServer(first.child);

  second = startServer(port, directory);
  await waitForServer(second.origin);
  const session = await fetch(`${second.origin}/api/v1/auth/session`, { headers: { Cookie: cookie } });
  const sessionPayload = await session.json();
  assert(session.ok && sessionPayload.session?.authenticated, "Сессия должна пережить полный перезапуск Node.js");
  const restored = await fetch(`${second.origin}/api/v1/local-state`, { headers: { Cookie: cookie } });
  const restoredPayload = await restored.json();
  assert(restored.ok && restoredPayload.state?.profile?.name === "Persisted after restart", "PlatformState должен пережить полный перезапуск Node.js");
  console.log(JSON.stringify({ processRestart: "ok", account: "restored", signedSession: "restored", platformState: "restored", dataDirectory: directory }, null, 2));
} catch (error) {
  console.error(first?.output?.() || "", second?.output?.() || "");
  throw error;
} finally {
  if (first) await stopServer(first.child);
  if (second) await stopServer(second.child);
  rmSync(directory, { recursive: true, force: true });
}
