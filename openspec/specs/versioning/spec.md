# versioning Specification

## Purpose

Defines how the actions in this repository are versioned and released, so consumers can pin a stable reference that tracks all fixes within a major version.

## Requirements

### Requirement: Consumed via major version tag
Every action in this repo SHALL be consumable as `<owner>/<repo>@v1` with no build step on the workflow side, via a bundled artifact committed to the repository and released on the `v1` tag.

#### Scenario: Workflow uses the v1 tag
- **WHEN** a workflow references the action as `bitfireAT/nextcloud-talk-api@v1`
- **THEN** the action runs from the bundled artifact without compiling anything at run time

### Requirement: Major tag tracks the latest release
The `v1` tag SHALL point to the commit of the latest release within major version 1; each release SHALL move the tag to the released commit. The repo SHALL NOT carry specific per-release version tags (such as `v1.2.3`).

#### Scenario: Release moves the tag
- **WHEN** a release is cut for a commit
- **THEN** the `v1` tag points to that commit afterwards

#### Scenario: No specific version tags
- **WHEN** the repository's tags are listed
- **THEN** only major-version tags exist (currently `v1`)

### Requirement: Releases are cut by the release workflow
A release SHALL be performed by a manually triggered CI workflow which verifies the committed bundle is current, then moves the `v1` tag to the released commit.

#### Scenario: Stale bundle blocks the release
- **WHEN** the release workflow runs on a commit whose committed `dist/` does not match a fresh build
- **THEN** the release fails and the `v1` tag is not moved

#### Scenario: Current bundle is released
- **WHEN** the release workflow runs on a commit whose committed `dist/` matches a fresh build
- **THEN** the workflow moves the `v1` tag to that commit

### Requirement: Breaking changes open a new major version
A release containing a breaking change SHALL be published under the next major tag, and the previous major tag SHALL keep pointing to the latest compatible release.

#### Scenario: Breaking change released
- **WHEN** a release changes the action's interface or behavior in a backward-incompatible way
- **THEN** it is released under a new major tag (`v2`) while `v1` still points to the last compatible release
