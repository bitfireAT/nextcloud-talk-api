# send-message Specification

## Purpose

Lets a GitHub workflow post a chat message to a Nextcloud Talk room, with diagnosable failures and no secret leakage in logs.

## Requirements

### Requirement: Send a chat message
The action SHALL post exactly one message to the Talk room identified by `room-token` on the Nextcloud instance at `server-url`, using the chat API with the user + app-password credentials, and SHALL expose the sent message's id as the `message-id` output.

#### Scenario: Message posted successfully
- **WHEN** all required inputs (`server-url`, `user`, `app-password`, `room-token`, `message`) are provided and the server accepts the request
- **THEN** the action succeeds and `message-id` contains the id of the created chat message

#### Scenario: Required input missing
- **WHEN** any required input is empty
- **THEN** the action fails before making a network request, naming the missing input

### Requirement: Message options
The action SHALL forward the optional inputs `silent`, `reply-to`, and `reference-id` to the chat API as the corresponding message fields, and SHALL omit each field when the input is not provided.

#### Scenario: Silent message
- **WHEN** `silent` is set to true
- **THEN** the message is sent without triggering notifications for room participants

#### Scenario: Reply to an existing message
- **WHEN** `reply-to` contains an existing message id in the same room
- **THEN** the message is sent as a reply to that message

#### Scenario: Reference id
- **WHEN** `reference-id` is provided
- **THEN** the message is sent with that reference id so the caller can correlate it later

### Requirement: Server errors are diagnosable
The action SHALL check both the HTTP status and the OCS response status code, and SHALL fail with a plain-language message. It SHALL name the following causes distinctly: invalid credentials (401), no permission in the room (403), unknown room (404), message too long (413), and rate limiting (429). Any other error SHALL fail with the OCS status code and server-provided message.

#### Scenario: Invalid credentials
- **WHEN** the server responds 401
- **THEN** the action fails with a message indicating the user or app password is wrong

#### Scenario: No permission for the room
- **WHEN** the server responds 403
- **THEN** the action fails with a message indicating the user is not allowed to post in that room

#### Scenario: Unknown room
- **WHEN** the server responds 404
- **THEN** the action fails with a message indicating the room token does not exist on that server

#### Scenario: Rate limited
- **WHEN** the server responds 429
- **THEN** the action fails with a message indicating Nextcloud rate-limited the request

#### Scenario: Unexpected server error
- **WHEN** the server responds with any other error
- **THEN** the action fails with the OCS status code and the server's message

### Requirement: No secrets in logs or errors
The action SHALL mask the room token in workflow logs and SHALL NOT include the room token, app password, or request URL in any error or log output. Only the app password SHALL be documented as an inherent secret.

#### Scenario: Room token masked in logs
- **WHEN** the room token is supplied as a non-secret input and would otherwise appear in log output
- **THEN** it is redacted by the action's own masking

#### Scenario: Error output excludes request URL
- **WHEN** a request fails
- **THEN** the reported error contains neither the request URL nor the room token

### Requirement: Runnable on standard and self-hosted runners
The action SHALL work unmodified on GitHub-hosted runners and on self-hosted runners that require an HTTP(S) proxy, honoring standard proxy environment variables.

#### Scenario: Self-hosted runner behind a proxy
- **WHEN** the runner sets `HTTPS_PROXY` and `NO_PROXY` appropriately
- **THEN** the request to the Nextcloud server goes through the proxy
