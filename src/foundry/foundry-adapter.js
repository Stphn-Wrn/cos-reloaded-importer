export function t(key, data) {
  if (data) {
    return game.i18n.format(key, data);
  }
  return game.i18n.localize(key);
}

export function escapeHTML(value) {
  return Handlebars.escapeExpression(value ?? "");
}

export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString(game.i18n.lang, { dateStyle: "long", timeStyle: "short" });
}

export function slugifyHeading(text) {
  return CONFIG.JournalEntryPage.documentClass.slugifyHeading(text);
}

export function getDialogClass() {
  return foundry.applications.api.DialogV2;
}

export function createProgress(label) {
  if (game.release.generation >= 13) {
    const notification = ui.notifications.info(label, { progress: true });
    return {
      update(pct, message) {
        notification.update({ pct, message });
      }
    };
  }
  return {
    update(pct, message) {
      SceneNavigation.displayProgressBar({ label: message, pct: Math.round(pct * 100) });
    }
  };
}

export function rootElement(html) {
  if (html instanceof HTMLElement) {
    return html;
  }
  return html[0];
}
