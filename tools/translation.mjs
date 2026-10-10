// Usage:
//   node tools/translation.mjs check <englishRoot> <translationRoot> <relativePath>
//   node tools/translation.mjs stamp <englishRoot> <translationRoot> <relativePath>
//   node tools/translation.mjs status <englishRoot> <translationRoot>
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parseSections } from "../src/vault/markdown-tools.js";
import { sourceHashOf } from "../src/translate/localization.js";

function readManifest(root) {
  const path = join(root, "manifest.json");
  if (!existsSync(path)) {
    return { names: {}, files: {} };
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeManifest(root, manifest) {
  writeFileSync(join(root, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

function sectionsAt(root, relativePath) {
  return parseSections(readFileSync(join(root, relativePath), "utf8"));
}

function label(section) {
  return section.title ?? "(introduction)";
}

function alignmentProblems(english, translated) {
  if (english.length !== translated.length) {
    return [`${english.length} sections in English, ${translated.length} in the translation`];
  }
  const problems = [];
  english.forEach((section, position) => {
    const other = translated[position];
    const levels = section.headings.map((heading) => heading.level).join(",");
    const otherLevels = other.headings.map((heading) => heading.level).join(",");
    if (levels !== otherLevels) {
      problems.push(`${label(section)}: headings ${levels} vs ${otherLevels}`);
    }
  });
  return problems;
}

function checkedSections(englishRoot, translationRoot, relativePath) {
  const english = sectionsAt(englishRoot, relativePath);
  const translated = sectionsAt(translationRoot, relativePath);
  const problems = alignmentProblems(english, translated);
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  return english;
}

function check(englishRoot, translationRoot, relativePath) {
  const english = checkedSections(englishRoot, translationRoot, relativePath);
  console.log(`Aligned: ${english.length} sections of ${relativePath}`);
}

function stamp(englishRoot, translationRoot, relativePath) {
  const english = checkedSections(englishRoot, translationRoot, relativePath);
  const manifest = readManifest(translationRoot);
  manifest.files[relativePath] = { sources: english.map(sourceHashOf) };
  writeManifest(translationRoot, manifest);
  console.log(`Stamped ${english.length} sections of ${relativePath}`);
}

function status(englishRoot, translationRoot) {
  const manifest = readManifest(translationRoot);
  for (const [relativePath, entry] of Object.entries(manifest.files)) {
    const english = sectionsAt(englishRoot, relativePath);
    const outdated = english.filter((section, position) => entry.sources[position] !== sourceHashOf(section));
    if (outdated.length === 0) {
      console.log(`OK        ${relativePath}`);
      continue;
    }
    console.log(`OUTDATED  ${relativePath}`);
    for (const section of outdated) {
      console.log(`          - ${label(section)}`);
    }
  }
}

const [command, ...args] = process.argv.slice(2);
if (command === "check") {
  check(...args);
} else if (command === "stamp") {
  stamp(...args);
} else if (command === "status") {
  status(...args);
} else {
  console.error("Usage: translation.mjs check|stamp|status <englishRoot> <translationRoot> [relativePath]");
  process.exit(1);
}
