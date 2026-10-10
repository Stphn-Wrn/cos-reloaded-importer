import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVaultIndex } from "../../src/vault/vault-index.js";
import { buildJournalPlan } from "../../src/build/journal-plan.js";

function planFor(markdownFiles) {
  const index = buildVaultIndex({ markdownFiles, imagePaths: [] });
  return buildJournalPlan({ index, renderPage: (markdown) => `<p>${markdown}</p>`, rootName: "CoS Reloaded" });
}

test("les dossiers suivent l'ordre du guide : introduction, chapitres, actes, annexes", () => {
  const plan = planFor([
    { path: "Appendices/NPC.md", text: "# A" },
    { path: "Act II - The Shadowed Town/Arc D.md", text: "# D" },
    { path: "Act I - Into the Mists/Arc A.md", text: "# A" },
    { path: "Chapter 1 - Beginning/Session Zero.md", text: "# S" },
    { path: "Introduction/Guide.md", text: "# G" }
  ]);

  const [root, ...folders] = plan.folders;
  assert.equal(root.name, "CoS Reloaded");
  assert.equal(root.parentId, null);
  assert.deepEqual(
    folders.map((folder) => folder.name),
    ["Introduction", "Chapter 1 - Beginning", "Act I - Into the Mists", "Act II - The Shadowed Town", "Appendices"]
  );
  assert.ok(folders.every((folder) => folder.parentId === root._id));
  assert.deepEqual(folders.map((folder) => folder.sort), [...folders.map((folder) => folder.sort)].sort((a, b) => a - b));
});

test("chaque fichier devient un journal rangé dans son dossier, avec ses pages dans l'ordre", () => {
  const plan = planFor([{ path: "Act II/Arc F.md", text: "Intro\n# F1. Inn\nA\n# F2. Haus\nB" }]);

  const [journal] = plan.journals;
  const folder = plan.folders.find((candidate) => candidate.name === "Act II");
  assert.equal(journal.name, "Arc F");
  assert.equal(journal.folderId, folder._id);
  assert.deepEqual(
    journal.pages.map((page) => [page.name, page.content]),
    [
      ["Arc F", "<p>Intro</p>"],
      ["F1. Inn", "<p>A</p>"],
      ["F2. Haus", "<p>B</p>"]
    ]
  );
  assert.ok(journal.pages[0].sort < journal.pages[1].sort);
});

test("les identifiants sont stables d'un import à l'autre et valides pour Foundry", () => {
  const files = [{ path: "Act II/Arc F.md", text: "# F1. Inn\nA" }];

  const first = planFor(files);
  const second = planFor(files);

  assert.equal(first.journals[0]._id, second.journals[0]._id);
  assert.equal(first.journals[0].pages[0]._id, second.journals[0].pages[0]._id);
  assert.match(first.journals[0].pages[0]._id, /^[A-Za-z0-9]{16}$/);
});

test("l'empreinte d'une page change quand son contenu change", () => {
  const before = planFor([{ path: "Arc.md", text: "# A\nTexte" }]);
  const after = planFor([{ path: "Arc.md", text: "# A\nTexte corrigé" }]);

  assert.notEqual(before.journals[0].pages[0].sourceHash, after.journals[0].pages[0].sourceHash);
});
