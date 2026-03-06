✦

**Product Requirements Document**

Fashion Design Business Web Application

Version 1.2 | February 2026 | Confidential

**Document Information**

|     |     |
| --- | --- |
| **Document Title** | Fashion Design Web App — PRD |
| **Version** | 1.2 |
| **Date** | February 2026 |
| **Status** | Draft — Ready for Development |
| **Prepared For** | Fashion Design Business Owner |
| **Tech Stack** | Next.js, Tailwind CSS, Node.js, Express, PostgreSQL (Railway), Cloudinary, JWT + Passport.js, Vercel |

# **1\. Executive Summary**

This document defines the full product requirements for a professional web application serving a fashion design business with three core business models: client-supplied fabric sewing, designer-sourced fabric sewing, and ready-to-wear sales. The application will serve both client-facing and admin-facing needs, enabling end-to-end management of orders, measurements, payments, communication, and catalog presentation.

The MVP is a fully functional web app covering all three business models, with manual bank transfer payment acknowledgement in place of automated payment processing. Automated payment integration (e.g., Paystack) is deferred to a post-MVP phase.

# **2\. Business Overview**

## **2.1 Business Models**

### **Model 1 — Client Brings Fabric**

The client provides her own fabric and selects a style from the curated catalog or submits a custom style with description and reference images. Measurements are taken or retrieved from the database. The designer sews the garment. Payment can be made in full or in installments — first installment upon agreement, final installment before pickup/delivery.

### **Model 2 — Designer Sources Fabric**

The client selects or proposes a style but does not provide fabric. The designer sources and prices the fabric, then proposes a total fee. Measurements are handled the same way as Model 1. Payment follows the same installment or full-payment structure, with the first installment made after the designer quotes the full cost.

### **Model 3 — Ready-to-Wear**

The client browses and purchases pre-made garments from the available collection. Prices are fixed and visible upfront. Payment is made in full at the time of purchase.

## **2.2 Target Users**

|     |     |
| --- | --- |
| **User Type** | **Description** |
| Clients | Female, ages 17–50, average tech-savviness, local and national. Walk-in, referral, and online discovery. |
| Super Admin | Business owner. Full access to all features including financials and payment confirmation. |
| Staff Admin | Team members. Access to operations (orders, measurements, catalog, communication) but no access to financials or payment confirmation. |

# **3\. Recommended Tech Stack**

|     |     |     |
| --- | --- | --- |
| **Layer** | **Technology** | **Reason** |
| **Frontend Framework** | Next.js 14 (App Router) | SEO-friendly, handles client & admin sides, fast |
| **Styling** | Tailwind CSS + Shadcn/ui | Fast build, professional UI, highly customizable |
| **Backend** | Node.js + Express.js | Explicit, learnable, full control over API logic |
| **Database** | PostgreSQL (hosted on Railway) | Powerful relational DB, great for complex relational data |
| **Authentication** | JWT + bcrypt (credentials) + Passport.js (OAuth) | Hand-rolled auth for credentials; Passport.js for Google, Facebook, Twitter/X OAuth |
| **File / Image Storage** | Cloudinary | Upload, optimization, CDN delivery; generous free tier |
| **Payments (MVP)** | Manual Bank Transfer + Admin Confirmation | Simple and trusted locally |
| **Payments (Post-MVP)** | Paystack | Best-in-class for Nigerian market |
| **Notifications (Email)** | Resend or Nodemailer + SMTP | Transactional email for key order events |
| **Notifications (WhatsApp)** | Twilio + Dedicated WhatsApp Business Number | Order start and pickup/delivery alerts |
| **Visual Catalog** | Multi-angle image gallery with zoom (Swiper + Lightbox) | No 360 photography planned; high-quality gallery is the standard |
| **Frontend Hosting** | Vercel | Native Next.js support, generous free tier, scalable |
| **Backend Hosting** | Railway or Render | Easy Node.js/Express deployment, connects directly to PostgreSQL |

# **4\. Feature Requirements**

## **4.1 Authentication & User Accounts**

Public browsing (styles catalog, ready-to-wear, testimonials) requires no account. All transactional features — placing orders, viewing history, messaging, managing measurements, making payments — require authentication.

### **Client Registration (Self-Sign-Up)**

- Mandatory fields: Full name, phone number, email address, sex
- Optional fields: Date of birth, home address, profile picture
- Two sign-up methods available: Credentials (email + password) and OAuth (social login)
- Password hashed with bcrypt before storage; never stored or logged in plain text
- Email verification sent on credentials signup via Resend/Nodemailer
- JWT issued on login; stored in httpOnly cookie for security
- Clients prompted to add phone number and sex after OAuth signup if not returned by the provider (these are mandatory)
- Clients prompted to add address when an order requires delivery

### **OAuth / Social Login**

- Implemented via Passport.js — the standard OAuth middleware for Node.js/Express
- Supported providers: Google (priority), Facebook, Twitter/X
- Instagram login is NOT supported — Instagram restricts OAuth to its own platform tools
- Apple Sign-In deferred to post-MVP (relevant when native iOS app is built)
- Flow: client clicks provider button → redirected to provider → returns to app with profile → backend checks if account exists by email → if yes: log in; if no: create account and log in → JWT issued
- OAuth users do not have a password; password_hash field is nullable in the database
- Users table stores: provider (local | google | facebook | twitter) and provider_id for each OAuth account
- A client who signed up with credentials can also link a social account later from profile settings, and vice versa

### **Admin-Created Client Accounts (Walk-in / Offline)**

- Admin creates account with mandatory fields: full name, phone number, email, sex
- System sends the client a welcome email/SMS with login credentials or a magic link
- Client can complete optional profile fields after first login

### **Admin Accounts**

- Super Admin account created during system setup
- Super Admin can create Staff Admin accounts and assign roles
- Two roles only: Super Admin (full access) and Staff Admin (operations only, no financials)

### **Session & Security**

- JWT-based sessions; tokens signed with a secret key stored in environment variables
- Access token (short-lived, 15 min) + Refresh token (long-lived, 7 days) pattern
- Passwords hashed with bcrypt (minimum 12 salt rounds) for credentials users
- Password reset via time-limited tokenized email link (credentials users only)
- Role stored in JWT payload; verified server-side on every protected route
- Middleware on all Express routes checks JWT validity and role before proceeding
- Passport.js manages OAuth strategy configuration for Google, Facebook, and Twitter/X
- OAuth callback URLs whitelisted in each provider's developer console

## **4.2 Measurements System**

All essential body measurements are stored per client. These include but are not limited to: bust, waist, hips, shoulder width, sleeve length, dress length, thigh, inseam, neck circumference, and any custom parameters the business uses.

### **Measurement Entry & Management**

- Admin can add or update measurements for any client
- Client can update their own measurements — must digitally sign a disclaimer acknowledging that self-reported measurements may affect garment fit and the business is not liable for fitting issues arising from inaccurate self-measurements
- Disclaimer must be re-signed each time the client updates measurements
- All measurement history is logged with timestamps and who made the update (client or admin name)

### **Returning Client Measurement Flow (Order Placement)**

- System auto-loads saved measurements for returning clients
- Client reviews and confirms measurements before proceeding with order
- Client can: confirm existing measurements, update measurements (with disclaimer), or schedule an in-person measurement appointment

### **Measurement Appointments**

- Client can request a measurement appointment through the app
- Admin receives notification and can confirm or suggest a different time via the chat or a simple scheduling response

### **Export**

- Admin can export individual or bulk client measurements as CSV or PDF

## **4.3 Order & Project Flow**

### **Model 1 & 2 — Custom Order Flow**

1.  Client selects a curated style from the catalog OR submits a custom style (written description + reference images)
2.  Client indicates whether they are bringing their own fabric (Model 1) or need the designer to source fabric (Model 2)
3.  Client confirms or updates measurements
4.  Client adds any special notes or instructions
5.  Order submitted — status set to: Pending Review
6.  Admin reviews the order, assesses requirements, determines cost (including fabric sourcing cost for Model 2)
7.  Admin proposes a fee and sends it to the client via the order chat
8.  Client reviews and accepts or negotiates the fee
9.  Once both parties agree: client makes the first installment payment (or full payment). Status moves to: Agreed & Awaiting Payment
10. Admin confirms payment receipt. Status moves to: In Progress
11. Admin moves project through defined stages (see below)
12. Final installment (if applicable) is paid before pickup/delivery. Admin confirms. Status moves to: Ready for Pickup / Out for Delivery

### **Project Status Stages**

- Pending Review — Order submitted, awaiting admin review
- Awaiting Client Response — Admin has proposed a fee, waiting for client agreement
- Agreed & Awaiting First Payment — Fee agreed, waiting for first payment
- In Progress — Payment confirmed, work has started
- Cutting — Fabric being cut
- Sewing — Garment being sewn
- Finishing & Quality Check — Final touches and inspection
- Awaiting Final Payment — Ready, pending last installment
- Ready for Pickup — Garment complete, client can collect
- Out for Delivery — Garment dispatched for delivery
- Completed — Order fully concluded
- Cancelled — Order cancelled (with reason logged)

### **Model 3 — Ready-to-Wear Purchase Flow**

1.  Client browses the ready-to-wear collection
2.  Client selects item(s), chooses size, adds to cart
3.  Client chooses fulfillment: Pickup or Delivery. If delivery — client provides or confirms delivery address; admin will add delivery fee to the order after coordinating with courier
4.  Client reviews order summary and total (delivery fee shown as 'To be confirmed' until admin adds it)
5.  Client makes full payment (bank transfer, confirmed by admin)
6.  Admin confirms payment. Status: Processing
7.  Admin updates status to: Dispatched / Ready for Pickup
8.  Order marked Completed

## **4.4 Payment System (MVP — Manual Bank Transfer)**

Automated payment processing is deferred post-MVP. The MVP uses bank transfer with manual admin confirmation.

### **Client-Facing Payment Flow**

- Client views payment breakdown on their order page: total agreed fee, amount paid, amount remaining, installment schedule
- Client initiates a payment by clicking 'Make Payment', entering the amount they are paying, and uploading a proof of transfer (screenshot/receipt)
- Payment is logged as 'Pending Confirmation'
- Client is notified when admin confirms the payment

### **Admin Payment Confirmation**

- Super Admin sees all pending payment confirmations in the financial dashboard
- Super Admin views proof of transfer, verifies, and marks payment as confirmed or rejected (with reason)
- Client and order status update automatically upon confirmation

### **Financial Dashboard (Super Admin Only)**

- Overview of all payments: confirmed, pending, rejected
- Per-order payment history and installment breakdown
- Total revenue summary (filterable by date range, business model type)
- Ability to manually log offline payments made outside the app
- Export payment records as CSV

## **4.5 Styles Catalog & Ready-to-Wear Collection**

### **Styles Catalog (Curated Styles for Custom Orders)**

- Grid/masonry layout with category filters (e.g., Gowns, Ankara, Corporate, Casual, Bridal, etc.)
- Each style has: name, photos (multiple angles), description, estimated turnaround time, and a 'Use This Style' CTA
- Clients can save/favourite styles for later
- Styles marked as 'Available for Client Fabric' and/or 'Designer Sources Fabric' to show applicable business models

### **Ready-to-Wear Collection**

- Grid layout with category filters and size filters
- Each item has: name, price, available sizes, photos (multiple angles or 360 view), description, fabric details, care instructions
- Items can be marked as sold out or limited stock
- Client can add to cart and proceed to checkout

### **Portfolio / Completed Work Catalog**

- Showcase of selected completed client projects
- Admin selects which completed projects to feature in the catalog
- Client's consent obtained before featuring their garment (toggle in admin panel)
- Each catalog item: photos, garment description, category, optional story/notes
- Visual presentation: high-quality multi-angle image gallery with zoom (Swiper carousel + Lightbox overlay). Tap/click any image to open full-screen with swipe navigation.
- 360-degree viewer and full 3D (Three.js) are deferred — no 360 photography setup planned in the near future.

### **Admin Catalog Management**

- Add, edit, archive, or delete styles and ready-to-wear items
- Upload multiple images per item
- Set categories, tags, prices, availability
- Feature completed client work in the portfolio catalog

## **4.6 In-App Communication (Chat System)**

Each order has a dedicated chat thread between the client and the admin team. There is no general inbox — all communication is contextual to a specific order.

### **Features**

- Chat thread auto-created when an order is placed
- Both client and admin can send text messages
- Both can attach images (fabric swatches, reference photos, revision notes)
- Admin can see all active order chats in a unified inbox with unread indicators
- Messages are timestamped and attributed to sender
- Admin can respond from any admin account; all admin messages appear under a unified 'Studio' name or show the staff member's name — configurable

### **Chat Notifications**

- In-app notification badge when a new message is received
- In-app notification when order status changes
- Email notification when project status changes to In Progress or Ready for Pickup/Delivery
- WhatsApp notification (via Twilio or WhatsApp Business API) for the same key milestones

## **4.7 Notification System**

|     |     |     |     |
| --- | --- | --- | --- |
| **Trigger Event** | **In-App** | **Email** | **WhatsApp** |
| Order placed (confirmation) | Yes | Yes | No  |
| Admin sends a message | Yes | No  | No  |
| Order status updated (general) | Yes | No  | No  |
| Project moves to In Progress | Yes | Yes | Yes |
| Project Ready for Pickup / Dispatched | Yes | Yes | Yes |
| Payment confirmed by admin | Yes | Yes | No  |
| Payment rejected by admin | Yes | Yes | No  |
| New account created (walk-in clients) | No  | Yes | No  |
| Measurement appointment confirmed | Yes | Yes | No  |

## **4.8 Testimonials**

### **Client-Submitted Testimonials**

- Clients can submit testimonials from their profile or order history page
- Testimonial form: rating (1–5 stars), written review, optional photo upload
- Testimonials submitted go to admin for review and approval before going live

### **Admin-Added Testimonials (Offline Clients)**

- Admin can manually add testimonials on behalf of offline clients who gave feedback in person
- Admin enters: client name (or 'Anonymous'), rating, review text, optional photo
- These are labelled as 'Verified by Studio' on the public testimonials page

### **Public Display**

- Testimonials displayed on the homepage and a dedicated testimonials page
- Sortable by rating, most recent, or featured (admin-curated)

## **4.9 Client Dashboard**

Each authenticated client has a personal dashboard where they can manage all aspects of their relationship with the business.

### **Dashboard Sections**

- Active Orders — Cards showing current orders with status, next action, and quick link to chat
- Order History — Complete list of past orders with status, payment summary, and ability to reorder a style
- Measurements — View current measurements, update with disclaimer, or request appointment
- Saved Styles — Favourited styles from the catalog
- Payment History — List of all payments made with confirmation status
- Messages — Quick access to all order chats with unread indicators
- Notifications — Bell icon with notification history
- Profile Settings — Update personal info, address, profile picture, password

## **4.10 Admin Dashboard**

### **Super Admin — Full Access**

- Overview dashboard: active projects count, pending reviews, pending payments, recent activity
- All order management (view, update status, assign, manage)
- Client management: view all clients, create accounts, update measurements, view history
- Catalog management: add/edit/archive styles, ready-to-wear items, portfolio entries
- Financial dashboard: all payments, revenue summary, payment confirmation, export
- Testimonials: review queue, approve/reject, add offline testimonials
- Notifications management
- Staff management: create staff accounts, set roles
- Measurement export: individual or bulk CSV/PDF

### **Staff Admin — Operations Access (No Financials)**

- Overview dashboard (non-financial metrics only)
- All order management
- Client management: view, create accounts, update measurements
- Catalog management
- Testimonials: add offline testimonials (pending Super Admin approval for publishing)
- No access to: financial dashboard, payment confirmation, revenue data, staff management

### **Admin Unified Chat Inbox**

- All active order chat threads in one view
- Unread message indicators
- Filter by: unread, active orders, completed orders, client name
- Admin can reply directly from the inbox

# **5\. Non-Functional Requirements**

## **5.1 Performance**

- Page load time under 3 seconds on standard mobile connections
- Image optimization via Next.js Image component and Supabase CDN
- Lazy loading for catalog grids

## **5.2 Security**

- All Express API routes protected with JWT middleware; role verified server-side
- Passwords hashed with bcrypt; never stored or logged in plain text
- Row-level data isolation enforced in API logic — clients can only access their own records
- HTTPS enforced across all routes (Vercel and Railway/Render both enforce this)
- File upload validation via Cloudinary (type and size limits) to prevent malicious uploads
- Disclaimer logs stored with timestamps and user IDs for legal protection
- Environment variables used for all secrets; never committed to version control
- Rate limiting on auth endpoints (login, password reset) to prevent brute force attacks

## **5.3 Scalability**

- Architecture designed to support growth from 20 to 200+ concurrent projects
- Node.js/Express backend can be horizontally scaled on Railway/Render as load grows
- PostgreSQL connection pooling (via pg-pool) to handle concurrent requests efficiently
- Cloudinary handles image delivery at scale via CDN — no server load for media
- Payment integration (Paystack) can be added without restructuring the existing payment data model

## **5.4 Accessibility & Usability**

- Mobile-first responsive design — all features usable on smartphone
- Simple, intuitive UI for average tech-savvy users ages 17–50
- Clear CTAs and guided flows at every step (no dead ends)
- English only (multi-language deferred)

## **5.5 Reliability**

- 99.9% uptime target via Vercel and Supabase hosted infrastructure
- Automated database backups via Supabase
- Error logging and monitoring (e.g., Sentry) for production issues

# **6\. MVP Scope**

## **6.1 In Scope for MVP**

- Full client authentication and profile management
- All three business model order flows
- Complete measurements system with disclaimer flow
- Project status tracking through all defined stages
- Manual bank transfer payment flow with admin confirmation
- In-app chat per order
- In-app, email, and WhatsApp notifications (key milestones)
- Styles catalog with filtering
- Ready-to-wear collection with cart and checkout
- Portfolio/completed work catalog with image gallery and 360 viewer
- Client dashboard with full history
- Admin dashboard (Super Admin and Staff Admin roles)
- Testimonials system (client-submitted and admin-added)
- Measurement export (CSV/PDF)
- Payment records export (CSV) — Super Admin only
- Walk-in client account creation by admin

## **6.2 Out of Scope (Post-MVP)**

- Automated payment processing (Paystack integration)
- Native mobile app (iOS / Android)
- Multi-language support
- AI style recommendation engine
- Loyalty / points system
- Social media integration or sharing
- 360-degree and full 3D garment viewer (Three.js) — no photography setup planned
- Fixed delivery fee structure — per-order courier negotiation used instead
- Advanced analytics and reporting dashboard
- Multi-branch or franchise support

# **7\. Database Schema Overview**

The following tables form the core data model. Full schema with column types and relationships to be defined during development.

- users — id, full_name, phone, email, sex, dob, address, profile_picture_url, role (client | staff_admin | super_admin), auth_provider (local | google | facebook | twitter), provider_id, password_hash (nullable for OAuth users), is_email_verified, created_at
- measurements — id, client_id, bust, waist, hips, shoulder_width, sleeve_length, dress_length, thigh, inseam, neck, custom_params (JSONB), updated_by, updated_at, disclaimer_signed_at
- styles — id, name, description, category, images (array), applicable_models, is_active, created_at
- ready_to_wear — id, name, description, price, category, sizes, images, stock_status, created_at
- orders — id, client_id, order_type (model_1 | model_2 | model_3), style_id or custom_style_description, custom_style_images, fabric_provided_by_client, measurements_id, fulfillment_method (pickup | delivery), delivery_address, delivery_fee, status, total_agreed_fee, notes, created_at, updated_at
- order_status_history — id, order_id, status, changed_by, changed_at, note
- payments — id, order_id, client_id, amount, payment_type (installment | full), proof_url, status (pending | confirmed | rejected), confirmed_by, confirmed_at, rejection_reason, created_at
- chat_messages — id, order_id, sender_id, sender_role, message_text, attachments (array), read_at, created_at
- notifications — id, user_id, type, message, read, related_order_id, created_at
- testimonials — id, client_id, rating, review_text, photo_url, source (client_submitted | admin_added), status (pending | approved | rejected), created_at
- portfolio — id, order_id, images, description, category, featured, client_consent, created_at
- measurement_appointments — id, client_id, requested_date, confirmed_date, status, notes, created_at

# **8\. Recommended Build Stages**

|     |     |     |
| --- | --- | --- |
| **Phase** | **Stage** | **Deliverables** |
| **1** | **Foundation & Auth** | Project setup (Next.js frontend, Node.js/Express backend, PostgreSQL on Railway), database schema, credentials auth (signup, login, JWT, refresh tokens, roles), OAuth with Passport.js (Google, Facebook, Twitter/X), client profile, admin account management |
| **2** | **Measurements System** | Measurement forms, client self-update with disclaimer, admin update, measurement history log, appointment request, CSV/PDF export |
| **3** | **Catalog & Styles** | Styles catalog with filters, ready-to-wear collection with cart, portfolio gallery with multi-angle image viewer, admin catalog management, Cloudinary image upload |
| **4** | **Order Flow** | All three business model order flows, project status tracking, order history, client dashboard, admin order management panel |
| **5** | **Payments** | Manual bank transfer flow, proof upload via Cloudinary, admin payment confirmation, financial dashboard (Super Admin only), payment export |
| **6** | **Chat & Notifications** | Per-order chat system, admin unified inbox, in-app notifications, email via Resend/Nodemailer, WhatsApp via Twilio |
| **7** | **Testimonials & Polish** | Testimonials system, public-facing pages (homepage, about), branding applied, mobile responsiveness, performance optimization |
| **8** | **Testing & Launch** | End-to-end testing, security audit, JWT/middleware verification, staging deployment, go-live (Vercel + Railway) |

# **9\. Branding Placeholders**

Branding decisions are pending. The following variables will be used as placeholders throughout design and development. Replace each variable with the real value once the branding is finalised.

|     |     |     |
| --- | --- | --- |
| **Variable** | **Placeholder Value** | **Notes** |
| {{BUSINESS_NAME}} | Studio Name | The official trading name of the fashion business |
| {{BUSINESS_TAGLINE}} | Your tagline here | Short brand statement shown on homepage hero |
| {{PRIMARY_COLOR}} | #C2185B (placeholder pink) | Main brand colour used for buttons, headings, accents |
| {{SECONDARY_COLOR}} | #1A1A2E (placeholder navy) | Supporting colour for backgrounds and contrast |
| {{ACCENT_COLOR}} | #F8E8F0 (placeholder blush) | Subtle background tints and highlight areas |
| {{LOGO_URL}} | /assets/logo-placeholder.svg | Replace with actual logo file (SVG preferred) |
| {{FAVICON_URL}} | /assets/favicon-placeholder.ico | Browser tab icon |
| {{BUSINESS_EMAIL}} | hello@yourstudio.com | Primary contact and sender email address |
| {{BUSINESS_PHONE}} | +234 000 000 0000 | Displayed on contact page and email footers |
| {{BUSINESS_ADDRESS}} | Studio Address, City, State | Physical address for contact page and receipts |
| {{WHATSAPP_NUMBER}} | +234 000 000 0000 | Dedicated WhatsApp Business number for notifications |
| {{INSTAGRAM_URL}} | https://instagram.com/yourstudio | Social link in footer (optional) |
| {{HERO_IMAGE_URL}} | /assets/hero-placeholder.jpg | Homepage hero background or feature image |

In code, these variables will be defined in a single config/branding.ts file and imported wherever needed. Updating branding across the entire app will require changing only that one file.

# **10\. Resolved Decisions**

The following questions from the initial discovery phase have been answered and are now reflected in this document.

- Branding — Pending. Placeholder variables defined in Section 9. No development blocker.
- Delivery — Both delivery and pickup options will be offered. Delivery fee is negotiated per order with the courier; no fixed fee structure at this stage. Admin manually adds the agreed delivery fee to the order during the quoting process.
- WhatsApp — A dedicated WhatsApp Business number will be set up. Twilio will be used to send notifications via the WhatsApp Business API.
- 360-degree photography — No 360 setup planned in the near future. Catalog will use high-quality multi-angle photography with a zoom-capable lightbox gallery (Swiper + Lightbox libraries).
- Custom style pricing — Fully project-specific. No base consultation fee. Admin quotes each custom project individually.
- Multiple active projects — Clients can have multiple simultaneous active projects under Model 1 and Model 2. No limit imposed at the data model level.
- Fabric sourcing transparency (Model 2) — Fabric options and swatches for designer-sourced orders are communicated via the order chat. No digital swatch library needed in the MVP.
- Backend — Changed from Next.js API Routes + Supabase to Node.js + Express.js + PostgreSQL (Railway) + Cloudinary + JWT/bcrypt. Decision driven by learning goals and desire for explicit control over backend logic.

End of Document — v1.2

This PRD is a living document and should be updated as decisions are made during development.