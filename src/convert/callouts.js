const CALLOUT_START = /^>\s?\[!([A-Za-z][\w-]*)\]([+-]?)\s*(.*)$/;

const CALLOUT_STYLES = {
  info: { icon: "fa-circle-info" },
  abstract: { icon: "fa-list-ul" },
  lore: { icon: "fa-book-open" },
  combat: { icon: "fa-skull" },
  warning: { icon: "fa-triangle-exclamation" },
  profile: { icon: "fa-user" },
  item: { icon: "fa-gem" },
  design: { icon: "fa-pen-ruler" },
  tip: { icon: "fa-lightbulb" }
};

const DEFAULT_STYLE = { icon: "fa-circle-info" };

function styleFor(type) {
  return CALLOUT_STYLES[type] ?? DEFAULT_STYLE;
}

function defaultTitle(type) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function inlineHtml(markdown, toHtml) {
  return toHtml(markdown)
    .trim()
    .replace(/^<p>([\s\S]*)<\/p>$/, "$1");
}

function renderCallout({ type, fold, title, body }, toHtml) {
  const { icon } = styleFor(type);
  const heading = `<i class="fa-solid ${icon}"></i> ${inlineHtml(title || defaultTitle(type), toHtml)}`;
  const content = `<div class="cosr-callout-body">${renderMarkdown(body, toHtml)}</div>`;
  const classes = `cosr-callout cosr-callout-${type}`;

  if (fold === "") {
    return `<div class="${classes}"><div class="cosr-callout-title">${heading}</div>${content}</div>`;
  }
  let open = "";
  if (fold === "+") {
    open = " open";
  }
  return `<details class="${classes}"${open}><summary>${heading}</summary>${content}</details>`;
}

export function renderMarkdown(markdown, toHtml) {
  const lines = markdown.split("\n");
  const chunks = [];
  let plain = [];

  function flushPlain() {
    const text = plain.join("\n");
    if (text.trim() !== "") {
      chunks.push(toHtml(text));
    }
    plain = [];
  }

  let i = 0;
  while (i < lines.length) {
    const start = lines[i].match(CALLOUT_START);
    if (!start) {
      plain.push(lines[i]);
      i++;
      continue;
    }
    flushPlain();
    const bodyLines = [];
    i++;
    while (i < lines.length && lines[i].startsWith(">")) {
      bodyLines.push(lines[i].replace(/^>\s?/, ""));
      i++;
    }
    chunks.push(
      renderCallout({ type: start[1].toLowerCase(), fold: start[2], title: start[3].trim(), body: bodyLines.join("\n") }, toHtml)
    );
  }
  flushPlain();
  return chunks.join("");
}
