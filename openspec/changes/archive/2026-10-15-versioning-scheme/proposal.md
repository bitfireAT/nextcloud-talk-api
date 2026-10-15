# Proposal

## Why

The README and the `send-message` spec already promise consumption via `@v1`, but the repo has no `v1` tag, no release process that creates or moves it, and no rule for what happens on a breaking change. Consumers currently have nothing stable to point at. GitHub's recommended scheme for composite/JavaScript actions (major-version tags like `v1`, moved on each release) fills exactly that gap and is what action users expect to reference.

## What Changes

- Adopt the GitHub-recommended major-version tag scheme: a single `v1` tag that always points to the latest release within major version 1.
- Workflows consume the action as `bitfireAT/nextcloud-talk-api@v1` (unchanged from what the README already shows).
- The `v1` tag moves (is force-updated) to the released commit on every release; it is never deleted.
- No specific version tags (`v1.x.y`) for now — the moving major tag is the only release identifier.
- A release is performed by a release workflow (`workflow_dispatch`), not by hand on a maintainer's machine; it moves the tag to the released commit. No GitHub Releases for now — a release is the position of the `v1` tag.
- Breaking changes are released under a new major tag (`v2`); `v1` keeps pointing to the last compatible release, so existing consumers are never broken by a release they did not opt into.
- The `send-message` spec's "Usable via major version tag" requirement moves into the new `versioning` capability, which owns the scheme for all current and future actions in the repo.
- `package.json` version is aligned to major version 1 (0.1.0 → 1.0.0) so the manifest does not contradict the `v1` tag.

## Capabilities

### New Capabilities
- `versioning`: How actions in this repo are versioned and released — moving major-version tag consumption, the release workflow, and the major-version bump rule for breaking changes.

### Modified Capabilities
- `send-message`: The "Usable via major version tag" requirement is removed here; it is superseded by the `versioning` capability, which states it repo-wide instead of per-action.

## Impact

- New `.github/workflows/release.yml` (workflow_dispatch): verify dist freshness, move `v1`; needs `contents: write` permission.
- `README.md`: document the versioning scheme and how to cut a release in the Development section.
- `package.json`: bump version to 1.0.0.
- `openspec/specs/send-message/spec.md`: lose the tag requirement to `versioning` (behavior for consumers is unchanged).
- No changes to the action code itself; no impact on dependencies.
