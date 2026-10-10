import { MODULE_ID, SOURCE } from "./constants.js";
import { createMarkdownConverter } from "./convert/markdown-converter.js";
import { rootElement, slugifyHeading, t } from "./foundry/foundry-adapter.js";
import { createJournalStore } from "./foundry/journal-store.js";
import { createGithubSource } from "./source/github-source.js";
import { createTranslationSource } from "./translate/translation-source.js";
import { openImportDialog } from "./ui/import-dialog.js";

let services = null;

function translationSource() {
  if (game.settings.get(MODULE_ID, "guideLanguage") === "en") {
    return null;
  }
  return createTranslationSource({ baseUrl: game.settings.get(MODULE_ID, "translationUrl") });
}

function getServices() {
  if (!services) {
    services = {
      source: createGithubSource(SOURCE),
      store: createJournalStore(),
      toHtml: createMarkdownConverter(),
      slugify: slugifyHeading,
      translation: translationSource
    };
  }
  return services;
}

function registerSettings() {
  game.settings.register(MODULE_ID, "importedCommit", {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  game.settings.register(MODULE_ID, "guideLanguage", {
    name: "COSR.Settings.GuideLanguage.Name",
    hint: "COSR.Settings.GuideLanguage.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: { en: "English", fr: "Français" },
    default: "en"
  });

  game.settings.register(MODULE_ID, "translationUrl", {
    name: "COSR.Settings.TranslationUrl.Name",
    hint: "COSR.Settings.TranslationUrl.Hint",
    scope: "world",
    config: true,
    type: String,
    default: `modules/${MODULE_ID}/translations/fr`
  });

  game.settings.register(MODULE_ID, "checkForUpdates", {
    name: "COSR.Settings.CheckForUpdates.Name",
    hint: "COSR.Settings.CheckForUpdates.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
}

async function checkForUpdates() {
  if (!game.user.isGM || !game.settings.get(MODULE_ID, "checkForUpdates")) {
    return;
  }
  const imported = game.settings.get(MODULE_ID, "importedCommit");
  if (!imported?.sha) {
    return;
  }
  try {
    const latest = await getServices().source.latestCommit();
    if (latest.sha !== imported.sha) {
      ui.notifications.info(t("COSR.Notify.UpdateAvailable"), { permanent: true });
    }
  } catch (error) {
    console.warn(`${MODULE_ID} | Update check failed`, error);
  }
}

function addDirectoryButton(app, html) {
  if (!game.user.isGM) {
    return;
  }
  const root = rootElement(html);
  const actions = root.querySelector(".header-actions");
  if (!actions || actions.querySelector(".cosr-open")) {
    return;
  }
  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("cosr-open");
  button.innerHTML = `<i class="fa-solid fa-book-skull"></i> ${t("COSR.DirectoryButton")}`;
  button.addEventListener("click", () => openImportDialog(getServices()));
  actions.append(button);
}

Hooks.once("init", registerSettings);
Hooks.once("ready", checkForUpdates);
Hooks.on("renderJournalDirectory", addDirectoryButton);
