# Jurisdiction Security Audit

**Generated:** June 3, 2026

## 1. Executive Summary

This document audits the mechanisms designed to enforce jurisdictional data isolation. The primary goal is to ensure that a user (e.g., a government officer) from one geographical area cannot access or modify records from another. The audit focuses on how jurisdiction is enforced across all modules.

## 2. Core Implementation

Jurisdictional control is primarily attempted through two mechanisms:

1.  **`jurisdictionMiddleware.js`**: Contains a middleware function, `enforceJurisdictionPayload`, which is intended to validate incoming data payloads.
2.  **Service-level Query Filtering**: The expectation is that when fetching lists of records (e.g., complaints, emergencies), the services will automatically filter results based on the logged-in user's jurisdiction.

## 3. Analysis of `enforceJurisdictionPayload` Middleware

**Location:** `server/middlewares/jurisdictionMiddleware.js`

**Logic:**
- The middleware checks if the user's role is `departmentOfficer` or `panchayatOfficer`.
- If so, it compares the `state`, `district`, `tehsil`, etc., from the request body (`req.body`) with the corresponding jurisdiction fields on the `req.user` object.
- If there is a mismatch, it throws a 403 Forbidden error.

**Route Usage:**
This middleware is used on the **creation** routes for:
- `POST /api/v1/announcements`
- `POST /api/v1/certificates/apply`
- `POST /api/v1/emergencies`
- `POST /api/v1/resources`

### Findings:

-   **Critical Flaw: Read Operations (GET requests) are Not Protected.** The middleware only inspects `req.body`, which is empty for `GET` requests. This means an officer from one district can potentially use query parameters to fetch data from another district (e.g., `GET /api/v1/complaints?district=Ajmer`). There is no enforcement on read operations at the middleware level.
-   **Incomplete Role Coverage:** The check only applies to `departmentOfficer` and `panchayatOfficer`. It implicitly trusts `districtAdmin` and higher to not create data outside their jurisdiction, which might be an acceptable risk, but it's not explicitly handled.
-   **Payload-Only:** The security model is entirely dependent on validating incoming data during creation. It does not prevent unauthorized access to existing data via URL parameters (`req.params`) or query strings (`req.query`).

## 4. Analysis of Service-Level Query Filtering

This is the most critical part of jurisdiction security, as it should prevent data leakage in all `GET` requests.

**Analysis of `complaintService.js` (`getComplaints`):**
- The service builds a MongoDB query object.
- It checks `req.user.role` and adds jurisdiction filters:
    - For `panchayatOfficer`, it filters by `district`, `tehsil`, and `village`.
    - For `districtAdmin`, it filters by `district`.
    - For `citizen`, it filters by `citizenId`.
- **Conclusion:** **PASS**. The `complaintService` appears to correctly filter read operations based on the user's jurisdiction.

**Analysis of `certificateService.js` (`getDepartmentQueue`):**
- The service builds a query.
- It correctly adds filters for `department` and `status`.
- It then applies jurisdiction filters based on the user's role, similar to the complaint service.
- **Conclusion:** **PASS**. The `certificateService` correctly filters read operations.

**Analysis of `emergencyService.js` (`getEmergencyDashboard`):**
- The service builds a query.
- It correctly applies jurisdiction filters based on the user's role (`district`, `tehsil`, etc.).
- **Conclusion:** **PASS**. The `emergencyService` correctly filters read operations.

**Analysis of `announcementService.js` (`getAnnouncements`):**
- The service builds a query.
- It correctly applies jurisdiction filters based on the user's role.
- **Conclusion:** **PASS**. The `announcementService` correctly filters read operations.

**Analysis of `resourceService.js` (`getResources`):**
- The service builds a query.
- It correctly applies jurisdiction filters based on the user's role.
- **Conclusion:** **PASS**. The `resourceService` correctly filters read operations.

**Analysis of `volunteerService.js` (`getVolunteers`):**
- The service builds a query.
- It correctly applies jurisdiction filters based on the user's role.
- **Conclusion:** **PASS**. The `volunteerService` correctly filters read operations.

## 5. Overall Security Posture

-   **Read Operations (GET):** The system's security against unauthorized reads relies **entirely** on the correct implementation of query filtering within each service file. This approach is functional but fragile. If a developer forgets to add the jurisdiction filter to a new `GET` endpoint in any service, it will create a data leak. The current implementation across existing services appears to be correct.
-   **Write Operations (POST, PATCH, DELETE):**
    -   **Creation (POST):** The `enforceJurisdictionPayload` middleware provides a layer of protection but is inconsistently applied and only covers a subset of roles.
    -   **Updates/Deletes (PATCH, DELETE):** Security for these operations is the most significant weakness. There is no middleware to prevent an officer from updating or deleting a record from another jurisdiction if they know its ID. For example, a `panchayatOfficer` from Jaipur could potentially call `PATCH /api/v1/complaints/some-ajmer-complaint-id/status`. The `complaintController`'s `updateComplaintStatus` function fetches the complaint by ID but does **not** re-verify that the fetched complaint falls within the officer's jurisdiction before updating it. This is a **critical vulnerability**.

## 6. Recommendations

1.  **Create a Universal Jurisdiction Middleware:** A new, more robust middleware should be created and applied to **all** routes that handle resource access (GET, PATCH, DELETE).
2.  **Update/Delete Verification:** This new middleware or a dedicated service-layer function must ensure that any resource being accessed via `req.params.id` belongs to the user's jurisdiction before any action is taken. This involves:
    a. Fetching the resource from the database using the ID.
    b. Comparing the resource's jurisdiction with the user's jurisdiction.
    c. Throwing a 403/404 error if they do not match.
3.  **Strengthen `enforceJurisdictionPayload`:** This middleware should be updated to cover all relevant roles and be applied more consistently.
4.  **Defense in Depth:** While service-level filtering is working for reads, the addition of a route-level middleware provides a second layer of defense, making the system more robust and less prone to developer error.
