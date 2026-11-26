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

function diffLine(text, { type = "addition", modern = false, hasText = true } = {}) {
  const codeSelector = modern ? `code[data-diff-type="${type}"]` : `code.diff-text.${type}`;
  const textSelector = modern ? '[data-diff-text-inner="true"]' : ".diff-text-inner";
  return {
    codeSelector,
    querySelector: (selector) => hasText && selector.split(",").map((item) => item.trim()).includes(textSelector)
      ? { textContent: text }
      : null
  };
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
      const selectors = selector.split(",").map((item) => item.trim());
      return changedLines.filter((line) => selectors.includes(line.codeSelector));
    }
  };
}

test("auto-marking is off until enabled and follows changes in Chrome Sync", async () => {
  const { files, scan, tick, storageChanged } = await openChangesPage();
  const rename = diffFile("diff-rename", { notice: "File renamed without changes." });
  const imports = diffFile("diff-imports", { changedLines: [diffLine("import kotlin.time.Duration")] });
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
  const imports = diffFile("diff-imports", { changedLines: [diffLine("import kotlin.time.Duration")] });
  const changed = diffFile("diff-changed", { changedLines: [diffLine("fun run() = 1")] });
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

test("marks modern import-only diffs and ignores unchanged context", async () => {
  const { files, tick } = await openChangesPage({ autoViewImportOnly: true });
  const imports = diffFile("diff-imports", { changedLines: [
    diffLine("import old", { type: "deletion", modern: true }),
    diffLine("import replacement", { modern: true }),
    diffLine(" ", { modern: true }),
    diffLine("print('context')", { type: "context", modern: true })
  ] });
  files.push(imports);

  tick();
  assert.equal(imports.button.click.mock.callCount(), 1);
});

test("leaves modern diffs unviewed when a changed line contains code or its text is unavailable", async () => {
  const { files, tick } = await openChangesPage({ autoViewImportOnly: true });
  const imports = diffLine("import replacement", { modern: true });
  const mixed = diffFile("diff-mixed", { changedLines: [
    imports,
    diffLine("print('changed')", { type: "deletion", modern: true })
  ] });
  const incomplete = diffFile("diff-incomplete", { changedLines: [
    imports,
    diffLine("print('changed')", { type: "deletion", modern: true, hasText: false })
  ] });
  files.push(mixed, incomplete);

  tick();
  assert.equal(mixed.button.click.mock.callCount(), 0);
  assert.equal(incomplete.button.click.mock.callCount(), 0);
});

// Lays files out top to bottom and, like GitHub, renders only those near the viewport.
async function openScrollingPage(layout) {
  const page = { scrollY: 0 };
  let keydown;
  const files = layout.map(({ id, height, viewed }) => {
    const file = {
      id,
      viewed,
      offset: 0,
      height,
      button: { click() { file.viewed = true; file.height = 40; }, getAttribute: () => String(file.viewed) },
      querySelector: () => file.button,
      getBoundingClientRect: () => ({ top: file.offset - page.scrollY, bottom: file.offset + file.height - page.scrollY })
    };
    return file;
  });
  const relayout = () => files.reduce((offset, file) => (file.offset = offset) + file.height, 0);
  relayout();

  const context = {
    location: new URL("https://github.com/acme/widgets/pull/42/changes"),
    document: {
      addEventListener: (type, listener) => { keydown = listener; },
      querySelectorAll: () => files.filter((file) => {
        const { top, bottom } = file.getBoundingClientRect();
        return bottom > -500 && top < 1500;
      })
    },
    chrome: { storage: { sync: { async get() { return {}; } }, onChanged: { addListener() {} } } },
    HTMLElement: class {},
    setInterval() {},
    setTimeout: (callback) => setImmediate(callback),
    scrollBy: (x, y) => { context.scrollY = Math.max(0, context.scrollY + y); },
    scrollY: 0
  };
  Object.defineProperty(page, "scrollY", { get: () => context.scrollY });
  runInNewContext(importOnlySource + "\n" + source, context);

  const press = async () => {
    keydown({ key: "v", target: null, preventDefault() {} });
    relayout();
    for (let i = 0; i < 50; i++) {
      await new Promise((resolve) => setImmediate(resolve));
    }
  };
  return { files, press, top: (id) => files.find((file) => file.id === id).getBoundingClientRect().top };
}

test("v scrolls to the next not-viewed file even when it is not rendered yet", async () => {
  const { files, press, top } = await openScrollingPage([
    { id: "diff-current", height: 3000, viewed: false },
    ...Array.from({ length: 60 }, (_, i) => ({ id: `diff-viewed-${i}`, height: 40, viewed: true })),
    { id: "diff-next", height: 800, viewed: false },
    { id: "diff-last", height: 800, viewed: false }
  ]);

  await press();

  assert.equal(files[0].viewed, true);
  assert.equal(top("diff-next"), 120);
  assert.equal(files.at(-2).viewed, false);
});
