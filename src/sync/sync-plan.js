function isPristine(page) {
  return page.currentHash === page.savedHash;
}

export function planSync({ desired, existing, force = false }) {
  const existingPages = new Map(existing.pages.map((page) => [page._id, page]));
  const desiredPageIds = new Set(desired.pages.map((page) => page._id));
  const existingJournalIds = new Set(existing.journals.map((journal) => journal._id));
  const desiredJournalIds = new Set(desired.journals.map((journal) => journal._id));

  const sync = {
    createJournals: [],
    removeJournals: [],
    createPages: [],
    updatePages: [],
    unchangedPages: [],
    removePages: [],
    conflicts: []
  };

  for (const page of desired.pages) {
    const current = existingPages.get(page._id);
    if (!current) {
      sync.createPages.push(page._id);
    } else if (current.sourceHash === page.sourceHash) {
      sync.unchangedPages.push(page._id);
    } else if (force || isPristine(current)) {
      sync.updatePages.push(page._id);
    } else {
      sync.conflicts.push(page._id);
    }
  }

  const keptJournalIds = new Set();
  for (const page of existing.pages) {
    if (desiredPageIds.has(page._id)) {
      continue;
    }
    if (force || isPristine(page)) {
      sync.removePages.push(page._id);
    } else {
      sync.conflicts.push(page._id);
      keptJournalIds.add(page.journalId);
    }
  }

  for (const journal of desired.journals) {
    if (!existingJournalIds.has(journal._id)) {
      sync.createJournals.push(journal._id);
    }
  }
  for (const journal of existing.journals) {
    if (!desiredJournalIds.has(journal._id) && !keptJournalIds.has(journal._id)) {
      sync.removeJournals.push(journal._id);
    }
  }

  return sync;
}
