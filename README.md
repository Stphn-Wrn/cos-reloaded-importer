# Curse of Strahd: Reloaded Importer

[Version française](README.fr.md)

A Foundry VTT module that imports DragnaCarta's [Curse of Strahd: Reloaded](https://www.strahdreloaded.com) guide into your world as structured, cross-linked journals, and keeps them up to date as the guide evolves.

The module downloads the English guide from the [author's public repository](https://github.com/DragnaCarta/Curse-of-Strahd-Reloaded), straight from your browser, when you run the import. The only guide text in this repository is the French translation in `translations/fr`, published with the author's permission.

## What it does

- One folder per part of the guide (Introduction, Chapters, Acts, Appendices), one journal per arc, one page per section.
- The guide's links become Foundry links that open the right page at the right section.
- Read-aloud text, callouts (lore, combat, profiles, items…), tables, stat blocks and images are styled.
- When the world launches, the GM is told if a new version of the guide has been published. An update only replaces the pages the author changed.
- Your edits are protected: a page you edited by hand is not overwritten unless you ask for it, and pages you add to the journals are never touched.

## Installation

In Foundry or on The Forge, install the module with this manifest URL:

```
https://raw.githubusercontent.com/Stphn-Wrn/cos-reloaded-importer/main/module.json
```

## Usage

1. Enable the module in your world.
2. In the **Journal** tab, click **CoS Reloaded**.
3. Click **Import**. The same button later becomes **Update**.

Imported journals are visible to the GM only.

## French version

The whole guide is translated into French, except the Changelog. To use it, choose **Français** in the **Guide language** setting, then run the import again. A section whose English original changed since it was translated is imported in English until its translation is updated. Vocabulary choices are listed in `translations/GLOSSAIRE.md`.

## Credits

Curse of Strahd: Reloaded is written by DragnaCarta and published for free under the Wizards of the Coast Fan Content Policy. If the guide helps you, [support the author](https://www.strahdreloaded.com).

This module is not affiliated with DragnaCarta or Wizards of the Coast.
