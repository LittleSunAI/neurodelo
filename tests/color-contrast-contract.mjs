import fs from "node:fs";

const css = fs.readFileSync("app/globals.css", "utf8");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

function rgb(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
}
function luminance(hex) {
  const [r, g, b] = rgb(hex).map((c) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
function requireContrast(name, foreground, background, minimum) {
  const value = ratio(foreground, background);
  check(value >= minimum, `${name}: контраст ${value.toFixed(2)} ниже ${minimum}`);
  return value;
}

const results = {
  text: requireContrast("Основной текст", "#f4f7fb", "#070b14", 7),
  muted: requireContrast("Вторичный текст", "#8d9ab0", "#070b14", 4.5),
  cyan: requireContrast("Акцентная ссылка", "#27d8d3", "#070b14", 4.5),
  primaryStart: requireContrast("Основная кнопка — начало", "#06101a", "#36d9d2", 4.5),
  primaryEnd: requireContrast("Основная кнопка — конец", "#06101a", "#7a72f2", 4.5),
};
check(css.includes("#7a72f2"), "Контрастный фиолетовый край основной кнопки не применён");

if (failures.length) {
  console.error("COLOR CONTRAST CONTRACT: FAILED\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("COLOR CONTRAST CONTRACT: OK");
for (const [name, value] of Object.entries(results)) console.log(`- ${name}: ${value.toFixed(2)}:1`);
