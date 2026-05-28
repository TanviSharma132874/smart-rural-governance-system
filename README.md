# Smart Rural Governance & Emergency Management System

Workflow-driven governance and emergency operations platform for complaint handling, certificate processing, and administrative coordination.

## Problem Statement

Many public-service processes still depend on fragmented manual workflows, delayed approvals, limited visibility, and poor coordination between citizens and officials.

This project simulates a structured digital governance system that focuses on workflow engineering, accountability, and role-based operations rather than simple CRUD screens.

## Project Details

The application is organized around these user roles:

- Citizen: files complaints, applies for certificates, and tracks progress.
- Panchayat Officer: reviews incoming cases and verifies submissions.
- District Admin: escalates cases, assigns work, and closes service loops.
- Volunteer / Field Team: receives assignments and updates live progress.

The main functional areas are:

- Complaint intake with attachments and location context.
- Certificate processing with document upload, verification, approval, and PDF download.
- Administrative review queues for officers and admins.
- Live tracking for status updates and task progress.

## Screenshots

The shared workflow screenshot is the primary visual reference for this project.

## Features

### Complaint Management

- Complaint creation and tracking
- Officer assignment workflows
- Status lifecycle management
- Location-aware case handling
- Search and filtering on the complaint queue

### Certificate Governance System

- Certificate application workflows
- Department-based authorization
- Officer verification queues
- Signed PDF generation
- QR-based certificate verification
- Audit history tracking

### Authentication and Security

- JWT authentication
- Role-based access control
- Protected APIs
- Validation middleware
- Request guarding for sensitive actions

### System Architecture

- Service-layer architecture
- Centralized error handling
- Structured logging
- Reusable validation schemas
- Document generation for approvals

## Tech Stack

### Frontend

- React
- Redux Toolkit
- Axios
- React Hook Form
- Tailwind CSS

### Backend

- Node.js
- Express.js
- MongoDB Atlas
- JWT authentication
- Multer

### Architecture and Tooling

- REST APIs
- RBAC
- Zod validation
- Audit logging
- PDF and QR generation

## Governance Workflow

Citizen access -> authentication -> dashboard access -> complaint or certificate submission -> officer review -> approval or assignment -> PDF or status update -> citizen tracking.

## Emergency Workflow

Citizen access -> SOS trigger -> real-time alert broadcast -> admin coordination -> resource allocation -> volunteer assignment -> live progress update -> emergency resolved.

## Project Structure

- client/
  - src/
    - pages/
    - components/
    - redux/
    - services/
    - layouts/
- server/
  - controllers/
  - services/
  - models/
  - routes/
  - middlewares/
  - validators/
  - utils/

## Sample API Routes

### Complaint APIs

- `POST /api/complaints`
- `GET /api/complaints`
- `PATCH /api/complaints/:id/status`
- `PATCH /api/complaints/:id/assign`

### Certificate APIs

- `POST /api/certificates/apply`
- `GET /api/certificates/:id`
- `GET /api/certificates/verify/:id`
- `PATCH /api/certificates/:id/review`
- `PATCH /api/certificates/:id/status`
- `GET /api/certificates/download/:id`

## Installation

### Clone Repository

```bash
git clone <repo-url>
```

### Backend Setup

```bash
cd server
npm install
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

## Environment Variables

Create a `.env` file inside `server/`:

```env
PORT=
MONGODB_URI=
JWT_SECRET=
CLIENT_URL=
```

## Notes

- Add the required environment variables in `server/` before starting the backend.
- Run frontend and backend in separate terminals during development.

## Future Enhancements

- Emergency SOS workflows
- Resource allocation engine
- Real-time notifications
- GIS-based jurisdiction mapping
- Multi-language support

## Engineering Focus

This project was built to explore workflow-driven backend architecture, access control, auditability, and real-world administrative processes.

## Author

Tanvi Sharma

## License

This project is licensed under the MIT License.
