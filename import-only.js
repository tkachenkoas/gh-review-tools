// Loaded both as a classic content script (before viewed-files.js) and by the
// Node tests, so it exposes its function through globalThis instead of export.
// A package declaration counts too: moving a Java/Kotlin/Go file to another
// package changes only that line and the imports.
const IMPORT_LINE = /^\s*(import\b|package\s|from\s+\S+\s+import\b)/;

/**
 * True when every changed line is an import, a package declaration or blank,
 * and at least one is not blank. Lines are the added/removed text without the
 * leading +/- marker.
 */
function isImportOnlyChange(lines) {
  const meaningful = lines.filter((line) => line.trim() !== "");
  return meaningful.length > 0 && meaningful.every((line) => IMPORT_LINE.test(line));
}

globalThis.isImportOnlyChange = isImportOnlyChange;
