import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const [sourceArg, marker, firstName, secondName] = process.argv.slice(2);
if (!sourceArg || !marker || !firstName || !secondName) {
  throw new Error("Usage: node split-feature-css.mjs <source> <marker> <first.css> <second.css>");
}

const source = resolve(sourceArg);
const text = readFileSync(source, "utf8");
if (/^\s*@import/m.test(text)) {
  console.log(`${source} is already an import aggregator; no changes made.`);
  process.exit(0);
}
const boundary = text.indexOf(marker);
if (boundary < 0) throw new Error(`Marker not found in ${source}: ${marker}`);

const directory = dirname(source);
const first = join(directory, firstName);
const second = join(directory, secondName);
writeFileSync(first, `${text.slice(0, boundary).trimEnd()}\n`, "utf8");
writeFileSync(second, `${text.slice(boundary).trimStart()}\n`, "utf8");
writeFileSync(source, `/* Feature stylesheet aggregator; import order is cascade order. */\n@import url("./${basename(first)}");\n@import url("./${basename(second)}");\n`, "utf8");
console.log(`Split ${source} into ${firstName} and ${secondName}.`);
