# Chrome Web Store listing

## Name

PR Review Tools for GitHub

## Summary

Review GitHub PRs with saved diff filters, press V to mark files viewed, and
auto-mark import-only diffs and unchanged renames.

## Detailed description

PR Review Tools for GitHub keeps pull-request review focused by applying your saved
filter preferences whenever you open the Changes tab.

- Hide whitespace-only changes.
- Hide files already marked as viewed.
- Keep GitHub's other URL settings, such as split or unified diff view.
- Turn either preference on or off from the extension popup.

The extension works only on `github.com` pull-request Changes pages. It does
not collect, transmit, or sell data.

## Category

Developer Tools

## Privacy policy URL

Use the public GitHub URL for `PRIVACY.md` after publishing this repository.

## Privacy practices form

Single purpose: apply the user's saved review filters on GitHub pull-request
Changes pages.

Permission justifications:

- `storage`: save the two user-selected filter preferences in Chrome Sync.
- `tabs`: update the active GitHub pull-request URL after a preference changes.
- `webNavigation`: detect navigation to a GitHub pull-request Changes page.
- `https://github.com/*`: run only on GitHub pull-request Changes pages.

The extension processes the current GitHub URL locally and stores only the two
Boolean preferences in Chrome Sync. It does not transmit user data, use remote
code, or use analytics.

## Store assets still needed

- At least one 1280×800 or 640×400 screenshot showing the popup on a GitHub
  pull-request Changes page.
