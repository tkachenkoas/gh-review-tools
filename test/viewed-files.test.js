import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mock, test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../viewed-files.js", import.meta.url), "utf8");
const importOnlySource = readFileSync(new URL("../import-only.js", import.meta.url), "utf8");

async function openChangesPage(preferences = {}) {
  const location = new URL("https://github.com/acme/widgets/pull/42/changes");
  const files = [];
  const scan = mock.fn(() => files);
  const intervals = new Map();
  let storageChanged;

  runInNewContext(importOnlySource + "\n" + source, {
    location,
    document: { querySelectorAll: scan, addEventListener() {} },
    chrome: {
      storage: {
        sync: { async get() { return preferences; } },
        onChanged: { addListener(listener) { storageChanged = listener; } }
      }
    },
    setInterval: (callback, delay) => intervals.set(delay, callback)
  });

  await Promise.resolve();
  const tick = intervals.get(1000);
  assert.equal(typeof tick, "function");
  return { location, files, scan, tick, storageChanged };
}

function diffFile(id, { notice, changedLines = [], viewed = false, disabled = false } = {}) {
  const button = {
    click: mock.fn(() => { viewed = true; }),
    getAttribute: (name) => name === "aria-pressed" ? String(viewed) : null,
    disabled
  };
  return {
    id,
    button,
    textContent: "",
    unmark: () => { viewed = false; },
    querySelector: (selector) => selector === "table" ? changedLines.length > 0 : button,
    querySelectorAll(selector) {
      if (selector === "div[data-diff-anchor]") {
        return notice ? [{ textContent: notice }] : [];
      }
      return changedLines.map((line) => ({ querySelector: () => ({ textContent: line }) }));
    }
  };
}

test("auto-marking is off until enabled and follows changes in Chrome Sync", async () => {
  const { files, scan, tick, storageChanged } = await openChangesPage();
  const rename = diffFile("diff-rename", { notice: "File renamed without changes." });
  const imports = diffFile("diff-imports", { changedLines: ["import kotlin.time.Duration"] });
  files.push(rename, imports);

  tick();
  assert.equal(scan.mock.callCount(), 0);
  storageChanged({ autoViewUnchangedRenames: { newValue: true } }, "sync");
  tick();
  assert.equal(rename.button.click.mock.callCount(), 1);
  assert.equal(imports.button.click.mock.callCount(), 0);

  storageChanged({ autoViewUnchangedRenames: { newValue: false } }, "sync");
  files.push(diffFile("diff-next", { notice: "File renamed without changes." }));
  tick();
  assert.equal(scan.mock.callCount(), 1);
});

test("marks at most one file per tick across both enabled options", async () => {
  const { files, tick } = await openChangesPage({
    autoViewUnchangedRenames: true,
    autoViewImportOnly: true
  });
  const rename = diffFile("diff-rename", { notice: "File renamed without changes." });
  const imports = diffFile("diff-imports", { changedLines: ["import kotlin.time.Duration"] });
  const changed = diffFile("diff-changed", { changedLines: ["fun run() = 1"] });
  const viewed = diffFile("diff-viewed", { notice: "File renamed without changes.", viewed: true });
  const disabled = diffFile("diff-disabled", { notice: "File renamed without changes.", disabled: true });
  files.push(changed, viewed, disabled, rename, imports);

  tick();
  assert.equal(rename.button.click.mock.callCount(), 1);
  assert.equal(imports.button.click.mock.callCount(), 0);
  rename.unmark();
  tick();
  assert.equal(rename.button.click.mock.callCount(), 1);
  assert.equal(imports.button.click.mock.callCount(), 1);
  assert.equal(changed.button.click.mock.callCount(), 0);
  assert.equal(viewed.button.click.mock.callCount(), 0);
  assert.equal(disabled.button.click.mock.callCount(), 0);
});

test("picks up newly rendered renames only on Changes and Files pages", async () => {
  const { location, files, scan, tick } = await openChangesPage({ autoViewUnchangedRenames: true });
  tick();
  const rename = diffFile("diff-late", { notice: "File renamed without changes." });
  files.push(rename);

  location.pathname = "/acme/widgets/pull/42";
  tick();
  assert.equal(scan.mock.callCount(), 1);
  assert.equal(rename.button.click.mock.callCount(), 0);

  location.pathname = "/acme/widgets/pull/42/files";
  tick();
  assert.equal(rename.button.click.mock.callCount(), 1);
});
