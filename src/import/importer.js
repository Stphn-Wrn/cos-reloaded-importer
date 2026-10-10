import { FETCH_CONCURRENCY, ROOT_FOLDER_NAME } from "../constants.js";
import { buildJournalPlan } from "../build/journal-plan.js";
import { createPageRenderer } from "../convert/page-renderer.js";
import { createLinkResolver } from "../resolve/link-resolver.js";
import { identityLocalization, loadLocalization } from "../translate/localization.js";
import { planSync } from "../sync/sync-plan.js";
import { buildVaultIndex } from "../vault/vault-index.js";

async function mapWithLimit(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const position = next;
      next++;
      results[position] = await task(items[position]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function desiredState(plan) {
  return {
    journals: plan.journals,
    pages: plan.journals.flatMap((journal) => journal.pages.map((page) => ({ ...page, journalId: journal._id })))
  };
}

export async function runImport({ source, store, toHtml, slugify, translation = null, force = false, onProgress = () => {} }) {
  const commit = await source.latestCommit();
  const files = await source.listFiles(commit.sha);

  let fetched = 0;
  const markdownFiles = await mapWithLimit(files.markdown, FETCH_CONCURRENCY, async (path) => {
    const text = await source.readFile(commit.sha, path);
    fetched++;
    onProgress({ step: "fetch", done: fetched, total: files.markdown.length });
    return { path, text };
  });

  onProgress({ step: "build" });
  const index = buildVaultIndex({ markdownFiles, imagePaths: files.images });
  const imageUrl = (name) => {
    const path = index.imagePath(name);
    if (!path) {
      return null;
    }
    return source.fileUrl(commit.sha, path);
  };
  let localization = identityLocalization;
  if (translation) {
    localization = await loadLocalization({ translation, index });
  }
  const resolveLink = createLinkResolver({ index, slugify, localization });
  const renderPage = createPageRenderer({ resolveLink, imageUrl, toHtml });
  const plan = buildJournalPlan({ index, renderPage, rootName: ROOT_FOLDER_NAME, localization });

  onProgress({ step: "write" });
  const sync = planSync({ desired: desiredState(plan), existing: store.readState(), force });
  await store.apply(plan, sync);

  return { commit, sync, translation: localization.stats };
}
