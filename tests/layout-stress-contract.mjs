import fs from "node:fs";

const css = fs.readFileSync("app/globals.css", "utf8");
const lab = fs.readFileSync("app/design-lab/page.tsx", "utf8");
const auth = fs.readFileSync("components/auth/auth-page.tsx", "utf8");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const mediaBreakpoints = [...css.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].map((m) => Number(m[1]));
check(mediaBreakpoints.some((x) => x <= 420), "Нет отдельного брейкпоинта для узкого телефона");
check(mediaBreakpoints.some((x) => x >= 700 && x <= 800), "Нет брейкпоинта для планшета");
check(mediaBreakpoints.some((x) => x >= 900), "Нет брейкпоинта для средней ширины");

check(css.includes("input,select,textarea { max-width:100%; min-width:0; }"), "Поля формы могут растянуть сетку");
check(css.includes(".panel,.content-panel,.modal-card"), "Критичные контейнеры не защищены от min-content overflow");
check(css.includes("overscroll-behavior:contain"), "Модальные окна не изолируют прокрутку");
check(css.includes("scroll-snap-type:x proximity"), "Горизонтальные вкладки не имеют управляемого скролла");
check(css.includes(".design-lab-scroll-note"), "Нет подсказки о горизонтальной прокрутке таблицы");
check(css.includes(".auth-password-toggle") && css.includes("min-width:40px"), "Кнопка показа пароля меньше безопасной области нажатия");
check(auth.includes('aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}'), "Кнопка показа пароля не озвучивается");
check(auth.includes('type="button" className="auth-password-toggle"'), "Кнопка показа пароля может случайно отправить форму");

const unsafeViewportWidths = [...css.matchAll(/(?:width|min-width):\s*(\d{3,})px/g)]
  .map((m) => Number(m[1]))
  .filter((x) => x > 420);
check(unsafeViewportWidths.length > 0, "Стресс-проверка фиксированных размеров ничего не нашла — тест повреждён");
check(css.includes("overflow-wrap:anywhere"), "Длинные непрерывные строки не защищены");
check(css.includes(".design-lab-table { width:100%; min-width:680px") && css.includes(".design-lab-table-wrap { max-width:100%; overflow:auto"), "Широкая таблица расширяет страницу вместо внутренней прокрутки");

check(lab.includes("design-lab-topbar-stress"), "Design Lab не проверяет перегруженную верхнюю панель");
check(lab.includes("design-lab-tabs-stress"), "Design Lab не проверяет длинный ряд вкладок");
check(lab.includes("design-lab-scroll-note"), "Design Lab не объясняет мобильный скролл таблицы");

if (failures.length) {
  console.error("LAYOUT STRESS CONTRACT: FAILED\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("LAYOUT STRESS CONTRACT: OK");
console.log(`- Responsive breakpoints checked: ${[...new Set(mediaBreakpoints)].sort((a,b)=>a-b).join(", ")} px`);
console.log("- Grid min-content guards: ok");
console.log("- Modal and horizontal-scroll containment: ok");
console.log("- Touch target and password control: ok");
console.log("- Long content and wide table stress cases: ok");
