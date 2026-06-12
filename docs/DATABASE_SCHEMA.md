# Database Schema

The system uses MongoDB with Mongoose for schema enforcement and validation.

## 1. User Collection
| Field | Type | Note |
| :--- | :--- | :--- |
| `name` | String | Required |
| `aadhaarNumber` | String | Unique, 12 digits (Hardened) |
| `email` | String | Unique, Index |
| `role` | Enum | Citizen, Officer, Admin, etc. |
| `department` | String | For Officers |
| `jurisdictionType`| Enum | Rural / Urban |
| `district` | String | Index |
| `village` | String | Conditional requirement |

## 2. Complaint Collection
| Field | Type | Note |
| :--- | :--- | :--- |
| `title` | String | Index (Text) |
| `citizenId` | ObjectId | Ref: User |
| `status` | Enum | Pending -> Closed |
| `responsibleDept` | String | Derived from Category |
| `assignedOfficer` | ObjectId | Ref: User |
| `images` | [String] | File paths |
| `escalationStatus`| Enum | Normal / Escalated |

## 3. Certificate Collection
| Field | Type | Note |
| :--- | :--- | :--- |
| `applicationNumber`| String | Unique, Index |
| `applicant` | ObjectId | Ref: User |
| `certificateType` | String | Index |
| `status` | Enum | Submitted -> Issued |
| `qrCode` | String | Base64 / URL |
| `digitalSignature`| String | Officer metadata |

## 4. Emergency Collection
| Field | Type | Note |
| :--- | :--- | :--- |
| `incidentNumber` | String | Unique, Index |
| `emergencyType` | Enum | Fire, Flood, Medical, etc. |
| `severity` | Enum | Low to Critical |
| `citizen` | ObjectId | Ref: User |
| `resourceAssignments`| [SubDoc] | Linked to Resource |
| `volunteerAssignments`| [SubDoc] | Linked to Volunteer |

## 5. Resource Collection
| Field | Type | Note |
| :--- | :--- | :--- |
| `resourceType` | String | Index |
| `quantity` | Number | Total stock |
| `availableQuantity`| Number | Real-time stock |
| `status` | Enum | Available, Low Stock, Depleted |
| `allocationHistory`| [SubDoc] | Tracks isReturned status |

## 6. Volunteer Collection
| Field | Type | Note |
| :--- | :--- | :--- |
| `user` | ObjectId | Ref: User |
| `skills` | [String] | Medical, Rescue, etc. |
| `approvalStatus` | Enum | Pending, Approved, Rejected |
| `availabilityStatus`| Enum | Available, Assigned, Completed |

## 7. Announcement Collection
| Field | Type | Note |
| :--- | :--- | :--- |
| `title` | String | Required |
| `targetAudience` | Enum | Citizens, Volunteers, All |
| `status` | Enum | Draft, Published, Archived |

## Core Relationships
- **User** is the primary identity for all records.
- **Complaint/Certificate/Emergency** belong to a **User (Citizen)** and are assigned to a **User (Officer)**.
- **Resource/Volunteer** assignments link **Emergency** records to field capacity.
