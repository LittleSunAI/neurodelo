import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const failures = [];
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".tsx")) files.push(full);
  }
}
for (const dir of ["app", "components"]) if (fs.existsSync(path.join(root, dir))) walk(path.join(root, dir));

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function inspect(node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === "button") {
      const attrs = node.openingElement.attributes.properties.filter(ts.isJsxAttribute);
      const names = new Set(attrs.map((attr) => attr.name.getText(source)));
      const actionable = ["onClick", "type", "formAction", "disabled"].some((name) => names.has(name));
      if (!actionable) {
        const pos = source.getLineAndCharacterOfPosition(node.getStart(source));
        failures.push(`${path.relative(root, file)}:${pos.line + 1} — активная кнопка не имеет обработчика, типа submit или disabled`);
      }
    }
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "button") {
      const attrs = node.attributes.properties.filter(ts.isJsxAttribute);
      const names = new Set(attrs.map((attr) => attr.name.getText(source)));
      const actionable = ["onClick", "type", "formAction", "disabled"].some((name) => names.has(name));
      if (!actionable) {
        const pos = source.getLineAndCharacterOfPosition(node.getStart(source));
        failures.push(`${path.relative(root, file)}:${pos.line + 1} — активная кнопка не имеет обработчика, типа submit или disabled`);
      }
    }
    ts.forEachChild(node, inspect);
  }
  inspect(source);
  if (/href\s*=\s*["']#["']/.test(text)) failures.push(`${path.relative(root, file)} — найдена ссылка href="#"`);
}

if (failures.length) {
  console.error("UI INTERACTION CONTRACT: FAILED");
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}
console.log("UI INTERACTION CONTRACT: OK");
console.log(`- TSX-файлов проверено: ${files.length}`);
console.log("- Пустых активных кнопок и href=\"#\" не найдено");
