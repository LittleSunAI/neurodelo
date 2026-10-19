import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const failures = [];
const notes = [];

function fail(message) { failures.push(message); }
function note(message) { notes.push(message); }
function exists(relative) { return fs.existsSync(path.join(root, relative)); }
function read(relative) { return fs.readFileSync(path.join(root, relative), "utf8"); }
function assert(condition, message) { if (!condition) fail(message); }

const requiredFiles = [
  "README.md",
  ".env.example",
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "app/layout.tsx",
  "app/not-found.tsx",
  "app/error.tsx",
  "app/global-error.tsx",
  "app/loading.tsx",
  "app/api/v1/health/route.ts",
  "app/api/v1/[...path]/route.ts",
  "database/current-schema.sql",
  "database/schema-manifest.json",
  "database/migration-checksums.sha256",
  "api/openapi.json",
  "api/endpoint-registry.json",
  "docs/LOCAL_DEVELOPMENT_PLAN.md",
  "app/design-lab/page.tsx",
  "tests/design-contract.mjs",
  "tests/layout-stress-contract.mjs",
  "tests/visual-density-contract.mjs",
  "tests/color-contrast-contract.mjs",
  "tests/form-semantics-contract.mjs",
  "tests/rendered-visual-metrics.mjs",
  "tests/http-runtime-smoke.mjs",
  "docs/design-qa-snapshots/metrics.json",
  "docs/EXTENDED_DESIGN_QA.md",
  "docs/SECURITY_FOUNDATION.md",
  "docs/FAL_AI_LIMITS.md",
  "docs/NOTIFICATIONS_EMAIL.md",
  "tests/security-foundation-contract.ts",
  "tests/notification-fallback-contract.ts",
  "app/api/v1/files/route.ts",
  "app/api/v1/files/[id]/route.ts",
  "app/api/v1/files/[id]/review/route.ts",
  "app/api/v1/portable-data/route.ts",
  "app/api/v1/jobs/route.ts",
  "tests/object-storage-contract.ts",
  "tests/portable-data-contract.ts",
  "tests/job-queue-contract.ts",
  "tests/abuse-threat-model-contract.ts",
  "database/migrations/0007_prebackend_storage_jobs.sql",
];
for (const file of requiredFiles) assert(exists(file), `Отсутствует обязательный файл: ${file}`);

const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
assert(pkg.version === "0.23.0", "Версия prebackend final должна быть 0.23.0");
assert(lock.version === pkg.version, "Версия package-lock.json не совпадает с package.json");
assert(lock.packages?.[""]?.version === pkg.version, "Корневой package-lock package имеет другую версию");
for (const script of ["build", "lint", "typecheck", "test:security", "test:notifications", "test:contracts", "test:database", "test:openapi", "test:a11y", "test:ui", "test:design", "test:layout", "test:density", "test:contrast", "test:forms", "test:visual-metrics", "test:http", "test:final", "test:release"]) {
  assert(Boolean(pkg.scripts?.[script]), `В package.json отсутствует скрипт ${script}`);
}

const resolvedHosts = new Set();
for (const entry of Object.values(lock.packages ?? {})) {
  if (!entry || typeof entry !== "object" || !("resolved" in entry) || !entry.resolved) continue;
  try { resolvedHosts.add(new URL(entry.resolved).hostname); } catch { fail(`Некорректный resolved URL в package-lock: ${entry.resolved}`); }
}
assert(resolvedHosts.size === 1 && resolvedHosts.has("registry.npmjs.org"), `package-lock содержит неожиданные хосты: ${[...resolvedHosts].join(", ")}`);

const env = read(".env.example");
for (const flag of [
  "NEXT_PUBLIC_USE_FALLBACKS",
  "NEXT_PUBLIC_USE_GAME_FALLBACKS",
  "NEXT_PUBLIC_USE_HERO_IMAGE_FALLBACKS",
  "NEXT_PUBLIC_USE_GIT_FALLBACKS",
  "NEXT_PUBLIC_USE_COMMUNITY_FALLBACKS",
  "NEXT_PUBLIC_USE_MODERATION_FALLBACKS",
]) assert(new RegExp(`^${flag}=true$`, "m").test(env), `В .env.example fallback ${flag} должен быть включён`);
for (const secret of ["DATABASE_URL", "AUTH_SECRET", "FAL_KEY", "RESEND_API_KEY", "GITHUB_PRIVATE_KEY", "GITHUB_WEBHOOK_SECRET", "GAME_ENGINE_SECRET", "MODERATION_SERVICE_SECRET"]) {
  assert(new RegExp(`^${secret}=$`, "m").test(env), `Серверный секрет ${secret} должен присутствовать пустым в .env.example`);
  assert(!env.includes(`NEXT_PUBLIC_${secret}`), `Серверный секрет ${secret} ошибочно объявлен публичным`);
}

const rootEntries = fs.readdirSync(root);
for (const generated of ["node_modules", ".next", "out", ".test-build"]) {
  if (rootEntries.includes(generated)) note(`Генерируемая директория ${generated} присутствует в установленной рабочей копии и исключается из релизного архива`);
}
for (const item of rootEntries.filter((name) => name.startsWith(".env") && name !== ".env.example")) {
  fail(`В релиз попал приватный env-файл: ${item}`);
}

function walk(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", "out", ".test-build"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else result.push(full);
  }
  return result;
}

const allFiles = walk(root);
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".txt", ".sql", ".css", ".bat", ".example"]);
const textFiles = allFiles.filter((file) => textExtensions.has(path.extname(file)) || path.basename(file) === ".env.example");
const sourceFiles = textFiles.filter((file) => /^(app|components|services|lib|data)\//.test(path.relative(root, file).replaceAll("\\", "/")));

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /sk-[A-Za-z0-9_-]{24,}/,
];
for (const file of textFiles) {
  const content = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file);
  for (const pattern of secretPatterns) if (pattern.test(content)) fail(`Похожий на секрет фрагмент найден в ${relative}`);
  if (/packages\.applied|artifactory\/api\/npm|internal\.api\.openai|\/mnt\/data|\/home\/oai/.test(content)) fail(`Внутренний путь или реестр найден в ${relative}`);
}

const dangerousPatterns = [
  [/(?:^|\W)eval\s*\(/, "eval"],
  [/new\s+Function\s*\(/, "new Function"],
  [/child_process/, "child_process"],
  [/(?:^|\W)(?:exec|spawn)\s*\(/, "exec/spawn"],
  [/document\.write\s*\(/, "document.write"],
  [/dangerouslySetInnerHTML/, "dangerouslySetInnerHTML"],
];
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, "utf8");
  for (const [pattern, label] of dangerousPatterns) if (pattern.test(content)) fail(`Опасный паттерн ${label} найден в ${path.relative(root, file)}`);
}

const externalFetches = [];
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, "utf8");
  if (/fetch\s*\(\s*[`'"]https?:\/\//.test(content)) externalFetches.push(path.relative(root, file).replaceAll("\\", "/"));
}
assert(externalFetches.length === 2 && externalFetches.includes("app/api/v1/hero-images/generate/route.ts") && externalFetches.includes("lib/server/email.ts"), `Неожиданные прямые внешние fetch: ${externalFetches.join(", ") || "нет"}`);

const nextConfig = read("next.config.ts");
for (const header of ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy", "Cross-Origin-Opener-Policy"]) {
  assert(nextConfig.includes(header), `Не настроен защитный заголовок ${header}`);
}
assert(nextConfig.includes("poweredByHeader:false") || nextConfig.includes("poweredByHeader: false"), "Не отключён заголовок X-Powered-By");

const checksums = read("database/migration-checksums.sha256").trim().split(/\r?\n/).filter(Boolean);
const migrationFiles = fs.readdirSync(path.join(root, "database", "migrations")).filter((name) => name.endsWith(".sql"));
assert(checksums.length === migrationFiles.length, `Число checksum должно совпадать с миграциями: ${checksums.length}/${migrationFiles.length}`);
for (const line of checksums) {
  const match = line.match(/^([a-f0-9]{64})\s+(.+)$/);
  if (!match) { fail(`Некорректная строка checksum: ${line}`); continue; }
  const [, expected, relative] = match;
  if (!exists(relative)) { fail(`Файл миграции из checksum отсутствует: ${relative}`); continue; }
  const actual = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relative))).digest("hex");
  assert(actual === expected, `Контрольная сумма миграции не совпадает: ${relative}`);
}

const schemaManifest = JSON.parse(read("database/schema-manifest.json"));
const openapi = JSON.parse(read("api/openapi.json"));
const endpointRegistry = JSON.parse(read("api/endpoint-registry.json"));
assert(Array.isArray(schemaManifest.tables) && schemaManifest.tables.length === 78, "Манифест базы должен содержать 78 таблиц");
assert(openapi.openapi === "3.1.0", "OpenAPI должен иметь версию 3.1.0");
assert(Object.keys(openapi.paths ?? {}).length === 64, "OpenAPI должен содержать 64 пути");
assert(Array.isArray(endpointRegistry.endpoints) && endpointRegistry.endpoints.length === 82, "Реестр должен содержать 82 API-операции");

for (const route of [
  "app/api/v1/community/[...path]/route.ts",
  "app/api/v1/game/[...path]/route.ts",
  "app/api/v1/git/[...path]/route.ts",
  "app/api/v1/moderation/[...path]/route.ts",
  "app/api/v1/recognition/[...path]/route.ts",
  "app/api/v1/hero-images/generate/route.ts",
  "app/api/v1/[...path]/route.ts",
  "app/api/v1/health/route.ts",
]) assert(exists(route), `Отсутствует API route: ${route}`);

const gitignore = read(".gitignore");
for (const entry of ["node_modules/", ".next/", ".env", ".env.*"]) assert(gitignore.includes(entry), `.gitignore не содержит ${entry}`);

note(`Файлов проверено: ${allFiles.length}`);
note(`Source-файлов проверено на опасные паттерны: ${sourceFiles.length}`);
note(`Resolved package hosts: ${[...resolvedHosts].join(", ")}`);
note(`Миграций с подтверждённой checksum: ${checksums.length}`);
note(`Таблиц/API paths/API operations: ${schemaManifest.tables.length}/${Object.keys(openapi.paths).length}/${endpointRegistry.endpoints.length}`);

if (failures.length) {
  console.error("FINAL LOCAL AUDIT: FAILED");
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log("FINAL LOCAL AUDIT: OK");
for (const message of notes) console.log(`- ${message}`);
