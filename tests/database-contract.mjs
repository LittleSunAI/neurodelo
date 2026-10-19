import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dbRoot = path.join(root, "database");
const migrationRoot = path.join(dbRoot, "migrations");
const manifest = JSON.parse(fs.readFileSync(path.join(dbRoot, "schema-manifest.json"), "utf8"));
const seed = JSON.parse(fs.readFileSync(path.join(dbRoot, "seeds", "development.json"), "utf8"));

const errors = [];
const notes = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

assert(manifest.database === "PostgreSQL 18+", "schema-manifest должен указывать PostgreSQL 18+");
assert(manifest.schema === "app", "рабочая схема должна называться app");
assert(manifest.tables.length >= 70, `ожидалось не менее 70 таблиц, найдено ${manifest.tables.length}`);
assert(new Set(manifest.tables).size === manifest.tables.length, "в schema-manifest есть дубли таблиц");

const allSql = [];
const createdTables = new Map();
const referencedTables = new Set();
const migrationVersions = new Set();

for (const migrationName of manifest.migrationOrder) {
  const filePath = path.join(migrationRoot, migrationName);
  assert(fs.existsSync(filePath), `отсутствует миграция ${migrationName}`);
  if (!fs.existsSync(filePath)) continue;

  const sql = fs.readFileSync(filePath, "utf8");
  allSql.push(sql);
  assert(/^BEGIN;/m.test(sql), `${migrationName}: нет BEGIN`);
  assert(/COMMIT;\s*$/m.test(sql), `${migrationName}: нет завершающего COMMIT`);
  assert(!/\bDROP\s+(TABLE|SCHEMA|DATABASE)\b/i.test(sql), `${migrationName}: разрушительная DROP-команда запрещена`);
  assert(!/\bTRUNCATE\b/i.test(sql), `${migrationName}: TRUNCATE запрещён в базовых миграциях`);

  const tables = [...sql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+app\.([a-z0-9_]+)/gi)].map((m) => m[1]);
  for (const table of tables) {
    if (createdTables.has(table)) errors.push(`таблица app.${table} создаётся повторно в ${migrationName}`);
    createdTables.set(table, migrationName);
  }

  for (const match of sql.matchAll(/REFERENCES\s+app\.([a-z0-9_]+)/gi)) referencedTables.add(match[1]);
  for (const match of sql.matchAll(/VALUES\s*\(\s*'([0-9]{4}_[a-z0-9_]+)'\s*,\s*'step17-/gi)) {
    assert(!migrationVersions.has(match[1]), `версия миграции ${match[1]} указана повторно`);
    migrationVersions.add(match[1]);
  }
}

for (const table of manifest.tables) assert(createdTables.has(table), `таблица app.${table} есть в манифесте, но не создаётся`);
for (const table of createdTables.keys()) assert(manifest.tables.includes(table), `таблица app.${table} создаётся, но отсутствует в манифесте`);
for (const table of referencedTables) assert(createdTables.has(table), `внешний ключ ссылается на неизвестную таблицу app.${table}`);
for (const table of manifest.criticalTables) assert(manifest.tables.includes(table), `критическая таблица ${table} отсутствует`);

const rlsSql = fs.readFileSync(path.join(migrationRoot, manifest.security.rlsMigration), "utf8");
const requiredRls = [
  "accounts", "user_profiles", "user_preferences", "projects", "project_members",
  "project_tasks", "contributions", "xp_transactions", "hero_profiles",
  "hero_image_variants", "conversations", "conversation_participants",
  "chat_messages", "notifications"
];
for (const table of requiredRls) {
  assert(new RegExp(`ALTER TABLE app\\.${table} ENABLE ROW LEVEL SECURITY`, "i").test(rlsSql), `RLS не включён для app.${table}`);
}
assert(rlsSql.includes("app.current_account_id"), "RLS не использует app.current_account_id");
assert(rlsSql.includes("app.is_project_member"), "нет helper-функции app.is_project_member");
assert(rlsSql.includes("app.is_project_maintainer"), "нет helper-функции app.is_project_maintainer");

const accountIds = new Set(seed.accounts.map((item) => item.id));
const projectIds = new Set(seed.projects.map((item) => item.id));
const taskIds = new Set(seed.tasks.map((item) => item.id));
assert(accountIds.size === seed.accounts.length, "дубли account id в development.json");
assert(projectIds.size === seed.projects.length, "дубли project id в development.json");
for (const project of seed.projects) assert(accountIds.has(project.ownerAccountId), `seed project ${project.id}: неизвестный ownerAccountId`);
for (const task of seed.tasks) {
  assert(projectIds.has(task.projectId), `seed task ${task.id}: неизвестный projectId`);
  if (task.claimedByAccountId) assert(accountIds.has(task.claimedByAccountId), `seed task ${task.id}: неизвестный claimedByAccountId`);
}
for (const repository of seed.repositories) assert(projectIds.has(repository.projectId), `seed repository ${repository.id}: неизвестный projectId`);
for (const contribution of seed.contributions) {
  assert(projectIds.has(contribution.projectId), `seed contribution ${contribution.id}: неизвестный projectId`);
  assert(accountIds.has(contribution.contributorAccountId), `seed contribution ${contribution.id}: неизвестный contributorAccountId`);
}
assert(taskIds.size === seed.tasks.length, "дубли task id в development.json");

const combinedSql = allSql.join("\n");
assert(/CREATE EXTENSION IF NOT EXISTS pgcrypto/i.test(combinedSql), "не подключён pgcrypto для UUID");
assert(/CREATE EXTENSION IF NOT EXISTS citext/i.test(combinedSql), "не подключён citext для email/slug");
assert(/CREATE UNIQUE INDEX idx_xp_single_reversal/i.test(combinedSql), "нет защиты от повторной отмены XP");
assert(/CHECK \(from_account_id <> to_account_id\)/i.test(combinedSql), "нет защиты от благодарности самому себе");
assert(/access_token_ciphertext/i.test(combinedSql), "Git token должен храниться только в зашифрованном поле");

notes.push(`Миграций: ${manifest.migrationOrder.length}`);
notes.push(`Таблиц: ${manifest.tables.length}`);
notes.push(`Внешних ссылок на таблицы: ${referencedTables.size}`);
notes.push(`Seed accounts/projects/tasks: ${seed.accounts.length}/${seed.projects.length}/${seed.tasks.length}`);
notes.push(`RLS таблиц проверено: ${requiredRls.length}`);

if (errors.length) {
  console.error("DATABASE CONTRACT: FAILED");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("DATABASE CONTRACT: OK");
for (const note of notes) console.log(`- ${note}`);
