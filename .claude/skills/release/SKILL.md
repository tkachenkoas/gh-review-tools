---
name: release
description: Release a new version of the extension to GitHub Releases and the Chrome Web Store. Use when asked to release, publish, ship or tag a new version ("выпусти релиз", "опубликуй в стор").
---

# Release

Updates to `main` run `.github/workflows/release.yml`. It computes the version
from Conventional Commits, builds the ZIP, creates the tag and GitHub Release,
and submits the ZIP to the Chrome Web Store. The README describes version bumps,
setup and secrets.

## Steps

1. Find the release run for the merge commit. To retry a failed run, use
   `gh run rerun <run-id> --failed`. If there is no run for the current tip of
   `main`, start one with `gh workflow run release.yml --ref main`.
2. Watch the run and report the store's answer:

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
