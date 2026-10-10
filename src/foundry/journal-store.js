import { MODULE_ID } from "../constants.js";
import { contentHash } from "../resolve/document-ids.js";

const HTML_FORMAT = 1;

function isManaged(document) {
  return document.getFlag(MODULE_ID, "managed") === true;
}

function folderData(folder) {
  return {
    _id: folder._id,
    name: folder.name,
    type: "JournalEntry",
    folder: folder.parentId,
    sorting: "m",
    sort: folder.sort,
    flags: { [MODULE_ID]: { managed: true } }
  };
}

function journalData(journal) {
  return {
    _id: journal._id,
    name: journal.name,
    folder: journal.folderId,
    sort: journal.sort,
    flags: { [MODULE_ID]: { managed: true, path: journal.path } }
  };
}

function pageData(page) {
  return {
    _id: page._id,
    name: page.name,
    type: "text",
    sort: page.sort,
    title: { show: true, level: 1 },
    text: { content: page.content, format: HTML_FORMAT },
    flags: { [MODULE_ID]: { key: page.key, sourceHash: page.sourceHash } }
  };
}

function pageUpdateData(page) {
  const { type, ...data } = pageData(page);
  return data;
}

function managedJournals() {
  return game.journal.filter(isManaged);
}

async function syncFolders(folders) {
  for (const folder of folders) {
    const existing = game.folders.get(folder._id);
    if (!existing) {
      await Folder.createDocuments([folderData(folder)], { keepId: true });
      continue;
    }
    await existing.update({ name: folder.name, folder: folder.parentId, sort: folder.sort });
  }
}

async function createJournals(plan, sync) {
  const journalIds = new Set(sync.createJournals);
  const pageIds = new Set(sync.createPages);
  const data = plan.journals
    .filter((journal) => journalIds.has(journal._id))
    .map((journal) => ({
      ...journalData(journal),
      pages: journal.pages.filter((page) => pageIds.has(page._id)).map(pageData)
    }));
  if (data.length > 0) {
    await JournalEntry.createDocuments(data, { keepId: true });
  }
}

async function syncExistingJournals(plan, sync) {
  const created = new Set(sync.createJournals);
  const createPages = new Set(sync.createPages);
  const updatePages = new Set(sync.updatePages);

  for (const journal of plan.journals) {
    if (created.has(journal._id)) {
      continue;
    }
    const document = game.journal.get(journal._id);
    if (!document) {
      continue;
    }
    await document.update({ name: journal.name, folder: journal.folderId, sort: journal.sort });

    const toCreate = journal.pages.filter((page) => createPages.has(page._id)).map(pageData);
    if (toCreate.length > 0) {
      await document.createEmbeddedDocuments("JournalEntryPage", toCreate, { keepId: true });
    }
    const toUpdate = journal.pages.filter((page) => updatePages.has(page._id)).map(pageUpdateData);
    if (toUpdate.length > 0) {
      await document.updateEmbeddedDocuments("JournalEntryPage", toUpdate);
    }
  }
}

async function removeObsolete(sync) {
  const removeJournals = new Set(sync.removeJournals);
  const removePages = new Set(sync.removePages);
  for (const journal of managedJournals()) {
    if (removeJournals.has(journal.id)) {
      continue;
    }
    const pageIds = journal.pages.filter((page) => removePages.has(page.id)).map((page) => page.id);
    if (pageIds.length > 0) {
      await journal.deleteEmbeddedDocuments("JournalEntryPage", pageIds);
    }
  }
  if (removeJournals.size > 0) {
    await JournalEntry.deleteDocuments([...removeJournals]);
  }
}

async function recordSavedHashes(pageIds) {
  for (const journal of managedJournals()) {
    const updates = journal.pages
      .filter((page) => pageIds.has(page.id))
      .map((page) => ({ _id: page.id, [`flags.${MODULE_ID}.savedHash`]: contentHash(page.text.content ?? "") }));
    if (updates.length > 0) {
      await journal.updateEmbeddedDocuments("JournalEntryPage", updates);
    }
  }
}

export function createJournalStore() {
  return {
    readState() {
      const journals = managedJournals();
      return {
        journals: journals.map((journal) => ({ _id: journal.id })),
        pages: journals.flatMap((journal) =>
          journal.pages
            .filter((page) => page.getFlag(MODULE_ID, "sourceHash"))
            .map((page) => ({
              _id: page.id,
              journalId: journal.id,
              sourceHash: page.getFlag(MODULE_ID, "sourceHash"),
              savedHash: page.getFlag(MODULE_ID, "savedHash"),
              currentHash: contentHash(page.text.content ?? "")
            }))
        )
      };
    },

    async apply(plan, sync) {
      await syncFolders(plan.folders);
      await createJournals(plan, sync);
      await syncExistingJournals(plan, sync);
      await removeObsolete(sync);
      await recordSavedHashes(new Set([...sync.createPages, ...sync.updatePages]));
    }
  };
}
