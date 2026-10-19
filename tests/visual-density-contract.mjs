import fs from "node:fs";

const css = fs.readFileSync("app/globals.css", "utf8");
const files = [
  "components/topbar.tsx",
  "components/auth/auth-page.tsx",
  "app/design-lab/page.tsx",
].map((file) => [file, fs.readFileSync(file, "utf8")]);
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(!/font-size:\s*(?:[0-9]|10)px\b/.test(css), "В CSS найден критично мелкий текст 10px или меньше");
check(!/font\s*:\s*[^;]*\s(?:[0-9]|10)px\//.test(css), "В сокращённом font найден критично мелкий текст");
check(!/height:\s*(?:[12][0-9]|3[0-1])px[^;]*cursor:pointer/.test(css), "Найдена интерактивная область ниже 32px без явной компенсации");
check(css.includes(".topbar-title h1") && css.includes("text-overflow:ellipsis"), "Длинный заголовок верхней панели может сдавить действия");
check(css.includes(".community-modal > footer") && css.includes("grid-template-columns:1fr"), "Кнопки модального окна не складываются вертикально на телефоне");
check(css.includes("max-height:calc(100dvh - 16px)"), "Модальное окно может выйти за высоту мобильного экрана");
check(css.includes("@media (prefers-reduced-motion: reduce)"), "Нет системного режима уменьшения движения");
check(css.includes(":focus-visible"), "Нет единого видимого клавиатурного фокуса");

for (const [name, source] of files) {
  const iconOnly = [...source.matchAll(/<button(?![^>]*(?:aria-label|title))[^>]*>\s*<([A-Z][A-Za-z0-9]*)\b[^>]*\/?>\s*<\/button>/g)];
  check(iconOnly.length === 0, `${name}: иконка-кнопка без aria-label/title (${iconOnly.map((m)=>m[1]).join(", ")})`);
}

if (failures.length) {
  console.error("VISUAL DENSITY CONTRACT: FAILED\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("VISUAL DENSITY CONTRACT: OK");
console.log("- Critical text floor: ok");
console.log("- Header compression guard: ok");
console.log("- Mobile modal action layout: ok");
console.log("- Reduced motion and focus visibility: ok");
console.log("- Icon-only controls: labelled");
