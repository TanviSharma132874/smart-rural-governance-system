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

### Documentation

- Added project status, bug tracker, changelog, and architecture documentation for Stage 2A.
- Documented current role hierarchy and remaining bootstrap requirement.

### Deferred

- Department normalization was intentionally not changed.
- Complaint, certificate, SOS, volunteer, and resource workflow behavior was intentionally not changed.
