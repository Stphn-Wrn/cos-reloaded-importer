const SHOWDOWN_OPTIONS = {
  tables: true,
  strikethrough: true,
  noHeaderId: true,
  literalMidWordUnderscores: true,
  disableForced4SpacesIndentedSublists: true,
  simpleLineBreaks: true,
  openLinksInNewWindow: true
};

export function createMarkdownConverter(showdown = globalThis.showdown) {
  const converter = new showdown.Converter(SHOWDOWN_OPTIONS);
  return (markdown) => converter.makeHtml(markdown);
}
