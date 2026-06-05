# Project Stabilization: Fix Plan

**Generated:** June 3, 2026

This document outlines the plan to address critical issues identified during the audit phase. Each section details the problem, root cause, affected files, a proposed fix strategy, and the associated risk level. No code modifications will be made until this plan is reviewed.

---

## 1. ISSUE: Certificate Department Routing

-   **Problem:** Citizens are required to manually select a department when applying for a certificate. The backend only validates this selection.
-   **Root Cause:** The business logic is inverted. The `authorizeCertificateDepartments` middleware validates a department sent from the client, instead of the backend programmatically assigning the department based on the selected `certificateType`.
-   **Files Affected:**
    -   `server/config/constants.js`
    -   `server/middlewares/departmentAuthorizationMiddleware.js`
    -   `server/routes/certificateRoutes.js`
    -   `server/services/certificateService.js`
    -   `client/src/pages/CertificatesPage.jsx` (or similar component for the application form)
-   **Fix Strategy:**
    1.  **Backend:**
        -   Update `CERTIFICATE_TYPE_DEPARTMENTS` in `constants.js` to ensure a single, definitive department for each certificate type. Add missing certificate types.
        -   Remove the `authorizeCertificateDepartments` middleware from the `POST /certificates/apply` route.
        -   In the `applyCertificate` service logic, add a step to determine the `department` using the `certificateType` from the request and the mapping from `constants.js`.
        -   Inject the determined department into the new certificate document before saving.
    2.  **Frontend:**
        -   Remove the department selection dropdown/input from the certificate application form. The form should only submit the `certificateType`.
-   **Risk Level:** **Medium**. This changes a core workflow. The backend change is straightforward, but it requires a corresponding frontend change to prevent breaking the user experience.

---

## 2. ISSUE: Complaint Department Routing

-   **Problem:** Complaints are not automatically routed to a department based on their category. The concept of a complaint belonging to a department is missing.
-   **Root Cause:** The `Complaint` Mongoose schema lacks a `department` field, and no business logic exists to map complaint categories to departments.
-   **Files Affected:**
    -   `server/models/Complaint.js`
    -   `server/config/constants.js`
    -   `server/services/complaintService.js`
    -   `server/controllers/complaintController.js`
-   **Fix Strategy:**
    1.  **Schema Change:** Add a `department` field (String, indexed) to the `complaintSchema` in `Complaint.js`.
    2.  **Mapping:** Create a new mapping object (e.g., `COMPLAINT_CATEGORY_DEPARTMENTS`) in `constants.js`.
    3.  **Business Logic:** In the `createComplaint` service, use the incoming `category` to look up the correct department from the new mapping and save it to the new `department` field.
    4.  **Data Integrity:** Existing complaint records will have a null `department` field. The application logic (especially for fetching queues) must be updated to handle this gracefully, or a one-time data migration script could be considered (though ruled out by the prompt for now). We will proceed by ensuring queries can handle null departments.
-   **Risk Level:** **High**. This involves a schema change. While `mongoose` is flexible, all queries that filter or sort by department will need to be reviewed to ensure they don't fail on older records.

---

## 3. ISSUE: Emergency Multi-Department Routing

-   **Problem:** When an emergency type maps to multiple departments (e.g., "Building Collapse"), the system only assigns the first department in the list.
-   **Root Cause:** The `determineDepartment` helper function in `emergencyController.js` simply returns `EMERGENCY_TYPE_DEPARTMENTS[emergencyType][0]`.
-   **Files Affected:**
    -   `server/models/Emergency.js`
    -   `server/controllers/emergencyController.js`
    -   `server/services/emergencyService.js`
-   **Fix Strategy:**
    1.  **Schema Change:** Add a `secondaryDepartments` field to the `emergencySchema` as an array of strings (`[String]`). The existing `assignedDepartment` field will be preserved and will hold the primary responding department.
    2.  **Business Logic:** Modify the logic in `createEmergency`. The first department in the mapping array will be assigned to `assignedDepartment`. The rest of the departments in the array will be saved into the `secondaryDepartments` field.
    3.  **Notifications (Future):** This schema change enables a future enhancement where the notification system (`Socket.IO`) can alert all departments listed in both `assignedDepartment` and `secondaryDepartments`.
-   **Risk Level:** **Medium**. This is a schema change, but it's additive. Existing records will work as before. New records will have richer data.

---

## 4. ISSUE: Jurisdiction Security Vulnerability

-   **Problem:** `PATCH` and `DELETE` endpoints do not verify if the resource being modified belongs to the officer's jurisdiction, allowing for potential cross-jurisdiction data manipulation.
-   **Root Cause:** Security checks are only performed on `GET` (at the service level) and `POST` (via middleware). There is no middleware or service-level check for `PATCH` and `DELETE` operations that re-validates jurisdiction after fetching the resource by its ID.
-   **Files Affected:**
    -   All service files (`complaintService.js`, `certificateService.js`, etc.) for update/delete functions.
    -   A new middleware file: `server/middlewares/resourceAccessMiddleware.js` (proposed).
-   **Fix Strategy:**
    1.  **Create Reusable Middleware:** Develop a new middleware function, `verifyResourceJurisdiction`.
    2.  **Middleware Logic:** This middleware will be a factory function that takes the Mongoose model name (e.g., 'Complaint') as an argument. It will:
        -   Extract the resource ID from `req.params.id`.
        -   Fetch the resource from the database.
        -   If not found, return a 404.
        -   Compare the resource's jurisdiction fields (`district`, `tehsil`, etc.) with the `req.user`'s jurisdiction.
        -   If there is a mismatch, return a 403 Forbidden error.
        -   If they match, attach the fetched resource to the `req` object to prevent re-fetching in the controller and call `next()`.
    3.  **Apply Middleware:** Apply this new middleware to all `PATCH` and `DELETE` routes in the respective route files.
-   **Risk Level:** **Low**. This is a purely additive security enhancement. It has a low risk of breaking existing functionality and a high reward for improving security.

---

## 5. ISSUE: Dashboard Loading Bug

-   **Problem:** Dashboards are getting stuck in an "infinite loading" state.
-   **Root Cause:** Multiple potential causes:
    1.  Slow database queries (especially aggregations) without proper indexes.
    2.  The frontend Redux logic does not correctly handle API error states (e.g., 403, 500), failing to turn off the `isLoading` flag in the `catch` block of an async thunk.
-   **Files Affected:**
    -   `server/models/Emergency.js` (and other models needing indexes).
    -   `server/services/emergencyService.js` (specifically `getEmergencyAnalytics`).
    -   `client/src/redux/` (all relevant slices for dashboard data).
    -   `client/src/pages/DashboardPage.jsx`.
-   **Fix Strategy:**
    1.  **Backend (Performance):** Add a compound index to the `Emergency` model to support the `getEmergencyAnalytics` aggregation query. The proposed index is `{ district: 1, emergencyType: 1, status: 1 }`.
    2.  **Frontend (Error Handling):** Audit all Redux async thunks responsible for fetching dashboard data. Ensure that every `createAsyncThunk` has a `.addCase(action.rejected, ...)` in its `extraReducers` that sets `isLoading: false` and stores the error message.
-   **Risk Level:** **Low**. Adding database indexes is a safe and standard performance optimization. Fixing frontend error handling is a standard bug fix that will improve stability.

---

## 6. ISSUE: RBAC Verification

-   **Problem:** Need to verify that the implemented Role-Based Access Control aligns with the specified business rules.
-   **Root Cause:** The `ROLE_ACCESS_MATRIX.md` was generated from a static analysis of the code. A conceptual review is needed to confirm it matches the project's intent.
-   **Files Affected:**
    -   `docs/ROLE_ACCESS_MATRIX.md`
    -   `docs/RBAC_VALIDATION.md` (to be created)
-   **Fix Strategy:**
    1.  Review the generated `ROLE_ACCESS_MATRIX.md`.
    2.  Identify discrepancies, such as the observation that citizens can hard-delete their own records.
    3.  Create a new document, `docs/RBAC_VALIDATION.md`, that lists these discrepancies and proposes changes. For example, changing `delete` operations to a `PATCH` that sets an `isCancelled` flag or a "Withdrawn" status.
    4.  Implement the changes by modifying the `roleMiddleware` or the controller logic as needed. For the delete issue, this would involve changing the `DELETE` endpoint logic for citizens.
-   **Risk Level:** **Medium**. Changing permissions can have wide-ranging impacts. Each change must be carefully considered and tested.

---

## 7. ISSUE: Performance Improvements

-   **Problem:** Key queries may be inefficient due to a lack of database indexes.
-   **Root Cause:** Models were created without comprehensive indexes to support all common query patterns (filtering, sorting).
-   **Files Affected:**
    -   `server/models/Complaint.js`
    -   `server/models/Certificate.js`
    -   `server/models/Emergency.js`
    -   `docs/PERFORMANCE_IMPROVEMENTS.md` (to be created)
-   **Fix Strategy:**
    1.  Analyze the `find()` queries in each service file.
    2.  Identify the most common fields used for filtering (`status`, `district`, `department`, `type`, etc.) and sorting (`createdAt`).
    3.  Add safe, compound indexes to the Mongoose schemas to cover these queries.
    4.  Document these changes in `docs/PERFORMANCE_IMPROVEMENTS.md`.
-   **Risk Level:** **Low**. Adding indexes is a non-destructive operation that improves performance. The only risk is a marginal increase in write times and storage, which is negligible compared to the read performance gains.
