# Codebase Audit: Smart Rural Governance & Emergency Management System

**Generated:** June 3, 2026

## 1. Executive Summary

This document provides a comprehensive audit of the existing codebase for the Smart Rural Governance & Emergency Management System. The system is a standard MERN stack application with a clear separation between the frontend (React) and backend (Node.js/Express). The backend follows a typical Model-View-Controller (MVC) pattern, adapted for an API-centric architecture (Model-Service-Controller-Router).

The codebase is approximately 80% complete, with established modules for core governance and emergency management functions. The immediate goal is to audit, stabilize, and fix existing functionality rather than to build new features.

## 2. Technology Stack

### 2.1. Backend

-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Database:** MongoDB with Mongoose ODM
-   **Authentication:** JSON Web Tokens (JWT)
-   **File Uploads:** Multer
-   **Real-time Communication:** Socket.IO
-   **Middleware:** `cors`, `helmet`, `morgan`, `express-rate-limit`, `express-validator`
-   **PDF Generation:** `pdfkit`
-   **QR Code Generation:** `qrcode`

### 2.2. Frontend

-   **Framework:** React
-   **State Management:** Redux Toolkit
-   **Routing:** React Router
-   **API Communication:** Axios
-   **Styling:** Tailwind CSS
-   **Forms:** React Hook Form with Zod for validation
-   **Mapping:** Leaflet
-   **Charts:** Recharts
-   **Build Tool:** Vite

## 3. Project Structure

The project is a monorepo with two primary directories: `client/` and `server/`.

-   `client/`: Contains the React frontend application.
-   `server/`: Contains the Node.js/Express backend API.
-   `docs/`: Intended for documentation (currently being generated).

## 4. Backend Architecture

The backend follows a layered architecture:

1.  **`routes/`**: Defines the API endpoints and connects them to controller functions. It also integrates middleware for authentication, authorization, validation, and file uploads.
2.  **`controllers/`**: Handles incoming HTTP requests, processes input, and calls the appropriate service layer functions. It is responsible for sending the final response to the client.
3.  **`services/`**: Contains the core business logic. It interacts with the database models and performs the main operations for each module.
4.  **`models/`**: Defines the Mongoose schemas for all MongoDB collections. This layer is the single source of truth for the data structure.
5.  **`middlewares/`**: Contains reusable middleware functions for handling authentication (`authMiddleware`), role-based access control (`roleMiddleware`), input validation (`validationMiddleware`), file uploads (`multer`), and error handling (`errorMiddleware`).
6.  **`validators/`**: Defines validation rules for incoming request bodies and parameters using `express-validator`.
7.  **`config/`**: Stores configuration files, such as database connection strings (`db.js`) and application-wide constants (`constants.js`).
8.  **`utils/`**: Holds utility functions and classes, such as `AppError` for custom error handling and `asyncHandler` for wrapping asynchronous route handlers.

## 5. Existing Modules

The application is divided into the following core modules:

1.  **Authentication (`auth`)**: User registration and login.
2.  **Announcements (`announcement`)**: Creating and distributing public announcements.
3.  **Certificates (`certificate`)**: Applying for and managing government certificates.
4.  **Complaints (`complaint`)**: Lodging and tracking public complaints.
5.  **Emergencies (`emergency`)**: Reporting and managing emergency incidents.
6.  **Resources (`resource`)**: Managing emergency response resources.
7.  **Volunteers (`volunteer`)**: Registering and managing volunteers.

## 6. MongoDB Collections (Models)

The following Mongoose models are defined in `server/models/`:

-   **`User`**: Stores user information, including credentials, role, and jurisdiction. This is the central model for all actors in the system.
-   **`Announcement`**: Stores public announcements, including their title, message, audience, and jurisdiction.
-   **`Certificate`**: Represents a certificate application, tracking its type, status, applicant, and associated documents.
-   **`Complaint`**: Represents a citizen's complaint, including its category, description, status, and location.
-   **`Emergency`**: Represents an emergency incident, detailing its type, severity, location, and the response effort.
-   **`Resource`**: Tracks available emergency resources (e.g., ambulances, medical kits), their quantity, and location.
-   **`Volunteer`**: Stores information about registered volunteers, including their skills and availability.
-   **`Counter`**: A utility model likely used for generating sequential, unique identifiers for other records (e.g., application numbers).

## 7. Role Hierarchy & Permissions

Roles are defined in `server/config/constants.js` and enforced by `server/middlewares/roleMiddleware.js`.

-   **`USER_ROLES`**:
    -   `citizen`: The general public. Can file complaints, apply for certificates, report emergencies, and register as a volunteer.
    -   `volunteer`: A citizen with approved volunteer status. Can be assigned to emergencies.
    -   `panchayatOfficer`: A local government official. Manages complaints and other local matters.
    -   `departmentOfficer`: An official in a specific government department. Manages tasks related to their department (e.g., certificates, emergencies).
    -   `districtAdmin`: A high-level administrator with oversight over a district.
    -   `stateAdmin`: A state-level administrator.
    -   `superAdmin`: The highest-level administrator with full system access.

Permissions are applied at the route level, granting or denying access based on these roles.

## 8. API Route Structure

All API routes are prefixed with `/api/v1`.

-   **`POST /api/v1/auth/register`**: User registration.
-   **`POST /api/v1/auth/login`**: User login.
-   **`GET /api/v1/auth/profile`**: Get current user's profile.

-   **`POST /api/v1/announcements`**: Create an announcement.
-   **`GET /api/v1/announcements`**: Get a list of announcements.
-   **`GET /api/v1/announcements/:id`**: Get a single announcement.
-   **`PATCH /api/v1/announcements/:id/publish`**: Publish an announcement.
-   **`DELETE /api/v1/announcements/:id`**: Delete an announcement.

-   **`POST /api/v1/certificates/apply`**: Apply for a certificate.
-   **`GET /api/v1/certificates/my-applications`**: Get citizen's applications.
-   **`GET /api/v1/certificates/department-queue`**: Get applications for an officer's department.
-   **`GET /api/v1/certificates/download/:id`**: Download an issued certificate.
-   **`GET /api/v1/certificates/verify/:id`**: Publicly verify a certificate.
-   **`PATCH /api/v1/certificates/:id/review`**: Officer reviews an application.
-   **`PATCH /api/v1/certificates/:id/status`**: Officer updates application status.

-   **`POST /api/v1/complaints`**: Create a complaint.
-   **`GET /api/v1/complaints`**: Get a list of complaints.
-   **`GET /api/v1/complaints/:id`**: Get a single complaint.
-   **`PATCH /api/v1/complaints/:id/status`**: Officer updates complaint status.
-   **`PATCH /api/v1/complaints/:id/assign`**: Officer assigns a complaint.

-   **`POST /api/v1/emergencies`**: Report an emergency.
-   **`GET /api/v1/emergencies/my`**: Get citizen's reported emergencies.
-   **`GET /api/v1/emergencies/dashboard`**: Get emergencies for an officer's dashboard.
-   **`PATCH /api/v1/emergencies/:id/acknowledge`**: Officer acknowledges an emergency.
-   **`PATCH /api/v1/emergencies/:id/status`**: Officer updates emergency status.
-   **`PATCH /api/v1/emergencies/:id/resources`**: Assign resources to an emergency.
-   **`PATCH /api/v1/emergencies/:id/volunteers`**: Assign volunteers to an emergency.

-   **`POST /api/v1/resources`**: Create a resource.
-   **`GET /api/v1/resources`**: Get a list of resources.
-   **`PATCH /api/v1/resources/:id`**: Update a resource.

-   **`POST /api/v1/volunteers/register`**: Register as a volunteer.
-   **`GET /api/v1/volunteers/me`**: Get volunteer's own profile.
-   **`GET /api/v1/volunteers`**: Get a list of volunteers.
-   **`PATCH /api/v1/volunteers/:id/approve`**: Admin approves a volunteer registration.
-   **`PATCH /api/v1/volunteers/:id/availability`**: Volunteer updates their availability.

## 9. Initial Observations & Potential Risks

-   **Complexity**: The system has a significant number of interdependent modules, roles, and data models. Changes in one area can have cascading effects.
-   **Constants File**: The `server/config/constants.js` file is a critical hub for enums and mappings. Mismatches between this file, the database models, and the frontend logic are a high-risk area for bugs.
-   **Middleware Chains**: Routes have complex middleware chains. The order of execution is critical for security and correct data processing.
-   **Jurisdiction Logic**: Jurisdiction is handled via `enforceJurisdictionPayload` middleware and validation on the `User` model. This is a critical security feature that needs thorough auditing.
-   **Frontend State**: The frontend uses Redux Toolkit, which implies a complex state management system that needs to be perfectly synchronized with the backend API.

This concludes the initial codebase audit. The next step is to perform a detailed audit of the government workflow logic.
