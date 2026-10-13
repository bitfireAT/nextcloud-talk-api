# Nextcloud Talk Actions

GitHub Actions for the [Nextcloud Talk](https://github.com/nextcloud/spreed) API.
No build step is needed in your workflow — the action runs from the bundled `dist/` artifact committed to this repository.

## Send a chat message

```yaml
- name: Send Nextcloud Talk message
  uses: <owner>/<repo>@v1
  with:
    server-url: 'https://cloud.example.com'
    user: 'ci-bot'
    app-password: ${{ secrets.NEXTCLOUD_APP_PASSWORD }}
    room-token: ${{ secrets.NEXTCLOUD_ROOM_TOKEN }}
    message: 'Deployment finished'
    silent: false
    # reply-to: '42'
    # reference-id: 'deploy-123'
```

### Inputs

| Input | Description | Required | Default |
| ----- | ----------- | -------- | ------- |
| `server-url` | Base URL of the Nextcloud instance, e.g. `https://cloud.example.com` | yes | — |
| `user` | Nextcloud user on whose behalf the message is sent | yes | — |
| `app-password` | App password of the user | yes | — |
| `room-token` | Token of the Talk room to post to (the part after `/call/` in the room link) | yes | — |
| `message` | Message text to send | yes | — |
| `silent` | Send without triggering notifications for room participants | no | `false` |
| `reply-to` | Id of an existing message to reply to | no | — |
| `reference-id` | Reference id to attach to the message for later correlation | no | — |

### Outputs

| Output | Description |
| ------ | ----------- |
| `message-id` | Id of the sent message |

## Secrets

- **`app-password` is an inherent secret.** It grants access to the account, so always pass it via `secrets`.
- **`room-token` is an identifier, not a credential** — it appears in the conversation link Nextcloud itself publishes. Whether you store it in `secrets` or `vars` is your call:
  - For **public rooms**, `vars` is fine because anyone with the token can join anyway.
  - For **private rooms**, treat the token as confidential: knowing it does not grant access on its own, but it identifies the room, so `secrets` is the safer choice.

The action masks the room token in workflow logs defensively and never includes the token, app password, or request URL in any error message.

## Error reporting

Both the HTTP status and the OCS status code are checked and mapped to plain-language errors:

| Status | Failure cause |
| ------ | ------------- |
| 401 | The user or app password is wrong |
| 403 | The user is not allowed to post in that room |
| 404 | The room token does not exist on that server |
| 413 | The message is too long for the server |
| 429 | Nextcloud rate-limited the request |

Any other error fails with the OCS status code and the server-provided message.

Missing required inputs fail before any network request, naming the missing input.

## Self-hosted runners

The action honors the standard `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY` environment variables, so it works unmodified on self-hosted runners behind an HTTP(S) proxy.

## Development

```bash
npm ci        # install dependencies
npm run build # compile TypeScript
npm run lint  # eslint
npm test      # vitest
npm run bundle        # build dist/send-message/index.js with ncc
npm run bundle:check  # rebuild and fail if the committed dist/ is stale
```

`dist/` is committed on purpose: workflows consume the action via the `v1` major tag without building anything at run time. CI fails if `dist/` does not match a fresh build.
