# pixelKanban — GitHub Actions Workflows

Two workflow files for deploying pixelKanban into any GitHub repository,
automatically wired to that repo's GitHub Issues.

---

## Files

### deploy-kanban.yml — Manual deploy
Trigger manually from the Actions tab whenever you want.

**How to use:**
1. Copy `deploy-kanban.yml` to `.github/workflows/` in any repo
2. Go to Actions → Deploy pixelKanban to GitHub Pages → Run workflow
3. Enable Pages: Settings → Pages → branch `gh-pages` / root
4. Board is live at `https://<owner>.github.io/<repo>/`

### auto-deploy-kanban.yml — Auto deploy on push
Deploys automatically on every push to `main` or `master`.

**How to use:**
1. Copy `auto-deploy-kanban.yml` to `.github/workflows/` in any repo
2. Push any commit to `main` — workflow triggers automatically
3. Enable Pages: Settings → Pages → branch `gh-pages` / root
4. Board is live at `https://<owner>.github.io/<repo>/`

---

## How it works

Both workflows:
1. Clone pixelKanban from `purna/pixelKanban`
2. Auto-detect the target repo's owner and name from `${{ github.repository }}`
3. Patch `js/config.js` so the board defaults to that repo's issues
4. Deploy the patched files to the `gh-pages` branch

No manual config editing required. The same workflow file works
across any repo without modification.

---

## Connecting to GitHub Issues

After deployment:
1. Open the board
2. Click the **GitHub** button in the header
3. Enter a Personal Access Token with `repo` scope
4. Use Push / Pull / Sync to manage issues

Generate a token at: https://github.com/settings/tokens
