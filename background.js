import { getChangesUrlWithPreferences } from "./url.js";

const githubFilter = { url: [{ hostEquals: "github.com" }] };

// GitHub uses both full document navigations and History API navigations.
// Listening for both makes the preference persist when moving between PR tabs.
chrome.webNavigation.onBeforeNavigate.addListener(redirectToDefaults, githubFilter);
chrome.webNavigation.onHistoryStateUpdated.addListener(redirectToDefaults, githubFilter);

async function redirectToDefaults(details) {
  if (details.frameId !== 0) {
    return;
  }

  await applyPreferencesToUrl(details.tabId, details.url);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "apply-preferences" && Number.isInteger(message.tabId)) {
    applyPreferencesToTab(message.tabId)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (message?.type === "github-url-changed" && Number.isInteger(_sender.tab?.id) && typeof message.url === "string") {
    applyPreferencesToUrl(_sender.tab.id, message.url)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }
});

async function applyPreferencesToTab(tabId) {
  const tab = await chrome.tabs.get(tabId);
  return applyPreferencesToUrl(tabId, tab.url);
}

async function applyPreferencesToUrl(tabId, url) {
  const preferences = await chrome.storage.sync.get(["hideWhitespace", "hideViewedFiles"]);
  const targetUrl = getChangesUrlWithPreferences(url, preferences);

  if (targetUrl) {
    await chrome.tabs.update(tabId, { url: targetUrl });
  }
}
