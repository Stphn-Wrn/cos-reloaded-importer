import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../../src/convert/callouts.js";

const toHtml = (markdown) => `<p>${markdown.trim()}</p>`;

test("un encadré ouvert devient un bloc dépliable ouvert, avec son icône", () => {
  const html = renderMarkdown("> [!lore]+ Histoire\n> Il était une fois.", toHtml);

  assert.equal(
    html,
    '<details class="cosr-callout cosr-callout-lore" open><summary><i class="fa-solid fa-book-open"></i> Histoire</summary>' +
      '<div class="cosr-callout-body"><p>Il était une fois.</p></div></details>'
  );
});

test("un encadré replié devient un bloc dépliable fermé", () => {
  const html = renderMarkdown("> [!combat]- Combat\n> Stats", toHtml);

  assert.match(html, /^<details class="cosr-callout cosr-callout-combat"><summary>/);
});

test("un encadré non dépliable devient un bloc simple, titré par son type à défaut de titre", () => {
  const html = renderMarkdown("> [!Warning]\n> Attention", toHtml);

  assert.equal(
    html,
    '<div class="cosr-callout cosr-callout-warning"><div class="cosr-callout-title"><i class="fa-solid fa-triangle-exclamation"></i> Warning</div>' +
      '<div class="cosr-callout-body"><p>Attention</p></div></div>'
  );
});

test("le texte autour des encadrés est converti séparément", () => {
  const html = renderMarkdown("Avant\n> [!info]+ Info\n> Dedans\n\nAprès", toHtml);

  assert.equal(
    html,
    '<p>Avant</p><details class="cosr-callout cosr-callout-info" open><summary><i class="fa-solid fa-circle-info"></i> Info</summary>' +
      '<div class="cosr-callout-body"><p>Dedans</p></div></details><p>Après</p>'
  );
});

test("une citation classique n'est pas un encadré", () => {
  assert.equal(renderMarkdown("> Une citation", toHtml), "<p>> Une citation</p>");
});

test("un type d'encadré inconnu garde l'apparence par défaut", () => {
  const html = renderMarkdown("> [!mystere] Titre\n> x", toHtml);

  assert.match(html, /cosr-callout-mystere.*fa-circle-info/);
});
