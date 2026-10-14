# Design

## Context

The repo is empty except for OpenSpec scaffolding; everything is new code. The external contract is fixed by two sides: GitHub Actions mechanics (action.yml inputs/outputs, node24 runtime, bundled artifact, `v1` tag) and the Nextcloud Talk chat API (`POST /ocs/v2.php/apps/spreed/api/v1/chat/{token}`, `OCS-APIRequest: true` header, Basic auth, OCS response envelope `{"ocs": {"meta": {"statuscode": ...}, "data": {"id": ...}}}`). See proposal.md for motivation and specs/send-message/spec.md for the behavioral requirements.

## Goals / Non-Goals

**Goals:**

- One root action ("send message") that works on GitHub-hosted and self-hosted (proxy) runners.
- Repo layout that lets future commands be added without restructuring (actions/cache convention).

**Non-Goals:**

- Any other Talk command (delete, react, rich text, file sharing) — later changes.
- A generic "command switch" input; each command stays its own action.
- Retry/backoff beyond what the HTTP client provides by default; rate limiting is reported, not absorbed.

## Decisions

### D1: JavaScript action on node24, not Docker or composite
Native `fetch` plus `curl` in a composite step would work, but composite gives no outputs plumbing, no proxy handling, and weak error mapping. Docker adds image build time for a single HTTP call. A JS action bundles to one `dist/` file, runs everywhere, and uses `@actions/core` for inputs/outputs/fail.

### D2: `@actions/http-client` for the request, not native `fetch`
It honors `HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY` automatically — relevant because self-hosted runners behind corporate proxies are a normal Nextcloud audience — and provides retry handling. Native `fetch` ignores proxy env vars without a manually wired undici agent. Dependencies are moot at runtime since JS actions are bundled anyway. Alternative rejected for exactly the proxy gap.

### D3: Two-layer internal structure
`src/client/` owns connection concerns: auth header assembly, OCS envelope parsing, statuscode checking, error mapping, proxy/retry/timeout. `src/commands/send-message/` reads inputs, validates required ones, calls the client, sets `message-id`. Rationale: the layering is what makes "future commands are additive" true without a framework. No class hierarchy ceremony — a single `TalkClient` module with one `postMessage` method is enough for v1.

### D4: Root action is the send-message action
`action.yml` at the repo root maps directly to the send-message entrypoint (`runs.using: node24`, `main: dist/send-message/index.js` — bundle path mirroring actions/cache's shared `dist/` tree). Future commands get top-level folders (`delete-message/action.yml` with `main: '../dist/delete-message/index.js'`), released together under the same `v1` tag. Alternative (nested `actions/` folder) rejected: longer `uses:` path for no benefit.

### D5: Room token handled as non-secret but masked
The token is an identifier that Nextcloud itself publishes in conversation links, not a credential; whether it lives in `secrets` or `vars` is the workflow author's call (documented per room visibility). The action calls `core.setSecret()` on it defensively and constructs error messages from the OCS payload only — never the URL or path. The app password is the only inherent secret; it never appears in logs by construction (only used in the auth header).

### D6: Error mapping table
A fixed map from expected statuses to messages: 401 -> credentials, 403 -> room permission, 404 -> room token, 413 -> message too long, 429 -> rate limited. Anything else (or non-2xx without OCS body) fails with status + raw body excerpt. Validation of required inputs happens before any network request. OCS `statuscode` inside a 200 response is checked too, since OCS can report errors with HTTP 200.

### D7: Bundling with ncc, CI-checked
`@vercel/ncc` produces `dist/send-message/index.js`; CI runs lint, unit tests (mocked HTTP layer), and a dist-is-current check (`ncc` output committed matches a fresh build) so a tag never ships stale code.

## Risks / Trade-offs

- [Talk API path changes (api version bumps)] -> the API path lives in one constant in the client layer; a new version is a one-line change.
- [Bot workflows want bot credentials instead of app passwords] -> auth stays in one place (D3); adding bot auth later is additive.
- [ncc bundling drifts from src] -> CI dist-freshness check fails the build on drift.
- [Self-hosted runners with broken proxy configs] -> errors from the HTTP client are surfaced verbatim; no silent fallback to direct connection.

## Migration Plan

Greenfield; no migration. Rollback = delete the tag; nothing depends on the action yet.
