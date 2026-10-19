import { hasPermission, listPermissions } from "../lib/security/permissions";
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
assert(hasPermission(["contributor"], "platform.access"), "Контрибьютор должен иметь доступ к платформе");
assert(!hasPermission(["contributor"], "moderation.view"), "Контрибьютор не должен видеть модерацию");
assert(hasPermission(["moderator"], "moderation.decide"), "Модератор должен принимать решения");
assert(!hasPermission(["moderator"], "featureFlags.manage"), "Модератор не должен управлять feature flags");
assert(hasPermission(["admin"], "featureFlags.manage") && hasPermission(["admin"], "securityAudit.view"), "Администратор должен иметь полные административные права");
assert(new Set(listPermissions(["maintainer", "moderator"])).size === listPermissions(["maintainer", "moderator"]).length, "Разрешения не должны дублироваться");
console.log(JSON.stringify({ contributor: "least privilege", maintainer: "project only", moderator: "moderation only", admin: "full administrative" }, null, 2));
