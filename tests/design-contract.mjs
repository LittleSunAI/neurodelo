import fs from "node:fs";

const css = fs.readFileSync("app/globals.css", "utf8");
const topbar = fs.readFileSync("components/topbar.tsx", "utf8");
const lab = fs.readFileSync("app/design-lab/page.tsx", "utf8");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(css.includes(".auth-layout,.auth-showcase,.auth-card-wrap,.auth-card { min-width:0; }"), "Нет защиты auth-экрана от min-content overflow");
check(css.includes("@media (max-width:420px)"), "Нет отдельного режима для экранов 320–420 px");
check(css.includes(".topbar-role,.topbar-accessibility { display:none; }"), "Верхняя панель не разгружается на очень узком экране");
check(css.includes(".search-popover { position:fixed;"), "Быстрый поиск может выйти за границы мобильного экрана");
check(css.includes(".modal-layer { padding:8px; place-items:end center; }"), "Модальные окна не адаптированы под телефон");
check(!/font\s*:\s*700\s+8px/.test(css), "Остался нечитаемый текст вкладок 8px");
check(!/font\s*:\s*9px\//.test(css), "Остался нечитаемый моноширинный текст 9px");
check(css.includes("overflow-wrap:anywhere"), "Нет защиты длинных URL и идентификаторов");
check(css.includes(".design-lab-table-wrap"), "Нет тестового сценария широкой таблицы");
check(topbar.includes("topbar-accessibility") && topbar.includes("topbar-role"), "Элементы верхней панели не имеют адаптивных маркеров");
check(lab.includes("Design Lab") && lab.includes("design-lab-long-token") && lab.includes("modal-card"), "Design Lab не покрывает ключевые стресс-сценарии");

if (failures.length) {
  console.error("DESIGN CONTRACT: FAILED\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("DESIGN CONTRACT: OK");
console.log("- Auth 320 px overflow guard: ok");
console.log("- Compact topbar: ok");
console.log("- Mobile popovers and modal: ok");
console.log("- Minimum critical text sizes: ok");
console.log("- Long content wrapping: ok");
console.log("- Design Lab stress cases: ok");
