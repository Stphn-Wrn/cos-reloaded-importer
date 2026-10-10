import { MODULE_ID } from "../constants.js";
import { createProgress, t } from "../foundry/foundry-adapter.js";
import { runImport } from "../import/importer.js";

let running = false;

function progressHandler(progress) {
  return (event) => {
    if (event.step === "fetch") {
      progress.update((event.done / event.total) * 0.8, t("COSR.Progress.Fetch", { done: event.done, total: event.total }));
      return;
    }
    if (event.step === "build") {
      progress.update(0.85, t("COSR.Progress.Build"));
      return;
    }
    progress.update(0.9, t("COSR.Progress.Write"));
  };
}

function report(sync, translation) {
  ui.notifications.info(
    t("COSR.Notify.Done", {
      created: sync.createPages.length,
      updated: sync.updatePages.length,
      removed: sync.removePages.length,
      unchanged: sync.unchangedPages.length
    })
  );
  if (translation.outdated > 0) {
    ui.notifications.warn(t("COSR.Notify.TranslationOutdated", { count: translation.outdated }), { permanent: true });
  }
  if (sync.conflicts.length > 0) {
    ui.notifications.warn(t("COSR.Notify.Conflicts", { count: sync.conflicts.length }), { permanent: true });
  }
}

export async function importGuide(services, { force }) {
  if (running) {
    ui.notifications.warn(t("COSR.Notify.AlreadyRunning"));
    return;
  }
  running = true;
  const progress = createProgress(t("COSR.Progress.Start"));
  try {
    const { commit, sync, translation } = await runImport({
      ...services,
      translation: services.translation(),
      force,
      onProgress: progressHandler(progress)
    });
    progress.update(1, t("COSR.Progress.Done"));
    await game.settings.set(MODULE_ID, "importedCommit", commit);
    report(sync, translation);
  } catch (error) {
    console.error(`${MODULE_ID} | Import failed`, error);
    progress.update(1, t("COSR.Notify.Failed", { error: error.message }));
    ui.notifications.error(t("COSR.Notify.Failed", { error: error.message }), { permanent: true });
  } finally {
    running = false;
  }
}
