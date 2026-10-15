# Proposal

## Why

Releases are currently cut by manually running the Release workflow. Every push to `main` is meant to be a release anyway, so the manual step is redundant work that is easy to forget. Separately, there is no way to try out the action end-to-end against a real Nextcloud Talk server without setting up an ad-hoc workflow in another repository.

## What Changes

- The Release workflow (`release.yml`) is triggered automatically by every push to `main` instead of by manual dispatch. It still verifies `dist/` is current before moving the `v1` tag.
- A new manually dispatched workflow (`notify.yml`) posts a message to a Nextcloud Talk room. The message text is a workflow dispatch input; server, user, app password, and room token come from repository secrets.
- README's release instructions are updated to reflect the automatic trigger.

## Capabilities

### New Capabilities
- `ci-notify`: A manually dispatched CI workflow that posts a caller-provided message to a Talk room configured via repository secrets, exercising the send-message action end to end.

### Modified Capabilities
- `versioning`: The requirement "Releases are cut by the release workflow" changes: a release SHALL be triggered automatically by every push to `main`, no longer by manual dispatch. The stale-bundle guard and tag-move behavior stay unchanged.

## Impact

- `.github/workflows/release.yml`: trigger changes from `workflow_dispatch` to `push` on `main`.
- `.github/workflows/notify.yml`: new workflow; requires new repository secrets (server URL, user, app password, room token).
- `README.md`: "Versioning and releases" section updated.
- No changes to the action code (`src/`, `lib/`, `dist/`) or its interface.
