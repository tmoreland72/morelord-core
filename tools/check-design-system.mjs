import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CORE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_MODULES = [
  "morelord-marketplace",
  "morelord-journeys",
  "morelord-craftworks",
  "morelord-encounters"
];
const PROTECTED = [
  "app",
  "app-shell",
  "stack",
  "cluster",
  "grid",
  "surface",
  "page-title",
  "section",
  "section-heading",
  "card",
  "dialog-shell",
  "hero",
  "actions",
  "toolbar",
  "icon-button",
  "status",
  "badge",
  "text",
  "button",
  "empty-state",
  "empty-message",
  "settings-section",
  "access-card",
  "choice-card",
  "progress"
];

function cssFiles(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => {
    const child = join(path, entry.name);
    if (entry.isDirectory()) return cssFiles(child);
    return entry.isFile() && entry.name.endsWith(".css") ? [child] : [];
  });
}

function sourceFiles(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => {
    if ([".git", "node_modules", "dist", "coverage", ".craftworks-stage"].includes(entry.name)) return [];
    const child = join(path, entry.name);
    if (entry.isDirectory()) return sourceFiles(child);
    return entry.isFile() && /\.(?:css|hbs|html|js|mjs|ts)$/.test(entry.name) ? [child] : [];
  });
}

const explicitRoots = process.argv.slice(2).map(resolve);
const roots = explicitRoots.length
  ? explicitRoots
  : DEFAULT_MODULES.map(name => resolve(CORE_ROOT, "..", name)).filter(existsSync);
const protectedPattern = new RegExp(
  String.raw`\.ml-(?:${PROTECTED.sort((a, b) => b.length - a.length).join("|")})(?=[\s,.#:\[>+~{])`,
  "g"
);
const failures = [];
const CHAT_CARD_ROOTS = new Set([
  "ml-marketplace-card",
  "ml-journeys-chat-card",
  "ml-craftworks-award-card",
  "ml-craftworks-chat-card"
]);

for (const root of roots) {
  const styles = join(root, "styles");
  if (!existsSync(styles) || !statSync(styles).isDirectory()) continue;
  for (const file of cssFiles(styles)) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(protectedPattern)) {
      const before = text.slice(0, match.index);
      const blockStart = Math.max(before.lastIndexOf("}"), before.lastIndexOf("/*"));
      const declarationStart = before.lastIndexOf("{");
      if (declarationStart > blockStart) continue;
      const line = before.split(/\r?\n/).length;
      failures.push(`${file}:${line}: feature modules may consume but not define ${match[0]}`);
    }
    for (const match of text.matchAll(/--ml-(?:color|font|space|radius|control|avatar)-[\w-]+\s*:/g)) {
      const line = text.slice(0, match.index).split(/\r?\n/).length;
      failures.push(`${file}:${line}: global design tokens may only be defined by Morelord Core`);
    }
    for (const match of text.matchAll(/font-family\s*:\s*([^;}{]+)/g)) {
      const value = match[1].trim();
      if (value === "inherit" || value.includes("var(--ml-font-")) continue;
      const line = text.slice(0, match.index).split(/\r?\n/).length;
      failures.push(`${file}:${line}: feature typography must inherit or use a Core --ml-font-* token`);
    }
  }
  for (const file of sourceFiles(root)) {
    const text = readFileSync(file, "utf8");
    const legacy = text.match(/\b(?:mlm-|mjourneys-|mcw-|mlh-|morelord-encounter-|morelord-simple-|morelord-creature-)|\.dataset\.(?:mlm|mjourneys|mcw|mlh)[A-Z]/);
    if (legacy) {
      const line = text.slice(0, legacy.index).split(/\r?\n/).length;
      failures.push(`${file}:${line}: legacy UI namespace ${legacy[0]} is not allowed`);
    }
    const exposedSetting = text.match(/\bconfig\s*:\s*true\b/);
    if (exposedSetting) {
      const line = text.slice(0, exposedSetting.index).split(/\r?\n/).length;
      failures.push(`${file}:${line}: feature settings must be managed by the module Configure application`);
    }
    for (const match of text.matchAll(/classes\s*:\s*\[([\s\S]*?)\]/g)) {
      if (!/\bml-(?:marketplace|journeys|craftworks|encounters)-(?:module|dialog|window)\b/.test(match[1])) continue;
      if (/['"]ml-window['"]/.test(match[1])) continue;
      const line = text.slice(0, match.index).split(/\r?\n/).length;
      failures.push(`${file}:${line}: Morelord application and dialog classes must include ml-window`);
    }
    for (const match of text.matchAll(/class=["']([^"']+)["']/g)) {
      const classes = new Set(match[1].split(/\s+/));
      if (![...CHAT_CARD_ROOTS].some(className => classes.has(className))) continue;
      if (classes.has("ml-chat-card")) continue;
      const line = text.slice(0, match.index).split(/\r?\n/).length;
      failures.push(`${file}:${line}: Morelord chat-card roots must include ml-chat-card`);
    }
    if (/\.(?:hbs|html)$/.test(file)) {
      if (/\.hbs$/.test(file) && !/[\\/](?:parts|partials)[\\/]/.test(file)) {
        const firstElement = text.match(/<(?:div|section|form|article)\b[^>]*>/i);
        if (firstElement && !/\bml-app\b/.test(firstElement[0])) {
          const line = text.slice(0, firstElement.index).split(/\r?\n/).length;
          failures.push(`${file}:${line}: full application templates must opt into the ml-app shell`);
        }
      }
      for (const match of text.matchAll(/<button\b[\s\S]*?<\/button>/gi)) {
        const button = match[0];
        if (!/class\s*=\s*["'][^"']*\bml-icon-button\b/i.test(button)) continue;
        const hasLabel = /\baria-label\s*=\s*["'][^"']+["']/i.test(button);
        const visibleText = button
          .replace(/<[^>]+>/g, " ")
          .replace(/{{[\s\S]*?}}/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (!hasLabel && !visibleText) {
          const line = text.slice(0, match.index).split(/\r?\n/).length;
          failures.push(`${file}:${line}: icon-only ml-icon-button requires an aria-label`);
        }
      }
    }
  }
}

if (failures.length) {
  console.error("Morelord design-system boundary check failed:\n");
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Morelord design-system boundary check passed (${roots.length} feature modules).`);
}
