/**
 * Returns a changes-tab URL with the selected review filters.
 * Returns null when the URL is not a GitHub pull-request Changes page or is
 * already normalized.
 */
export const DEFAULT_PREFERENCES = Object.freeze({
  hideWhitespace: true,
  hideViewedFiles: true,
  autoViewImportOnly: false
});

export function getChangesUrlWithPreferences(rawUrl, preferences = DEFAULT_PREFERENCES) {
  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.origin !== "https://github.com" || !isPullRequestChangesPath(url.pathname)) {
    return null;
  }

  const whitespaceChanged = applyPreference(url, "w", "1", preferences.hideWhitespace);
  const viewedFilesChanged = applyPreference(
    url,
    "show-viewed-files",
    "false",
    preferences.hideViewedFiles
  );

  return whitespaceChanged || viewedFilesChanged ? url.toString() : null;
}

function isPullRequestChangesPath(pathname) {
  const segments = pathname.split("/").filter(Boolean);

  return (
    segments.length === 5 &&
    segments[2] === "pull" &&
    /^\d+$/.test(segments[3]) &&
    (segments[4] === "changes" || segments[4] === "files")
  );
}

function applyPreference(url, name, value, enabled) {
  if (enabled) {
    if (url.searchParams.get(name) === value && url.searchParams.getAll(name).length === 1) {
      return false;
    }

    url.searchParams.set(name, value);
    return true;
  }

  if (!url.searchParams.has(name)) {
    return false;
  }

  url.searchParams.delete(name);
  return true;
}
