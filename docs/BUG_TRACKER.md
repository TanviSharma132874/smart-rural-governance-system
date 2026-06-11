# Bug Tracker

**Last Updated:** June 8, 2026

| ID | Severity | Area | Issue | Status | Resolution / Next Step |
| --- | --- | --- | --- | --- | --- |
| P0-AUTH-001 | P0 | Authentication | Public registration allowed arbitrary role selection, including officer/admin roles. | Fixed | Public registration validator rejects non-`citizen` role and service forces `role: "citizen"`. |
| P0-AUTH-002 | P0 | Provisioning | No controlled path existed for officer/admin account creation once public escalation is blocked. | Fixed | Added authenticated `POST /api/v1/auth/users` for `stateAdmin` and `superAdmin` with service-level hierarchy checks. |
| P0-RBAC-001 | P0 | RBAC | Route surface needed review for missing auth/role protection. | Reviewed | No non-public route without auth/role protection found in Stage 2A review. |
| OPS-AUTH-001 | Operational | Authentication | First `superAdmin` bootstrap is not handled by public APIs. | Open | Seed securely during deployment or create via direct controlled database bootstrap. |
| P1-RBAC-002 | P1 | Volunteers | `districtAdmin` could approve or modify volunteer profiles outside their assigned district. | Fixed | Added `ensureJurisdictionAccess` check in `volunteerService` mutations. |
| P2-LOGIC-003 | P2 | Departments | Incompatible department taxonomies between Governance and Emergency modules blocked officer workflows. | Fixed | Unified taxonomy implemented and data migrated. |

## RBAC Review Notes

- Public endpoints are limited to health checks, `POST /auth/register`, `POST /auth/login`, and `GET /certificates/verify/:id`.
- Authenticated citizen-only create routes remain protected for complaints, certificate applications, and SOS creation.
- Officer/admin mutation routes use `authorize(...)` middleware.
- Citizen archive/delete permissions on own certificate/emergency/volunteer records are not changed in Stage 2A because they are workflow policy issues, not public role escalation.
