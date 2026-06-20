# SMART RURAL GOVERNANCE & EMERGENCY MANAGEMENT SYSTEM

## Project Vision

This is a production-oriented Government Governance and Emergency Management Platform for Rural and Semi-Urban Administration.

The system must follow real Government workflow patterns and must not behave like a generic social platform.

All modules must be implemented using:

* MERN Stack
* JWT Authentication
* RBAC
* Zod Validation
* Socket.IO Realtime Updates
* Audit Logging
* Jurisdiction Based Access Control
* Secure File Gateway
* Department Based Routing

Security and workflow correctness are higher priority than UI convenience.

---

# User Types

## Citizen

Can self-register.

Identity fields:

* Full Name
* Aadhaar Number
* Date of Birth
* Gender
* Email
* Mobile Number
* Address
* State
* District
* Tehsil
* Panchayat
* Village
* Municipality
* Ward
* Pincode

Optional:

* Father Name
* Mother Name
* Occupation

Citizen Capabilities:

* Register
* Login
* Raise Complaints
* Apply Certificates
* Raise SOS Requests
* Register as Volunteer
* Track Applications
* Track Complaint Status
* Track SOS Status
* View Own Profile

Citizen must never choose:

* Role
* Department
* Officer Jurisdiction

These are controlled by the system.

---

## Volunteer

Registration allowed.

Approval required.

Workflow:

Pending
→ Approved
→ Available
→ Assigned
→ Completed
→ Available

Volunteer fields:

* Citizen Identity
* Skills
* Availability
* Emergency Training
* Blood Group
* Contact Information

Volunteer cannot self-approve.

Approval authority:

* District Admin
* State Admin
* Super Admin

---

## Panchayat Officer

Cannot self-register.

Must be provisioned by Admin.

Fields:

* Employee ID
* Department
* Designation
* Jurisdiction

Responsibilities:

* First Level Complaint Review
* Local Verification
* Citizen Coordination
* Forward to Department Officer

Cannot Resolve Final Complaints.

---

## Department Officer

Cannot self-register.

Must be provisioned.

Responsibilities:

* Certificate Processing
* Complaint Resolution
* SOS Handling
* Resource Assignment
* Volunteer Assignment

Can resolve complaints.

---

## District Admin

Provisioned account.

Responsibilities:

* Volunteer Approval
* Officer Monitoring
* Resource Oversight
* District Governance Dashboard

---

## State Admin

Provisioned account.

Responsibilities:

* Cross District Monitoring
* Officer Management
* Analytics
* Escalation Monitoring

---

## Super Admin

System Owner.

Responsibilities:

* Global Access
* Provision State Admins
* System Configuration

---

# Registration Form

Citizen Registration Only.

Visible Fields:

* Name
* Aadhaar
* DOB
* Gender
* Email
* Password
* Phone
* Address
* Jurisdiction

Hidden Fields:

* role = citizen

Not Allowed:

* department
* designation
* employeeId

---

# Login Form

Fields:

* Email
* Password

Features:

* JWT Authentication
* Remember Session
* Refresh Handling
* Role Based Redirect

---

# Complaint Module

Citizen Fields:

* Category
* Title
* Description
* Priority
* Evidence Images

Routing:

Category
→ Department Mapping

Citizen must not choose department.

Workflow:

Submitted
→ Reviewed
→ Assigned
→ In Progress
→ Resolved
→ Closed

Hierarchy:

Citizen
→ Panchayat Officer
→ Department Officer

---

# Certificate Module

Citizen Fields:

* Certificate Type
* Required Details
* Supporting Documents
* Remarks

Citizen must never choose department.

Department must be derived on backend.

Workflow:

Submitted
→ Under Review
→ Approved
→ Issued

or

Submitted
→ Correction Required
→ Resubmitted

---

# Emergency (SOS) Module

Citizen Fields:

* Emergency Type
* Description
* Location
* Images

Routing:

Emergency Type
→ Department

Workflow:

Submitted
→ Acknowledged
→ Assigned
→ In Progress
→ Resolved
→ Closed

---

# Resource Module

Managed by Officers.

Fields:

* Resource Name
* Resource Type
* Quantity
* Department
* Availability

---

# Volunteer Module

Fields:

* Skills
* Availability
* Emergency Training
* Certifications

Workflow:

Pending
→ Approved
→ Available
→ Assigned
→ Completed

---

# Announcement Module

Only Officers/Admins.

Fields:

* Title
* Content
* Department
* Priority
* Expiry Date

Citizens can only view.

---


# Profile Module



Required.

Every user must have:

GET Profile
UPDATE Profile

Editable:

* Phone
* Email
* Address

Restricted:

* Aadhaar
* Employee ID
* Role

---

# Security Requirements

Mandatory:

* JWT Authentication
* Role Based Access Control
* Jurisdiction Based Access Control
* Department Based Access Control
* Audit Logging
* Secure File Gateway
* Zod Validation

Forbidden:

* Public Officer Registration
* Public Admin Registration
* Public Upload Access

* Client Controlled Department Routing

---

# Real-Time Requirements

Socket.IO must use JWT authenticated handshake.

Room membership must never be client-controlled.

Rooms:

* user:{id}
* district:{district}
* department:{department}
* role:{role}

Room access must be server-validated.

---
# GEMINI.md ADDENDUM – PHASE 4 GOVERNMENT WORKFLOW UPGRADE

## Critical Architecture Principle

The platform must behave like a real Government e-Governance System and not like a generic CRUD application.

Workflow correctness, auditability, jurisdiction control, and document integrity always take priority over UI convenience.

---

# MASTER DATA SYSTEM

Remove all hardcoded geography.

Current hardcoded values:

* Rajasthan
* Sikar
* Laxmangarh
* Singodara

must become configurable.

Create master collections:

State
District
Tehsil
Block
Panchayat
Village
Municipality
Ward

Relationships:

State
→ District
→ Tehsil
→ Panchayat/Block
→ Village
→ Ward

All workflows must derive jurisdiction from these collections.

System must support onboarding of any district in India without code changes.

---

# CITIZEN PROFILE ENHANCEMENT

Citizen profile becomes the source of truth.

Mandatory identity fields:

* Full Name
* Aadhaar Number
* DOB
* Gender
* Mobile
* Email
* Address
* State
* District
* Tehsil
* Panchayat
* Village
* Municipality
* Ward
* Pincode

Optional:

* Father Name
* Mother Name
* Occupation

Certificate applications must automatically inherit profile data.

Citizen should not repeatedly enter identity information.

---

# CERTIFICATE ENGINE REBUILD

Replace generic certificate form with Dynamic Certificate Engine.

Every certificate type must define:

Certificate Metadata:

* Certificate Name
* Certificate Code
* Department Mapping
* Workflow Template

Required Fields:

* Dynamic per certificate

Required Documents:

* Dynamic per certificate

Validation Rules:

* Dynamic per certificate

Review Authority:

* Dynamic per certificate

Examples:

Birth Certificate
Marriage Certificate
Death Certificate
Income Certificate
Residence Certificate
Domicile Certificate
Caste Certificate
Disability Certificate
Senior Citizen Certificate
Land Ownership Certificate

Each certificate must have its own schema.

---

# MULTI DOCUMENT SUPPORT

Current implementation is insufficient.

Required:

Citizen can upload:

* Aadhaar
* Residence Proof
* Income Proof
* Affidavit
* Existing Certificate
* Supporting Evidence

Support:

PDF
PNG
JPG
JPEG

Features:

* Multi-file upload
* File preview
* Replace document
* Remove document
* Verification status
* Document category tagging

Storage must use Secure File Gateway.

---

# CERTIFICATE CORRECTION WORKFLOW

New module required.

Citizen actions:

Apply Correction

Fields:

* Existing Certificate
* Certificate Number
* Reason For Change
* Requested Changes
* Supporting Documents

Workflow:

Submitted
→ Under Review
→ Correction Required
→ Resubmitted
→ Approved
→ Issued

or

Submitted
→ Rejected

Every correction must generate a new certificate version.

---

# CERTIFICATE VERSIONING

Mandatory.

Store:

Version 1
Version 2
Version 3

Track:

* Who modified
* What changed
* When changed
* Reason

No certificate may be overwritten.

Historical versions remain immutable.

---

# CERTIFICATE PDF SYSTEM

Current PDF generation must be upgraded.

Every generated certificate PDF must contain:

* Government Header
* Certificate Number
* Application Number
* Citizen Details
* Issue Date
* Expiry Date (if applicable)
* Issuing Officer
* QR Verification Code
* Verification URL
* Digital Signature Metadata
* Department Seal Placeholder

PDF generation must use certificate-specific templates.

Different certificate types must not share identical layouts.

---

# CERTIFICATE VERIFICATION SYSTEM

Public Verification Endpoint

Inputs:

* Certificate Number
  OR
* QR Code

Outputs:

* Valid
* Revoked
* Superseded
* Expired

Public users must not access private citizen information.

---

# DEPARTMENT ROUTING ENGINE

Citizen must never select department.

Routing occurs on backend.

Examples:

Birth Certificate
→ Civil Registration

Income Certificate
→ Revenue Department

Road Complaint
→ Public Works

Street Light Complaint
→ Electricity Department

Water Leakage
→ Water Department

Routing must be configuration driven.

No hardcoded switch statements.

---

# COMPLAINT MODULE UPGRADE

Add:

Search
Status Filter
Priority Filter
Category Filter
Subcategory Filter
Escalation Filter
Date Range Filter
Jurisdiction Filter

All filters must support combination queries.

Add:

Complaint Timeline

Display:

* Submitted
* Reviewed
* Assigned
* Escalated
* In Progress
* Resolved
* Closed

Include:

Officer
Department
Timestamp
Remarks

---

# COMPLAINT EVIDENCE SYSTEM

Support:

Multiple Images
Multiple PDFs

Features:

Preview
Gallery View
Secure Download
Officer Verification

---

# SOS MODULE UPGRADE

Add:

Resource Assignment

Examples:

Ambulance
Water Tanker
Fire Vehicle
Police Unit
Relief Team

Add:

Volunteer Assignment

Track:

Assigned Officer
Assigned Resources
Assigned Volunteers
Response Timeline

---

# VOLUNTEER MODULE UPGRADE

Workflow:

Pending
→ Approved
→ Available
→ Assigned
→ Completed
→ Available

Approval authority:

District Admin
State Admin
Super Admin

Add:

Skill Verification
Background Verification
Training Certification

---

# AUDIT LOGGING

Mandatory for:

Certificates
Complaints
SOS
Volunteer Actions
Officer Actions

Store:

Actor
Role
Timestamp
Action
Before State
After State
IP Metadata

Audit logs are immutable.

---

# SECURITY REQUIREMENTS

Citizen cannot:

* Choose Department
* Choose Officer
* Choose Role
* Choose Workflow Status
* Choose Jurisdiction outside profile

All routing and permissions must be enforced on backend.

Never trust client-side values.

---

# FUTURE AI FEATURES (OPTIONAL)

AI is NOT required for routing.

Routing remains rule-based.

AI may later assist with:

* Complaint category prediction
* Complaint duplicate detection
* Complaint severity estimation
* Certificate document quality checks
* OCR extraction from uploaded documents

Department assignment remains backend-controlled and deterministic.

# Project Goal

A real-life government governance platform suitable for academic demonstration and scalable toward production deployment while maintaining strict security, accountability, and workflow integrity.
