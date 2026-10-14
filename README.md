# GitHub Diff Defaults

Chrome extension that applies preferred URL settings whenever a GitHub pull
request's **Changes** tab opens.

The extension button opens a small settings panel. Both settings are enabled
by default and are saved in Chrome Sync. GitHub's internal navigations are
also observed, so it cannot silently replace either chosen value:

- `w=1` — hide whitespace-only changes;
- `show-viewed-files=false` — do not show files already marked as viewed.

Other query parameters, such as `diff=split`, and URL hashes are retained.
The extension affects only URLs shaped like
`https://github.com/<owner>/<repo>/pull/<number>/changes` (and the older
`/files` route).

## Marking files as viewed

- Press `v` on a Changes page to mark the first not-viewed file on screen as
  viewed. With viewed files hidden, the next file moves up, so `v` can be
  pressed repeatedly while scrolling.
- **Auto-mark import-only files as viewed** (off by default) marks files whose
  every changed line is an import, one file per second. GitHub renders diffs
  lazily, so files are picked up as they load while you scroll. A file
  unmarked by hand is not marked again until the page reloads.

## Install locally

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this project folder:
   `C:\\Users\\Anton\\IdeaProjects\\gh-tools-extension`

## Verify

Open a pull request's **Changes** tab. Its URL should include:

```text
?w=1&show-viewed-files=false
```

Run the URL-handling tests with:

```bash
npm test
```

## Build a distributable package

```bash
npm run build
```

The unpacked distributable is written to `dist/`. GitHub Actions additionally
uploads this folder for every CI run and builds a ZIP for every `v*` tag.

## Release

Bump `version` in `manifest.json` and `package.json`, merge, then push a
matching tag (`git tag v1.2.0 && git push origin v1.2.0`). The release workflow
attaches the ZIP to a GitHub Release, uploads it to the Chrome Web Store and
submits it for review. Google's review usually takes from a few hours to a
couple of days; the store rejects a version it has already received.

If the Chrome Web Store step fails after the GitHub Release was created, fix the
cause and re-run the failed job (`gh run rerun <run-id> --failed`); there is no
need to recreate the tag.

### One-time setup

The API only updates an existing item, so the very first version is uploaded by
hand in the [Developer Dashboard](https://chrome.google.com/webstore/devconsole).
Then, in the Google Cloud project `chrome-extensions-511619`:

1. Enable the
   [Chrome Web Store API](https://console.cloud.google.com/apis/library/chromewebstore.googleapis.com)
   and the
   [IAM Service Account Credentials API](https://console.cloud.google.com/apis/library/iamcredentials.googleapis.com);
   the latter is what `google-github-actions/auth` uses to mint the access token.
2. Create a service account (`cws-publisher`) and download a JSON key for it.
3. Grant that service account **Service Account Token Creator**; without it the
   auth step fails with `iam.serviceAccounts.getAccessToken denied`. New IAM
   grants can take a few minutes to apply.
4. Add the service account's email in the Developer Dashboard under Account →
   Service account.

Repository secrets:

- `GCP_SA_KEY`: the service account's JSON key.
- `CWS_PUBLISHER_ID`: the publisher ID, the UUID in Developer Dashboard URLs
  (`devconsole/<publisher-id>/<extension-id>/...`).
- `CWS_EXTENSION_ID`: the extension's item ID.

## Privacy

See [PRIVACY.md](PRIVACY.md). The extension does not collect or transmit
personal data.
