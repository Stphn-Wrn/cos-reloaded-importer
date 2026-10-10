import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVaultIndex } from "../../src/vault/vault-index.js";
import { createLinkResolver } from "../../src/resolve/link-resolver.js";
import { journalIdFor, pageIdFor } from "../../src/resolve/document-ids.js";

function setup() {
  const index = buildVaultIndex({
    markdownFiles: [
      { path: "Appendices/Non-Player Characters.md", text: "# Vallaki\n## Lady Fiona Wachter\nTexte" },
      { path: "Act II/Arc H - The Lost Soul.md", text: "# H1. Start\nTexte" }
    ],
    imagePaths: []
  });
  const slugify = (text) => text.toLowerCase().replaceAll(" ", "-");
  const resolve = createLinkResolver({ index, slugify });
  const [npcs, arcH] = index.documents;
  return { resolve, npcs, arcH };
}

test("un lien vers un fichier pointe vers son journal", () => {
  const { resolve, npcs, arcH } = setup();

  const link = resolve({ page: "Arc H - The Lost Soul", anchor: null, alias: null }, npcs);

  assert.deepEqual(link, { uuid: `JournalEntry.${journalIdFor(arcH)}`, label: "Arc H - The Lost Soul" });
});

test("un lien vers un sous-titre pointe vers la page et l'ancre du titre", () => {
  const { resolve, npcs, arcH } = setup();

  const link = resolve({ page: "Non-Player Characters", anchor: "Lady Fiona Wachter", alias: "Lady Wachter" }, arcH);

  const pageUuid = `JournalEntry.${journalIdFor(npcs)}.JournalEntryPage.${pageIdFor(npcs.sections[0])}`;
  assert.deepEqual(link, { uuid: `${pageUuid}#lady-fiona-wachter`, label: "Lady Wachter" });
});

test("un lien vers un titre de niveau 1 pointe vers la page sans ancre", () => {
  const { resolve, arcH } = setup();

  const link = resolve({ page: "", anchor: "H1. Start", alias: null }, arcH);

  assert.deepEqual(link, {
    uuid: `JournalEntry.${journalIdFor(arcH)}.JournalEntryPage.${pageIdFor(arcH.sections[0])}`,
    label: "H1. Start"
  });
});

test("une ancre imbriquée façon Obsidian vise le dernier titre du chemin", () => {
  const { resolve, npcs, arcH } = setup();

  const link = resolve({ page: "Non-Player Characters", anchor: "Vallaki#Lady Fiona Wachter", alias: null }, arcH);

  assert.equal(link.uuid, `JournalEntry.${journalIdFor(npcs)}.JournalEntryPage.${pageIdFor(npcs.sections[0])}#lady-fiona-wachter`);
});

test("un titre introuvable renvoie vers le journal du fichier", () => {
  const { resolve, npcs } = setup();

  const link = resolve({ page: "Non-Player Characters", anchor: "Personne", alias: null }, npcs);

  assert.deepEqual(link, { uuid: `JournalEntry.${journalIdFor(npcs)}`, label: "Personne" });
});

test("un fichier introuvable ne donne pas de lien", () => {
  const { resolve, npcs } = setup();

  assert.equal(resolve({ page: "Arc D - The Tome of Strahd", anchor: null, alias: null }, npcs), null);
});
