import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVaultIndex } from "../../src/vault/vault-index.js";
import { buildJournalPlan } from "../../src/build/journal-plan.js";
import { createLinkResolver } from "../../src/resolve/link-resolver.js";
import { journalIdFor, pageIdFor } from "../../src/resolve/document-ids.js";
import { createLocalization, sourceHashOf } from "../../src/translate/localization.js";

function indexOf(path, text) {
  return buildVaultIndex({ markdownFiles: [{ path, text }], imagePaths: [] });
}

function manifestFor(index, path, names = {}) {
  const [document] = index.documents;
  return { names, files: { [path]: { sources: document.sections.map(sourceHashOf) } } };
}

test("une section traduite remplace le titre et le texte anglais", () => {
  const path = "Act I/Arc A.md";
  const index = indexOf(path, "Intro\n# A1. Daggerford\n## The Inn\nRain falls.");
  const manifest = manifestFor(index, path);

  const localization = createLocalization({
    index,
    manifest,
    files: [{ path, text: "Intro FR\n# A1. Daggerford FR\n## L'auberge\nIl pleut." }]
  });

  const [preamble, daggerford] = index.documents[0].sections;
  assert.equal(localization.section(preamble).markdown, "Intro FR");
  assert.equal(localization.section(daggerford).title, "A1. Daggerford FR");
  assert.equal(localization.section(daggerford).markdown, "## L'auberge\nIl pleut.");
  assert.deepEqual(localization.stats, { translated: 2, outdated: 0 });
});

test("une section dont l'anglais a changé depuis la traduction reste en anglais", () => {
  const path = "Act I/Arc A.md";
  const manifest = manifestFor(indexOf(path, "# A1. Daggerford\nRain falls."), path);
  const updated = indexOf(path, "# A1. Daggerford\nRain falls heavily.");

  const localization = createLocalization({
    index: updated,
    manifest,
    files: [{ path, text: "# A1. Daggerford FR\nIl pleut." }]
  });

  assert.equal(localization.section(updated.documents[0].sections[0]), null);
  assert.deepEqual(localization.stats, { translated: 0, outdated: 1 });
});

test("une traduction qui n'a pas les mêmes sous-titres que l'anglais est ignorée", () => {
  const path = "Act I/Arc A.md";
  const index = indexOf(path, "# A1. Daggerford\n## The Inn\n## The Stable");
  const manifest = manifestFor(index, path);

  const localization = createLocalization({
    index,
    manifest,
    files: [{ path, text: "# A1. Daggerford FR\n## L'auberge" }]
  });

  assert.equal(localization.section(index.documents[0].sections[0]), null);
  assert.deepEqual(localization.stats, { translated: 0, outdated: 1 });
});

test("les noms de journaux et de dossiers sont traduits, sinon gardés en anglais", () => {
  const path = "Act I - Into the Mists/Arc A - Escape From Death House.md";
  const index = indexOf(path, "# A1. Daggerford");
  const manifest = manifestFor(index, path, { "Act I - Into the Mists": "Acte I - Dans les brumes" });

  const localization = createLocalization({ index, manifest, files: [] });

  assert.equal(localization.folderName("Act I - Into the Mists"), "Acte I - Dans les brumes");
  assert.equal(localization.folderName("Appendices"), "Appendices");
  assert.equal(localization.documentName(index.documents[0]), "Arc A - Escape From Death House");
});

test("le plan de journaux affiche la traduction sans changer les identifiants", () => {
  const path = "Act I/Arc A.md";
  const index = indexOf(path, "# A1. Daggerford\nRain falls.");
  const manifest = manifestFor(index, path, { "Act I": "Acte I", "Arc A": "Arc A FR" });
  const localization = createLocalization({ index, manifest, files: [{ path, text: "# A1. Poignard\nIl pleut." }] });
  const renderPage = (markdown) => `<p>${markdown}</p>`;

  const english = buildJournalPlan({ index, renderPage, rootName: "CoS" });
  const french = buildJournalPlan({ index, renderPage, rootName: "CoS", localization });

  const [journal] = french.journals;
  assert.equal(journal.name, "Arc A FR");
  assert.equal(journal._id, english.journals[0]._id);
  assert.deepEqual(
    journal.pages.map((page) => [page._id, page.name, page.content]),
    [[english.journals[0].pages[0]._id, "A1. Poignard", "<p>Il pleut.</p>"]]
  );
  assert.equal(french.folders.find((folder) => folder.name === "Acte I")._id, english.folders[1]._id);
});

test("un lien vers un sous-titre traduit utilise le titre français pour le libellé et l'ancre", () => {
  const path = "Act I/Arc A.md";
  const index = indexOf(path, "# A2. Death House\n## Main Hall\n## Library");
  const manifest = manifestFor(index, path);
  const localization = createLocalization({
    index,
    manifest,
    files: [{ path, text: "# A2. La Maison de la Mort\n## Grand hall\n## Bibliothèque" }]
  });
  const slugify = (text) => text.toLowerCase().replaceAll(" ", "-");
  const resolve = createLinkResolver({ index, slugify, localization });
  const [document] = index.documents;
  const pageUuid = `JournalEntry.${journalIdFor(document)}.JournalEntryPage.${pageIdFor(document.sections[0])}`;

  assert.deepEqual(resolve({ page: "", anchor: "Library", alias: null }, document), {
    uuid: `${pageUuid}#bibliothèque`,
    label: "Bibliothèque"
  });
  assert.deepEqual(resolve({ page: "", anchor: "A2. Death House", alias: "la maison" }, document), {
    uuid: pageUuid,
    label: "la maison"
  });
  assert.deepEqual(resolve({ page: "", anchor: "A2. Death House", alias: null }, document), {
    uuid: pageUuid,
    label: "A2. La Maison de la Mort"
  });
});
