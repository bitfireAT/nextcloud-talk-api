# Spec Delta

## REMOVED Requirements

### Requirement: Usable via major version tag
**Reason**: Versioning is a repo-wide concern, not specific to the send-message action; the new `versioning` capability now owns it with the full major-version tag scheme.
**Migration**: The identical behavior is specified in the `versioning` capability ("Consumed via major version tag"); consumers referencing `bitfireAT/nextcloud-talk-api@v1` are unaffected.
