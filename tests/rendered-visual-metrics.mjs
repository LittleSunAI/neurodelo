import fs from "node:fs";
import path from "node:path";

const root = "docs/design-qa-snapshots";
const metricsPath = path.join(root, "metrics.json");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
check(fs.existsSync(metricsPath), "Нет результатов фактического Chromium-рендера");
const records = fs.existsSync(metricsPath) ? JSON.parse(fs.readFileSync(metricsPath, "utf8")) : [];
check(records.length === 16, `Ожидалось 16 снимков, найдено ${records.length}`);

for (const record of records) {
  const label = `${record.name} ${record.width}px`;
  const metrics = record.metrics;
  check(metrics.scrollW <= metrics.clientW + 1, `${label}: горизонтальная прокрутка страницы ${metrics.scrollW}/${metrics.clientW}`);
  check(metrics.tiny.length === 0, `${label}: найден критически мелкий текст`);
  const disallowedTargets = metrics.smallTargets.filter((item) => item.tag !== "INPUT");
  check(disallowedTargets.length === 0, `${label}: маленькие кликабельные элементы: ${disallowedTargets.map((x) => x.text || x.cls).join(", ")}`);
  const screenshot = path.join(root, `${record.name}_${record.width}.png`);
  check(fs.existsSync(screenshot) && fs.statSync(screenshot).size > 50_000, `${label}: снимок отсутствует или повреждён`);
}

const widths = [...new Set(records.map((x) => x.width))].sort((a,b)=>a-b);
check(JSON.stringify(widths) === JSON.stringify([320,390,768,1440]), `Неверный набор ширин: ${widths.join(", ")}`);

if (failures.length) {
  console.error("RENDERED VISUAL METRICS: FAILED\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("RENDERED VISUAL METRICS: OK");
console.log(`- Chromium snapshots: ${records.length}`);
console.log(`- Viewports: ${widths.join(", ")} px`);
console.log("- Page horizontal overflow: none");
console.log("- Critical tiny text: none");
console.log("- Damaged screenshots: none");
