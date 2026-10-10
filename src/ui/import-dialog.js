import { MODULE_ID } from "../constants.js";
import { escapeHTML, formatDate, getDialogClass, t } from "../foundry/foundry-adapter.js";
import { importGuide } from "./import-action.js";

async function readStatus(source, imported) {
  const latest = await source.latestCommit();
  let changedFiles = [];
  if (imported?.sha && imported.sha !== latest.sha) {
    changedFiles = await source.changedFiles(imported.sha, latest.sha);
  }
  return { latest, changedFiles };
}

function fileLabel(path) {
  return path.split("/").pop().replace(/\.md$/i, "");
}

function renderImported(imported) {
  if (!imported?.sha) {
    return `<p>${t("COSR.Dialog.NotImported")}</p>`;
  }
  return `<p>${t("COSR.Dialog.Imported", { date: formatDate(imported.date) })}</p>`;
}

function renderLatest(status, imported) {
  if (status.error) {
    return `<p class="cosr-error">${t("COSR.Dialog.LoadError", { error: escapeHTML(status.error) })}</p>`;
  }
  const lines = [`<p>${t("COSR.Dialog.Latest", { date: formatDate(status.latest.date) })}</p>`];
  if (imported?.sha === status.latest.sha) {
    lines.push(`<p class="cosr-uptodate"><i class="fa-solid fa-check"></i> ${t("COSR.Dialog.UpToDate")}</p>`);
  } else if (imported?.sha) {
    lines.push(`<p class="cosr-update"><i class="fa-solid fa-arrows-rotate"></i> ${t("COSR.Dialog.UpdateAvailable")}</p>`);
    if (status.changedFiles.length > 0) {
      const items = status.changedFiles.map((path) => `<li>${escapeHTML(fileLabel(path))}</li>`).join("");
      lines.push(`<p>${t("COSR.Dialog.ChangedFiles")}</p><ul class="cosr-changed">${items}</ul>`);
    }
  }
  return lines.join("");
}

function renderContent(source, status, imported) {
  const repository = `<a href="${source.repositoryUrl}" target="_blank" rel="noopener">DragnaCarta / Curse-of-Strahd-Reloaded</a>`;
  return `
    <div class="cosr-dialog">
      <p>${t("COSR.Dialog.Source", { repository })}</p>
      ${renderImported(imported)}
      ${renderLatest(status, imported)}
      <label class="cosr-force">
        <input type="checkbox" name="force">
        ${t("COSR.Dialog.Force")}
      </label>
      <p class="hint">${t("COSR.Dialog.ForceHint")}</p>
      <p class="hint">${t("COSR.Dialog.Credits")}</p>
    </div>`;
}

function importLabel(imported) {
  if (imported?.sha) {
    return t("COSR.Dialog.Update");
  }
  return t("COSR.Dialog.Import");
}

export async function openImportDialog(services) {
  const imported = game.settings.get(MODULE_ID, "importedCommit");
  let status;
  try {
    status = await readStatus(services.source, imported);
  } catch (error) {
    status = { error: error.message };
  }

  const choice = await getDialogClass().wait({
    window: { title: t("COSR.Title"), icon: "fa-solid fa-book-skull" },
    content: renderContent(services.source, status, imported),
    buttons: [
      {
        action: "import",
        label: importLabel(imported),
        icon: "fa-solid fa-download",
        default: true,
        callback: (event, button) => ({ force: button.form.elements.force.checked })
      },
      { action: "close", label: t("COSR.Dialog.Close"), icon: "fa-solid fa-xmark" }
    ],
    rejectClose: false
  });

  if (choice?.force === undefined) {
    return;
  }
  await importGuide(services, { force: choice.force });
}
