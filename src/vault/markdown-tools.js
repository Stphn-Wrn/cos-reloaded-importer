const PAGE_HEADING = /^# +(.+?)\s*#*\s*$/;
const ANY_HEADING = /^(#{1,6}) +(.+?)\s*#*\s*$/gm;

export function normalizeNewlines(text) {
  return text.replace(/\r\n?/g, "\n");
}

export function stripFrontmatter(text) {
  if (!text.startsWith("---\n")) {
    return text;
  }
  const end = text.indexOf("\n---", 3);
  if (end < 0) {
    return text;
  }
  const afterFence = text.indexOf("\n", end + 4);
  if (afterFence < 0) {
    return "";
  }
  return text.slice(afterFence + 1);
}

export function splitSections(markdown) {
  const sections = [];
  let current = { title: null, lines: [] };
  for (const line of markdown.split("\n")) {
    const heading = line.match(PAGE_HEADING);
    if (heading) {
      sections.push(current);
      current = { title: heading[1], lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  sections.push(current);
  return sections
    .map((section) => ({ title: section.title, markdown: section.lines.join("\n").trim() }))
    .filter((section) => section.title !== null || section.markdown !== "");
}

export function headingsOf(markdown) {
  return [...markdown.matchAll(ANY_HEADING)].map((match) => ({
    level: match[1].length,
    plain: plainHeading(match[2])
  }));
}

export function plainHeading(text) {
  return text
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function headingKey(text) {
  return plainHeading(text)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .toLowerCase();
}

export function parseSections(text) {
  return splitSections(stripFrontmatter(normalizeNewlines(text))).map((section) => {
    let title = null;
    if (section.title !== null) {
      title = plainHeading(section.title);
    }
    return { title, markdown: section.markdown, headings: headingsOf(section.markdown) };
  });
}
