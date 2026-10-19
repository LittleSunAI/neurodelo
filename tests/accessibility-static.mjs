import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const css = read("app/globals.css");
const shell = read("components/app-shell.tsx");
const layout = read("app/layout.tsx");
const topbar = read("components/topbar.tsx");
const sidebar = read("components/sidebar.tsx");
const files = [];
for (const base of ["components", "app"]) {
  const walk = (dir) => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (/\.(tsx|ts)$/.test(entry.name)) files.push(rel);
    }
  };
  walk(base);
}

check(shell.includes('className="skip-link"'), "Нет ссылки перехода к основному содержимому");
check(shell.includes('id="main-content"'), "Нет цели main-content");
check(shell.includes('aria-live="polite"'), "Нет live-region для смены раздела");
check(sidebar.includes('aria-current={active === item.id ? "page"'), "Навигация не сообщает активную страницу");
check(topbar.includes('event.key.toLowerCase() === "k"'), "Нет клавиатурного вызова поиска Ctrl/Cmd+K");
check(layout.includes('initialScale: 1'), "Viewport должен разрешать нормальное масштабирование");
check(!layout.includes('maximumScale') && !layout.includes('userScalable'), "Нельзя запрещать масштабирование страницы");
check(css.includes('prefers-reduced-motion: reduce'), "Нет поддержки prefers-reduced-motion");
check(css.includes('data-high-contrast="true"'), "Нет режима высокого контраста");
check(css.includes('.mobile-dock'), "Нет мобильной нижней навигации");
check(css.includes('a:focus-visible'), "Нет видимого фокуса для ссылок");
check(!/font-size:\s*(?:[0-9]|10)px/.test(css), "Остались прямые размеры текста меньше 11px");

for (const file of files) {
  const source = read(file);
  for (const line of source.split(/\r?\n/)) {
    if (line.includes('className="icon-button"') && !line.includes("aria-label") && !line.includes("title=")) failures.push(`${file}: icon-button без доступного имени`);
    if (line.includes('className="modal-layer"') && !line.includes('role="dialog"')) failures.push(`${file}: modal-layer без role=dialog`);
  }
}

if (failures.length) {
  console.error("Accessibility static check failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(JSON.stringify({ skipLink:"ok", liveRegion:"ok", keyboardSearch:"ok", focusVisible:"ok", reducedMotion:"ok", highContrast:"ok", mobileDock:"ok", minimumText:"ok", iconLabels:"ok", dialogSemantics:"ok" }, null, 2));
