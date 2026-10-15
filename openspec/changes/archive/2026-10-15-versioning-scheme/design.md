# Design

## Context

The action already ships a committed bundle (`dist/`, CI-checked) and the README tells consumers to use `@v1`, but no tag or release process exists yet; `package.json` still says `0.1.0`. See proposal.md for motivation and specs/versioning/spec.md for the requirements. The scheme follows GitHub's guidance for managing actions via major version tags.

## Goals / Non-Goals

**Goals:**
- A stable, moving `v1` tag that consumers pin, tracking the latest release within major version 1.
- A reproducible release path from CI that cannot ship a stale bundle.

**Non-Goals:**
- Specific version tags (`v1.x.y`) or a changelog — git history is the record for now.
- GitHub Releases — without unique tags per release, a release object has nothing stable to attach to; add later (e.g. dated releases) if note visibility becomes wanted, without touching the tag scheme.
- Any change to the action code itself.

## Decisions

### D1: Single moving major tag, no specific version tags
Consumers reference `bitfireAT/nextcloud-talk-api@v1`; every release force-moves `v1` to the released commit. Alternative (full semver tags plus an automated tag-updater workflow) rejected for now: extra machinery with no current consumer need. If pinning to an exact release is ever requested, specific tags can be added alongside the moving `v1` without breaking anyone.

### D2: Release via `workflow_dispatch`, cutting main HEAD
A new `release.yml` workflow, manually triggered, releases the current `HEAD` of `main`: checkout, `npm ci`, `npm run bundle:check` (re-fails on stale `dist/` even if CI was skipped), then `git tag -f v1 <sha>` and `git push -f origin v1` with `permissions: contents: write`. Alternatives rejected: manual tagging on a maintainer machine (error-prone, skips the freshness check) and a tag-push trigger (circular with a single moving tag — the trigger tag would have to exist to be pushed). Re-releasing an older commit means running the workflow from that ref, which `workflow_dispatch`'s ref selector already supports.

### D3: Breaking changes open `v2`
A breaking change is released by moving a new `v2` tag instead of `v1`; `v1` stays on the last compatible commit. This is the GitHub-documented contract that keeps `@v1` consumers stable. `package.json` `version` is aligned to `1.0.0` so the manifest does not contradict the tag; it is informational only (the tag is the release identity), so later releases do not need to bump it in lockstep.

### D4: `main` stays the only branch; no release branch
Development happens on `main`, protected (PRs only, CI green) so it is always releasable; the `v1` tag is the release identity. A support branch (à la `actions/checkout`'s `releases/v4`) is only needed if a v1 hotfix must ship while `main` already carries v2 development; introduce one then, not now.

### D5: Tag requirement moves from `send-message` to `versioning`
The existing "Usable via major version tag" requirement in `send-message` is removed and restated repo-wide in the new `versioning` capability, so future actions are covered by the same spec. No consumer-visible behavior changes.

## Risks / Trade-offs

- [Force-pushed tag vs. protected tags] → `v1` must be movable; if tag protection rules exist later, they must allow the release workflow (or the workflow's token) to update `v1`.
- [No per-release tags means no easy pin-to-exact-release] → git SHAs can be pinned as an escape hatch; specific tags can be introduced later.
- [Workflow releases only what is on `main`] → intended: anything merged to `main` is releasable; CI's dist check on push keeps `main` releasable at all times.

## Migration Plan

Greenfield: no tag exists yet. Rollout: merge and archive the change, then cut the first release by running the release workflow once, and verify a test workflow resolves `@v1`. Rollback: delete or re-point the `v1` tag; nothing depends on a specific release position yet.
