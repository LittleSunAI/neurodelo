import fs from "node:fs";import path from "node:path";import url from "node:url";
const root=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),"..");
function read(file){return fs.readFileSync(path.join(root,file),"utf8")};function assert(c,m){if(!c)throw new Error(m)}
const session=read("lib/server/session.ts"),proxy=read("proxy.ts"),config=read("next.config.ts"),fal=read("app/api/v1/hero-images/generate/route.ts"),profile=read("components/views/public-profile-page.tsx"),app=read("components/app-shell.tsx"),env=read(".env.example");
assert(session.includes("httpOnly: true")&&session.includes('sameSite: "lax"'),"Session cookie security missing");
assert(!session.includes("development-secret")&&!session.includes("change-me"),"Known fallback secret must not exist");
assert(proxy.includes('pathname==="/"')&&proxy.includes("verifySessionToken"),"Private root must be protected by proxy");
assert(config.includes("Content-Security-Policy-Report-Only")&&config.includes("X-Frame-Options")&&config.includes("Strict-Transport-Security"),"Security headers incomplete");
assert(fal.includes("getRequestSession")&&fal.includes("reserveFalGeneration")&&fal.includes("Idempotency-Key")&&fal.includes("checkRateLimit"),"fal.ai endpoint is not sufficiently protected");
assert(profile.includes("profileVisibility")&&profile.includes("messagePermission")&&profile.includes("showActivity"),"Public profile privacy is incomplete");
assert(app.includes('hasPermission(authSession.roles, "moderation.view")'),"Admin access must use signed roles");
assert(env.includes("FAL_MAX_GENERATIONS_PER_DAY")&&env.includes("FAL_MAX_ESTIMATED_DAILY_USD")&&env.includes("RESEND_API_KEY"),"Security provider configuration missing");
const sourceFiles=[];for(const dir of ["app","components","lib","services"]){const walk=(d)=>{for(const name of fs.readdirSync(path.join(root,d))){const rel=path.join(d,name),stat=fs.statSync(path.join(root,rel));if(stat.isDirectory())walk(rel);else if(/\.(ts|tsx|js|mjs)$/.test(name))sourceFiles.push(rel)}};walk(dir)}
for(const file of sourceFiles){const text=read(file);assert(!text.includes("dangerouslySetInnerHTML"),`Unsafe HTML insertion in ${file}`);assert(!/\beval\s*\(/.test(text),`eval found in ${file}`)}
console.log(`SECURITY STATIC: OK\n- Files scanned: ${sourceFiles.length}\n- Signed sessions, headers, fal limits, privacy and permissions: OK`);
