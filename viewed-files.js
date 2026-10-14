// Speeds up marking files as viewed on a PR Changes page:
// - "v" marks the first not-viewed file visible on screen;
// - optionally, import-only files are marked automatically, one per second.
const VIEWED_BUTTON = 'button[aria-pressed][aria-label="Viewed"], button[aria-pressed][aria-label="Not Viewed"]';
// The sticky PR toolbar covers the top of the viewport; a file whose bottom is
// above this line is no longer readable, so the hotkey skips it.
const STICKY_TOOLBAR_HEIGHT = 120;
const AUTO_VIEW_INTERVAL_MS = 1000;

let autoViewImportOnly = false;
// Files already auto-marked on this page; unmarking one by hand must stick.
const autoViewedFileIds = new Set();

chrome.storage.sync.get({ autoViewImportOnly: false }).then((preferences) => {
  autoViewImportOnly = preferences.autoViewImportOnly;
});
chrome.storage.onChanged.addListener((changes) => {
  if (changes.autoViewImportOnly) {
    autoViewImportOnly = changes.autoViewImportOnly.newValue;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "v" || event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) {
    return;
  }

  const file = notViewedFiles().find((region) => region.getBoundingClientRect().bottom > STICKY_TOOLBAR_HEIGHT);
  if (file) {
    event.preventDefault();
    viewedButton(file).click();
  }
});

setInterval(() => {
  if (!autoViewImportOnly) {
    return;
  }

  const file = notViewedFiles().find((region) => !autoViewedFileIds.has(region.id) && isImportOnlyFile(region));
  if (file) {
    autoViewedFileIds.add(file.id);
    viewedButton(file).click();
  }
}, AUTO_VIEW_INTERVAL_MS);

function notViewedFiles() {
  if (!/^\/[^/]+\/[^/]+\/pull\/\d+\/(changes|files)$/.test(location.pathname)) {
    return [];
  }

  return [...document.querySelectorAll('div[role="region"][id^="diff-"]')]
    .filter((region) => viewedButton(region)?.getAttribute("aria-pressed") === "false");
}

function viewedButton(region) {
  return region.querySelector(VIEWED_BUTTON);
}

// GitHub renders file diffs lazily; only a file whose lines are already in the
// DOM can be judged, so the others are picked up once scrolled into view.
function isImportOnlyFile(region) {
  if (!region.querySelector("table") || /Load diff/.test(region.textContent)) {
    return false;
  }

  const changedLines = [...region.querySelectorAll("code.diff-text.addition, code.diff-text.deletion")]
    .map((code) => code.querySelector(".diff-text-inner")?.textContent ?? "");
  return isImportOnlyChange(changedLines);
}

function isTyping(target) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}
