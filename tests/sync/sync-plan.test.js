import { test } from "node:test";
import assert from "node:assert/strict";
import { planSync } from "../../src/sync/sync-plan.js";

test("au premier import, tout est créé", () => {
  const sync = planSync({
    desired: { journals: [{ _id: "j1" }], pages: [{ _id: "p1", journalId: "j1", sourceHash: "a" }] },
    existing: { journals: [], pages: [] }
  });

  assert.deepEqual(sync.createJournals, ["j1"]);
  assert.deepEqual(sync.createPages, ["p1"]);
});

test("une page dont la source n'a pas changé n'est pas réécrite", () => {
  const sync = planSync({
    desired: { journals: [{ _id: "j1" }], pages: [{ _id: "p1", journalId: "j1", sourceHash: "a" }] },
    existing: {
      journals: [{ _id: "j1" }],
      pages: [{ _id: "p1", journalId: "j1", sourceHash: "a", savedHash: "x", currentHash: "x" }]
    }
  });

  assert.deepEqual(sync.unchangedPages, ["p1"]);
  assert.deepEqual(sync.updatePages, []);
});

test("une page mise à jour par l'auteur et non retouchée par le MJ est remplacée", () => {
  const sync = planSync({
    desired: { journals: [{ _id: "j1" }], pages: [{ _id: "p1", journalId: "j1", sourceHash: "b" }] },
    existing: {
      journals: [{ _id: "j1" }],
      pages: [{ _id: "p1", journalId: "j1", sourceHash: "a", savedHash: "x", currentHash: "x" }]
    }
  });

  assert.deepEqual(sync.updatePages, ["p1"]);
});

test("une page modifiée par le MJ n'est pas écrasée, sauf si on force", () => {
  const input = {
    desired: { journals: [{ _id: "j1" }], pages: [{ _id: "p1", journalId: "j1", sourceHash: "b" }] },
    existing: {
      journals: [{ _id: "j1" }],
      pages: [{ _id: "p1", journalId: "j1", sourceHash: "a", savedHash: "x", currentHash: "edited" }]
    }
  };

  assert.deepEqual(planSync(input).conflicts, ["p1"]);
  assert.deepEqual(planSync(input).updatePages, []);
  assert.deepEqual(planSync({ ...input, force: true }).updatePages, ["p1"]);
});

test("une page disparue du guide est supprimée, et son journal aussi s'il n'existe plus", () => {
  const sync = planSync({
    desired: { journals: [], pages: [] },
    existing: {
      journals: [{ _id: "j1" }],
      pages: [{ _id: "p1", journalId: "j1", sourceHash: "a", savedHash: "x", currentHash: "x" }]
    }
  });

  assert.deepEqual(sync.removePages, ["p1"]);
  assert.deepEqual(sync.removeJournals, ["j1"]);
});

test("un journal disparu du guide est conservé s'il contient une page modifiée par le MJ", () => {
  const sync = planSync({
    desired: { journals: [], pages: [] },
    existing: {
      journals: [{ _id: "j1" }],
      pages: [{ _id: "p1", journalId: "j1", sourceHash: "a", savedHash: "x", currentHash: "edited" }]
    }
  });

  assert.deepEqual(sync.removePages, []);
  assert.deepEqual(sync.conflicts, ["p1"]);
  assert.deepEqual(sync.removeJournals, []);
});
