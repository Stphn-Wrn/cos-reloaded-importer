import { test } from "node:test";
import assert from "node:assert/strict";
import { createGithubSource } from "../../src/source/github-source.js";

function fakeFetch(responses) {
  return async (url) => {
    const body = responses[url];
    if (body === undefined) {
      return { ok: false, status: 404 };
    }
    return { ok: true, status: 200, json: async () => body, text: async () => body };
  };
}

test("l'arborescence du dépôt est triée entre fichiers markdown et images", async () => {
  const source = createGithubSource({
    owner: "o",
    repo: "r",
    branch: "main",
    fetchImpl: fakeFetch({
      "https://api.github.com/repos/o/r/git/trees/abc?recursive=1": {
        tree: [
          { path: "Act I", type: "tree" },
          { path: "Act I/Arc A.md", type: "blob" },
          { path: "images/Map.PNG", type: "blob" },
          { path: "images/Portrait.jpg", type: "blob" },
          { path: "publish.css", type: "blob" }
        ]
      }
    })
  });

  const files = await source.listFiles("abc");

  assert.deepEqual(files, { markdown: ["Act I/Arc A.md"], images: ["images/Map.PNG", "images/Portrait.jpg"] });
});

test("l'adresse d'un fichier brut encode chaque segment du chemin", () => {
  const source = createGithubSource({ owner: "o", repo: "r", branch: "main", fetchImpl: fakeFetch({}) });

  assert.equal(
    source.fileUrl("abc", "Act II/Arc F - Lady Wachter's Wish.md"),
    "https://raw.githubusercontent.com/o/r/abc/Act%20II/Arc%20F%20-%20Lady%20Wachter's%20Wish.md"
  );
});

test("seuls les fichiers markdown modifiés entre deux versions sont listés", async () => {
  const source = createGithubSource({
    owner: "o",
    repo: "r",
    branch: "main",
    fetchImpl: fakeFetch({
      "https://api.github.com/repos/o/r/compare/old...new": {
        files: [
          { filename: "Act II/Arc F.md", status: "modified" },
          { filename: "images/Map.png", status: "added" }
        ]
      }
    })
  });

  assert.deepEqual(await source.changedFiles("old", "new"), ["Act II/Arc F.md"]);
});

test("une erreur GitHub remonte avec son code", async () => {
  const source = createGithubSource({ owner: "o", repo: "r", branch: "main", fetchImpl: fakeFetch({}) });

  await assert.rejects(source.latestCommit(), /404/);
});
