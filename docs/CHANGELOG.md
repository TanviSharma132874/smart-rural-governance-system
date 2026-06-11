# Changelog

## June 8, 2026 - Stage 2A P0 Security Stabilization

### Security

- Restricted public registration to citizen accounts only.
- Removed public frontend role selection from registration.
- Added backend defense-in-depth so public registration always persists `role: "citizen"` and clears `department`.
- Added authenticated admin-only privileged user provisioning endpoint.
- Added hierarchy checks:
  - `superAdmin` can provision privileged roles, including `stateAdmin` and `superAdmin`.
  - `stateAdmin` can provision `districtAdmin`, `panchayatOfficer`, and `departmentOfficer` inside their state.

## June 11, 2026 - Security Hardening

### Security

- Implemented Volunteer Jurisdiction Validation:
  - `districtAdmin` is now strictly restricted to managing volunteers within their own district.
  - Statewide and global access preserved for `stateAdmin` and `superAdmin`.
  - Service-level enforcement added to approval, availability updates, and archival actions.

## June 11, 2026 - Workflow Synchronization

### Core Architecture

- Normalized Department Taxonomy:
  - Unified `GOVERNMENT_DEPARTMENTS` and `EMERGENCY_DEPARTMENTS` into a single standardized list.
  - Updated all Mongoose models (`User`, `Complaint`, `Certificate`, `Emergency`, `Resource`, `Announcement`) to enforce unified enums.
  - Created and executed a database migration script to map legacy department strings to the new taxonomy.
  - Updated frontend constants and Zod validation schemas for cross-module consistency.

### Documentation

- Updated Bug Tracker and Project Status to reflect department normalization.
- Updated readiness estimate to 78%.

### Documentation

- Added project status, bug tracker, changelog, and architecture documentation for Stage 2A.
- Documented current role hierarchy and remaining bootstrap requirement.

### Deferred

- Department normalization was intentionally not changed.
- Complaint, certificate, SOS, volunteer, and resource workflow behavior was intentionally not changed.
