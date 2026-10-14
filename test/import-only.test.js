import test from "node:test";
import assert from "node:assert/strict";

import "../import-only.js";

const { isImportOnlyChange } = globalThis;

test("isImportOnlyChange_javaImportsAndBlankLines_true", () => {
  assert.equal(
    isImportOnlyChange(["import com.acme.Widget;", "", "import static org.junit.Assert.assertEquals;"]),
    true
  );
});

test("isImportOnlyChange_jsAndPythonImports_true", () => {
  assert.equal(isImportOnlyChange(['import { a } from "./a.js";', "from os import path", "import sys"]), true);
});

test("isImportOnlyChange_importNextToCode_false", () => {
  assert.equal(isImportOnlyChange(["import com.acme.Widget;", "    widget.run();"]), false);
});

test("isImportOnlyChange_identifierStartingWithImport_false", () => {
  assert.equal(isImportOnlyChange(["importer.run();"]), false);
});

test("isImportOnlyChange_onlyBlankLines_false", () => {
  assert.equal(isImportOnlyChange(["", "   "]), false);
});

test("isImportOnlyChange_noChangedLines_false", () => {
  assert.equal(isImportOnlyChange([]), false);
});
