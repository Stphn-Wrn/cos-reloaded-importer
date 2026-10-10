import { identityLocalization } from "../translate/localization.js";
import { journalIdFor, pageIdFor } from "./document-ids.js";

function journalUuid(document) {
  return `JournalEntry.${journalIdFor(document)}`;
}

function pageUuid(document, section) {
  return `${journalUuid(document)}.JournalEntryPage.${pageIdFor(section)}`;
}

function displayedHeading(heading, localization) {
  const translated = localization.section(heading.section);
  if (!translated) {
    return heading.plain;
  }
  if (heading.level === 1) {
    return translated.title;
  }
  return translated.headings[heading.position].plain;
}

export function createLinkResolver({ index, slugify, localization = identityLocalization }) {
  return function resolveLink(link, fromDocument) {
    let document = fromDocument;
    if (link.page !== "") {
      document = index.findDocument(link.page);
    }
    if (!document) {
      return null;
    }

    let firstPageId = null;
    if (document.sections.length > 0) {
      firstPageId = pageIdFor(document.sections[0]);
    }
    if (!link.anchor || link.anchor.startsWith("^")) {
      return { uuid: journalUuid(document), pageId: firstPageId, label: link.alias ?? localization.documentName(document) };
    }

    const heading = index.findHeading(document, link.anchor.split("#").pop());
    if (!heading) {
      return { uuid: journalUuid(document), pageId: firstPageId, label: link.alias ?? link.anchor };
    }

    const plain = displayedHeading(heading, localization);
    const label = link.alias ?? plain;
    const pageId = pageIdFor(heading.section);
    if (heading.level === 1) {
      return { uuid: pageUuid(document, heading.section), pageId, label };
    }
    return { uuid: `${pageUuid(document, heading.section)}#${slugify(plain)}`, pageId, label };
  };
}
