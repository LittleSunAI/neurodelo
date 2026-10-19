import { spawn } from "node:child_process";
import process from "node:process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const port = 3219;
const base = `http://127.0.0.1:${port}`;
const authSecret = "runtime-test-secret-with-more-than-thirty-two-characters";
const dataDir = mkdtempSync(path.join(os.tmpdir(), "neurodelo-http-smoke-"));
const child = spawn(process.execPath, [path.resolve("node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(port)], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, PORT: String(port), APP_ORIGIN: base, ALLOWED_ORIGINS: base, AUTH_SECRET: authSecret, COOKIE_SECURE: "false", ENABLE_DESIGN_LAB: "false", NODE_ENV: "production", NEURODELO_TEST_DEMO_USERS: "true", NEURODELO_DATA_DIR: dataDir },
  detached: process.platform !== "win32",
});
let output = ""; child.stdout.on("data", (x) => { output += x; }); child.stderr.on("data", (x) => { output += x; });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitForServer(){const deadline=Date.now()+40_000;while(Date.now()<deadline){try{const r=await fetch(`${base}/api/v1/health`);if(r.ok)return}catch{}await wait(300)}throw new Error(`Сервер не запустился\n${output}`)}
const failures=[];const check=(condition,message)=>{if(!condition)failures.push(message)};
const cookieFrom=(response)=>{const raw=response.headers.get("set-cookie")??"";return raw.split(";")[0]};
async function jsonRequest(path, body, options={}){return fetch(base+path,{method:"POST",redirect:"manual",headers:{Origin:base,"Content-Type":"application/json",...(options.headers??{}),...(options.cookie?{Cookie:options.cookie}:{})},body:JSON.stringify(body)});}
try{
  await waitForServer();
  const anonymousRoot=await fetch(base+"/",{redirect:"manual"});check([302,307,308].includes(anonymousRoot.status),`/ без сессии должен перенаправлять, получен ${anonymousRoot.status}`);check((anonymousRoot.headers.get("location")??"").includes("/login"),"Редирект должен вести на login");
  const publicRoutes=["/login","/register","/forgot-password","/reset-password","/verify-email","/blocked","/session-expired","/p/open-companion","/u/tbv","/contributions/pr-145"];
  for(const route of publicRoutes){const response=await fetch(base+route,{redirect:"manual"});check(response.status===200,`${route}: ожидался 200, получен ${response.status}`);check(response.headers.get("x-content-type-options")==="nosniff",`${route}: нет nosniff`);check(response.headers.get("x-frame-options")==="DENY",`${route}: нет frame deny`);check(Boolean(response.headers.get("content-security-policy-report-only")),`${route}: нет CSP Report-Only`)}
  const design=await fetch(base+"/design-lab",{redirect:"manual"});check(design.status===404,`/design-lab в production должен быть 404, получен ${design.status}`);
  const crossOrigin=await fetch(base+"/api/v1/auth/login",{method:"POST",headers:{Origin:"https://evil.example","Content-Type":"application/json"},body:JSON.stringify({email:"demo@neurodelo.local",password:"Demo123!",remember:false})});check(crossOrigin.status===403,"Чужой Origin должен блокироваться");
  const login=await jsonRequest("/api/v1/auth/login",{email:"demo@neurodelo.local",password:"Demo123!",remember:false});check(login.status===200,"Демо-вход должен работать");const setCookie=login.headers.get("set-cookie")??"";check(/HttpOnly/i.test(setCookie)&&/SameSite=Lax/i.test(setCookie),"Сессионная cookie должна быть HttpOnly и SameSite=Lax");const demoCookie=cookieFrom(login);
  const rootWithCookie=await fetch(base+"/",{headers:{Cookie:demoCookie},redirect:"manual"});check(rootWithCookie.status===200,"Приватный root с валидной cookie должен открываться");
  const session=await fetch(base+"/api/v1/auth/session",{headers:{Cookie:demoCookie}});const sessionBody=await session.json();check(sessionBody.session?.authenticated&&sessionBody.session.roles?.includes("admin"),"Подписанная демо-сессия должна содержать серверные роли");
  const quota=await fetch(base+"/api/v1/hero-images/quota",{headers:{Cookie:demoCookie}});const quotaBody=await quota.json();check(quota.status===200&&quotaBody.maxGenerations>=1&&quotaBody.estimatedDailyLimitUsd>0,"Авторизованная fal-квота должна возвращаться");check((await fetch(base+"/api/v1/hero-images/quota")).status===401,"fal-квота без входа должна быть 401");
  const fal=await fetch(base+"/api/v1/hero-images/generate",{method:"POST",headers:{Origin:base,Cookie:demoCookie,"Content-Type":"application/json","Idempotency-Key":"runtime-fal-12345"},body:JSON.stringify({prompt:"Safe adult hero portrait",preset:"cinematic",mood:"focused",background:"workshop",palette:"cyan",classId:"guardian"})});check(fal.status===503,"fal.ai без ключа должен возвращать 503");
  const testEmail=await jsonRequest("/api/v1/notifications/email/test",{email:"demo@neurodelo.local"},{cookie:demoCookie,headers:{"Idempotency-Key":"email-runtime-123"}});const emailBody=await testEmail.json();check(testEmail.status===200&&emailBody.provider==="preview","Email без Resend должен работать как preview");
  const foreignEmail=await jsonRequest("/api/v1/notifications/email/test",{email:"other@example.com"},{cookie:demoCookie});check(foreignEmail.status===403,"Тестовое письмо на чужой адрес должно блокироваться");
  const oversized=await fetch(base+"/api/v1/notifications/email/test",{method:"POST",headers:{Origin:base,Cookie:demoCookie,"Content-Type":"application/json"},body:JSON.stringify({email:"demo@neurodelo.local",padding:"x".repeat(9000)})});check(oversized.status===400,"Слишком большое email-тело должно быть 400");
  const unique=`runtime-${Date.now()}@example.com`,password="RuntimeStrong123";
  const register=await jsonRequest("/api/v1/auth/register",{name:"Runtime User",email:unique,password,remember:false});check(register.status===200,"Локальная серверная регистрация должна работать");const regBody=await register.json();check(regBody.session?.roles?.length===1&&regBody.session.roles[0]==="contributor","Новый аккаунт не должен получать админские роли");const userCookie=cookieFrom(register);
  await jsonRequest("/api/v1/auth/logout",{},{cookie:userCookie});
  const relogin=await jsonRequest("/api/v1/auth/login",{email:unique,password,remember:false});check(relogin.status===200,"Новый пользователь должен повторно войти после выхода");
  const health=await fetch(`${base}/api/v1/health`);const healthBody=await health.json();check(health.status===200&&healthBody.status==="ok","Health-check не готов");check(healthBody.security?.auth?.configuredSecret===true,"Health должен показывать настроенный AUTH_SECRET без раскрытия значения");
  for(const endpoint of ["/api/v1/git/status","/api/v1/community/threads","/api/v1/game/profile","/api/v1/moderation/cases","/api/v1/recognition/ledger"]){const response=await fetch(base+endpoint);const text=await response.text();check(response.status===503,`${endpoint}: ожидается 503`);check(!/FAL_KEY|RESEND_API_KEY|AUTH_SECRET/.test(text),`${endpoint}: ответ не должен раскрывать имена секретов`)}
  const logout=await jsonRequest("/api/v1/auth/logout",{},{cookie:demoCookie});check(logout.status===200&&(logout.headers.get("set-cookie")??"").includes("Max-Age=0"),"Logout должен очищать cookie");
} finally {if(process.platform==="win32")spawn("taskkill",["/pid",String(child.pid),"/T","/F"],{stdio:"ignore"});else{try{process.kill(-child.pid,"SIGTERM")}catch{}}await wait(500);rmSync(dataDir,{recursive:true,force:true})}
if(failures.length){console.error("HTTP RUNTIME SMOKE: FAILED\n- "+failures.join("\n- "));process.exit(1)}
console.log("HTTP RUNTIME SMOKE: OK");console.log("- Anonymous/private route matrix: ok");console.log("- Signed cookie and roles: ok");console.log("- fal.ai quota and provider guard: ok");console.log("- email preview and anti-abuse: ok");console.log("- local register/logout/login: ok");console.log("- security headers and disabled APIs: ok");
