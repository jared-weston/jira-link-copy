# Jira Link Copy (Firefox)

Adds a small clipboard button next to the issue key on Jira pages. Clicking it copies a
hyperlink whose text is `ABC-123 Do The Thing` and whose target is the issue's `/browse/ABC-123` URL.

Both `text/html` (rich hyperlink for Outlook, Word, Confluence, Teams) and `text/plain`
(`ABC-123 Do The Thing`) flavours are placed on the clipboard.

## Load it temporarily

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on…**.
3. Select `manifest.json` from this folder.
4. Open a Jira issue — the clipboard icon appears right after the issue key in the breadcrumb
   (works in the full issue view and in the board/backlog issue modal).

Temporary add-ons are removed on restart. For a permanent install, zip the folder contents and
submit it to [addons.mozilla.org](https://addons.mozilla.org/developers/) for signing.

## Build a distributable zip

Every push to `main` runs [`.github/workflows/build.yml`](.github/workflows/build.yml), which lints
the extension with `web-ext` and uploads a zip as a workflow artifact. Pushing a tag such as
`v1.0.0` additionally publishes a GitHub release with the zip attached.

Locally:

```powershell
npx web-ext lint
npx web-ext build --artifacts-dir dist --overwrite-dest
```

Upload the resulting zip to AMO ("On your own" / unlisted) to get a signed `.xpi` you can share.

## Self-hosted Jira (Server / Data Center)

Add your host to `content_scripts[0].matches` in `manifest.json`, e.g.:

```json
"matches": ["*://*.atlassian.net/*", "*://jira.mycompany.com/*"]
```
