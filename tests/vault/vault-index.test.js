import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVaultIndex } from "../../src/vault/vault-index.js";

test("un fichier est découpé en une page par titre de niveau 1, avec le préambule en tête", () => {
  const index = buildVaultIndex({
    markdownFiles: [
      {
        path: "Act II/Arc F - Lady Wachter's Wish.md",
        text: "Intro de l'arc.\n# F1. The Blue Water Inn\nTexte F1.\n# F2. Wachterhaus\n## F2a. Welcome\nTexte F2a."
      }
    ],
    imagePaths: []
  });

  const [document] = index.documents;
  assert.equal(document.name, "Arc F - Lady Wachter's Wish");
  assert.equal(document.folderPath, "Act II");
  assert.deepEqual(
    document.sections.map((section) => [section.title, section.markdown]),
    [
      [null, "Intro de l'arc."],
      ["F1. The Blue Water Inn", "Texte F1."],
      ["F2. Wachterhaus", "## F2a. Welcome\nTexte F2a."]
    ]
  );
});

test("le frontmatter est retiré et un préambule vide ne crée pas de page", () => {
  const index = buildVaultIndex({
    markdownFiles: [{ path: "Introduction/Guide.md", text: "---\ndescription: x\n---\n\n# Bienvenue\nTexte." }],
    imagePaths: []
  });

  assert.deepEqual(index.documents[0].sections.map((section) => section.title), ["Bienvenue"]);
});

test("les titres dans un encadré ne découpent pas le fichier", () => {
  const index = buildVaultIndex({
    markdownFiles: [{ path: "Arc.md", text: "# A\n> [!combat]- Combat\n> # Pas une page\n> texte" }],
    imagePaths: []
  });

  assert.equal(index.documents[0].sections.length, 1);
});

test("deux sections de même titre ont des clés distinctes", () => {
  const index = buildVaultIndex({
    markdownFiles: [{ path: "Arc.md", text: "# Notes\na\n# Notes\nb" }],
    imagePaths: []
  });

  const [first, second] = index.documents[0].sections;
  assert.notEqual(first.key, second.key);
});

test("les fichiers techniques du coffre Obsidian sont ignorés", () => {
  const index = buildVaultIndex({
    markdownFiles: [
      { path: "_other/templates/combat.md", text: "# T" },
      { path: ".obsidian/x.md", text: "# T" },
      { path: "Appendices/Bestiary.md", text: "# B" }
    ],
    imagePaths: []
  });

  assert.deepEqual(index.documents.map((document) => document.path), ["Appendices/Bestiary.md"]);
});

test("un document se retrouve par son nom ou par son chemin, sans tenir compte de la casse", () => {
  const index = buildVaultIndex({
    markdownFiles: [{ path: "Act I - Into the Mists/Arc C - Into the Valley.md", text: "# C" }],
    imagePaths: []
  });

  assert.equal(index.findDocument("arc c - into the valley")?.name, "Arc C - Into the Valley");
  assert.equal(index.findDocument("Act I - Into the Mists/Arc C - Into the Valley")?.name, "Arc C - Into the Valley");
  assert.equal(index.findDocument("Arc D - The Tome of Strahd"), null);
});

test("un titre se retrouve malgré la mise en forme markdown", () => {
  const index = buildVaultIndex({
    markdownFiles: [{ path: "NPC.md", text: "# Death House\n### Rosavalda \"Rose\" Durst\n### **Balancing:**" }],
    imagePaths: []
  });
  const document = index.documents[0];

  const rose = index.findHeading(document, "Rosavalda \"Rose\" Durst");
  assert.equal(rose.section.title, "Death House");
  assert.equal(rose.level, 3);
  assert.equal(rose.plain, "Rosavalda \"Rose\" Durst");

  assert.equal(index.findHeading(document, "Balancing:")?.plain, "Balancing:");
  assert.equal(index.findHeading(document, "Rosavalda “Rose” Durst")?.level, 3);
  assert.equal(index.findHeading(document, "death house")?.level, 1);
  assert.equal(index.findHeading(document, "Inconnu"), null);
});

test("une image se retrouve par son nom de fichier", () => {
  const index = buildVaultIndex({ markdownFiles: [], imagePaths: ["images/Lady Fiona Wachter.png"] });

  assert.equal(index.imagePath("Lady Fiona Wachter.png"), "images/Lady Fiona Wachter.png");
  assert.equal(index.imagePath("absent.png"), null);
});
