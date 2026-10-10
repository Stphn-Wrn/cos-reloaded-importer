import { contentHash, folderIdFor, journalIdFor, pageIdFor } from "../resolve/document-ids.js";
import { identityLocalization } from "../translate/localization.js";

const SORT_STEP = 1000;

const FOLDER_RANKS = [/^Introduction/i, /^Chapter/i, /^Act/i, /^Appendi/i];

function folderRank(name) {
  const rank = FOLDER_RANKS.findIndex((pattern) => pattern.test(name));
  if (rank < 0) {
    return FOLDER_RANKS.length;
  }
  return rank;
}

function compareFolders(a, b) {
  const byRank = folderRank(a) - folderRank(b);
  if (byRank !== 0) {
    return byRank;
  }
  return a.localeCompare(b, "en", { numeric: true });
}

function parentPath(path) {
  const segments = path.split("/");
  segments.pop();
  return segments.join("/");
}

function folderPathsOf(documents) {
  const paths = new Set();
  for (const document of documents) {
    let path = document.folderPath;
    while (path !== "") {
      paths.add(path);
      path = parentPath(path);
    }
  }
  return [...paths].sort((a, b) => {
    const depth = a.split("/").length - b.split("/").length;
    if (depth !== 0) {
      return depth;
    }
    return compareFolders(a, b);
  });
}

function buildFolders(documents, rootName, localization) {
  const root = { _id: folderIdFor(""), name: rootName, parentId: null, sort: 0 };
  const folders = folderPathsOf(documents).map((path, position) => ({
    _id: folderIdFor(path),
    name: localization.folderName(path),
    parentId: folderIdFor(parentPath(path)),
    sort: (position + 1) * SORT_STEP
  }));
  return [root, ...folders];
}

function buildPages(document, renderPage, localization) {
  return document.sections.map((section, position) => {
    const displayed = localization.section(section) ?? section;
    const content = renderPage(displayed.markdown, document);
    return {
      _id: pageIdFor(section),
      key: section.key,
      name: displayed.title ?? localization.documentName(document),
      sort: (position + 1) * SORT_STEP,
      content,
      sourceHash: contentHash(content)
    };
  });
}

export function buildJournalPlan({ index, renderPage, rootName, localization = identityLocalization }) {
  const documents = [...index.documents].sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  const journals = documents.map((document, position) => ({
    _id: journalIdFor(document),
    path: document.path,
    name: localization.documentName(document),
    folderId: folderIdFor(document.folderPath),
    sort: (position + 1) * SORT_STEP,
    pages: buildPages(document, renderPage, localization)
  }));
  return { folders: buildFolders(documents, rootName, localization), journals };
}
