# NexusHub API Documentation

> **Base URL (local):** `http://localhost:5000`  
> **Base URL (production):** `https://api.nexushub.io` *(replace when deployed)*  
> **API Version:** `v1` — All routes are prefixed with `/api`  
> **Content-Type:** `application/json` (all requests and responses)

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
  - [Token Strategy](#token-strategy)
  - [Rate Limiting](#rate-limiting)
  - [Error Format](#error-format)
- [Endpoints](#endpoints)
  - [System](#system)
    - [GET /api/health](#get-apihealth)
  - [Auth — Identity & Session](#auth--identity--session)
    - [POST /api/auth/register](#post-apiauthregister)
    - [POST /api/auth/login](#post-apiauthlogin)
    - [POST /api/auth/forgot-password](#post-apiauthforgot-password)
    - [POST /api/auth/reset-password](#post-apiauthreset-password)
    - [GET /api/auth/me](#get-apiauthme)
- [Response Schemas](#response-schemas)
- [Adding New Endpoints](#adding-new-endpoints)

---

## Overview

NexusHub exposes a RESTful JSON API built on **Express 5**, backed by **PostgreSQL** via the Prisma ORM. The API currently covers:

| Domain | Prefix | Status |
|--------|--------|--------|
| System health | `/api/health` | ✅ Live |
| Authentication | `/api/auth` | ✅ Live |
| Workspaces | `/api/workspaces` | 🚧 Planned |
| Channels & Messaging | `/api/channels` | 🚧 Planned |
| Tasks | `/api/tasks` | 🚧 Planned |
| Documents | `/api/documents` | 🚧 Planned |
| Files | `/api/files` | 🚧 Planned |
| Notifications | `/api/notifications` | 🚧 Planned |

---

## Authentication

### Token Strategy

NexusHub uses a **dual-token** (Access + Refresh) JWT strategy:

| Token | Location | Lifetime | Purpose |
|-------|----------|----------|---------|
| `accessToken` | `Authorization` header (`Bearer <token>`) | **15 minutes** | Authenticate API requests |
| `refreshToken` | `HttpOnly` cookie (`refreshToken`) | **7 days** | Obtain new access tokens silently |

**Sending the access token:**

```http
Authorization: Bearer <accessToken>
```

**JWT Payload shape** (decoded):

```json
{
  "id": "uuid-of-user",
  "iat": 1720000000,
  "exp": 1720000900
}
```

> **Security note:** The `refreshToken` cookie is `HttpOnly`, `SameSite=Strict` (login) / `SameSite=Lax` (OAuth), and `Secure` in production. It is never accessible via JavaScript.

---

### Rate Limiting

Sensitive auth endpoints are protected by a **Redis-backed rate limiter**.

| Limit | Window | Applies To |
|-------|--------|------------|
| **5 requests** per IP | 15 minutes | `POST /api/auth/register` `POST /api/auth/login` `POST /api/auth/forgot-password` `POST /api/auth/reset-password` |

When the limit is exceeded:

```json
HTTP 429 Too Many Requests

{
  "success": false,
  "message": "Too many login attempts, please try again after 15 minutes"
}
```

Standard rate-limit headers (`RateLimit-*`) are included in every response from these endpoints.

---

### Error Format

All error responses follow this envelope:

```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

In development, an additional `stack` field (string) is included for debugging. In production, it is redacted.

---

## Endpoints

---

### System

---

#### `GET /api/health`

> Verifies the API server is reachable and operational. Used by load balancers, uptime monitors, and CI pipelines.

**Authentication required:** No  
**Rate limited:** No

**Request**

```http
GET /api/health HTTP/1.1
Host: localhost:5000
```

**Response — `200 OK`**

```json
{
  "status": "ok"
}
```

**Example (curl)**

```bash
curl http://localhost:5000/api/health
```

---

### Auth — Identity & Session

All authentication routes live under `/api/auth`.

---

#### `POST /api/auth/register`

> Creates a new user account. The password is hashed with bcrypt (cost factor 12) before storage. Returns the created user's ID and email upon success.

**Authentication required:** No  
**Rate limited:** Yes — 5 requests / 15 min per IP

**Request Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | `string` | ✅ | Non-empty |
| `email` | `string` | ✅ | Valid email format, must be unique |
| `password` | `string` | ✅ | Non-empty (enforce min-length on the client) |

```json
{
  "name": "Hassan Khalid",
  "email": "hassan@example.com",
  "password": "mysecretpassword"
}
```

**Response — `201 Created`**

```json
{
  "success": true,
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "hassan@example.com"
}
```

**Error Responses**

| Status | Cause |
|--------|-------|
| `400 Bad Request` | Malformed request body |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Email already taken (Prisma unique constraint violation — will return a generic 500 until a conflict handler is added) |

**Example (curl)**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Hassan Khalid","email":"hassan@example.com","password":"mysecretpassword"}'
```

---

#### `POST /api/auth/login`

> Authenticates an existing user with email + password. On success, creates a server-side session in the database, sets the `refreshToken` as an `HttpOnly` cookie, and returns a short-lived `accessToken` in the JSON body.

**Authentication required:** No  
**Rate limited:** Yes — 5 requests / 15 min per IP

**Request Body**

| Field | Type | Required |
|-------|------|----------|
| `email` | `string` | ✅ |
| `password` | `string` | ✅ |

```json
{
  "email": "hassan@example.com",
  "password": "mysecretpassword"
}
```

**Response — `200 OK`**

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

A `Set-Cookie` header is also returned:

```
Set-Cookie: refreshToken=<token>; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800
```

*(Cookie is `Secure` in production)*

**Error Responses**

| Status | Cause |
|--------|-------|
| `401 Unauthorized` | Email not found or password mismatch |
| `429 Too Many Requests` | Rate limit exceeded |

**Example (curl)**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"hassan@example.com","password":"mysecretpassword"}'
```

> **Note:** The `-c cookies.txt` flag stores the `refreshToken` cookie for later use.

---

#### `POST /api/auth/forgot-password`

> Initiates the password-reset flow. Generates a cryptographically secure 6-digit OTP and sends it to the user's email address via SMTP. The OTP expires after **15 minutes**.
>
> To prevent **email enumeration attacks**, the response is identical whether the email exists in the database or not.

**Authentication required:** No  
**Rate limited:** Yes — 5 requests / 15 min per IP

**Request Body**

| Field | Type | Required |
|-------|------|----------|
| `email` | `string` | ✅ |

```json
{
  "email": "hassan@example.com"
}
```

**Response — `200 OK`** *(always, regardless of whether email exists)*

```json
{
  "success": true,
  "message": "If an account exists, an OTP has been sent."
}
```

**Error Responses**

| Status | Cause |
|--------|-------|
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | SMTP delivery failure |

**Example (curl)**

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"hassan@example.com"}'
```

---

#### `POST /api/auth/reset-password`

> Verifies the OTP received via email and sets a new password. On success, the OTP is invalidated and **all active sessions for that user are deleted**, forcing re-login on all devices.

**Authentication required:** No  
**Rate limited:** Yes — 5 requests / 15 min per IP

**Request Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | `string` | ✅ | Must match the email the OTP was sent to |
| `otp` | `string` | ✅ | 6-digit code from the email |
| `newPassword` | `string` | ✅ | Non-empty |

```json
{
  "email": "hassan@example.com",
  "otp": "482917",
  "newPassword": "mynewsecretpassword"
}
```

**Response — `200 OK`**

```json
{
  "success": true,
  "message": "Password has been reset successfully."
}
```

**Error Responses**

| Status | Cause |
|--------|-------|
| `400 Bad Request` | OTP is invalid, already used, or expired |
| `429 Too Many Requests` | Rate limit exceeded |

**Example (curl)**

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"hassan@example.com","otp":"482917","newPassword":"mynewsecretpassword"}'
```

---

#### `GET /api/auth/me`

> Returns the decoded JWT payload of the currently authenticated user. This endpoint is protected — a valid `accessToken` must be present in the `Authorization` header.

**Authentication required:** ✅ Yes (`Bearer <accessToken>`)  
**Rate limited:** No

**Request**

```http
GET /api/auth/me HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response — `200 OK`**

```json
{
  "success": true,
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "iat": 1720000000,
    "exp": 1720000900
  }
}
```

> **Note:** This endpoint currently returns the raw decoded JWT payload, not a full user profile from the database. A dedicated `/me` route that fetches the full profile (`name`, `email`, `avatar_url`, etc.) from the database is recommended for production.

**Error Responses**

| Status | Cause |
|--------|-------|
| `401 Unauthorized` | Missing `Authorization` header, or token is invalid / expired |

**Example (curl)**

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_access_token>"
```

---

## Response Schemas

### `SuccessEnvelope`

```typescript
{
  success: true;
  // Additional data fields specific to each endpoint
}
```

### `ErrorEnvelope`

```typescript
{
  success: false;
  message: string;       // Human-readable error
  stack?: string;        // Stack trace (development only)
}
```

### `User` (JWT payload shape, from `/api/auth/me`)

```typescript
{
  id:    string;   // UUID
  iat:   number;   // Issued at (Unix timestamp)
  exp:   number;   // Expires at (Unix timestamp)
}
```

### `AccessToken`

```typescript
{
  success: true;
  accessToken: string;  // Signed JWT, 15-minute lifetime
}
```

---

## Adding New Endpoints

Follow this checklist when adding a new route to the API:

### 1 — Create the Controller

```
apps/api/src/controllers/<domain>.controller.ts
```

Export one async function per endpoint. Always accept `(req, res, next)` and call `next(error)` inside `catch` blocks so the global error handler picks it up.

```typescript
export const myHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // business logic
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
```

### 2 — Create / Update the Router

```
apps/api/src/routes/<domain>.ts
```

```typescript
import { Router } from 'express';
import { myHandler } from '../controllers/<domain>.controller';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

router.get('/my-route', requireAuth, myHandler);

export default router;
```

### 3 — Mount the Router in `index.ts`

```typescript
import myRouter from './routes/<domain>';
app.use('/api/<domain>', myRouter);
```

### 4 — Document It Here

Add a new `###` section under the appropriate domain heading above. Follow the existing format:

- Method badge & path
- Description paragraph
- Authentication / rate-limit flags
- Request body table + JSON example
- Response examples for success and all error cases
- `curl` example

---

*Last updated: 2026-07-09 — NexusHub API v1*
