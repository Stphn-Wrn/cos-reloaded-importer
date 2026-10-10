import { renderMarkdown } from "./callouts.js";
import { formatFoundryLink, normalizeTableSeparators, replaceEmbeds, replaceObsidianHrefs, replaceWikilinks } from "./obsidian-syntax.js";

export function createPageRenderer({ resolveLink, imageUrl, toHtml, formatLink = formatFoundryLink }) {
  return function renderPage(markdown, document) {
    const resolve = (link) => resolveLink(link, document);
    let text = replaceEmbeds(markdown, imageUrl);
    text = replaceWikilinks(text, resolve, formatLink);
    text = normalizeTableSeparators(text);
    let html = renderMarkdown(text, toHtml);
    html = replaceObsidianHrefs(html, resolve, formatLink);
    return `<div class="cosr-page">${html}</div>`;
  };
}
