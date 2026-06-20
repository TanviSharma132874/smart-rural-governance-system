# Workflow Status

## 1. Complaint Workflow
- **Path**: Citizen -> Panchayat Officer -> Department Officer -> Citizen
- **Statuses**: Pending -> Reviewed -> In Progress -> Resolved -> Closed
- **Hardening**: Read-only after Closure.

## 2. Certificate Workflow
- **Path**: Citizen -> Department Officer -> Citizen
- **Statuses**: Submitted -> Under Review -> Correction Required -> Resubmitted -> Issued
- **Hardening**: Automatic QR Issuance.

## 3. Emergency SOS Workflow
- **Path**: Citizen -> Department Officer -> Volunteers
- **Statuses**: Submitted -> Acknowledged -> Assigned -> Resolved -> Closed
- **Hardening**: Automatic Volunteer Release.

## 4. Volunteer Workflow
- **Statuses**: Pending -> Approved -> Available -> Assigned -> Completed
- **Hardening**: Linked to SOS resolution.

## 5. Resource Workflow
- **Statuses**: Available -> Allocated -> Returned
- **Hardening**: Non-consumable asset tracking enabled.
