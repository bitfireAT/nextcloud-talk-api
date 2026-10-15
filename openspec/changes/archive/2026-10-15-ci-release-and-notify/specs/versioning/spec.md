# Spec Delta

## MODIFIED Requirements

### Requirement: Releases are cut by the release workflow
A release SHALL be performed automatically by the release CI workflow on every push to the `main` branch. The workflow SHALL verify the committed bundle is current, then move the `v1` tag to the pushed commit.

#### Scenario: Push to main triggers the release
- **WHEN** a commit is pushed to `main`
- **THEN** the release workflow runs automatically for that commit without manual interaction

#### Scenario: Stale bundle blocks the release
- **WHEN** the release workflow runs on a commit whose committed `dist/` does not match a fresh build
- **THEN** the release fails and the `v1` tag is not moved

#### Scenario: Current bundle is released
- **WHEN** the release workflow runs on a commit whose committed `dist/` matches a fresh build
- **THEN** the workflow moves the `v1` tag to that commit
