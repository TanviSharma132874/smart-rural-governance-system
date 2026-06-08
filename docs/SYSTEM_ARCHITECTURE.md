# System Architecture

**Last Updated:** June 8, 2026

## Overview

The system is a MERN application with a React/Vite client and an Express/Mongoose API server. Stage 2A focused on the authentication and RBAC boundary.

## Authentication Boundary

- `POST /api/v1/auth/register` is public and creates only `citizen` accounts.
- `POST /api/v1/auth/login` is public and returns JWT-based authentication.
- `GET /api/v1/auth/profile` requires a valid JWT.
- `POST /api/v1/auth/users` requires a valid JWT and `stateAdmin` or `superAdmin` role.

## Privileged Provisioning Strategy

Privileged roles are no longer self-service. They must be created through the authenticated provisioning endpoint:

`POST /api/v1/auth/users`

Allowed provisioning rules:

| Creator | Can Create |
| --- | --- |
| `superAdmin` | `panchayatOfficer`, `departmentOfficer`, `districtAdmin`, `stateAdmin`, `superAdmin` |
| `stateAdmin` | `panchayatOfficer`, `departmentOfficer`, `districtAdmin` within the same state |
| Other roles | No privileged provisioning access |

The first `superAdmin` must be created through a secure deployment seed or a controlled database bootstrap.

## Role Usage

| Role | Current Usage |
| --- | --- |
| `citizen` | Public registration, complaint/certificate/SOS creation, own tracking |
| `volunteer` | Volunteer-facing routes and announcement audience support; not publicly created in Stage 2A |
| `panchayatOfficer` | Complaints, certificates, emergencies, resources, announcements, volunteer roster |
| `departmentOfficer` | Complaints, certificates, emergencies, resources, announcements, volunteer roster |
| `districtAdmin` | Administrative oversight and destructive/archive actions |
| `stateAdmin` | State oversight and privileged provisioning |
| `superAdmin` | Platform-wide access and root provisioning |

## RBAC Route Summary

- Auth routes: public register/login, authenticated profile, admin-only provisioning.
- Complaint routes: citizen create/read-own, officer/admin queue and workflow actions, admin archive.
- Certificate routes: public verification, citizen application/tracking, officer/admin queue and review.
- Emergency routes: citizen SOS/tracking, officer/admin dashboard and response actions, admin analytics/archive.
- Resource routes: officer/admin inventory access, admin archive.
- Volunteer routes: citizen/volunteer self-registration/profile, officer/admin roster, admin approval.
- Announcement routes: authenticated read, officer/admin create/publish, admin archive.

## Deferred Architecture Risks

- Department taxonomies remain split between governance departments and emergency departments.
- Workflow status models still require separate Stage 2B stabilization.
- Dashboard analytics still depend on existing module queries and cache behavior.
