# 🚀 NexusHub AI

> **An enterprise-grade AI-powered collaboration platform** for startups, student teams, and remote developers.

NexusHub AI combines the real-time communication of **Slack**, the collaborative documentation of **Notion**, the project management capabilities of **Jira**, and the intelligence of **ChatGPT/Gemini** into a unified SaaS platform.

---

## 📌 Status

> 🚧 **Currently Under Active Development**

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based Authentication
- Refresh Tokens stored in PostgreSQL
- HTTP-Only Secure Cookies
- bcrypt Password Hashing
- Redis-powered Rate Limiting
- 6-digit OTP Password Recovery
- Transactional Email via Brevo

---

### 👥 Workspace Management
- Multi-workspace Architecture
- Role-Based Access Control (RBAC)
  - Owner
  - Admin
  - Member
  - Guest
- Invitation System
- Workspace Settings

---

### 💬 Real-Time Communication *(WIP)*
- Socket.io
- Redis Pub/Sub Adapter
- Typing Indicators
- Presence System
- Horizontal Scaling

---

### 📝 Collaborative Documents *(WIP)*
- Real-time Collaborative Editing
- Conflict-free Replicated Data Types (CRDT)
- Powered by **Yjs**

---

### 🤖 AI Features *(WIP)*
- Workspace Assistant
- AI Task Generation
- AI Document Summaries
- AI Channel Summaries
- Workspace Q&A
- Gemini API Integration

---

### ⚡ Event-Driven Architecture *(WIP)*
- RabbitMQ Message Queues
- Background Workers
- Email Processing
- AI Processing
- Notification Queue

---

# 🛠 Tech Stack

## Frontend (`apps/web`)

| Category | Technology |
|-----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| Components | Shadcn UI + Radix UI |
| State Management | Zustand |
| Forms | React Hook Form |
| Validation | Zod |
| HTTP Client | Axios |

---

## Backend (`apps/api`)

| Category | Technology |
|-----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Validation | Zod |
| Security | Helmet, CORS, JWT, bcrypt |
| Architecture | Modular Monolith |

---

## Infrastructure

| Service | Technology |
|-----------|------------|
| Database | PostgreSQL |
| ORM | Prisma ORM v7 |
| Cache | Redis |
| Message Queue | RabbitMQ |
| Containers | Docker |
| Email | Nodemailer + Brevo SMTP |

---

# 🏗 Monorepo Structure

```text
NexusHub/
│
├── apps/
│   ├── api/                 # Express.js Backend
│   └── web/                 # Next.js Frontend
│
├── packages/
│   ├── config/              # Shared Configurations
│   ├── types/               # Shared Types
│   └── ui/                  # Shared Components
│
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

---

# 🚀 Getting Started

## Prerequisites

- Node.js 20+
- PNPM 11+
- Docker Desktop

---

## 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/nexushub-ai.git
cd nexushub-ai
```

---

## 2️⃣ Install Dependencies

```bash
pnpm install
```

---

## 3️⃣ Start Infrastructure

```bash
docker compose up -d
```

This starts:

- PostgreSQL
- Redis
- RabbitMQ

---

## 4️⃣ Configure Environment Variables

### `apps/api/.env`

```env
PORT=5000
NODE_ENV=development

DATABASE_URL="postgresql://user:password@127.0.0.1:5433/nexushub?schema=public"

JWT_SECRET="your_super_secret_jwt_key"
REFRESH_SECRET="your_super_secret_refresh_key"

SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT=587
SMTP_USER="your_smtp_user"
SMTP_PASS="your_smtp_password"
```

---

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 5️⃣ Run Database Migrations

```bash
cd apps/api

npx prisma migrate dev
```

---

## 6️⃣ Start Development Server

```bash
cd ../..

pnpm dev
```

---

## 🌐 Application URLs

| Service | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Prisma Studio | http://localhost:5555 |

---

# 🗺 Development Roadmap

## ✅ Phase 1

- [x] Turborepo Monorepo
- [x] Docker Infrastructure
- [x] PostgreSQL + Prisma
- [x] JWT Authentication
- [x] Refresh Tokens
- [x] Redis Rate Limiting
- [x] OTP Password Recovery
- [x] RBAC Middleware

---

## 🚧 In Progress

- [ ] Socket.io Chat
- [ ] Redis Pub/Sub
- [ ] Kanban Boards
- [ ] AI Integrations
- [ ] Collaborative Documents
- [ ] File Uploads
- [ ] RabbitMQ Workers
- [ ] Notifications
- [ ] SaaS Billing
- [ ] Production Deployment

---

# 📚 Future Improvements

- AWS S3 Storage
- Kubernetes Deployment
- CI/CD Pipelines
- Monitoring & Logging
- Distributed Services
- Mobile Application
- Electron Desktop Client

---

# 📄 License

This project is licensed under the **MIT License**.

See the **LICENSE** file for more information.