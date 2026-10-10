const WIKILINK = /(?<!!)\[\[([^\]]+)\]\]/g;
const EMBED = /!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const OBSIDIAN_HREF = /<a href="obsidian:\/\/open\?[^"]*?file=([^"&]+)[^"]*">([\s\S]*?)<\/a>/g;

export function parseWikilink(raw) {
  const [target, ...aliasParts] = raw.replaceAll("\\|", "|").split("|");
  let alias = null;
  if (aliasParts.length > 0) {
    alias = aliasParts.join("|").trim();
  }
  const [page, ...anchorParts] = target.split("#");
  let anchor = null;
  if (anchorParts.length > 0) {
    anchor = anchorParts.join("#").trim();
  }
  return { page: page.trim().replace(/\.md$/i, ""), anchor, alias };
}

function fallbackLabel(link) {
  if (link.alias) {
    return link.alias;
  }
  if (link.anchor && !link.anchor.startsWith("^")) {
    return link.anchor;
  }
  return link.page.split("/").pop();
}

export function formatFoundryLink(link, resolved, label) {
  if (!resolved) {
    return `<span class="cosr-unresolved">${label}</span>`;
  }
  return `@UUID[${resolved.uuid}]{${label}}`;
}

export function replaceWikilinks(markdown, resolve, formatLink = formatFoundryLink) {
  return markdown.replace(WIKILINK, (match, raw) => {
    const link = parseWikilink(raw);
    const resolved = resolve(link);
    let label = fallbackLabel(link);
    if (resolved) {
      label = resolved.label;
    }
    return formatLink(link, resolved, label);
  });
}

export function replaceEmbeds(markdown, imageUrl) {
  return markdown.replace(EMBED, (match, name, size) => {
    const url = imageUrl(name.trim());
    if (!url) {
      return "";
    }
    const alt = name.trim().replace(/\.[a-z0-9]+$/i, "");
    let width = "";
    if (size && /^\d+$/.test(size.trim())) {
      width = ` width="${size.trim()}"`;
    }
    return `<img src="${url}" alt="${alt}"${width}>`;
  });
}

const TABLE_SEPARATOR = /^\|?(\s*:?-+:?\s*\|)+\s*(:?-+:?)?\s*$/;
const QUOTE_PREFIX = /^((?:>\s?)*)(.*)$/;

function expandSeparatorCell(cell) {
  const trimmed = cell.trim();
  let start = "";
  if (trimmed.startsWith(":")) {
    start = ":";
  }
  let end = "";
  if (trimmed.length > 1 && trimmed.endsWith(":")) {
    end = ":";
  }
  return ` ${start}---${end} `;
}

export function normalizeTableSeparators(markdown) {
  return markdown
    .split("\n")
    .map((line) => {
      const [, quote, rest] = line.match(QUOTE_PREFIX);
      if (!TABLE_SEPARATOR.test(rest.trim())) {
        return line;
      }
      const cells = rest.trim().replace(/^\|/, "").replace(/\|$/, "").split("|");
      return `${quote}|${cells.map(expandSeparatorCell).join("|")}|`;
    })
    .join("\n");
}

export function replaceObsidianHrefs(html, resolve, formatLink = formatFoundryLink) {
  return html.replace(OBSIDIAN_HREF, (match, file, label) => {
    const link = { page: decodeURIComponent(file).replace(/\.md$/i, ""), anchor: null, alias: null };
    return formatLink(link, resolve(link), label);
  });
}
