# Spec Delta

## Purpose

Provides a manually dispatched CI workflow that posts a caller-provided message to a Nextcloud Talk room configured via repository secrets, so the action can be exercised end to end against a real server.

## ADDED Requirements

### Requirement: Manual dispatch posts a message
The notify workflow SHALL be dispatchable manually with the message text as a dispatch input, and SHALL post that message to a Talk room whose server, user, app password, and room token are configured as repository secrets.

#### Scenario: Dispatch with a message
- **WHEN** the notify workflow is dispatched with message text "Hello from CI"
- **THEN** that exact message is posted to the Talk room configured via repository secrets

#### Scenario: Dispatch without a message
- **WHEN** the notify workflow is dispatched without a message input
- **THEN** the dispatch is rejected before any message is sent

#### Scenario: Missing secrets
- **WHEN** the notify workflow runs while any required repository secret is unset
- **THEN** the workflow fails without leaking secret values into the logs
