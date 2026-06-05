# Government Workflow Audit

**Generated:** June 3, 2026

## 1. Executive Summary

This document audits the core government-facing workflows for certificate, complaint, and emergency management. The primary goal is to verify that the system's automated routing and assignment logic aligns with the specified real-world departmental responsibilities.

## 2. Certificate Department Routing

**Requirement:** The department for a certificate application must be assigned automatically based on the certificate type. The citizen must not select the department manually.

**Analysis:**

1.  **Route:** The certificate application process starts at `POST /api/v1/certificates/apply`.
2.  **Middleware:** This route uses the `authorizeCertificateDepartments` middleware, located in `server/middlewares/departmentAuthorizationMiddleware.js`.
3.  **Logic:**
    -   The `authorizeCertificateDepartments` middleware retrieves the `certificateType` from the request body (`req.body.certificateType`).
    -   It then consults the `CERTIFICATE_TYPE_DEPARTMENTS` mapping in `server/config/constants.js`.
    -   It checks if the `department` provided in the request body is a valid department for the given `certificateType`.
    -   Crucially, it **does not automatically assign** the department. It **validates** a department sent from the frontend.

**Findings:**

-   **Critical Workflow Mismatch:** The current implementation requires the frontend to send a `department` in the payload. The backend then validates if that department is appropriate for the chosen `certificateType`. This contradicts the requirement that the department should be **automatically assigned** by the backend. The citizen should not be choosing the department at all.
-   **Data Model:** The `Certificate` model correctly includes a `department` field.
-   **Mapping:** The `CERTIFICATE_TYPE_DEPARTMENTS` mapping in `constants.js` exists but needs review and potential correction to ensure a single, definitive department is assigned for each certificate type. For example, `Residence Certificate` maps to two departments, which will cause ambiguity in automatic assignment.

**Conclusion:** **FAIL**. The certificate workflow does not meet the core requirement for automatic department assignment. The backend logic needs to be inverted from "validate department" to "assign department".

## 3. Complaint Department Routing

**Requirement:** The responsible department for a complaint should be determined automatically by its `category`.

**Analysis:**

1.  **Route:** Complaints are created via `POST /api/v1/complaints`.
2.  **Controller:** The `createComplaint` function in `server/controllers/complaintController.js` handles the request.
3.  **Data Model:** The `Complaint` model in `server/models/Complaint.js` has a `category` field but **lacks a `department` field**.
4.  **Logic:** There is no logic in the controller, service, or middleware layer that maps a complaint `category` to a government department. The concept of assigning a complaint to a department does not exist in the current implementation. Complaints are created and then sit in a general pool to be manually assigned an officer via `PATCH /api/v1/complaints/:id/assign`.

**Findings:**

-   **Critical Workflow Gap:** The system completely lacks the required functionality for automatic complaint routing to departments based on category.
-   **Schema Defect:** The `Complaint` model is missing a `department` field to store the assigned department.
-   **Missing Logic:** No mapping or business logic exists to connect categories like "Water" to the "Water Department".

**Conclusion:** **FAIL**. The complaint workflow is fundamentally missing the department routing feature. This requires a schema modification and the creation of new business logic.

## 4. Emergency Department Routing

**Requirement:** The responding department for an emergency should be determined automatically by the `emergencyType`.

**Analysis:**

1.  **Route:** Emergencies are reported via `POST /api/v1/emergencies`.
2.  **Controller:** The `createEmergency` function in `server/controllers/emergencyController.js` handles this.
3.  **Logic:**
    -   The controller receives the `emergencyType` from the request body.
    -   It uses a helper function `determineDepartment` (defined within the same controller file) to look up the appropriate department from the `EMERGENCY_TYPE_DEPARTMENTS` mapping in `server/config/constants.js`.
    -   If a mapping is found, it assigns the first department from the resulting array to the `assignedDepartment` field of the new emergency document.
4.  **Data Model:** The `Emergency` model correctly includes an `assignedDepartment` field.
5.  **Mapping:** The `EMERGENCY_TYPE_DEPARTMENTS` object in `constants.js` correctly maps emergency types to an array of departments.

**Findings:**

-   **Workflow Alignment:** The implementation correctly and automatically assigns a department based on the emergency type, which matches the requirement.
-   **Potential Issue:** The mapping sometimes contains multiple departments (e.g., `Road Accident` maps to `["Police Department", "Health Department"]`). The current logic simply picks the *first* one (`Police Department`). This might not be the desired behavior for multi-department responses. The requirement for "Building Collapse" is "Public Works + Disaster Authority", which the current logic does not fully support as it only assigns one department.

**Conclusion:** **PASS (with observations)**. The basic workflow for automatic department assignment is correctly implemented. However, the handling of incidents requiring a multi-department response is a weak point that needs to be addressed. The system currently only assigns a single primary department.
