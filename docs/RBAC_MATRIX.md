# RBAC Matrix

The Smart Rural Governance System enforces a strict Role-Based Access Control (RBAC) model aligned with real-world government hierarchy.

## Roles Overview

| Role | Responsibility | Provisioning |
| :--- | :--- | :--- |
| **Citizen** | Raise complaints, apply for certificates, SOS. | Self-Registration |
| **Volunteer** | Field response and emergency assistance. | Self-Registration + Admin Approval |
| **Panchayat Officer** | Local review and verification. | Administrative Provisioning |
| **Department Officer** | Technical resolution and certificate processing. | Administrative Provisioning |
| **District Admin** | District oversight and resource management. | Administrative Provisioning |
| **State Admin** | State-wide analytics and escalation monitoring. | Administrative Provisioning |
| **Super Admin** | Global system configuration and root control. | System Seeded |

## Permission Matrix

| Module | Action | Cit | Vol | PO | DO | DA | SA | SAdm |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | Login / View Profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | Update Contact Info | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | Provision Officers | - | - | - | - | - | ✓ | ✓ |
| **Complaints** | Submit Complaint | ✓ | - | - | - | - | - | - |
| | Review / Reject | - | - | ✓ | - | ✓ | ✓ | ✓ |
| | Resolve Complaint | - | - | - | ✓ | ✓ | ✓ | ✓ |
| | Close (Resolved) | ✓ | - | - | - | - | - | - |
| | View Jurisdiction Queue | - | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Certificates** | Apply | ✓ | - | - | - | - | - | - |
| | Review / Correction Req | - | - | - | ✓ | ✓ | ✓ | ✓ |
| | Resubmit | ✓ | - | - | - | - | - | - |
| | Final Approval / Issue | - | - | - | ✓ | ✓ | ✓ | ✓ |
| **Emergency** | Raise SOS | ✓ | - | - | - | - | - | - |
| | Acknowledge / Respond | - | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| | Assign Res / Vol | - | - | - | ✓ | ✓ | ✓ | ✓ |
| **Resources** | View Inventory | - | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| | Create / Update | - | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| | Return Assets | - | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Volunteers** | Register as Vol | ✓ | - | - | - | - | - | - |
| | Approve / Reject | - | - | - | - | ✓ | ✓ | ✓ |
| | Complete Assignment | - | ✓ | - | - | - | - | - |
| **Announcements** | View (Targeted) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | Create / Publish | - | - | ✓ | ✓ | ✓ | ✓ | ✓ |

## Jurisdiction Enforcement

Access is further restricted by the user's jurisdiction profile:
- **Village/Ward**: Panchayat Officers only see local records.
- **District**: District Admins and Department Officers see district-wide records.
- **State**: State Admins see all records within their state boundary.
- **Global**: Super Admins have no boundary restrictions.
