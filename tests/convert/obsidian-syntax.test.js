import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTableSeparators,
  parseWikilink,
  replaceEmbeds,
  replaceObsidianHrefs,
  replaceWikilinks
} from "../../src/convert/obsidian-syntax.js";

test("un wikilink est découpé en fichier, ancre et alias", () => {
  assert.deepEqual(parseWikilink("Non-Player Characters#Lady Fiona Wachter|Lady Wachter"), {
    page: "Non-Player Characters",
    anchor: "Lady Fiona Wachter",
    alias: "Lady Wachter"
  });
  assert.deepEqual(parseWikilink("#F2a. Welcome"), { page: "", anchor: "F2a. Welcome", alias: null });
  assert.deepEqual(parseWikilink("Glossary\n"), { page: "Glossary", anchor: null, alias: null });
  assert.deepEqual(parseWikilink("Arc B.md#^bloc"), { page: "Arc B", anchor: "^bloc", alias: null });
});

test("un wikilink résolu devient un lien Foundry", () => {
  const resolve = () => ({ uuid: "JournalEntry.abc", label: "Arc H" });

  const result = replaceWikilinks("Voir [[Arc H - The Lost Soul|Arc H]].", resolve);

  assert.equal(result, "Voir @UUID[JournalEntry.abc]{Arc H}.");
});

test("un wikilink non résolu garde son texte, sans lien", () => {
  const result = replaceWikilinks("Voir [[Arc D - The Tome of Strahd]] et [[Arc S#Fin|la fin]].", () => null);

  assert.equal(
    result,
    'Voir <span class="cosr-unresolved">Arc D - The Tome of Strahd</span> et <span class="cosr-unresolved">la fin</span>.'
  );
});

test("une image intégrée devient une balise img, avec sa largeur si elle est précisée", () => {
  const imageUrl = (name) => {
    if (name === "Map.png") {
      return "https://raw/images/Map.png";
    }
    return null;
  };

  assert.equal(replaceEmbeds("![[Map.png]]", imageUrl), '<img src="https://raw/images/Map.png" alt="Map">');
  assert.equal(replaceEmbeds("![[Map.png|300]]", imageUrl), '<img src="https://raw/images/Map.png" alt="Map" width="300">');
  assert.equal(replaceEmbeds("![[Absente.png]]", imageUrl), "");
});

test("les séparateurs de tableau courts d'Obsidian sont allongés pour être reconnus", () => {
  const markdown = "| Joueurs | Modification |\n|-|:-:|\n| 3 | Moins de PV |";

  assert.equal(normalizeTableSeparators(markdown), "| Joueurs | Modification |\n| --- | :---: |\n| 3 | Moins de PV |");
  assert.equal(normalizeTableSeparators("> |-|-|"), "> | --- | --- |");
});

test("un lien obsidian:// devient un lien Foundry", () => {
  const received = [];
  const resolve = (link) => {
    received.push(link);
    return { uuid: "JournalEntry.abc", label: link.page };
  };
  const html = '<a href="obsidian://open?vault=CoS&amp;file=Act%20II%2FArc%20H%20-%20The%20Lost%20Soul">Arc H</a>';

  assert.equal(replaceObsidianHrefs(html, resolve), "@UUID[JournalEntry.abc]{Arc H}");
  assert.deepEqual(received, [{ page: "Act II/Arc H - The Lost Soul", anchor: null, alias: null }]);
});

test("un autre format de lien peut remplacer le format Foundry", () => {
  const resolve = () => ({ uuid: "JournalEntry.abc", pageId: "p1", label: "Arc H" });
  const formatLink = (link, resolved) => `<${resolved.pageId}:${resolved.label}>`;

  const result = replaceWikilinks("Voir [[Arc H - The Lost Soul|Arc H]].", resolve, formatLink);

  assert.equal(result, "Voir <p1:Arc H>.");
});

test("le format de lien choisi s'applique aussi aux liens obsidian:// déjà convertis en HTML", () => {
  const resolve = () => ({ uuid: "JournalEntry.abc", pageId: "p1", label: "Arc H" });
  const formatLink = (link, resolved, label) => `<${resolved.pageId}:${label}>`;

  const result = replaceObsidianHrefs('<a href="obsidian://open?vault=x&file=Arc%20H.md">ici</a>', resolve, formatLink);

  assert.equal(result, "<p1:ici>");
});
