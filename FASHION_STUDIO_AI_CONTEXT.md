# Fashion Studio — AI Agent Context Document

> Attach this document at the start of every session.
> This document gives you full context of the project: what is being built, every decision made, patterns used, what is complete, and what remains.

---

## 1. Project Overview

A full-stack web application for a fashion design business. The business has three models:

**Model 1 — Client Brings Fabric**
The client provides her own fabric, selects a curated style or submits a custom style (description + reference images), and gets her garment sewn. Payment is in full or installments — first installment on agreement, final installment before pickup/delivery.

**Model 2 — Designer Sources Fabric**
Same as Model 1 but the designer sources and prices the fabric. The admin proposes a fee (including fabric cost) before work begins. Same payment structure.

**Model 3 — Ready-to-Wear**
Client purchases a pre-made garment from a collection. Fixed prices. Full payment only.

**Target Users:**

- Clients: Female, ages 17–50, average tech-savviness, local and national (Nigeria), walk-in, referral, and online discovery
- Super Admin: Business owner, full access to everything including financials
- Staff Admin: Team members, access to all operations except financials and payment confirmation

**Scale:** Small team, ~20 active projects at a time, built to scale.

---

## 2. Tech Stack

| Layer               | Technology                                         | Version / Notes                                                |
| ------------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| Frontend            | Next.js (App Router)                               | v14+, JavaScript (not TypeScript)                              |
| Styling             | Tailwind CSS + Shadcn/ui                           | Initialized with Default style, Slate base                     |
| Backend             | Node.js + Express.js                               | Express v5 — async errors caught automatically                 |
| Database            | PostgreSQL (local for dev, Railway for production) |                                                                |
| ORM                 | Prisma                                             | v7.4.1 — has major breaking changes from v6, see Section 6     |
| Authentication      | JWT + bcrypt (credentials) + Passport.js (OAuth)   |                                                                |
| File Storage        | Cloudinary                                         | Images uploaded via multer memory storage + upload_stream      |
| CSV Export          | fast-csv                                           | Streamed directly to response                                  |
| PDF Export          | pdfkit                                             | Streamed directly to response — manual table rendering         |
| File Upload Parsing | multer                                             | Memory storage only — no disk writes                           |
| Real-time           | SSE (Server-Sent Events)                           | Persistent HTTP connection, no WebSockets needed               |
| Payments (MVP)      | Manual bank transfer + admin confirmation          | No Paystack yet                                                |
| Payments (Post-MVP) | Paystack                                           | Nigerian market                                                |
| Email               | Nodemailer + SMTP (Resend as relay)                | Branded HTML templates, errors swallowed                       |
| WhatsApp            | Twilio                                             | Key milestone alerts + appointment confirmations/cancellations |
| Frontend Hosting    | Vercel                                             |                                                                |
| Backend Hosting     | Railway or Render                                  |                                                                |

**Language:** JavaScript throughout — NO TypeScript anywhere in this project.

**Module System:** ESM (`import`/`export`) throughout the backend. Required by Prisma 7.

---

## 3. Repository Structure

```
fashion-studio/               <- monorepo root
├── frontend/                 <- Next.js app
├── backend/                  <- Node.js + Express API
├── backend-tests/            <- Vitest + Supertest testing suite
└── UI_UX_Design.md           <- Strict design mandate for frontend
```

### Backend Structure

```
backend/
├── prisma/
│   ├── generated/prisma/          <- auto-generated Prisma client, NEVER edit manually
│   ├── migrations/                <- auto-generated migration history, NEVER edit manually
│   ├── schema.prisma              <- single source of truth for database schema
│   └── seed.js                    <- seeds the Super Admin account
├── prisma.config.js               <- Prisma 7 config — at backend/ ROOT (not inside prisma/)
├── src/
│   ├── config/
│   │   ├── prisma.js              <- Prisma client singleton (import this everywhere)
│   │   └── passport.js            <- Passport.js OAuth strategy configuration
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── oauth.controller.js
│   │   ├── measurement.controller.js
│   │   ├── appointment.controller.js
│   │   ├── style.controller.js
│   │   ├── readyToWear.controller.js
│   │   ├── portfolio.controller.js
│   │   ├── imageManagement.controller.js
│   │   ├── order.controller.js
│   │   ├── payment.controller.js
│   │   ├── user.controller.js
│   │   ├── chat.controller.js
│   │   └── notification.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── errorHandler.js
│   │   ├── validate.js
│   │   └── upload.middleware.js
│   ├── routes/
│   │   ├── index.js               <- central router, mounts all feature routers
│   │   ├── auth.routes.js
│   │   ├── oauth.routes.js
│   │   ├── measurement.routes.js
│   │   ├── appointment.routes.js
│   │   ├── style.routes.js        <- includes PATCH /:id/images
│   │   ├── readyToWear.routes.js  <- includes PATCH /:id/images
│   │   ├── portfolio.routes.js    <- includes PATCH /:id/images
│   │   ├── order.routes.js        <- client order routes
│   │   ├── adminOrder.routes.js   <- admin order routes
│   │   ├── payment.routes.js      <- client payment routes
│   │   ├── adminPayment.routes.js <- admin payment routes (SUPER_ADMIN only)
│   │   ├── sse.routes.js          <- GET /sse — persistent SSE connection
│   │   ├── chat.routes.js         <- includes GET /admin/inbox
│   │   ├── notification.routes.js
│   │   └── user.routes.js         <- profile + /admin/clients CRUD + online status (mounted at /users)
│   ├── services/
│   │   ├── cloudinary.service.js
│   │   ├── email.service.js       <- nodemailer + Resend SMTP, errors swallowed
│   │   ├── notification.service.js <- internal service called by other controllers
│   │   └── whatsapp.service.js    <- Twilio, errors swallowed
│   ├── utils/
│   │   ├── AppError.js
│   │   ├── apiResponse.js
│   │   ├── tokens.js
│   │   ├── oauthHandler.js
│   │   ├── measurementDiff.js
│   │   ├── csvExport.js
│   │   ├── cloudinaryPublicId.js
│   │   ├── orderNumber.js
│   │   ├── paymentExport.js       <- exportPaymentsToCSV, exportPaymentsToPDF
│   │   ├── emailTemplates.js      <- branded HTML templates for all email types
│   │   └── sseManager.js          <- addClient, removeClient, sendToUser, sendToUsers, isUserOnline, getOnlineUserIds
│   ├── validators/
│   │   ├── auth.validators.js
│   │   ├── measurement.validators.js
│   │   ├── catalog.validators.js
│   │   ├── order.validators.js
│   │   └── payment.validators.js
│   ├── app.js
│   └── index.js
├── .env
├── .env.example
├── nodemon.json
└── package.json
```

### Frontend Structure

```
frontend/src/
├── app/
│   ├── (public)/             <- no auth required (homepage, catalog, testimonials)
│   ├── (auth)/               <- login, signup, forgot-password
│   ├── (client)/             <- client dashboard (auth required)
│   └── (admin)/              <- admin panel (admin auth required)
├── components/
│   ├── ui/                   <- Shadcn components
│   ├── layout/               <- Navbar, Footer, Sidebar
│   ├── forms/
│   └── shared/
├── lib/
│   ├── api.js                <- Axios instance
│   ├── auth.js               <- auth helpers
│   └── utils.js
├── hooks/
├── context/
│   └── AuthContext.jsx       <- global auth state
└── config/
    └── branding.js           <- all brand placeholder variables
```

---

## 4. Environment Variables

### backend/.env

```
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/fashion_studio"
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USER=resend
EMAIL_PASS=your_resend_api_key
EMAIL_FROM=hello@yourstudio.com
EMAIL_FROM_NAME=Fashion Studio
PRIMARY_COLOR=#C2185B

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=whatsapp:+234xxxxxxxxxx

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
```

### frontend/.env.local

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 5. Database Schema (Prisma)

### Enums

```
Role:               CLIENT | STAFF_ADMIN | SUPER_ADMIN
AuthProvider:       LOCAL | GOOGLE | FACEBOOK | TWITTER
Sex:                MALE | FEMALE | OTHER
OrderType:          MODEL_1 | MODEL_2 | MODEL_3
FulfillmentMethod:  PICKUP | DELIVERY
OrderStatus:        PENDING_REVIEW | AWAITING_CLIENT_RESPONSE | AGREED_AWAITING_PAYMENT |
                    IN_PROGRESS | CUTTING | SEWING | FINISHING | AWAITING_FINAL_PAYMENT |
                    READY_FOR_PICKUP | OUT_FOR_DELIVERY | COMPLETED | CANCELLED
PaymentStatus:      PENDING | CONFIRMED | REJECTED
PaymentType:        INSTALLMENT | FULL
TestimonialStatus:  PENDING | APPROVED | REJECTED
TestimonialSource:  CLIENT_SUBMITTED | ADMIN_ADDED
AppointmentStatus:  REQUESTED | CONFIRMED | COMPLETED | CANCELLED
NotificationType:   ORDER_PLACED | ORDER_STATUS_UPDATED | PROJECT_STARTED |
                    READY_FOR_PICKUP | PAYMENT_CONFIRMED | PAYMENT_REJECTED |
                    NEW_MESSAGE | MEASUREMENT_APPOINTMENT | ACCOUNT_CREATED
```

### Models Summary

| Model                  | Key Fields                                                                                                                                                                                                                                                                                                                                                                                     | Notes                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| User                   | id (cuid), fullName, email (unique), phone, sex, role, authProvider, providerId, passwordHash (nullable), refreshToken (hashed), refreshTokenExpiry, isEmailVerified                                                                                                                                                                                                                           | passwordHash null for OAuth users                                    |
| Measurement            | id, clientId, bust/waist/hips/etc (all Float?), customParams (Json?), disclaimerSignedAt, updatedByRole, notes                                                                                                                                                                                                                                                                                 | All in cm. One record per client (app-enforced).                     |
| MeasurementHistory     | id, measurementId, clientId, changedFields (Json), updatedById, updatedByRole, updatedByName, disclaimerSignedAt?, notes?                                                                                                                                                                                                                                                                      | changedFields: `{ bust: { from: 88, to: 90 } }`                      |
| Style                  | id, name, description, category, images (String[]), availableForModel1, availableForModel2, isFeatured, isActive                                                                                                                                                                                                                                                                               | Soft delete via isActive                                             |
| ReadyToWear            | id, name, price (Decimal), category, images (String[]), availableSizes (String[]), fabricDetails?, careInstructions?, stockStatus, stockCount, isFeatured, isActive                                                                                                                                                                                                                            | stockStatus auto-calculated from stockCount                          |
| OrderItem              | id, orderId, readyToWearId, selectedSize, quantity, priceAtPurchase (Decimal)                                                                                                                                                                                                                                                                                                                  | Cascade delete with order. Links to ReadyToWear.                     |
| Order                  | id, orderNumber (unique, ORD-YYYY-XXXX), clientId, createdByAdminId (nullable), orderType, styleId?, customStyleDescription?, customStyleImages (String[]), clientProvidesFabric, fabricNotes?, measurementId?, fulfillmentMethod, deliveryAddress?, deliveryFee (Decimal?), totalAgreedFee (Decimal?), totalPaid (Decimal, default 0), status, clientNotes?, adminNotes?, cancellationReason? | createdByAdminId set when admin creates on behalf of client          |
| OrderStatusHistory     | id, orderId, status, changedById, note?, createdAt                                                                                                                                                                                                                                                                                                                                             | Full audit trail. Cascade delete.                                    |
| Payment                | id, orderId, clientId, amount (Decimal), paymentType, proofUrl? (Cloudinary URL), status, confirmedById?, confirmedAt?, rejectionReason?, notes?                                                                                                                                                                                                                                               | Super Admin only confirms                                            |
| ChatMessage            | id, orderId, senderId, senderRole, message?, attachments (String[]), isRead, readAt?                                                                                                                                                                                                                                                                                                           | Cascade delete with order                                            |
| Notification           | id, userId, type (NotificationType), title, message, isRead, relatedOrderId?                                                                                                                                                                                                                                                                                                                   |                                                                      |
| Testimonial            | id, clientId? (nullable), clientName, rating (1-5), review, photoUrl?, source, status, isFeatured                                                                                                                                                                                                                                                                                              | clientId null for admin-added offline testimonials                   |
| Portfolio              | id, orderId (unique), title?, description?, category, images (String[]), clientConsent, isFeatured, isPublished                                                                                                                                                                                                                                                                                | One-to-one with Order. Public only if isPublished AND clientConsent. |
| MeasurementAppointment | id, clientId, requestedDate?, confirmedDate?, status, clientNotes?, adminNotes?                                                                                                                                                                                                                                                                                                                | State machine: REQUESTED -> CONFIRMED -> COMPLETED or CANCELLED      |

### Key Relationships

- User -> Measurements: one-to-many (one-per-client enforced in app logic)
- Measurement -> MeasurementHistory: one-to-many (cascade delete)
- User -> Orders (as client): one-to-many via `clientId`
- User -> Orders (as creating admin): one-to-many via `createdByAdminId`, named relation `"AdminCreatedOrders"`
- User -> Payments: two named relations (ClientPayments, ConfirmedByAdmin)
- Order -> OrderItems: one-to-many (cascade delete)
- ReadyToWear -> OrderItems: one-to-many
- Order -> Payments: one-to-many
- Order -> ChatMessages: one-to-many (cascade delete)
- Order -> OrderStatusHistory: one-to-many (cascade delete)
- Order -> Portfolio: one-to-one
- Order -> Notifications: one-to-many
- User -> User: self-relation "AdminCreatedClients"

---

## 6. Prisma 7 — Critical Breaking Changes (Already Resolved)

| Change                              | How we handled it                                                           |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `prisma-client-js` provider removed | Using `prisma-client` in schema.prisma                                      |
| `output` field now required         | Set to `./generated/prisma`                                                 |
| `url` removed from datasource block | Moved to `prisma.config.js`                                                 |
| New `prisma.config.js` required     | Created at `backend/prisma.config.js` (root of backend, NOT inside prisma/) |
| Client import path changed          | Import from `'../prisma/generated/prisma/client.js'` NOT `@prisma/client`   |
| Driver adapter required             | Using `@prisma/adapter-pg` with `pg`                                        |
| ESM required                        | `"type": "module"` in package.json                                          |
| Seed no longer in package.json      | Configured in `prisma.config.js` under `migrations.seed`                    |
| dotenv not auto-loaded              | `import 'dotenv/config'` in both `prisma.config.js` and `seed.js`           |

### schema.prisma top section:

```prisma
generator client {
  provider = "prisma-client"
  output   = "./generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

### src/config/prisma.js:

```javascript
import { PrismaClient } from "../prisma/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default prisma;
```

### prisma.config.js (at backend/ root):

```javascript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: { url: env("DATABASE_URL") },
});
```

---

## 7. Authentication System

### Two-Token Strategy

**Access Token:** Short-lived JWT (15 min), `{ userId, role }`, signed with `JWT_SECRET`.
Returned in response body. Client stores in memory only. Sent as `Authorization: Bearer <token>`.

**Refresh Token:** Long-lived JWT (7 days), `{ userId }`, signed with `JWT_REFRESH_SECRET`.
Set as `httpOnly` cookie. Also stored bcrypt-hashed in `users.refreshToken` + expiry in `users.refreshTokenExpiry`.
Rotated on every use.

**Logout:** Clears DB fields + clears cookie.

### OAuth (Passport.js)

Providers: Google, Facebook, Twitter/X. Instagram NOT supported.
After OAuth: redirect to `FRONTEND_URL/auth/callback?token=<accessToken>`.
Account linking: OAuth email matching existing account links them (no duplicate).
`session: false` everywhere — JWTs only.

---

## 8. Coding Patterns & Conventions

### Error Handling

```javascript
import AppError from "../utils/AppError.js";
throw new AppError("Not found", 404);
throw new AppError("Already exists", 409);
throw new AppError("Unauthorized", 401);
throw new AppError("Forbidden", 403);
```

Express 5 catches all thrown errors automatically. All flow to `middleware/errorHandler.js`.

### Response Shape

```javascript
import { successResponse } from "../utils/apiResponse.js";
return successResponse(res, 200, "Success message", { data });
return successResponse(res, 201, "Created", { item });
```

Success: `{ "success": true, "message": "...", "data": { ... } }`
Error: `{ "success": false, "message": "..." }`

### Validation

Zod schemas in `src/validators/`. Apply via `validate()` middleware.
Controllers ALWAYS read from `req.validatedBody`, NEVER `req.body`.

For cross-field validation use `superRefine`:

```javascript
.superRefine((data, ctx) => {
  if (data.orderType === 'MODEL_3' && !data.readyToWearId) {
    ctx.addIssue({ path: ['readyToWearId'], message: 'Required for Model 3 orders', code: z.ZodIssueCode.custom });
  }
});
```

### Route Protection

```javascript
router.get("/x", authenticate, handler);
router.delete("/x", authenticate, authorise("SUPER_ADMIN"), handler);
router.put(
  "/x",
  authenticate,
  authorise("SUPER_ADMIN", "STAFF_ADMIN"),
  handler,
);

// Bulk middleware on all routes in a router file:
router.use(authenticate, authorise("STAFF_ADMIN", "SUPER_ADMIN"));
```

### Prisma Usage

Always import singleton. Never `new PrismaClient()` in files.

```javascript
import prisma from "../config/prisma.js";

await prisma.user.findUnique({
  where: { id },
  select: { id: true, role: true },
});

// Parallel queries for performance
const [total, items] = await Promise.all([
  prisma.model.count({ where }),
  prisma.model.findMany({ where, skip, take }),
]);

// Dynamic model access
await prisma[modelName].findUnique({ where: { id } });

// Aggregate functions
const result = await prisma.payment.aggregate({
  where: { orderId, status: "CONFIRMED" },
  _sum: { amount: true },
  _count: { id: true },
});

// Group by
const rows = await prisma.payment.groupBy({
  by: ["status"],
  where,
  _sum: { amount: true },
  _count: { id: true },
});

// notIn filter
where.status = { notIn: ["CANCELLED", "COMPLETED"] };
```

### Pagination Pattern

```javascript
const { page = 1, limit = 20 } = req.query;
const skip = (parseInt(page) - 1) * parseInt(limit);
const take = parseInt(limit);

const [total, items] = await Promise.all([
  prisma.model.count({ where }),
  prisma.model.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
]);

return successResponse(res, 200, "Retrieved", {
  total,
  page: parseInt(page),
  totalPages: Math.ceil(total / take),
  items,
});
```

### Sensitive Data

Always strip before sending to client:

```javascript
const { passwordHash, refreshToken, refreshTokenExpiry, ...safeUser } = user;
```

### Route Ordering Rule

Specific routes BEFORE dynamic routes:

```javascript
router.get("/export", handler); // specific first
router.get("/:id/online", handler); // more specific dynamic before less specific
router.get("/:id", handler); // catch-all dynamic last
```

### 404 Instead of 403 for Client Data Isolation

```javascript
if (order.clientId !== req.user.userId) {
  throw new AppError("Order not found", 404); // NOT 403 — don't confirm resource exists
}
```

### State Machine Pattern

```javascript
const ORDER_STATUS_TRANSITIONS = {
  PENDING_REVIEW: [
    "AWAITING_CLIENT_RESPONSE",
    "AGREED_AWAITING_PAYMENT",
    "CANCELLED",
  ],
  AWAITING_CLIENT_RESPONSE: ["AGREED_AWAITING_PAYMENT", "CANCELLED"],
  AGREED_AWAITING_PAYMENT: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["CUTTING", "CANCELLED"],
  CUTTING: ["SEWING", "CANCELLED"],
  SEWING: ["FINISHING", "CANCELLED"],
  FINISHING: [
    "AWAITING_FINAL_PAYMENT",
    "READY_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "CANCELLED",
  ],
  AWAITING_FINAL_PAYMENT: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_PICKUP: ["COMPLETED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [], // terminal
  CANCELLED: [], // terminal
};

if (!ORDER_STATUS_TRANSITIONS[order.status].includes(newStatus)) {
  throw new AppError(
    `Cannot transition from ${order.status} to ${newStatus}`,
    400,
  );
}
```

### CSV Streaming

```javascript
// Use fast-csv, pipe directly to res — do NOT use successResponse()
csvStream.pipe(res);
```

### PDF Streaming

```javascript
// Use pdfkit, pipe directly to res — no temp files
const doc = new PDFDocument({ margin: 40, size: "A4" });
doc.pipe(res);
// ... draw content ...
doc.end(); // flush to response
```

### File Upload Middleware Order

```javascript
router.post('/', authenticate, authorise(...), uploadMultiple('images'), validate(schema), controller);
// Multer MUST run before validate — req.body is empty until multer parses multipart data
```

### Multipart Form Data String Transforms

```javascript
isFeatured: z.string().transform((val) => val === 'true').default('false'),
price: z.string().transform((val) => parseFloat(val)).refine((val) => !isNaN(val) && val > 0),
availableSizes: z.string().transform((val) => JSON.parse(val)),
```

### Cloudinary Upload Pattern

```javascript
import { uploadMultipleImages } from "../services/cloudinary.service.js";
const uploadResults = await uploadMultipleImages(req.files, "folder-name");
const imageUrls = uploadResults.map((r) => r.secure_url);
```

### Image Deletion Pattern

```javascript
import { deleteImages } from "../services/cloudinary.service.js";
// Validate URLs belong to the record first, then:
await deleteImages(urlsToDelete); // Promise.allSettled — failures logged, don't throw
```

### Stock Status Auto-Calculation

```javascript
const stockStatus =
  stockCount > 10 ? "IN_STOCK" : stockCount > 0 ? "LOW_STOCK" : "OUT_OF_STOCK";
```

### Order Number Generation

```javascript
import { generateOrderNumber } from "../utils/orderNumber.js";
const orderNumber = await generateOrderNumber(); // "ORD-2026-0001"
// Finds last order number for the year and increments — gap-safe (not count-based)
```

### totalPaid Recalculation

```javascript
// NEVER store totalPaid as a running total — always recalculate from source of truth
const result = await prisma.payment.aggregate({
  where: { orderId, status: "CONFIRMED" },
  _sum: { amount: true },
});
const totalPaid = result._sum.amount ?? 0;
await prisma.order.update({ where: { id: orderId }, data: { totalPaid } });
```

### Admin-Created Order Labelling

Set `createdByAdminId: req.user.userId` when admin creates on behalf of a client.
NEVER mutate `req.user` to impersonate a client — pass `clientId` explicitly.
Include `createdByAdmin` in `fullOrderInclude` for "Created by admin" badge on frontend.

### Quote Negotiation Flow

```
Admin sets quote -> AWAITING_CLIENT_RESPONSE
Client declines (PUT /orders/:id/decline-quote) -> PENDING_REVIEW (note in status history)
Admin sees note, sets new quote -> AWAITING_CLIENT_RESPONSE
Repeat until client accepts (PUT /orders/:id/accept-quote) -> AGREED_AWAITING_PAYMENT
```

Admin can re-quote from PENDING_REVIEW or AWAITING_CLIENT_RESPONSE.

### SSE Real-Time Pattern

```javascript
// Server: register connection
addClient(userId, res);
res.write(`event: ${eventType}\n`);
res.write(`data: ${JSON.stringify(data)}\n\n`);

// Push to specific user
sendToUser(userId, 'notification', { ... });

// Push to multiple users
sendToUsers([clientId, ...adminIds], 'chat_message', { ... });

// Check online status
const online = isUserOnline(userId);
```

### Notification Service Pattern

Notifications are always persisted to DB first, then SSE-pushed if user is connected.
SSE push is best-effort — if user is offline, DB record ensures they see it on next login.

```javascript
// Internal service — called by other controllers, not an HTTP endpoint
import { notifyOrderPlaced, notifyOrderStatusChanged, ... } from '../services/notification.service.js';
await notifyOrderPlaced({ order, client });
```

### Email Pattern

Nodemailer + Resend SMTP. Errors are swallowed (logged but never thrown).
A failed email must never crash a payment confirmation or order status update.
All emails use branded HTML templates from `src/utils/emailTemplates.js`.
`PRIMARY_COLOR` and `EMAIL_FROM_NAME` come from env vars — update `.env` to change branding.

```javascript
import { sendEmail } from "../services/email.service.js";
import { orderPlacedTemplate } from "../utils/emailTemplates.js";

await sendEmail({
  to: client.email,
  subject: `Order Received — ${order.orderNumber}`,
  html: orderPlacedTemplate({
    clientName: client.fullName,
    orderNumber: order.orderNumber,
  }),
});
```

In development (`NODE_ENV=development`), emails are logged to console only — not sent.

### WhatsApp Pattern

Twilio. Errors are swallowed (logged but never thrown).
WhatsApp fires on: IN_PROGRESS, READY_FOR_PICKUP, OUT_FOR_DELIVERY, COMPLETED, appointment CONFIRMED, appointment CANCELLED.

```javascript
import { sendWhatsApp } from "../services/whatsapp.service.js";
await sendWhatsApp({ to: client.phone, body: `Hi ${client.fullName}! ...` });
```

In development, WhatsApp messages are logged to console only — not sent.

### Online Status Pattern

```javascript
import { isUserOnline, getOnlineUserIds } from "../utils/sseManager.js";

// In list endpoint — attach online status to each user
const clientsWithStatus = clients.map((c) => ({
  ...c,
  online: isUserOnline(c.id),
}));

// In dedicated status endpoint
const online = isUserOnline(req.params.id);
```

### User/Client Routes Note

Client management lives in `user.routes.js` — there is NO separate `client.routes.js`.
`user.routes.js` was a placeholder file in Phase 1 and was fully implemented in Phase 6.
It is mounted at `/users` in `routes/index.js`. Full paths: `/api/users/profile`, `/api/users/admin/clients/...`.

### File Naming Convention

- Controllers: `feature.controller.js`
- Routes: `feature.routes.js`
- Validators: `feature.validators.js`
- Middleware: `feature.middleware.js`
- Services: `feature.service.js`
- Utils: `camelCase.js`

### Import Style

Always ESM, always `.js` extension in relative imports:

```javascript
import prisma from "../config/prisma.js"; // correct
import prisma from "../config/prisma"; // WRONG — breaks in Node.js ESM
```

---

## 9. Key Decisions & Their Reasons

| Decision                                        | Reason                                                                                   |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| JavaScript over TypeScript                      | Learning-friendly, no build step                                                         |
| Prisma over raw pg                              | Schema-driven, auto-migration, Prisma Studio                                             |
| Express 5                                       | Async error handling built-in, no try/catch in controllers                               |
| ESM modules                                     | Required by Prisma 7                                                                     |
| Two-token auth                                  | Short access token limits theft window; httpOnly cookie for refresh                      |
| Refresh token hashed in DB                      | Supports revocation; DB compromise safe                                                  |
| Refresh token rotation                          | Limits stolen token window                                                               |
| `req.validatedBody`                             | Self-documenting; clear validation happened                                              |
| `AppError` class                                | Consistent errors with HTTP status codes                                                 |
| Central error handler                           | One place, consistent shape, no stack traces in production                               |
| One measurement record per client               | POST creates, PUT updates; history in separate table                                     |
| Diff-based history                              | Only changed fields with before/after stored                                             |
| Disclaimer for client self-updates              | Legal protection; `disclaimerSigned: true` + timestamp                                   |
| State machines for status                       | Prevents invalid transitions; terminal states enforced                                   |
| Soft deletes for catalog                        | `isActive: false`; items stay for order history references                               |
| Multer memory storage                           | No disk writes; buffer goes directly to Cloudinary; works on ephemeral filesystems       |
| Image append on update                          | Adding new photos doesn't require re-uploading existing ones                             |
| Image delete endpoint (PATCH /:id/images)       | Delete specific, add replacements, or both in one call                                   |
| Promise.allSettled for image deletion           | Cloudinary failures don't block DB update                                                |
| Portfolio clientConsent gate                    | Privacy/legal protection                                                                 |
| Portfolio anonymous public view                 | orderId and client details excluded from public responses                                |
| stockStatus auto-calculation                    | Derived from stockCount; admin can override manually                                     |
| Order number format ORD-YYYY-XXXX               | Human-readable, year-scoped, gap-safe increment                                          |
| Gap-safe order number generation                | findFirst + increment vs count + 1 — deletions don't break sequence                      |
| `createdByAdminId` on Order                     | Explicit, queryable label for admin-created orders                                       |
| Quote negotiation via decline endpoint          | Client can decline with note; full trail in OrderStatusHistory                           |
| 404 instead of 403 for cross-client access      | Doesn't confirm resource exists to unauthorized users                                    |
| Pagination with parallel count + data           | count() and findMany() run simultaneously via Promise.all                                |
| Separate client/admin order/payment route files | Clean separation; router.use() for bulk auth                                             |
| totalPaid recalculated from payments            | Aggregate sum is always accurate; running total risks drift                              |
| Pending payment duplicate prevention            | One PENDING payment per order at a time                                                  |
| Offline payment auto-confirmed                  | Admin is affirming they received it in person; no proof needed                           |
| SSE over WebSockets                             | One-way server push is all that's needed; simpler, no extra infra, works on Railway      |
| SSE heartbeat every 25 seconds                  | Keeps connection alive through proxies; cost is negligible at this scale                 |
| SSE connection per tab (Set per userId)         | Multi-tab support; each tab gets its own connection                                      |
| `X-Accel-Buffering: no` on SSE                  | Prevents Nginx from buffering the stream on Railway                                      |
| Notifications persisted before SSE push         | DB is durable source of truth; SSE is best-effort real-time layer                        |
| Email errors swallowed                          | Email failure must never crash a business operation                                      |
| WhatsApp errors swallowed                       | Same reason as email                                                                     |
| Branded email templates                         | PRIMARY_COLOR and EMAIL_FROM_NAME from env — one change updates all emails               |
| Nodemailer + Resend SMTP (not direct send)      | Resend provides deliverability, DKIM/SPF, bounce handling; Nodemailer is just the client |
| WhatsApp for high-importance milestones only    | Avoids message fatigue; reserved for actionable updates                                  |
| WhatsApp on appointment confirm/cancel          | Client needs to know promptly; appointment is time-sensitive                             |

| Client management in user.routes.js | No separate client.routes.js — user.routes.js was always the right home |
| Online status on list endpoint | Attach isUserOnline() to every client in list — no extra query, just Map lookup |

---

## 10. Installed Packages

### Backend (package.json)

```json
{
  "type": "module",
  "dependencies": {
    "@prisma/adapter-pg": "^7.4.2",
    "bcryptjs": "^3.0.3",
    "cloudinary": "latest",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^17.3.1",
    "express": "^5.2.1",
    "fast-csv": "latest",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.3",
    "morgan": "^1.10.1",
    "multer": "latest",
    "nodemailer": "latest",
    "passport": "latest",
    "passport-facebook": "latest",
    "passport-google-oauth20": "latest",
    "passport-twitter": "latest",
    "pdfkit": "latest",
    "pg": "^8.19.0",
    "twilio": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "nodemon": "^3.1.14",
    "prisma": "^7.4.1"
  }
}
```

`@prisma/client` is NOT installed — client is generated locally by Prisma 7.

Next.js 14+ (JS), Tailwind CSS, Shadcn/ui, Axios, ESLint.

### Backend Tests (backend-tests/package.json)

Vitest, Supertest, cross-env, Prisma Client (for mocking).
Uses isolated environment variables to prevent accidental DB writes during unit tests.

---

## 11. Build Phases & Current Status

### ✅ Phase 1 — Foundation & Auth (COMPLETE)

- Express server with all middleware
- Prisma 7 fully configured — all breaking changes resolved
- Full database schema — all models, enums, relations, initial migration
- Super Admin seeded: `admin@fashionstudio.com` / `Admin@1234`
- Credentials auth: register, login, refresh (rotation), logout, getMe
- JWT + bcrypt two-token system with httpOnly cookie
- OAuth: Google, Facebook, Twitter + account linking
- Zod validation, authenticate + authorise middleware
- Frontend scaffolded: Next.js, Tailwind, Shadcn/ui, branding.js

---

### ✅ Phase 2 — Measurements System (COMPLETE)

- MeasurementHistory model added; migration run
- One record per client (POST blocked if exists — 409)
- Client self-update requires `disclaimerSigned: true`; timestamp stored
- Diff-based history — only changed fields with before/after
- No-op detection — skips DB write if nothing changed
- CSV export streamed via fast-csv
- Appointment state machine: REQUESTED -> CONFIRMED -> COMPLETED|CANCELLED

---

### ✅ Phase 3 — Catalog & Styles (COMPLETE)

- Cloudinary + multer integration
- Styles: CRUD, soft delete, category/model filtering
- Ready-to-wear: CRUD, size array filtering, stockStatus auto-calculation
- Portfolio: CRUD, clientConsent gate, anonymous public view
- Image management: PATCH /:id/images — delete specific, add new, or both
- All upload routes: authenticate -> authorise -> uploadMultiple -> validate -> controller

---

### ✅ Phase 4 — Orders (COMPLETE)

- Schema additions: `createdByAdminId` on Order
- Named relation: `"AdminCreatedOrders"`
- Order number generation: ORD-YYYY-XXXX (gap-safe)
- Status state machine with all valid transitions; COMPLETED and CANCELLED are terminal
- Every status change logged to OrderStatusHistory
- Quote flow: admin proposes -> client accepts or declines -> admin can re-quote
- Client decline stores negotiation note in OrderStatusHistory
- Model 3 orders decrease stockCount on creation
- Admin-created orders labelled via createdByAdminId
- Separate client routes (order.routes.js) and admin routes (adminOrder.routes.js)
- Pagination on admin list with parallel count + findMany

---

### ✅ Phase 5 — Payments (COMPLETE)

- Client proof submission with optional Cloudinary upload
- Duplicate pending payment prevention per order
- Amount validation against outstanding balance
- Admin confirm/reject with rejection reason
- Offline/cash payment logging (auto-confirmed immediately)
- `totalPaid` always recalculated via aggregate sum — never a running total
- Pending-first ordering on admin payments list
- CSV export via fast-csv
- PDF export via pdfkit — manual table with header, alternating rows, multi-page support, optional summary block
- Finance summary: total revenue, by payment type, by order type, outstanding orders — all parallel queries
- Separate client routes (payment.routes.js) and admin routes (adminPayment.routes.js)

---

### ✅ Phase 6 — Chat, Notifications, Real-time & Client Management (COMPLETE)

**Schema additions:** None — Phase 6 uses existing models (ChatMessage, Notification already in schema).

**New files:**

- `src/utils/sseManager.js` — Map<userId, Set<res>>, addClient, removeClient, sendToUser, sendToUsers, isUserOnline, getOnlineUserIds
- `src/routes/sse.routes.js` — GET /api/sse, heartbeat every 25s, X-Accel-Buffering: no
- `src/controllers/chat.controller.js` — getMessages, sendMessage, markAsRead, getAdminInbox
- `src/routes/chat.routes.js`
- `src/controllers/notification.controller.js` — getNotifications, markOneRead, markAllRead
- `src/routes/notification.routes.js`
- `src/services/notification.service.js` — notifyOrderPlaced, notifyOrderStatusChanged, notifyPaymentConfirmed, notifyPaymentRejected, notifyNewMessage, notifyAppointmentConfirmed, notifyAppointmentCancelled
- `src/services/email.service.js` — nodemailer + Resend SMTP, dev mode logs only
- `src/services/whatsapp.service.js` — Twilio, dev mode logs only
- `src/utils/emailTemplates.js` — baseTemplate + 6 specific templates, PRIMARY_COLOR from env
- `src/routes/user.routes.js` — FULLY IMPLEMENTED (was placeholder in Phase 1)

**Notification hooks wired into existing controllers:**

- `order.controller.js` — notifyOrderPlaced (createOrder), notifyOrderStatusChanged (updateOrderStatus)
- `payment.controller.js` — notifyPaymentConfirmed (confirmPayment), notifyPaymentRejected (rejectPayment)
- `appointment.controller.js` — notifyAppointmentConfirmed, notifyAppointmentCancelled (updateAppointment)

**Endpoints:**

SSE:

- `GET /api/sse` — persistent connection, authenticate via Bearer token, heartbeat 25s

Chat:

- `GET /api/chat/admin/inbox` — admin unified inbox with unread counts [admin] ← BEFORE /:orderId
- `GET /api/chat/:orderId` — messages for an order
- `POST /api/chat/:orderId` — send message (optional image attachments via Cloudinary)
- `PUT /api/chat/:orderId/read` — mark messages as read

Notifications:

- `GET /api/notifications?unreadOnly=&page=&limit=` — always returns unreadCount for badge
- `PUT /api/notifications/read-all` ← BEFORE /:id/read
- `PUT /api/notifications/:id/read`

User Profile (user.routes.js, mounted at /users):

- `PUT /api/users/profile` — update own profile
- `PUT /api/users/password` — change own password
- `PUT /api/users/profile-picture` — update profile picture URL

Client Management (user.routes.js, mounted at /users):

- `GET /api/users/admin/clients?search=&page=&limit=` — list with online status [admin]
- `GET /api/users/admin/clients/:id/online` — check single client online status [admin] ← BEFORE /:id
- `GET /api/users/admin/clients/:id` — full profile with orders and measurements [admin]
- `POST /api/users/admin/clients` — create walk-in client account [admin]

**Key behaviours:**

- SSE: Map<userId, Set<res>> handles multiple tabs; 25s heartbeat; X-Accel-Buffering: no for Railway
- Notifications: always written to DB first, SSE push is best-effort on top
- Email: sent on all order/payment/appointment events; errors logged but never thrown
- WhatsApp: fires on IN_PROGRESS, READY_FOR_PICKUP, OUT_FOR_DELIVERY, COMPLETED, appointment CONFIRMED, appointment CANCELLED
- Online status: O(1) Map lookup, attached to every client in list response
- Chat SSE: new message pushed to all admins + the client (except the sender)
- Presence events: broadcast to admins on connect/disconnect (optional enhancement)

---

### ✅ Phase 7 — Backend Polish (COMPLETE)

Remaining backend features built.

**Testimonials:**

- CRUD for testimonials (public GET, authenticated POST for clients, admin approve/reject + admin-created)
- Featured ordering, status filtering

**Shopping Cart (Ready-to-Wear Model 3):**

- Cart & CartItem models: unique userId, items (readyToWearId, selectedSize, quantity)
- Add to cart, update quantity, remove item, clear cart
- Stock validation on add and on checkout
- Checkout uses $transaction to create order, decrement stock, and clear cart atomically.

**Auth Enhancements:**

- Forgot password: request reset → email token → reset password
- Email verification on signup: backend generates token → frontend verify endpoint
- Uses crypto generated one-time tokens instead of JWTs for security (enumeration prevention).

**Rate Limiting:**

- express-rate-limit used on auth endpoints (login, register, forgot-password, reset-password).
- `trust proxy` enabled in express for correct IP forwarding.

**Admin Dashboard Statistics:**

- `GET /api/admin/dashboard` & `/api/admin/dashboard/export`
- Total orders, revenue, active clients, pending orders, orders by status, recent activity
- Parallel aggregations including time series data via Prisma $queryRaw for charting.
- Powers the admin dashboard page in the frontend

---

### 🔲 Phase 8 — Frontend (Next.js)

Public pages, auth flow, client dashboard, admin panel. Mobile-first responsive design.
**CRITICAL:** The frontend MUST be developed strictly according to the `UI_UX_Design.md` document located in the project root. This document defines exact fluid typography, animations, mega-menus, kanban boards, and luxury design standards.

SSE client-side connection note: `EventSource` doesn't support custom headers. Pass the access token as a query param (`?token=<accessToken>`) and read from `req.query.token` in the SSE route middleware. Handle this properly in Phase 8.

---

### ✅ Phase 10 — Backend Testing Suite (COMPLETE)

- Created standalone `backend-tests` directory.
- Configured Vitest + Supertest for unit and integration testing.
- Created `setup.js` for global mocks of Passport, Cloudinary, Email, and WhatsApp.
- Wrote extensive unit tests for Controllers: Auth, Dashboard, Order (Model 3 cart atomic transactions), Testimonial.
- Created robust utilities for mocking Express `req` and `res`.
- Architecture allows for completely isolated logic testing without a live PostgreSQL database.

---

### 🔲 Phase 9 — Testing & Deployment

Railway (DB + backend), Vercel (frontend), production env, domain config.

---

## 12. API Route Map (Complete)

All routes prefixed with `/api`.

```
AUTH                                          (Public except where noted)
POST   /auth/register                         (Rate limited: 3/hr)
POST   /auth/login                            (Rate limited: 5/15m)
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me                               [authenticate]
POST   /auth/forgot-password                  (Rate limited: 3/15m)
POST   /auth/reset-password                   (Rate limited: 5/15m)
POST   /auth/send-verification                [authenticate]
POST   /auth/verify-email

OAUTH                                         (Public)
GET    /auth/google
GET    /auth/google/callback
GET    /auth/facebook
GET    /auth/facebook/callback
GET    /auth/twitter
GET    /auth/twitter/callback
GET    /auth/failure

SSE
GET    /sse                                   [authenticate]

MEASUREMENTS                                  [authenticate]
GET    /measurements/export                   [authorise: STAFF_ADMIN, SUPER_ADMIN] <- BEFORE /:clientId
GET    /measurements/:clientId
POST   /measurements/:clientId                [authorise: STAFF_ADMIN, SUPER_ADMIN]
PUT    /measurements/:clientId
GET    /measurements/:clientId/history

APPOINTMENTS                                  [authenticate]
POST   /appointments
GET    /appointments                          [authorise: STAFF_ADMIN, SUPER_ADMIN]
PUT    /appointments/:id                      [authorise: STAFF_ADMIN, SUPER_ADMIN]

STYLES
GET    /styles                                (public)
GET    /styles/:id                            (public)
POST   /styles                                [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]
PUT    /styles/:id                            [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]
DELETE /styles/:id                            [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]
PATCH  /styles/:id/images                     [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]

READY-TO-WEAR
GET    /ready-to-wear                         (public)
GET    /ready-to-wear/:id                     (public)
POST   /ready-to-wear                         [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]
PUT    /ready-to-wear/:id                     [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]
PATCH  /ready-to-wear/:id/images              [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]

PORTFOLIO
GET    /portfolio                             (public, isPublished + clientConsent required)
GET    /portfolio/:id                         (public, same gate)
POST   /portfolio                             [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]
PUT    /portfolio/:id                         [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]
PATCH  /portfolio/:id/images                  [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]

ORDERS (client)                               [authenticate]
POST   /orders
GET    /orders
GET    /orders/:id
PUT    /orders/:id/accept-quote
PUT    /orders/:id/decline-quote

ORDERS (admin)                                [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]
GET    /admin/orders
GET    /admin/orders/:id
PUT    /admin/orders/:id/status
PUT    /admin/orders/:id/quote
PUT    /admin/orders/:id/delivery-fee
POST   /admin/orders/client/:clientId

PAYMENTS (client)                             [authenticate]
POST   /payments
GET    /payments/order/:orderId

PAYMENTS (admin)                              [authenticate, authorise: SUPER_ADMIN]
GET    /admin/payments/export                 <- BEFORE /:id routes
GET    /admin/payments/summary                <- BEFORE /:id routes
POST   /admin/payments/offline                <- BEFORE /:id routes
GET    /admin/payments
PUT    /admin/payments/:id/confirm
PUT    /admin/payments/:id/reject

CHAT                                          [authenticate]
GET    /chat/admin/inbox                      [authorise: STAFF_ADMIN, SUPER_ADMIN] <- BEFORE /:orderId
GET    /chat/:orderId
POST   /chat/:orderId
PUT    /chat/:orderId/read

NOTIFICATIONS                                 [authenticate]
GET    /notifications
PUT    /notifications/read-all                <- BEFORE /:id/read
PUT    /notifications/:id/read

USERS (profile)                               [authenticate]
PUT    /users/profile
PUT    /users/password
PUT    /users/profile-picture

CLIENTS (in user.routes.js)                   [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]
GET    /users/admin/clients
GET    /users/admin/clients/:id/online        <- BEFORE /:id
GET    /users/admin/clients/:id
POST   /users/admin/clients

TESTIMONIALS                                  (Public except where noted)
GET    /testimonials
POST   /testimonials                          [authenticate]
GET    /testimonials/admin                    [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]
POST   /testimonials/admin                    [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]
PUT    /testimonials/admin/:id                [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]

CART                                          [authenticate]
GET    /cart
POST   /cart/items
PUT    /cart/items/:itemId
DELETE /cart/items/:itemId
DELETE /cart
POST   /cart/checkout

DASHBOARD                                     [authenticate, authorise: STAFF_ADMIN, SUPER_ADMIN]
GET    /admin/dashboard
GET    /admin/dashboard/export
```

---

## 13. Branding Placeholders

All in `frontend/src/config/branding.js`. Replace when branding is finalised.

| Variable               | Placeholder                      |
| ---------------------- | -------------------------------- |
| `{{BUSINESS_NAME}}`    | Studio Name                      |
| `{{BUSINESS_TAGLINE}}` | Your tagline here                |
| `{{PRIMARY_COLOR}}`    | #C2185B                          |
| `{{SECONDARY_COLOR}}`  | #1A1A2E                          |
| `{{ACCENT_COLOR}}`     | #F8E8F0                          |
| `{{LOGO_URL}}`         | /assets/logo-placeholder.svg     |
| `{{BUSINESS_EMAIL}}`   | hello@yourstudio.com             |
| `{{BUSINESS_PHONE}}`   | +234 000 000 0000                |
| `{{WHATSAPP_NUMBER}}`  | +234 000 000 0000                |
| `{{INSTAGRAM_URL}}`    | https://instagram.com/yourstudio |

---

## 14. Important Notes for the AI Agent

- **Never suggest TypeScript** — JavaScript only throughout
- **Always use ESM** (`import`/`export`) — never `require()`/`module.exports`
- **Always include `.js` extension** in relative imports — required for Node.js ESM
- **Never create `new PrismaClient()`** in individual files — always import from `src/config/prisma.js`
- **Always use `req.validatedBody`** in controllers — never `req.body` directly
- **Always throw `AppError`** for expected errors — never `res.status().json()` in controllers
- **Express 5 is installed** — async errors caught automatically, no try/catch needed in controllers
- **Prisma 7 is installed** — import from `'../prisma/generated/prisma/client.js'`, NOT `@prisma/client`
- **`@prisma/client` is NOT installed** — do not suggest installing or importing it
- **Payments are manual MVP** — no Paystack
- **No sessions** — `session: false` everywhere Passport is used
- **Access token in memory only** — never localStorage or sessionStorage
- **Refresh token is httpOnly cookie** — never localStorage
- **All measurements in centimetres**
- **One measurement record per client** — POST blocked if exists (409); PUT for all updates
- **Disclaimer required for client self-updates** — `disclaimerSigned: true` in body; timestamp stored
- **Measurement history is diff-based** — only changed fields with before/after values
- **orderNumber format**: `ORD-YYYY-XXXX` — gap-safe generation, NOT count-based
- **Soft deletes** — catalog items use `isActive: false`, not hard deletes
- **Financial routes** — `authorise('SUPER_ADMIN')` only, never staff admin
- **Client data isolation** — clients only access their own data; use 404 not 403
- **Route order matters** — specific routes (export, summary, online) always before dynamic (/:id)
- **State machines** — order and appointment status validated against transitions map
- **CSV exports** — use fast-csv, pipe to `res`; do NOT call `successResponse()`
- **PDF exports** — use pdfkit, pipe to `res`; manual table rendering; no temp files
- **No-op detection on updates** — skip DB write if nothing changed
- **File upload middleware order** — authenticate -> authorise -> uploadMultiple -> validate -> controller
- **Multipart form data** — all non-file fields arrive as strings; use Zod `.transform()`
- **Cloudinary uploads** — use `uploadMultipleImages` from `src/services/cloudinary.service.js`
- **Image deletion** — use `deleteImages` (Promise.allSettled); validate URLs belong to record first
- **Image updates append** — PATCH /:id/images for targeted delete/replace
- **Portfolio privacy** — public responses exclude orderId and client details
- **Portfolio consent** — always check `clientConsent: true` before serving publicly
- **Stock status** — auto-calculated from stockCount
- **Admin-created orders** — set `createdByAdminId`; NEVER mutate `req.user`
- **Quote negotiation** — decline -> PENDING_REVIEW; admin can re-quote from PENDING_REVIEW or AWAITING_CLIENT_RESPONSE
- **COMPLETED and CANCELLED are terminal order statuses** — no further transitions
- **Model 3 orders** — skip AWAITING_CLIENT_RESPONSE and AWAITING_FINAL_PAYMENT; decrease stockCount on creation
- **totalPaid** — always recalculate via aggregate sum; never store as running total
- **Duplicate payment prevention** — check for existing PENDING payment before creating new one
- **SSE** — uses Map<userId, Set<res>>; heartbeat 25s; X-Accel-Buffering: no; EventSource reconnects automatically
- **Notifications** — always write to DB first; SSE push is best-effort; DB is the durable source of truth
- **Email** — errors swallowed; in development logs to console only; uses branded templates
- **WhatsApp** — errors swallowed; in development logs to console only; milestone events + appointments only
- **Online status** — O(1) Map lookup via isUserOnline(); no DB query needed
- **Client management routes** — live in `user.routes.js`, mounted at `/users`; actual API path is `/api/users/admin/clients/...`; there is NO `client.routes.js`
- **SSE auth in frontend** — EventSource doesn't support headers; pass token as query param in Phase 8

_Document version: 5.2 — reflects state after Phase 7, complete Backend Test Suite, and finalized UI/UX Design Prompt_
_Last updated: March 2026_
