# System Architecture

The Smart Rural Governance System is built on a high-concurrency, security-first MERN stack architecture designed for public sector reliability.

## 1. Technical Stack
- **Frontend**: React 19, Redux Toolkit (State Management), Tailwind CSS (Styling), React Hook Form + Zod (Validation).
- **Backend**: Node.js (Express), Mongoose (ODM), JWT (Auth), Socket.IO (Real-time).
- **Database**: MongoDB (NoSQL).
- **Security**: Helmet.js, Rate Limiting, BCrypt (Hashing).

## 2. Core Components

### **A. Authentication & RBAC Flow**
1. **JWT Handshake**: All API requests pass through `authMiddleware`.
2. **Role Gate**: `roleMiddleware` checks against the verified JWT payload to allow/deny access based on the `USER_ROLES` enum.
3. **Identity Hardening**: Backend services strip privileged fields from public registration payloads to prevent role-injection attacks.

### **B. Jurisdiction & Departmental Flow**
- **Jurisdiction Logic**: Every record (Complaint/Certificate/Emergency) is tagged with State, District, and Local (Village/Ward) IDs.
- **Filtering**: Backend query builders automatically inject jurisdiction filters based on the authenticated user's profile, ensuring an officer only sees relevant records.
- **Department Routing**: Module-specific logic (e.g., `CERTIFICATE_TYPE_DEPARTMENTS`) routes applications to the correct department without citizen intervention.

### **C. Secure File Gateway**
- **Architecture**: The `/uploads` directory is blocked from public static serving.
- **Access Controller**: `fileController.getFile` performs a "Reverse DB Lookup":
  1. Identifies the record associated with the requested file.
  2. Validates if the requesting user is either the Owner (Citizen) or an Authorized Officer (Jurisdiction + Dept match).
  3. Serves the file only upon 100% authorization success.

### **D. Real-time Notification System**
- **Socket.IO Integration**: Integrated directly into service layers.
- **Room Strategy**: Users are joined to rooms based on their identity:
  - `user:<id>`: Personal updates.
  - `district:<district>`: Emergency alerts for local responders.
  - `department:<dept>`: New queue notifications.
- **Handshake Security**: Socket connections are rejected if the JWT handshake fails.

### **E. Resource & Volunteer Management**
- **Inventory Control**: Atomic updates to `availableQuantity` prevent over-allocation.
- **Asset Lifecycle**: Implements a `Returned` workflow for non-consumable assets (Ambulances, Boats), ensuring stock restoration post-emergency.
- **Volunteer Loop**: Automatically resets volunteers to `Available` status upon closure of assigned SOS events.
