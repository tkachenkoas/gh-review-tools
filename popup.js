import { DEFAULT_PREFERENCES } from "./url.js";

const controls = {
  hideWhitespace: document.querySelector("#hide-whitespace"),
  hideViewedFiles: document.querySelector("#hide-viewed-files"),
  autoViewImportOnly: document.querySelector("#auto-view-import-only"),
  autoViewUnchangedRenames: document.querySelector("#auto-view-unchanged-renames")
};

await loadPreferences();

for (const [name, control] of Object.entries(controls)) {
  control.addEventListener("change", () => savePreference(name, control.checked));
}

async function loadPreferences() {
  const preferences = await chrome.storage.sync.get(DEFAULT_PREFERENCES);

  for (const [name, control] of Object.entries(controls)) {
    control.checked = preferences[name];
  }
}

async function savePreference(name, enabled) {
  await chrome.storage.sync.set({ [name]: enabled });

  if (name !== "hideWhitespace" && name !== "hideViewedFiles") {
    return;
  }
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab?.id !== undefined) {
    await chrome.runtime.sendMessage({ type: "apply-preferences", tabId: activeTab.id });
  }
}
