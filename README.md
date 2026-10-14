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

## Privacy

See [PRIVACY.md](PRIVACY.md). The extension does not collect or transmit
personal data.
