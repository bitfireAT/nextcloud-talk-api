# Tasks

## 1. Automatic release on push to main

- [x] 1.1 Change `.github/workflows/release.yml` trigger from `workflow_dispatch` to `push` on `main` (keep `contents: write`, the bundle-freshness check, and the tag-move steps) and verify the workflow still parses with `act --list` or a push to a scratch branch that fast-forwards `main`
- [x] 1.2 Update the README "Versioning and releases" section to describe the automatic release (no more "Actions → Release → Run workflow") and verify the instructions match `release.yml`

## 2. Manual notify workflow

- [x] 2.1 Create `.github/workflows/notify.yml`: `workflow_dispatch` with required `message` input, minimal permissions, one job that runs the local action (`uses: ./`) with the four repository secrets (`NEXTCLOUD_SERVER_URL`, `NEXTCLOUD_USER`, `NEXTCLOUD_APP_PASSWORD`, `NEXTCLOUD_ROOM_TOKEN`) and no `continue-on-error`; verify the file parses with `act --list` or equivalent YAML lint
- [ ] 2.2 Add the four repository secrets on GitHub and verify a manual dispatch with a test message posts exactly that message to the configured room

## 3. Integration check

- [ ] 3.1 Push a trivial commit to `main` and verify the Release workflow runs automatically and moves the `v1` tag to that commit (`git ls-remote origin v1` matches the pushed SHA)
