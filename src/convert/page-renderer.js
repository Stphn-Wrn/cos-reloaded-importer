import { renderMarkdown } from "./callouts.js";
import { normalizeTableSeparators, replaceEmbeds, replaceObsidianHrefs, replaceWikilinks } from "./obsidian-syntax.js";

export function createPageRenderer({ resolveLink, imageUrl, toHtml }) {
  return function renderPage(markdown, document) {
    const resolve = (link) => resolveLink(link, document);
    let text = replaceEmbeds(markdown, imageUrl);
    text = replaceWikilinks(text, resolve);
    text = normalizeTableSeparators(text);
    let html = renderMarkdown(text, toHtml);
    html = replaceObsidianHrefs(html, resolve);
    return `<div class="cosr-page">${html}</div>`;
  };
}
