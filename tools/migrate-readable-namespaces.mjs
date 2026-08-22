import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const WRITE = process.argv.includes("--write");
const roots = process.argv.slice(2).filter(arg => arg !== "--write").map(value => resolve(value));
if (!roots.length) throw new Error("Pass one or more module roots.");

const extensions = new Set([".css", ".hbs", ".html", ".js", ".mjs", ".ts"]);
const ignoredDirectories = new Set([".git", "node_modules", "dist", "coverage", ".craftworks-stage"]);
const replacements = [
  [/class="(?![^"]*\bml-chat-card\b)([^"]*\bml-journeys-chat-card(?=\s|$)[^"]*)"/g, (_match, classes) => `class="ml-chat-card ${classes}"`],
  [/class="(?![^"]*\bml-chat-card\b)([^"]*\bml-craftworks-award-card(?=\s|$)[^"]*)"/g, (_match, classes) => `class="ml-chat-card ${classes}"`],
  [/class="(?![^"]*\bml-chat-card\b)([^"]*\bml-craftworks-chat-card(?=\s|$)[^"]*)"/g, (_match, classes) => `class="ml-chat-card ${classes}"`],
  [/class="(?![^"]*\bml-chat-card\b)([^"]*\bml-marketplace-card(?=\s|$)[^"]*)"/g, (_match, classes) => `class="ml-chat-card ${classes}"`],
  [/\.morelord-marketplace-card\b/g, ".ml-marketplace-card"],
  [/\bmorelord-marketplace-card\b/g, "ml-marketplace-card"],
  [/\.morelord-encounters-dialog\b/g, ".ml-encounters-dialog"],
  [/"morelord-encounters-dialog"/g, '"ml-encounters-dialog"'],
  [/morelord-encounter-/g, "ml-encounters-"],
  [/mlm-/g, "ml-marketplace-"],
  [/mjourneys-/g, "ml-journeys-"],
  [/\bmjourneys\b/g, "ml-journeys"],
  [/mcw-/g, "ml-craftworks-"],
  [/\bmcw\b/g, "ml-craftworks"],
  [/mlh-/g, "ml-craftworks-harvest-"]
];
const moduleClassReplacements = [
  ["morelord-marketplace", "ml-marketplace-module"],
  ["morelord-journeys", "ml-journeys-module"],
  ["morelord-craftworks", "ml-craftworks-module"],
  ["morelord-encounters", "ml-encounters-module"]
];

function files(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const child = join(path, entry.name);
    if (entry.isDirectory()) return files(child);
    return entry.isFile() && extensions.has(extname(entry.name)) ? [child] : [];
  });
}

let changedFiles = 0;
let replacementsMade = 0;
const failedFiles = [];
for (const root of roots) {
  for (const file of files(root)) {
    const original = readFileSync(file, "utf8");
    let updated = original;
    let fileReplacements = 0;
    for (const [pattern, replacement] of replacements) {
      updated = updated.replace(pattern, (...args) => {
        fileReplacements += 1;
        return typeof replacement === "function" ? replacement(...args) : replacement;
      });
    }
    updated = updated.replace(/classes\s*:\s*\[[\s\S]*?\]/g, block => {
      let migrated = block;
      for (const [legacy, readable] of moduleClassReplacements) {
        const quotedLegacy = `"${legacy}"`;
        if (migrated.includes(quotedLegacy)) {
          migrated = migrated.replaceAll(quotedLegacy, `"${readable}"`);
          fileReplacements += 1;
        }
        const duplicate = new RegExp(`"${readable}"\\s*,\\s*"${readable}"`, "g");
        while (duplicate.test(migrated)) {
          migrated = migrated.replace(duplicate, `"${readable}"`);
          fileReplacements += 1;
        }
      }
      if (moduleClassReplacements.some(([legacy, readable]) => migrated.includes(legacy) || migrated.includes(readable)) && !migrated.includes('"ml-window"')) {
        migrated = migrated.replace("[", '["ml-window", ');
        fileReplacements += 1;
      }
      return migrated;
    });
    if (extname(file) === ".hbs" && !/[\\/](?:parts|partials)[\\/]/.test(file)) {
      updated = updated.replace(/^<(section|div) class="(?![^"]*\bml-app\b)([^"]*\bml-(?:marketplace|journeys|craftworks|encounters)[^"]*)"/, (_match, tag, classes) => {
        fileReplacements += 1;
        return `<${tag} class="ml-app ml-app-shell ${classes}"`;
      });
    }
    if ([".hbs", ".html", ".js", ".mjs", ".ts"].includes(extname(file))) {
      updated = updated.replace(/(class(?:Name)?\s*=\s*"|class=")(?![^"]*\bml-actions\b)([^"]*\bml-craftworks-actions\b[^"]*")/g, (_match, start, classes) => {
        fileReplacements += 1;
        return `${start}ml-actions ${classes}`;
      });
      updated = updated.replace(/(class(?:Name)?\s*=\s*"|class=")(?![^"]*\bml-icon-button\b)([^"]*\b(?:ml-craftworks|ml-journeys)-icon-button\b[^"]*")/g, (_match, start, classes) => {
        fileReplacements += 1;
        return `${start}ml-icon-button ${classes}`;
      });
    }
    if (updated === original) continue;
    changedFiles += 1;
    replacementsMade += fileReplacements;
    console.log(`${WRITE ? "updated" : "would update"} ${file} (${fileReplacements})`);
    if (WRITE) {
      try {
        writeFileSync(file, updated, "utf8");
      } catch (error) {
        failedFiles.push(`${file}: ${error.code ?? error.message}`);
      }
    }
  }
}

console.log(`${WRITE ? "Updated" : "Would update"} ${changedFiles} files with ${replacementsMade} replacements.`);
if (failedFiles.length) {
  console.error(`Could not update ${failedFiles.length} files:\n${failedFiles.join("\n")}`);
  process.exitCode = 2;
}
