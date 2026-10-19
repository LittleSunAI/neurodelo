import assert from "node:assert/strict";
import { hasPermission } from "../lib/security/permissions";
import { sanitizeUploadName, validateUploadedBuffer } from "../lib/server/object-storage";
import { validateHttpsUrl, validateUserExternalUrl } from "../lib/server/url-policy";

assert.equal(hasPermission(["contributor"], "moderation.decide"), false);
assert.equal(hasPermission(["maintainer"], "featureFlags.manage"), false);
assert.equal(hasPermission(["admin"], "featureFlags.manage"), true);
assert.equal(validateUserExternalUrl("javascript:alert(1)"), null);
assert.equal(validateUserExternalUrl("http://127.0.0.1/admin"), null);
assert.equal(validateUserExternalUrl("https://example.com/path")?.startsWith("https://example.com"), true);
assert.equal(validateHttpsUrl("https://evil.example/image.png", ["fal.media"]), null);
assert.equal(sanitizeUploadName("../../.env\0<script>.txt").includes(".."), false);
assert.throws(() => validateUploadedBuffer(Buffer.from([0x4d,0x5a,0,0,1]), "virus.exe"));
console.log("ABUSE THREAT MODEL CONTRACT: OK");
