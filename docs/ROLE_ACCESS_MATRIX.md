# Role-Based Access Control (RBAC) Matrix

**Generated:** June 3, 2026

This document outlines the permissions for each user role across the system's modules. The analysis is based on the middleware (`authorize(...)`) applied to each API route in the `server/routes/` directory.

**Legend:**

*   **C** - Create
*   **R** - Read
*   **U** - Update
*   **D** - Delete
*   **X** - Custom Action (e.g., assign, publish, approve)
*   **-** - No Access

| Module / Feature | Route | Citizen | Volunteer | Panchayat Officer | Department Officer | District Admin |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Authentication** | `/auth/register` | **C** | **C** | **C** | **C** | **C** |
| | `/auth/login` | **X** | **X** | **X** | **X** | **X** |
| | `/auth/profile` | **R** | **R** | **R** | **R** | **R** |
| **Announcements** | `POST /announcements` | - | - | **C** | **C** | **C** |
| | `GET /announcements` | **R** | **R** | **R** | **R** | **R** |
| | `GET /announcements/:id` | **R** | **R** | **R** | **R** | **R** |
| | `PATCH /:id/publish` | - | - | **X** | **X** | **X** |
| | `DELETE /:id` | - | - | - | - | **D** |
| **Certificates** | `POST /certificates/apply` | **C** | - | - | - | - |
| | `GET /my-applications` | **R** | - | - | - | - |
| | `GET /department-queue` | - | - | **R** | **R** | **R** |
| | `GET /download/:id` | **R** | - | **R** | **R** | **R** |
| | `GET /verify/:id` | **R** | **R** | **R** | **R** | **R** |
| | `GET /:id` | **R** | - | **R** | **R** | **R** |
| | `PATCH /:id/review` | - | - | **X** | **X** | **X** |
| | `PATCH /:id/status` | - | - | **X** | **X** | **X** |
| | `DELETE /:id` | **D** | - | - | - | **D** |
| **Complaints** | `POST /complaints` | **C** | - | - | - | - |
| | `GET /complaints` | **R** | - | **R** | - | **R** |
| | `GET /:id` | **R** | - | **R** | - | **R** |
| | `PATCH /:id/status` | - | - | **X** | - | **X** |
| | `PATCH /:id/assign` | - | - | **X** | - | **X** |
| | `DELETE /:id` | - | - | - | - | **D** |
| **Emergencies** | `POST /emergencies` | **C** | - | - | - | - |
| | `GET /my` | **R** | - | - | - | - |
| | `GET /dashboard` | - | - | **R** | **R** | **R** |
| | `GET /analytics` | - | - | - | - | **R** |
| | `GET /:id` | **R** | - | **R** | **R** | **R** |
| | `PATCH /:id/acknowledge` | - | - | **X** | **X** | **X** |
| | `PATCH /:id/status` | - | - | **X** | **X** | **X** |
| | `PATCH /:id/resources` | - | - | - | **X** | **X** |
| | `PATCH /:id/volunteers` | - | - | - | **X** | **X** |
| | `DELETE /:id` | **D** | - | - | - | **D** |
| **Resources** | `POST /resources` | - | - | **C** | **C** | **C** |
| | `GET /resources` | - | - | **R** | **R** | **R** |
| | `PATCH /:id` | - | - | **U** | **U** | **U** |
| | `DELETE /:id` | - | - | - | - | **D** |
| **Volunteers** | `POST /register` | **C** | **C** | - | - | - |
| | `GET /me` | **R** | **R** | - | - | - |
| | `GET /` | - | - | **R** | **R** | **R** |
| | `PATCH /:id/approve` | - | - | - | - | **X** |
| | `PATCH /:id/availability` | **X** | **X** | - | - | **X** |
| | `DELETE /:id` | **D** | **D** | - | - | **D** |

---

### Observations:

1.  **Citizen Permissions:**
    *   Can create complaints, certificates, and emergencies.
    *   Can register as a volunteer.
    *   Can view their own applications and emergencies.
    *   Can delete their own certificate applications, emergencies, and volunteer registrations. This might be an unintended level of permission and should be reviewed. A "cancel" or "withdraw" status is often preferred over a hard delete.

2.  **Panchayat Officer Permissions:**
    *   Has significant control over complaints (read, update status, assign).
    *   Can manage announcements and resources.
    *   Can view certificate and emergency queues but has limited update capabilities on emergencies compared to a Department Officer.
    *   Lacks access to the main volunteer list.

3.  **Department Officer Permissions:**
    *   The primary role for managing emergencies, including status updates and resource/volunteer assignment.
    *   Manages certificate queues (review, status updates).
    *   Can create announcements and manage resources.
    *   Has no access to the complaints module, which is a potential gap if a complaint needs to be escalated to a specific department.

4.  **District Admin Permissions:**
    *   High-level role with broad read access across most modules.
    *   Has delete permissions on almost everything, acting as a system moderator.
    *   The only role (besides superAdmin) that can approve volunteer registrations.
    *   Can view emergency analytics.

5.  **Volunteer Role:**
    *   The `volunteer` role is often used interchangeably with `citizen`, especially for registration and profile viewing.
    *   The key distinction is their ability to be assigned to emergencies, which is a data relationship, not an access control distinction on most routes.

6.  **Gaps & Inconsistencies:**
    *   **Complaints:** There is no route for a `Department Officer` to see or manage complaints. If a `Panchayat Officer` assigns a complaint, it seems to be assigned to another *officer* directly, not to a *department*, which contradicts the workflow audit findings.
    *   **Deletes:** The ability for citizens to hard-delete their own records is risky. It can lead to loss of audit trails and data integrity issues. For example, if a citizen deletes an emergency report that is already being acted upon.
    *   **StateAdmin / SuperAdmin:** These roles are present in the route definitions but are not detailed here as they generally have universal access. Their permissions are effectively the same as or greater than `District Admin`.
