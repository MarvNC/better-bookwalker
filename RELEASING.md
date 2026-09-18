# Releasing

Releases are tag-driven. The GitHub Actions **Build and Release** workflow
creates the GitHub release and uploads the generated userscript files whenever
it receives a `v*` tag.

From a clean checkout of `main`:

```bash
git pull --ff-only origin main
npm version patch   # or minor / major
git push --follow-tags origin main
```

`npm version` updates `package.json`, creates the matching `vX.Y.Z` commit and
tag, and `git push --follow-tags` sends both to GitHub. The tag push runs the
workflow, which builds the project and attaches `dist/better-bookwalker.user.js`
and `dist/better-bookwalker.meta.js` to the release with generated notes.

For feature work, open and merge a pull request first. Create the version tag
from the resulting `main` commit so the release points at the merged source.
