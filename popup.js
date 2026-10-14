import { DEFAULT_PREFERENCES } from "./url.js";

const controls = {
  hideWhitespace: document.querySelector("#hide-whitespace"),
  hideViewedFiles: document.querySelector("#hide-viewed-files"),
  autoViewImportOnly: document.querySelector("#auto-view-import-only")
};

await loadPreferences();

for (const control of Object.values(controls)) {
  control.addEventListener("change", savePreferences);
}

async function loadPreferences() {
  const preferences = await chrome.storage.sync.get(DEFAULT_PREFERENCES);

  for (const [name, control] of Object.entries(controls)) {
    control.checked = preferences[name];
  }
}

async function savePreferences() {
  const preferences = Object.fromEntries(
    Object.entries(controls).map(([name, control]) => [name, control.checked])
  );
  await chrome.storage.sync.set(preferences);

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab?.id !== undefined) {
    await chrome.runtime.sendMessage({ type: "apply-preferences", tabId: activeTab.id });
  }

}
