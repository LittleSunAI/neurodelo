import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const spec = JSON.parse(fs.readFileSync(path.join(root, "api", "openapi.json"), "utf8"));
const registry = JSON.parse(fs.readFileSync(path.join(root, "api", "endpoint-registry.json"), "utf8"));
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

assert(spec.openapi === "3.1.0", "ожидается OpenAPI 3.1.0");
assert(spec.info?.version === "1.0.0", "версия API должна быть 1.0.0");
assert(spec.servers?.[0]?.url === "/api/v1", "базовый путь должен быть /api/v1");
assert(Object.keys(spec.paths ?? {}).length >= 50, "ожидается не менее 50 путей API");
assert(Object.keys(spec.components?.schemas ?? {}).length >= 25, "ожидается не менее 25 схем данных");

const operations = [];
const operationIds = new Set();
const methods = new Set(["get","post","put","patch","delete","options","head"]);
const refs = [];

const walk = (value) => {
  if (!value || typeof value !== "object") return;
  if (typeof value.$ref === "string") refs.push(value.$ref);
  for (const nested of Object.values(value)) walk(nested);
};
walk(spec);

for (const [apiPath, pathItem] of Object.entries(spec.paths)) {
  const placeholders = [...apiPath.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
  for (const [method, operation] of Object.entries(pathItem)) {
    if (!methods.has(method)) continue;
    operations.push({ method: method.toUpperCase(), path: apiPath, operation });
    assert(operation.operationId, `${method.toUpperCase()} ${apiPath}: нет operationId`);
    if (operation.operationId) {
      assert(!operationIds.has(operation.operationId), `operationId ${operation.operationId} повторяется`);
      operationIds.add(operation.operationId);
    }
    assert(Array.isArray(operation.tags) && operation.tags.length === 1, `${method.toUpperCase()} ${apiPath}: должен быть ровно один основной tag`);
    assert(operation.responses && Object.keys(operation.responses).length > 0, `${method.toUpperCase()} ${apiPath}: нет responses`);
    for (const [status, response] of Object.entries(operation.responses ?? {})) {
      assert(Boolean(response.description), `${method.toUpperCase()} ${apiPath} ${status}: нет description`);
    }
    const params = operation.parameters ?? [];
    for (const placeholder of placeholders) {
      assert(params.some((p) => p.in === "path" && p.name === placeholder && p.required === true), `${method.toUpperCase()} ${apiPath}: не описан path-параметр ${placeholder}`);
    }
    for (const param of params.filter((p) => p.in === "path")) {
      assert(placeholders.includes(param.name), `${method.toUpperCase()} ${apiPath}: лишний path-параметр ${param.name}`);
    }
    if (operation.security) assert(operation.responses["401"], `${method.toUpperCase()} ${apiPath}: защищённая операция должна описывать 401`);
  }
}

const schemaNames = new Set(Object.keys(spec.components.schemas));
for (const ref of refs) {
  if (!ref.startsWith("#/components/schemas/")) continue;
  const name = ref.slice("#/components/schemas/".length);
  assert(schemaNames.has(name), `неразрешённая ссылка на schema ${name}`);
}

assert(operations.length >= 60, `ожидалось не менее 60 операций, найдено ${operations.length}`);
assert(registry.count === operations.length, "endpoint-registry count не совпадает с OpenAPI");
assert(registry.endpoints.length === operations.length, "endpoint-registry содержит другое число операций");
const registryKeys = new Set(registry.endpoints.map((item) => `${item.method} ${item.path} ${item.operationId}`));
for (const item of operations) {
  assert(registryKeys.has(`${item.method} ${item.path} ${item.operation.operationId}`), `операция ${item.method} ${item.path} отсутствует в registry`);
}

const requiredTags = ["Auth","Users","Projects","Contributions","Git","Community","Recognition","Hero images","Game","Moderation","Notifications"];
for (const tag of requiredTags) assert(operations.some((item) => item.operation.tags.includes(tag)), `в OpenAPI нет модуля ${tag}`);

const publicOps = operations.filter((item) => !item.operation.security).length;
const protectedOps = operations.length - publicOps;
assert(publicOps >= 8, "слишком мало явно публичных операций");
assert(protectedOps >= 40, "слишком мало защищённых операций");

if (errors.length) {
  console.error("OPENAPI CONTRACT: FAILED");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("OPENAPI CONTRACT: OK");
console.log(`- Paths: ${Object.keys(spec.paths).length}`);
console.log(`- Operations: ${operations.length}`);
console.log(`- Schemas: ${schemaNames.size}`);
console.log(`- Public/protected: ${publicOps}/${protectedOps}`);
console.log(`- References checked: ${refs.length}`);
