import { headingKey, parseSections } from "./markdown-tools.js";

function isContentPath(path) {
  return !path.split("/").some((segment) => segment.startsWith("_") || segment.startsWith("."));
}

function basename(path) {
  return path.split("/").pop();
}

function withoutExtension(path) {
  return path.replace(/\.md$/i, "");
}

function dirname(path) {
  const segments = path.split("/");
  segments.pop();
  return segments.join("/");
}

function toSections(path, text) {
  const seen = new Map();
  return parseSections(text).map((section) => {
    const baseKey = `${path}::${section.title ?? ""}`;
    const occurrence = (seen.get(baseKey) ?? 0) + 1;
    seen.set(baseKey, occurrence);
    let key = baseKey;
    if (occurrence > 1) {
      key = `${baseKey}::${occurrence}`;
    }
    return { key, ...section };
  });
}

function toDocument({ path, text }) {
  return {
    path,
    name: withoutExtension(basename(path)),
    folderPath: dirname(path),
    sections: toSections(path, text)
  };
}

export function buildVaultIndex({ markdownFiles, imagePaths }) {
  const documents = markdownFiles.filter((file) => isContentPath(file.path)).map(toDocument);

  const byPath = new Map();
  const byName = new Map();
  for (const document of documents) {
    byPath.set(withoutExtension(document.path).toLowerCase(), document);
    byName.set(document.name.toLowerCase(), document);
  }

  const images = new Map(imagePaths.map((path) => [basename(path).toLowerCase(), path]));

  function findDocument(target) {
    const key = withoutExtension(target.trim()).toLowerCase();
    return byPath.get(key) ?? byName.get(basename(key)) ?? null;
  }

  function findHeading(document, anchor) {
    const key = headingKey(anchor);
    for (const section of document.sections) {
      if (section.title !== null && headingKey(section.title) === key) {
        return { section, level: 1, plain: section.title, position: -1 };
      }
      const position = section.headings.findIndex((candidate) => headingKey(candidate.plain) === key);
      if (position >= 0) {
        const heading = section.headings[position];
        return { section, level: heading.level, plain: heading.plain, position };
      }
    }
    return null;
  }

  function imagePath(name) {
    return images.get(name.trim().toLowerCase()) ?? null;
  }

  return { documents, findDocument, findHeading, imagePath };
}
