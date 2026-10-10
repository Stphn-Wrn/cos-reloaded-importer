# Curse of Strahd: Reloaded Importer

[English version](README.md)

Module Foundry VTT qui importe le guide [Curse of Strahd: Reloaded](https://www.strahdreloaded.com) de DragnaCarta dans votre monde, sous forme de journaux structurés et reliés entre eux, et qui les tient à jour quand le guide évolue.

Le module télécharge le guide anglais depuis le [dépôt public de l'auteur](https://github.com/DragnaCarta/Curse-of-Strahd-Reloaded), directement depuis votre navigateur, au moment où vous lancez l'import. Le seul texte du guide présent dans ce dépôt est la traduction française, dans `translations/fr`, publiée avec l'accord de l'auteur.

## Ce que fait le module

- Un dossier par partie du guide (Introduction, Chapitres, Actes, Annexes), un journal par arc, une page par section.
- Les liens du guide deviennent des liens Foundry qui ouvrent la bonne page, à la bonne section.
- Les textes à lire aux joueurs, les encadrés (lore, combat, profils, objets…), les tableaux, les profils et les images sont mis en forme.
- À l'ouverture du monde, le MJ est prévenu si une nouvelle version du guide est publiée. La mise à jour ne remplace que les pages modifiées par l'auteur.
- Vos modifications sont protégées : une page que vous avez retouchée n'est pas écrasée, sauf si vous le demandez, et les pages que vous ajoutez aux journaux ne sont jamais touchées.

## Installation

Dans Foundry ou sur The Forge, installez le module avec l'URL de manifest :

```
https://raw.githubusercontent.com/Stphn-Wrn/cos-reloaded-importer/main/module.json
```

## Utilisation

1. Activez le module dans votre monde.
2. Dans l'onglet **Journaux**, cliquez sur **CoS Reloaded**.
3. Cliquez sur **Importer**. Le même bouton sert ensuite à **Mettre à jour**.

Les journaux importés ne sont visibles que par le MJ.

## Version française

Le guide complet est traduit en français, sauf le journal des modifications (Changelog). Pour l'utiliser, choisissez **Français** dans le réglage **Langue du guide**, puis relancez l'import. Une section dont l'original anglais a changé depuis sa traduction est importée en anglais jusqu'à ce que sa traduction soit mise à jour. Les choix de vocabulaire sont rassemblés dans `translations/GLOSSAIRE.md`.

## Crédits

Curse of Strahd: Reloaded est écrit par DragnaCarta et publié gratuitement dans le cadre de la Fan Content Policy de Wizards of the Coast. Si le guide vous sert, [soutenez l'auteur](https://www.strahdreloaded.com).

Ce module n'est affilié ni à DragnaCarta ni à Wizards of the Coast.
