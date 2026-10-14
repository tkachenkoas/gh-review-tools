---
name: release
description: Release a new version of the extension to GitHub Releases and the Chrome Web Store. Use when asked to release, publish, ship or tag a new version ("выпусти релиз", "опубликуй в стор").
---

# Release

A pushed `v*` tag runs `.github/workflows/release.yml`: it builds the ZIP,
attaches it to a GitHub Release, uploads it to the Chrome Web Store and submits
it for review. Setup and secrets are described in the README's Release section.

## Steps

1. Pick the new version (ask if the user didn't say). It must be higher than the
   version already in the store; the store rejects a repeat.
2. Bump `version` in both `manifest.json` and `package.json`, open a PR, merge
   it once CI passes.
3. Tag the merge commit on `main` and push the tag:

   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin vX.Y.Z
   ```

   The workflow fails before uploading if the tag doesn't match the manifest.
4. Watch the run and report the store's answer:

   ```bash
   gh run list --workflow release.yml --limit 1
   gh run watch <run-id> --exit-status
   gh run view <run-id> --log | grep -E 'Upload state|"state"|##\[error\]'
   ```

   Success is `Upload state: SUCCEEDED` followed by `"state": "PENDING_REVIEW"`
   (or `PUBLISHED`). Google's review then takes hours to a couple of days.

## When the store step fails

Fix the cause, then `gh run rerun <run-id> --failed`; don't recreate the tag.

- `IAM Service Account Credentials API has not been used ... or it is disabled`:
  the user enables it at the link in the error.
- `Permission 'iam.serviceAccounts.getAccessToken' denied`: the service account
  needs the Service Account Token Creator role. Right after granting it, wait a
  few minutes before re-running; IAM changes apply with a delay.
- Upload rejected for the version: the version is already in the store; bump it
  and release again with a new tag.

Changing Google Cloud or Developer Dashboard settings is the user's job; give
them the exact link and what to click.
