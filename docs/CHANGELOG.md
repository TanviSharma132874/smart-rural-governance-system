# Changelog

## [1.1.0] - 2026-06-12
### Added
- **Resource Return Workflow**: Non-consumable assets (Ambulances, Generators, etc.) can now be returned to inventory.
- **Complaint Closure**: Citizens can now officially close resolved complaints.
- **Certificate Correction**: Citizen-driven resubmission workflow for applications requiring correction.
- **Profile Management**: Full frontend and backend implementation for identity management.

### Changed
- **Aadhaar Validation**: Hardened to strictly 12 numeric digits.
- **Socket.IO Security**: Rooms are now strictly tied to authenticated JWT user context.
- **Volunteer Lifecycle**: Automatic transition to 'Available' upon SOS closure.

### Fixed
- Fixed role-based access for Panchayat Officers in Complaint workflow.
- Optimized Secure File Gateway with database indexing for document lookups.
