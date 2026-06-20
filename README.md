# Smart Rural Governance & Emergency Management System

A workflow-driven digital governance platform designed to streamline public service delivery, emergency response coordination, certificate processing, complaint resolution, volunteer management, and administrative operations across multiple levels of governance.

## Live Deployment

Frontend:
https://smart-rural-governance-system.vercel.app

Backend API:
https://smart-rural-governance-api.onrender.com

## Overview

The Smart Rural Governance & Emergency Management System was built to simulate how real governance workflows operate across Citizens, Panchayat Officers, District Administrators, State Administrators, and Emergency Response Teams.

Instead of focusing on isolated CRUD operations, the platform emphasizes workflow orchestration, accountability, role-based operations, real-time coordination, auditability, and operational visibility.

The system combines governance services and emergency management capabilities into a unified platform.

---

# Core Modules

## Complaint Management

Citizens can report civic issues and track progress throughout the complete resolution lifecycle.

Features:

* Complaint registration with attachments
* Department routing
* Officer assignment workflows
* Escalation management
* SLA monitoring
* Resolution tracking
* Citizen closure confirmation
* Search, filtering, and queue management
* Audit trail and timeline history

Lifecycle:

Submitted → Assigned → In Progress → Resolved → Closed

---

## Digital Certificate Management

Provides a structured workflow for certificate applications and issuance.

Features:

* Certificate applications
* Document uploads
* Department review queues
* Correction request workflows
* Resubmission management
* Digital approval process
* PDF generation
* QR verification
* Application version history
* Certificate verification endpoint

Lifecycle:

Submitted → Under Review → Correction Required → Resubmitted → Approved → Issued

---

## Emergency Response Management

Supports emergency incident reporting and response coordination.

Features:

* SOS emergency submission
* Severity classification
* Geographic location mapping
* Resource allocation
* Incident tracking
* Volunteer assignment
* Emergency lifecycle management
* Real-time dispatch coordination

Lifecycle:

Submitted → Acknowledged → Assigned → In Progress → Resolved → Closed

---

## Resource Management

Provides inventory and operational resource tracking.

Features:

* Resource catalog
* Stock management
* Allocation tracking
* Maintenance logging
* Inventory audit history
* Emergency resource assignment
* Availability monitoring

Examples:

* Ambulances
* Medical Kits
* Food Supplies
* Water Resources
* Shelter Capacity
* Rescue Equipment

---

## Volunteer Management

Manages citizen volunteers available for emergency response.

Features:

* Volunteer registration
* Skills tracking
* Availability management
* Approval workflows
* Emergency assignment support
* Administrative verification

Lifecycle:

Pending Verification → Approved → Active Response Pool

---

## Real-Time Notification System

Provides operational awareness across governance workflows.

Features:

* Socket.IO integration
* Real-time updates
* Persistent notifications
* Deep-link navigation
* Role-based targeting
* Department notifications
* Emergency alerts
* Read/unread tracking

Examples:

* Complaint assignments
* Certificate updates
* Emergency alerts
* Volunteer approvals
* Escalation events

---

## Dashboard & Analytics

Role-specific dashboards provide operational visibility.

Features:

* Citizen Dashboard
* Panchayat Officer Dashboard
* District Admin Dashboard
* State Admin Dashboard
* Analytics widgets
* Queue monitoring
* Performance metrics
* Emergency overview statistics

---

# User Roles

## Citizen

* Register and authenticate
* File complaints
* Apply for certificates
* Submit SOS requests
* Register as volunteers
* Track workflow status
* Receive notifications

## Panchayat Officer

* Review complaints
* Manage certificate workflows
* Process incoming requests
* Update statuses
* Add review remarks

## District Administrator

* Manage escalations
* Coordinate resources
* Approve volunteers
* Monitor emergencies
* Supervise operations

## State Administrator

* Monitor statewide analytics
* Review governance metrics
* Coordinate district oversight
* Publish announcements

## Volunteer

* Maintain profile
* Update availability
* Participate in emergency response

---

# Security & Governance Controls

* JWT Authentication
* Role-Based Access Control (RBAC)
* Protected API Endpoints
* Request Validation
* Audit Logging
* Activity Tracking
* Secure File Upload Handling
* Route Protection
* Ownership Verification

---

# Technical Highlights

* Workflow-Driven Architecture
* Service Layer Pattern
* Real-Time Communication
* Deep-Link Navigation
* Socket Session Management
* PDF Generation
* QR Verification
* Notification Persistence
* URL State Synchronization
* Centralized Error Handling

---

# Tech Stack

## Frontend

* React
* Redux Toolkit
* React Router
* React Hook Form
* Tailwind CSS
* Axios
* Socket.IO Client

## Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* Socket.IO
* JWT Authentication
* Multer

## Infrastructure

* Vercel
* Render
* MongoDB Atlas

---

# Project Structure

client/
├── src/
│ ├── pages/
│ ├── components/
│ ├── services/
│ ├── redux/
│ ├── layouts/
│ └── utils/

server/
├── controllers/
├── services/
├── models/
├── routes/
├── validators/
├── middlewares/
├── sockets/
├── scripts/
└── utils/

---

# Installation

Backend

```bash
cd server
npm install
npm run dev
```

Frontend

```bash
cd client
npm install
npm run dev
```

Environment Variables

```env
PORT=
MONGODB_URI=
JWT_SECRET=
CLIENT_URL=
```

---

# Future Roadmap

* GIS-based jurisdiction mapping
* Mobile application
* Multi-language support
* AI-assisted complaint categorization
* Predictive emergency analytics
* Resource demand forecasting

---

# Author

Tanvi Sharma

B.Tech Computer Science & Engineering

---

# License

MIT License
