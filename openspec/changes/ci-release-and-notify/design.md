# Design

## Context

`release.yml` currently runs only on `workflow_dispatch`, verifies the committed `dist/` is current, and force-moves the `v1` tag. `ci.yml` runs build/lint/test plus the same `dist/` freshness check on every push to `main` and on pull requests. The action itself (`action.yml`) posts messages to a Talk room from `server-url`, `user`, `app-password`, `room-token`, and `message` inputs. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Release automatically on every push to `main`, keeping the stale-bundle guard.
- A manually dispatched workflow that posts a caller-supplied message via the action, configured entirely through repository secrets.

**Non-Goals:**
- No changes to the action code, its inputs/outputs, or the versioning scheme itself.
- No release notifications or conditionality (e.g. "only release when src changed") — every push to `main` releases.

## Decisions

- **Release trigger: `on: push` limited to `main`, replacing `workflow_dispatch`.**
  Every push to `main` is meant to be a release, so keeping the manual trigger would just invite divergent states. Alternative considered: chaining after `ci.yml` via `workflow_run` so a release only happens after CI passes — rejected because `release.yml` already performs its own verification (`npm run bundle` + `git diff --exit-code`), so waiting on CI adds coupling without adding safety.
- **Notify workflow uses the local checkout (`uses: ./`).**
  The workflow exists to test the code at the dispatched ref, not the last released bundle. `@v1` would test an older state; `./` tests exactly what was dispatched (any branch can be selected when dispatching).
- **Secret names: `NEXTCLOUD_SERVER_URL`, `NEXTCLOUD_USER`, `NEXTCLOUD_APP_PASSWORD`, `NEXTCLOUD_ROOM_TOKEN`.**
  The user provides the values as repository secrets; the workflow references them with these names. `app-password` is the actual credential; the others are configuration that belongs in secrets here for simplicity.
- **`message` is a required dispatch input; missing input fails the dispatch before any send.**
  GitHub rejects the dispatch form when a required input is empty, which satisfies the "Dispatch without a message" scenario without custom code.
- **No `continue-on-error` in the notify workflow.**
  A failed send should mark the run as failed — the workflow exists to surface problems. (Consumer workflows may keep the README's `continue-on-error` pattern; this one should not.)
- **`permissions: contents: read` (release) / minimal permissions (notify).**
  The tag move needs `contents: write`; the release job keeps it scoped to that workflow. The notify workflow sends an HTTP request to an external server and needs no write permissions.

## Risks / Trade-offs

- [Every push to `main` moves `v1`, including docs-only pushes] → Accepted: that is the intended behavior; the commit history remains the changelog.
- [Automatic force-push of the tag races with concurrent pushes to `main`] → Rare and self-healing: the next push re-runs the release on the newer commit. No queued serialization needed.
- [Secrets unset or wrong make the notify workflow fail on first use] → The action already maps HTTP/OCS errors to plain-language messages and masks the room token; failure output stays safe.

## Migration Plan

1. Change `release.yml` trigger; the first subsequent push to `main` releases automatically.
2. Add `notify.yml`; create the four repository secrets before the first dispatch.
3. Update the README release instructions ("Actions → Release → Run workflow" no longer applies).

Rollback: revert both workflow files; releases then need the previous manual procedure again (restore `workflow_dispatch`).
