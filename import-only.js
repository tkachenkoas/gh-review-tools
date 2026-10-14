// Loaded both as a classic content script (before viewed-files.js) and by the
// Node tests, so it exposes its function through globalThis instead of export.
const IMPORT_LINE = /^\s*(import\b|from\s+\S+\s+import\b)/;

/**
 * True when every changed line is an import or blank, and at least one is an
 * import. Lines are the added/removed text without the leading +/- marker.
 */
function isImportOnlyChange(lines) {
  const meaningful = lines.filter((line) => line.trim() !== "");
  return meaningful.length > 0 && meaningful.every((line) => IMPORT_LINE.test(line));
}

globalThis.isImportOnlyChange = isImportOnlyChange;
