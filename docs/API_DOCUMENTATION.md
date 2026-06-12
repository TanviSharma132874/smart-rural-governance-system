# API Documentation

The system exposes a secure RESTful API under the `/api/v1` prefix. All sensitive endpoints require a valid JWT in the `Authorization` header.

## 1. Authentication & Identity

### **POST /auth/register**
- **Access**: Public (Citizen only)
- **Payload**: `name`, `email`, `password`, `aadhaarNumber`, `phone`, `jurisdictionType`, `district`, `village/municipality`
- **Response**: JWT + Sanitized User Object

### **POST /auth/login**
- **Access**: Public
- **Payload**: `email`, `password`
- **Response**: JWT + Sanitized User Object

### **GET /auth/profile**
- **Access**: Authenticated
- **Response**: Current user profile details

### **PATCH /auth/profile**
- **Access**: Authenticated
- **Payload**: `phone`, `email`, `address`, `pincode`, etc. (Restricted fields like Aadhaar are ignored)

### **POST /auth/users**
- **Access**: State Admin / Super Admin
- **Payload**: Full user details including `role`, `department`, `employeeId`, `designation`
- **Purpose**: Administrative provisioning of privileged accounts.

---

## 2. Complaint Module

### **POST /complaints**
- **Access**: Citizen
- **Payload**: `title`, `description`, `category`, `subcategory`, `images[]`

### **GET /complaints**
- **Access**: Authenticated (Jurisdiction filtered)
- **Filters**: `status`, `category`, `priority`

### **PATCH /complaints/:id/status**
- **Access**: Officer (Review/Resolve) or Citizen (Close)
- **Payload**: `status`, `officerRemarks`, `resolutionNotes`

### **PATCH /complaints/:id/assign**
- **Access**: Officer / Admin
- **Payload**: `assignedOfficerId`

---

## 3. Certificate Module

### **POST /certificates/apply**
- **Access**: Citizen
- **Payload**: `certificateType`, `certificateDetails`, `documents[]`

### **PATCH /certificates/:id/resubmit**
- **Access**: Citizen
- **Payload**: Updated details/documents for applications marked "Correction Required"

### **PATCH /certificates/:id/status**
- **Access**: Department Officer
- **Payload**: `status`, `remarks` (Approving auto-generates QR and moves to "Issued")

---

## 4. Emergency SOS Module

### **POST /emergencies**
- **Access**: Citizen
- **Payload**: `emergencyType`, `title`, `description`, `locationAddress`, `severity`

### **PATCH /emergencies/:id/resources**
- **Access**: Department Officer / Admin
- **Payload**: `resourceId`, `quantity`

### **PATCH /emergencies/:id/volunteers**
- **Access**: Department Officer / Admin
- **Payload**: `volunteerIds[]`

---

## 5. Resource Module

### **POST /resources**
- **Access**: Officer / Admin
- **Payload**: `resourceType`, `quantity`, `locationAddress`, `department`

### **PATCH /resources/:id/return**
- **Access**: Officer / Admin
- **Payload**: `allocationId`, `returnRemarks`
- **Purpose**: Restoration of non-consumable assets (Ambulances, etc.) to inventory.

---

## 6. Real-Time (Socket.IO)

- **Handshake**: Requires JWT.
- **Rooms**: Automatically assigned on connection:
  - `user:<userId>`
  - `role:<role>`
  - `district:<district>`
  - `department:<department>`
- **Events**:
  - `complaint:updated`, `certificate:updated`, `emergency:alert`, `resource:updated`.
