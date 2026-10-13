# Tasks

## 1. Project setup

- [ ] 1.1 Add runtime deps (`@actions/core`, `@actions/http-client`) and dev tooling (TypeScript, vitest, `@vercel/ncc`, eslint) to package.json; verify `npm run build` compiles a stub entrypoint
- [ ] 1.2 Add tsconfig, eslint config, and npm scripts (build, test, lint, bundle); verify all scripts run green on the stub

## 2. Client core

- [ ] 2.1 Implement OCS response parsing and the error mapping table (401/403/404/413/429 named distinctly, OCS error inside HTTP 200 caught, unknown errors fall back to status + body excerpt); verify unit tests cover every mapping and the HTTP-200-with-OCS-error case
- [ ] 2.2 Implement request building on `@actions/http-client` (Basic auth, `OCS-APIRequest` header, form fields `message`/`silent`/`replyTo`/`referenceId` omitted when unset); verify unit tests assert headers, body fields, and omission of optional fields
- [ ] 2.3 Implement log-safety (mask room token via `setSecret`, errors built from OCS payload only, never URL or path); verify unit tests assert no error message contains the token or request URL

## 3. Send-message command

- [ ] 3.1 Implement input reading with required-input validation (`server-url`, `user`, `app-password`, `room-token`, `message`) that fails before any network request, naming the missing input; verify unit tests cover each missing-input case
- [ ] 3.2 Implement the main entrypoint (read inputs, mask token, call client, set `message-id` output, fail on mapped errors); verify unit tests with a mocked client assert output and failure paths

## 4. Action packaging

- [ ] 4.1 Create `action.yml` (inputs incl. `silent`/`reply-to`/`reference-id`, `message-id` output, `runs: node24`, `main: dist/send-message/index.js`); verify with `actionlint`
- [ ] 4.2 Bundle with ncc to `dist/send-message/index.js`; verify a dist-freshness check (rebuild and diff) reports no drift
- [ ] 4.3 Write README with the `uses: owner/repo@v1` usage example, input table, and room-token secrets-vs-vars guidance; verify the example matches `action.yml` field for field

## 5. Integration checks

- [ ] 5.1 Add CI workflow (install, lint, unit tests, bundle, dist-freshness check); verify a pushed branch runs green end to end
- [ ] 5.2 Smoke-test the bundled action against a real Nextcloud instance using test credentials; verify the message arrives in the room and `message-id` is set
