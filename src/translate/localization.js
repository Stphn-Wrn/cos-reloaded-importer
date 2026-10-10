import { contentHash } from "../resolve/document-ids.js";
import { parseSections } from "../vault/markdown-tools.js";

function lastSegment(path) {
  return path.split("/").pop();
}

export function sourceHashOf(section) {
  return contentHash(`${section.title ?? ""}\n${section.markdown}`);
}

export const identityLocalization = {
  documentName: (document) => document.name,
  folderName: (path) => lastSegment(path),
  section: () => null,
  stats: { translated: 0, outdated: 0 }
};

function sameHeadings(english, translated) {
  if (english.headings.length !== translated.headings.length) {
    return false;
  }
  return english.headings.every((heading, position) => heading.level === translated.headings[position].level);
}

function isUsable(english, translated, sourceHash) {
  if (!translated || sourceHash !== sourceHashOf(english)) {
    return false;
  }
  if ((english.title === null) !== (translated.title === null)) {
    return false;
  }
  return sameHeadings(english, translated);
}

export function createLocalization({ index, manifest, files }) {
  const names = manifest.names ?? {};
  const texts = new Map(files.map((file) => [file.path, file.text]));
  const sections = new Map();
  const stats = { translated: 0, outdated: 0 };

  for (const document of index.documents) {
    const entry = manifest.files?.[document.path];
    const text = texts.get(document.path);
    if (!entry || text === undefined) {
      continue;
    }
    let translatedSections = parseSections(text);
    if (translatedSections.length !== document.sections.length) {
      translatedSections = [];
    }
    document.sections.forEach((section, position) => {
      const translated = translatedSections[position];
      if (isUsable(section, translated, entry.sources[position])) {
        sections.set(section, translated);
        stats.translated++;
        return;
      }
      stats.outdated++;
    });
  }

  return {
    documentName: (document) => names[document.name] ?? document.name,
    folderName: (path) => names[lastSegment(path)] ?? lastSegment(path),
    section: (section) => sections.get(section) ?? null,
    stats
  };
}

export async function loadLocalization({ translation, index }) {
  const manifest = await translation.readManifest();
  const paths = index.documents.map((document) => document.path).filter((path) => manifest.files?.[path]);
  const files = await Promise.all(paths.map(async (path) => ({ path, text: await translation.readFile(path) })));
  return createLocalization({ index, manifest, files });
}
