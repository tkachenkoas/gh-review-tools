import assert from "node:assert/strict";
import { test } from "node:test";
import { nextReleaseTag } from "../scripts/release-version.mjs";

test("uses a patch bump for fixes, CI and non-conventional merges", () => {
  for (const message of ["fix: correct diff", "ci: automate releases", "Update filters (#6)"]) {
    assert.equal(nextReleaseTag("v1.1.0", [message]), "v1.1.1");
  }
});

test("uses a minor bump for scoped features and conventional PR titles", () => {
  assert.equal(nextReleaseTag("v1.1.3", ["feat(popup): add setting (#6)"]), "v1.2.0");
  assert.equal(nextReleaseTag("v1.1.3", ["Merge pull request #6 from org/branch\n\nfeat: add setting"]), "v1.2.0");
});

test("breaking changes take priority over features", () => {
  for (const message of ["fix(popup)!: remove setting", "fix: remove setting\n\nBREAKING CHANGE: old setting removed"]) {
    assert.equal(nextReleaseTag("v1.1.3", ["feat: add setting", message]), "v2.0.0");
  }
});
