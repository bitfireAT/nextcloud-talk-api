# Tasks

## 1. Release workflow

- [x] 1.1 Add `.github/workflows/release.yml` (trigger: `workflow_dispatch`, `permissions: contents: write`) that checks out main HEAD, runs `npm ci` and `npm run bundle:check`, then runs `git tag -f v1 <HEAD sha>` and `git push -f origin v1`; verify the YAML is accepted by the Actions parser (push the branch and check the workflow appears without a syntax error annotation)
- [x] 1.2 Verify the stale-bundle guard: run `npm run bundle` with a deliberately modified `src/` (or rely on the existing dist-freshness check) and confirm the release workflow's check step fails before any tag is moved

## 2. Documentation and manifest alignment

- [x] 2.1 Document the versioning scheme in the README Development section: consumers pin `@v1`, a release is the `v1` tag position, how to cut a release (run the release workflow), and that breaking changes open a new major tag; verify the documented steps match `release.yml` exactly
- [x] 2.2 Bump `package.json` `version` from `0.1.0` to `1.0.0` to align with the `v1` tag; verify `npm run build && npm test` still pass

## Workflow follow-up

- Archive the change.
- After archiving, ask whether to cut the first release: run the release workflow on `main`, then verify `git ls-remote --tags origin` shows `v1` at the released commit.
- After the first release, reference `bitfireAT/nextcloud-talk-api@v1` in a throwaway workflow and verify the action resolves and runs from the tag.
