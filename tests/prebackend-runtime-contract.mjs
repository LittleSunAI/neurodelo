import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const port = 4317;
const origin = `http://127.0.0.1:${port}`;
const dataDir = mkdtempSync(path.join(os.tmpdir(), "neurodelo-prebackend-runtime-"));
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: "production", COOKIE_SECURE: "false", APP_ORIGIN: origin, ALLOWED_ORIGINS: origin, NEURODELO_DATA_DIR: dataDir, OBJECT_AUTO_APPROVE_SAFE: "true" },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
child.stdout.on("data", (chunk) => { output += chunk; });
child.stderr.on("data", (chunk) => { output += chunk; });

async function waitReady() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try { const response = await fetch(`${origin}/api/v1/health`); if (response.ok) return; } catch { /* retry */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not start\n${output}`);
}
function headers(cookie, json = false) {
  return { Origin: origin, Cookie: cookie, ...(json ? { "Content-Type": "application/json" } : {}) };
}
async function assertStatus(response, expected) {
  if (response.status !== expected) throw new Error(`Expected HTTP ${expected}, received ${response.status}: ${await response.text()}`);
}

try {
  await waitReady();
  const email = `runtime-${Date.now()}@example.test`;
  const register = await fetch(`${origin}/api/v1/auth/register`, { method: "POST", headers: headers("", true), body: JSON.stringify({ email, name: "Runtime User", password: "Runtime12345!", remember: true }) });
  await assertStatus(register, 200);
  const setCookie = register.headers.get("set-cookie") || "";
  const cookie = setCookie.split(";")[0];
  assert.match(cookie, /^neurodelo_session=/);

  const state = { version: 12, profile: { nickname: "runtime-user", name: "Runtime User" }, preferences: { privacy: {}, notifications: {}, appearance: {} }, projects: [{ id: "runtime-project", title: "Runtime" }], notifications: [] };
  const save = await fetch(`${origin}/api/v1/local-state`, { method: "PUT", headers: headers(cookie, true), body: JSON.stringify(state) });
  await assertStatus(save, 200);

  const exported = await fetch(`${origin}/api/v1/portable-data`, { headers: headers(cookie) });
  await assertStatus(exported, 200);
  const exportPayload = await exported.json();
  assert.equal(exportPayload.envelope.format, "neurodelo-portable-data");
  assert.match(exportPayload.envelope.checksum, /^[a-f0-9]{64}$/);
  const dryRun = await fetch(`${origin}/api/v1/portable-data`, { method: "POST", headers: headers(cookie, true), body: JSON.stringify({ envelope: exportPayload.envelope, dryRun: true }) });
  await assertStatus(dryRun, 200);
  assert.equal((await dryRun.json()).dryRun, true);
  const tampered = structuredClone(exportPayload.envelope);
  tampered.state.profile.nickname = "tampered";
  const tamperedImport = await fetch(`${origin}/api/v1/portable-data`, { method: "POST", headers: headers(cookie, true), body: JSON.stringify({ envelope: tampered, dryRun: true }) });
  assert.equal(tamperedImport.status, 422);

  const png = Buffer.alloc(32);
  Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(png,0);
  png.writeUInt32BE(13,8); Buffer.from("IHDR").copy(png,12); png.writeUInt32BE(64,16); png.writeUInt32BE(64,20);
  const form = new FormData();
  form.set("scope", "chat");
  form.set("file", new File([png], "runtime.png", { type: "image/png" }));
  const uploaded = await fetch(`${origin}/api/v1/files`, { method: "POST", headers: headers(cookie), body: form });
  await assertStatus(uploaded, 201);
  const uploadedPayload = await uploaded.json();
  assert.equal(uploadedPayload.metadata.status, "approved");
  assert.equal(uploadedPayload.metadata.width, 64);
  const duplicateForm = new FormData();
  duplicateForm.set("scope", "chat");
  duplicateForm.set("file", new File([png], "runtime-copy.png", { type: "image/png" }));
  const duplicate = await fetch(`${origin}/api/v1/files`, { method: "POST", headers: headers(cookie), body: duplicateForm });
  await assertStatus(duplicate, 200);
  assert.equal((await duplicate.json()).deduplicated, true);

  const secondRegister = await fetch(`${origin}/api/v1/auth/register`, { method: "POST", headers: headers("", true), body: JSON.stringify({ email: `second-${Date.now()}@example.test`, name: "Second User", password: "Runtime12345!", remember: true }) });
  await assertStatus(secondRegister, 200);
  const secondCookie = (secondRegister.headers.get("set-cookie") || "").split(";")[0];
  const foreignRead = await fetch(`${origin}/api/v1/files/${uploadedPayload.metadata.id}`, { headers: headers(secondCookie) });
  assert.equal(foreignRead.status, 404);
  const foreignReview = await fetch(`${origin}/api/v1/files/${uploadedPayload.metadata.id}/review`, { method: "POST", headers: headers(secondCookie, true), body: JSON.stringify({ status: "rejected" }) });
  assert.equal(foreignReview.status, 403);

  const files = await fetch(`${origin}/api/v1/files`, { headers: headers(cookie) });
  assert.equal(files.status, 200);
  assert.equal((await files.json()).files.length, 1);
  const download = await fetch(`${origin}/api/v1/files/${uploadedPayload.metadata.id}?download=1`, { headers: headers(cookie) });
  await assertStatus(download, 200);
  assert.equal((await download.arrayBuffer()).byteLength, png.byteLength);

  const bad = new FormData();
  bad.set("file", new File([Buffer.from([0x4d,0x5a,0,0])], "malware.exe", { type: "application/octet-stream" }));
  const rejected = await fetch(`${origin}/api/v1/files`, { method: "POST", headers: headers(cookie), body: bad });
  assert.equal(rejected.status, 422);

  const jobs = await fetch(`${origin}/api/v1/jobs`, { headers: headers(cookie) });
  assert.equal(jobs.status, 403);

  console.log(JSON.stringify({ registration: "ok", durableState: "ok", portableData: "ok", tamperedImport: "blocked", safeUpload: "ok", duplicateUpload: "deduplicated", unsafeUpload: "blocked", crossAccountAccess: "blocked", reviewPermission: "blocked", adminJobs: "forbidden" }, null, 2));
} finally {
  child.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (!child.killed) child.kill("SIGKILL");
  rmSync(dataDir, { recursive: true, force: true });
}
