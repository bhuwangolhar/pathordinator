# pathordinator

**A real-time location tracking and co-ordination platform for customers and delivery partners.**

---

## Overview

Pathordinator is a full-stack delivery coordination platform structured around organization-scoped operations. Teams can manage users, create delivery orders, assign delivery partners, and monitor execution from a single dashboard — with live visibility into ongoing deliveries through location history, session timing, and real-time status signals.

The platform combines a React + TypeScript frontend with an Express + Sequelize backend, PostgreSQL persistence, JWT-based authentication for workflow APIs, and Socket.IO room-based events for delivery and organization activity. The data model is built around five core entities: `organizations`, `users` (with `admin`, `customer`, or `delivery_partner` roles), `orders`, `delivery_sessions`, and `location_updates`.

---

## Features

- **Organization Onboarding** — Signup flow that creates a new organization and its first admin account in one step
- **User Management** — Unified management for customers, delivery partners, and admins with activation and deactivation controls
- **Order Workflows** — Delivery order creation with pickup and delivery addresses, coordinates, and a full status lifecycle (`created`, `assigned`, `picked_up`, `delivered`)
- **Session Management** — Delivery session start/end with active status tracking, duration visibility, and partner assignment
- **Location History** — Timestamped coordinate storage per session with latest-location lookup by order
- **Real-Time Events** — Socket.IO room-based broadcasting for organization presence, session activity, user status signals, and live location updates
- **Live Time Monitoring** — Session start/end timestamps, duration calculations, last ping visibility, and location path history
- **SPA Deployment Ready** — Vercel-friendly frontend with `vercel.json` rewrites for client-side routing

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, React Router |
| **Backend** | Node.js, Express 5, Sequelize 6, Sequelize CLI |
| **Database** | PostgreSQL, accessed via Sequelize and `pg` |
| **Real-Time** | Socket.IO 4 (server) + `socket.io-client` (frontend) |
| **Auth & Security** | JWT (`jsonwebtoken`), bcrypt password hashing, CORS |
| **Integrations** | Fetch API, Google Maps packages (component available, not yet wired into the routed dashboard) |
| **Deployment** | Vercel (frontend SPA), Render-style backend env, Neon PostgreSQL support |

---

## Architecture

```text
+---------------------------+
|   React + Vite Frontend   |
|  - AuthContext            |
|  - WebSocketContext       |
|  - Dashboard pages        |
+-------------+-------------+
              |
              |  REST (/api/*) + JWT
              |  Socket.IO connection
              v
+-------------+-------------+
|  Express + Socket.IO API  |
|  - Routes                 |
|  - Controllers            |
|  - Auth middleware        |
+-------------+-------------+
              |
              |  Sequelize ORM
              v
+---------------------------+
|     PostgreSQL Database   |
|  - organizations          |
|  - users                  |
|  - orders                 |
|  - delivery_sessions      |
|  - location_updates       |
+---------------------------+
```

- The frontend stores `authUser`, `authToken`, and last dashboard tab in `localStorage` and attaches `Authorization: Bearer <token>` on all authenticated requests
- Organization scoping is enforced inside order, session, and location controllers by comparing the JWT payload against entity ownership
- Socket.IO rooms are used for organization-wide events (`org-<id>`) and session-specific tracking (`delivery-<sessionId>`)
- `WebSocketContext` on the frontend maintains socket connectivity and stores received location and presence updates in context state
- The `TrackingPage` combines API polling (5-second refresh) with socket room subscription for live path updates

---

## Project Structure

```
pathordinator/
├── backend/
│   ├── config/
│   │   └── config.js
│   ├── migrations/
│   │   ├── 20260314204224-create-users-table.js
│   │   ├── 20260329124455-create-orders.js
│   │   ├── 20260329133333-create-delivery-sessions.js
│   │   ├── 20260329133422-create-location-updates.js
│   │   ├── 20260405000001-add-is-active-to-users.js
│   │   ├── 20260405120000-create-organizations-and-auth.js
│   │   ├── 20260406000001-add-organization-to-orders.js
│   │   ├── 20260406000002-add-organization-to-delivery-sessions.js
│   │   └── 20260406000003-add-coordinates-to-orders.js
│   ├── models/
│   │   └── index.js
│   └── src/
│       ├── server.js
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       └── routes/
└── frontend/
    ├── index.html
    ├── vercel.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── api/
        ├── components/
        ├── contexts/
        └── pages/
```

---

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL
- A JWT secret for backend authentication
- A Google Maps API key (optional — only needed if wiring in the `DeliveryMap` component)

### 1. Clone the repository

```bash
git clone <repository-url>
cd pathordinator
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

See the [Environment Variables](#environment-variables) section for all required fields.

### 4. Run database migrations

```bash
cd backend
npx sequelize-cli db:migrate --config config/config.js --env development
```

### 5. Start the backend

```bash
# Development (nodemon)
cd backend && npm run dev
```

### 6. Start the frontend

```bash
cd frontend && npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `PORT` | Optional | HTTP server port — defaults to `8080` |
| `NODE_ENV` | **Yes** | `development` or `production` — selects the Sequelize config environment |
| `DB_URL_DEV` | **Yes (local dev)** | Development PostgreSQL connection string used by `config/config.js` |
| `DATABASE_URL` | **Yes (production)** | Production PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | Secret for signing and verifying JWTs — tokens expire after 24 hours |
| `CORS_ORIGIN` | Recommended | Allowed frontend origin — falls back to `*` if unset |

> **Note:** The split `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` variables shown in `backend/.env.example` are illustrative — the current Sequelize config reads `DB_URL_DEV` and `DATABASE_URL` directly.

### Frontend — `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | **Yes** | Base URL for all API requests — must include `/api`, e.g. `http://localhost:8080/api` |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Only needed if enabling the standalone `DeliveryMap` component |

> **Note:** `frontend/src/api/config.ts` will throw in production if `VITE_API_URL` is not set.

---

## Core Modules

| Module | Summary |
|---|---|
| **Customer Management** | Customers are `users` with the `customer` role, attachable to organization-scoped orders |
| **Delivery Partner Management** | Delivery partners are `users` with the `delivery_partner` role; active session counts drive online/offline status |
| **Order Management** | Orders include customer linkage, organization scoping, coordinate capture, and a full `created → assigned → picked_up → delivered` status lifecycle |
| **Session Management** | Sessions link an order to a delivery partner with start/end timestamps, duration tracking, and live/completed state |
| **Location Tracking** | Timestamped coordinates stored per session and broadcast to delivery rooms via Socket.IO on every POST |
| **Live Time Monitoring** | Session duration, last ping time, and full location path history give real-time operational visibility |
| **Workflow Coordination** | The dashboard connects user, order, session, and tracking modules; Socket.IO rooms handle organization and delivery event fan-out |

---

## API Reference

Base URL (local): `http://localhost:8080/api`

### Public

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Service root response |
| `GET` | `/api/health` | Health check |
| `POST` | `/auth/signup` | Create an organization and its first admin user |
| `POST` | `/auth/login` | Authenticate a user, return JWT |
| `GET` | `/auth/user/:email?org_id=<id>` | Look up a user by email within an organization |
| `POST` | `/auth/verify-password` | Re-verify a user password for privileged UI actions |

### Organizations & Users

| Method | Endpoint | Description |
|---|---|---|
| `GET / POST` | `/organizations/:organization_id/users` | List or add users in an organization |
| `GET` | `/organizations/:organization_id` | Fetch organization details and member count |
| `PUT` | `/organizations/:organization_id/users/:user_id/deactivate` | Deactivate an organization user |
| `PUT` | `/organizations/:organization_id/users/:user_id/activate` | Reactivate an organization user |
| `GET / POST` | `/users` | List all users or create a user record |
| `PUT` | `/users/:id/deactivate` | Deactivate a user |
| `PUT` | `/users/:id/activate` | Reactivate a user |

### Orders — require `Authorization: Bearer <token>`

| Method | Endpoint | Description |
|---|---|---|
| `GET / POST` | `/orders` | List organization orders or create a new order |
| `GET` | `/orders/:id` | Fetch a single organization-scoped order |
| `PATCH` | `/orders/:id/status` | Update order status |

### Delivery Sessions — require `Authorization: Bearer <token>`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/delivery-sessions/start` | Start a session for an order and delivery partner |
| `PATCH` | `/delivery-sessions/:id/end` | End an active delivery session |
| `GET` | `/delivery-sessions/order/:orderId` | Fetch the latest session for an order |

### Location Updates — require `Authorization: Bearer <token>`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/location-updates` | Insert a timestamped coordinate for an active session |
| `GET` | `/location-updates/session/:sessionId` | Return full location history for a session |
| `GET` | `/location-updates/order/:orderId/latest` | Return the latest location for an order's active session |

---

## Real-Time Events

| Event | Direction | Description |
|---|---|---|
| `join-organization` | Client → Server | Join the `org-<organizationId>` presence room |
| `track-delivery` | Client → Server | Join the `delivery-<sessionId>` tracking room |
| `session-started` | Server → Org room | Broadcast when a new delivery session begins |
| `user-online` | Server → Org room | Broadcast when a delivery partner goes active |
| `users-updated` | Server → Org room | Broadcast when user list changes |
| `user-activated` | Server → Org room | Broadcast on user reactivation |
| `user-deactivated` | Server → Org room | Broadcast on user deactivation |
| `location-update` | Server → Delivery room | Broadcast on every successful `POST /location-updates` |

---

## Security

- **Passwords** hashed with `bcrypt` before storage — never stored in plain text
- **JWTs** signed with `JWT_SECRET`, expiring after 24 hours; required on all order, session, and location endpoints
- **Organization ownership** enforced in controllers by comparing JWT payload against entity records
- **Password re-verification** required via `/auth/verify-password` for privileged UI actions such as user deactivation
- **CORS** controlled via `CORS_ORIGIN` — defaults to `*` if unset; set this explicitly before any public deployment
- **Pre-deployment hardening recommended:** add JWT middleware to `/api/organizations` and `/api/users` routes, which are currently unprotected

---

## Usage Guide

1. **Sign up** to create a new organization and its first admin account
2. **Add users** from the Users dashboard — assign `customer` or `delivery_partner` roles as needed
3. **Create an order** from the Orders dashboard by selecting a customer and entering pickup/delivery addresses with coordinates
4. **Start a session** from the Sessions dashboard by linking an order to a delivery partner
5. **Monitor delivery** from the Tracking dashboard — inspect the latest path, ping history, and session timing for any active order
6. **Post location updates** to the backend API for active sessions to drive live tracking

Example location update request:

```bash
curl -X POST http://localhost:8080/api/location-updates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{"session_id":1,"latitude":21.1458,"longitude":79.0882}'
```

---

## Deployment

### Frontend (Vercel)

- Build command: `npm run build`
- Output directory: `dist`
- SPA rewrites are pre-configured in `frontend/vercel.json`
- Set `VITE_API_URL` to the deployed backend API base URL (including `/api`)

### Backend

- Set the deployment root to `backend/`
- Install: `npm install`
- Start: `npm start`
- Required environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN`
- Run migrations on deploy: `npx sequelize-cli db:migrate --config config/config.js --env production`

### Database

- The production env template references a Neon PostgreSQL connection string
- The backend is structured for a Render-style deployment with environment variables set in the platform dashboard

---

## Roadmap

- [ ] Connect the tracking ping form to the real `POST /location-updates` API instead of local UI simulation
- [ ] Mount the existing `DeliveryMap` Google Maps component into the routed dashboard
- [ ] Add JWT middleware and role checks to organization and user management routes
- [ ] Introduce root-level workspace scripts for installing, running, and building both apps together
- [ ] Add automated tests for controllers, route authorization, and frontend flows
- [ ] Expand WebSocket usage so more dashboard views update instantly without polling

---

## Contributing

1. Fork the repository and create a focused feature branch
2. Keep changes aligned with the existing split between `frontend/` and `backend/`
3. Add a Sequelize migration for any data model changes
4. Run lint and build checks in the frontend before opening a pull request

```bash
cd frontend
npm run lint
npm run build
```

5. Document any notable behavioral or setup changes in this README

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

*Built by **Bhuvan Golhar***  
➢ **LinkedIn**: https://linkedin.com/in/bhuvangolhar  
➢ **Portfolio**: https://bhuvangolhar.space