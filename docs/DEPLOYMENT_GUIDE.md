# Deployment Guide

This guide covers the setup and deployment of the Smart Rural Governance System for both development and production environments.

## Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: v6.0 or higher
- **npm**: v9.0 or higher

## Local Development Setup

1. **Install Root Dependencies**:
   ```bash
   npm install
   ```

2. **Install Sub-Project Dependencies**:
   ```bash
   npm install --prefix client
   npm install --prefix server
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `server/` directory:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/smart-rural-governance
   JWT_SECRET=your_super_secret_jwt_key
   CLIENT_URL=http://localhost:5173
   ```

4. **Launch Application**:
   ```bash
   npm run dev
   ```
   - **Frontend**: http://localhost:5173
   - **Backend**: http://localhost:5000

---

## Production Deployment

### 1. Build Frontend
```bash
npm run build --prefix client
```
The static assets will be generated in `client/dist`.

### 2. Environment Hardening
- Ensure `NODE_ENV=production`.
- Use a strong, unique `JWT_SECRET`.
- Configure a cloud MongoDB provider (e.g., MongoDB Atlas).

### 3. Process Management
Use a process manager like **PM2** to keep the server running:
```bash
cd server
pm2 start server.js --name "governance-api"
```

### 4. Nginx Configuration
Recommended Nginx block to serve frontend and proxy backend:
```nginx
server {
    listen 80;
    server_name example.gov.in;

    location / {
        root /path/to/client/dist;
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

## Maintenance Commands
- **Seed Super Admin**: `npm run seed:admin` (if implemented in server/scripts)
- **Check Logs**: `pm2 logs governance-api`
- **DB Backup**: `mongodump --uri="your_mongodb_uri"`
