# Proposal

## Why

There is no maintained GitHub Action for posting messages to Nextcloud Talk. Teams that run their CI/CD on GitHub and their chat on Nextcloud (a common self-hosting combination) currently hand-roll `curl` steps with no error handling, masked-value leaks, or marketplace ergonomics. This repo is empty today; it becomes the home of a reusable action covering that integration, starting with the single most-wanted command: send a chat message.

## What Changes

- Introduce a JavaScript (node24) GitHub Action at the repo root that sends one message to a Nextcloud Talk room via the chat API (`POST /ocs/v2.php/apps/spreed/api/v1/chat/{token}`).
- Inputs: `server-url`, `user`, `app-password`, `room-token`, `message` (required), plus optional `silent`, `reply-to`, `reference-id`.
- Output: `message-id` of the sent message.
- Errors are user-diagnosable: HTTP and OCS status codes are checked and mapped to plain messages; 401/403/404/413/429 are named distinctly.
- The room token is masked in logs and never appears in error output; only the app password is treated as an inherent secret.
- Action is published via a `v1` major tag with a bundled `dist/` artifact; the repo layout follows the actions/cache convention (command folders at repo root, shared `src/` and `dist/`) so later commands slot in without restructuring.

## Capabilities

### New Capabilities

- `send-message`: Posting a chat message to a Nextcloud Talk room from a GitHub workflow — inputs, outputs, authentication, error reporting, and log-safety rules of the send-message action.

### Modified Capabilities

- None. No existing specs.

## Impact

- New code only; no existing behavior is touched.
- Dependencies: `@actions/core`, `@actions/http-client` (bundled; chosen over native `fetch` for proxy and retry support on self-hosted runners).
- Publishing impact: repo must carry `action.yml`, bundled `dist/`, CI (build + test), and a `v1` tag for workflow consumption.
- Future commands (delete message, react, etc.) are out of scope for this change; the layout must merely not prevent them.
