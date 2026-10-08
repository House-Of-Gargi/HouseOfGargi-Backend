# House of Gargi — Backend Atelier Architecture & Master Blueprint

> High-Performance Fastify v5 Modular Monolith API Gateway & E-Commerce Engine for **House of Gargi** Luxury Handloom Atelier.

---

## 1. Executive Architecture Overview

```
                                  +-----------------------------+
                                  |   Storefront (Vercel Edge)  |
                                  |    https://www.gargisaha.com|
                                  +--------------+--------------+
                                                 |
                                     HTTPS REST / WSS WebSockets
                                                 |
                                                 v
                       +-------------------------------------------------+
                       |         Fastify v5 Backend Engine               |
                       |    (Render Cloud Node.js 24 Container)          |
                       |                                                 |
                       |  - Helmet HTTP Security Headers                 |
                       |  - Global Rate Limiting (150 req/min)           |
                       |  - Bot & Scraper Filter (403 Auto-Block)        |
                       |  - Keep-Alive Cron Ping (Every 5-10m)           |
                       +-------+-------------+-------------+-------------+
                               |             |             |
                               v             v             v
                    +--------------+  +------------+  +-----------------+
                    |  PostgreSQL  |  |   Resend   |  | Razorpay/Stripe |
                    |  (Supabase)  |  |  Email API |  | Payment Gateway |
                    |  RLS Enabled |  | (OTP Engine|  | (Authoritative  |
                    |              |  |   & Order) |  |   Verification) |
                    +--------------+  +------------+  +-----------------+
```

### Core Architecture Philosophy: The Lean Modular Monolith
For a boutique luxury atelier handling **100–300 bespoke products** and **100–1,000 daily patrons**:
- **Why a Monolith?** A clean Fastify monolith serves requests in **under 15 milliseconds** in-process. Microservices would introduce distributed network latency, multi-database sync issues, and 4x hosting costs for zero business advantage.
- **Why Fastify?** Benchmarked at **20,000–35,000 requests/sec**, Fastify handles your entire current and projected traffic using less than **0.05%** of its CPU capacity.
- **Why Supabase PostgreSQL?** Enterprise ACID compliance, relational integrity, automatic backups, and Row-Level Security (RLS) policies.

---

## 2. Live Production Services & Gateways

- **Live API Gateway**: `https://houseofgargi-backend.onrender.com`
- **Health Check & Telemetry**: `https://houseofgargi-backend.onrender.com/health`
- **Interactive OpenAPI 3.1 Swagger UI**: `https://houseofgargi-backend.onrender.com/documentation`
- **Real-Time WebSocket Sync Hub**: `wss://houseofgargi-backend.onrender.com/ws/sync`
- **Crawler Directive**: `https://houseofgargi-backend.onrender.com/robots.txt`

---

## 3. Master Feature Matrix: Small-Scale Luxury E-Commerce

Below is the definitive functional roadmap required to run an enterprise-grade, high-trust luxury commerce business:

### A. Authentication & Patron Identity
- [x] **Passwordless Cryptographic OTP**: 6-digit access codes signed with HMAC-SHA256, dispatched via Resend API.
- [x] **JWT Session Tokens**: Signed tokens for patron authorization without storing plaintext passwords.
- [ ] **Saved Addresses Book**: Ability for patrons to store multiple shipping/billing addresses (`default_shipping`, `default_billing`).
- [ ] **Role-Based Access Control (RBAC)**: Clear permission separation between `patron`, `store_manager`, and `super_admin`.

### B. Product Information Management (PIM)
- [x] **Catalog Browsing & Categorization**: Filter by category (`sarees`, `lehengas`, `dupattas`), featured flags, and full-text search.
- [ ] **Bespoke Luxury Attributes**: Weave type, fabric purity certification (Silk Mark/Zari), artisan village provenance, and dry-clean care instructions.
- [ ] **Product Variants**: Size options (`Free Size`, `Custom Blouse Tailoring`), colorways, and SKU-level inventory tracking.
- [ ] **Inventory Locking on Checkout**: Temporary 10-minute inventory reservation while a customer completes payment to prevent overselling one-of-a-kind handcrafted pieces.

### C. Shopping Bag & Real-Time Sync
- [x] **Authoritative Server Pricing**: Server recalculates item price from database; client totals are never trusted.
- [x] **Real-Time Cross-Device Sync**: WebSockets (`/ws/sync`) broadcast updates across open browser tabs and devices.
- [ ] **Persistent Guest-to-User Bag Migration**: Seamlessly merging a guest's local cart into their authenticated database profile upon OTP verification.

### D. Order Lifecycle & State Machine
- [x] **Authoritative Order Creation**: Server generates unique tracking reference `#HG-XXXXXX` and calculates total in paise/rupees.
- [ ] **Strict Order State Transition**:
  $$\text{Draft} \longrightarrow \text{Payment Pending} \longrightarrow \text{Confirmed} \longrightarrow \text{In Artisan Tailoring} \longrightarrow \text{Dispatched} \longrightarrow \text{Delivered}$$
- [ ] **GST Invoice Generation**: Automated PDF tax invoice generation with state-wise GST calculation (CGST/SGST vs IGST).

### E. Payment Gateway & Webhook Reconciliation
- [ ] **Gateway Integration**: Official Razorpay / Cashfree / Stripe SDK checkout integration.
- [ ] **Cryptographic Webhook Verification**: Raw payload HMAC signature verification (`x-razorpay-signature`) ensuring payment events cannot be spoofed.
- [ ] **Payment Idempotency**: Unique idempotency keys to guarantee a customer is never billed twice if a connection drops.

### F. Logistics, Fulfillment & Tracking
- [ ] **Pincode Serviceability Check**: Real-time lookup with logistics partners (Shiprocket / Delhivery) before checkout.
- [ ] **Automated AWB & Shipping Labels**: Single-click courier assignment and label printing directly from the atelier dashboard.
- [ ] **Tracking Updates**: Ingest courier webhooks and notify customers of transit milestones.

### G. Transactional Customer Communications
- [x] **OTP Email Dispatch**: High-deliverability transactional emails via Resend.
- [ ] **Order Confirmation Dispatch**: Itemized email with order summary, estimated delivery date, and atelier notes.
- [ ] **WhatsApp Business API Concierge**: Direct luxury concierge dispatch notifications and dispatch alerts via WhatsApp.

---

## 4. Codebase Audit: Standards & Gaps in Current Code

While our backend is ultra-fast, secure, and live on Render, the following **7 industry standards** must be addressed to transition from prototype to full commercial scale:

### ⚠️ Gap 1: In-Memory Static Catalog vs. Supabase PostgreSQL
- **Current State**: `src/routes/products.routes.ts` imports a static TypeScript array from `src/db/catalog.ts` instead of querying the live Supabase PostgreSQL `products` table.
- **Risk**: Adding or editing a product currently requires a code commit rather than updating a database row or using an admin panel.
- **Solution**: Replace `products.find(...)` with `supabase.from('products').select('*')` with an in-memory cache layer.

### ⚠️ Gap 2: Denormalized Order Schema
- **Current State**: `supabase_schema.sql` stores all order data in a single flat `orders` table. Items are handled as an unstructured JSON array.
- **Risk**: You cannot run SQL analytical queries like *"Which saree was sold most in September?"* or track item-level refund statuses.
- **Solution**: Introduce a relational `order_items` table linked by `order_id` with foreign key constraints.

### ⚠️ Gap 3: Mock Checkout Session
- **Current State**: `/checkout/session` generates a dummy identifier (`chk_...`) and placeholder key (`rzp_test_placeholder`).
- **Risk**: Live credit card, UPI, and NetBanking transactions cannot be processed.
- **Solution**: Install `razorpay` (or `@stripe/stripe-js`) and implement genuine server-to-server order creation with webhook handlers.

### ⚠️ Gap 4: Missing Global RFC 7807 Error Handling
- **Current State**: Individual route handlers use ad-hoc `try/catch` blocks returning generic `{ success: false, message: ... }`.
- **Standard**: Fastify standard applications use `fastify.setErrorHandler(...)` to emit consistent RFC 7807 problem details with error codes (`ERR_OUT_OF_STOCK`, `ERR_INVALID_OTP`).

### ⚠️ Gap 5: Process Lifecycle & Graceful Shutdown
- **Current State**: The Node process in `src/server.ts` does not intercept `SIGTERM` or `SIGINT` signals.
- **Risk**: When Render deploys new code or restarts an instance, active WebSocket connections and in-flight HTTP requests can be abruptly severed.
- **Solution**: Implement `fastify.close()` on termination signals to finish in-flight requests and close DB pools gracefully.

### ⚠️ Gap 6: Structured Logging & Correlation IDs
- **Current State**: Console logs print plain strings; Fastify logger is on, but lacks correlation request IDs.
- **Standard**: Every request should pass an `X-Request-Id` header through all log statements and error reports to trace user issues in seconds.

### ⚠️ Gap 7: Automated Test Suite (CI/CD)
- **Current State**: Verification is done via manual curl requests and typechecks (`tsc --noEmit`).
- **Standard**: A test suite using `vitest` and `supertest` covering auth, catalog filtering, and order creation running automatically on GitHub Actions before merging to `main`.

---

## 5. Maximum Performance Optimization Blueprint (Sub-30ms)

To ensure the backend runs at maximum speed while remaining on $0 free tiers:

1. **In-Memory Cache for Catalog (TTL: 5 Minutes)**:
   Because the catalog has 100–300 items, cache the full catalog in Node memory using a simple Map or `lru-cache`. Invalidate the cache only when a product is added or updated. Database hits for catalog queries drop to **zero**.
2. **PostgreSQL Indexes**:
   Add B-Tree indexes on frequently filtered columns:
   ```sql
   CREATE INDEX idx_products_category ON public.products(category);
   CREATE INDEX idx_products_created_at ON public.products(created_at DESC);
   CREATE INDEX idx_orders_status ON public.orders(status);
   CREATE INDEX idx_orders_customer_email ON public.orders(customer_email);
   ```
3. **Keep-Alive Uptime Ping**:
   Maintain the 5-minute cron ping via Cron-job.org pointing to `/health` to eliminate cold starts.
4. **Connection Pooling via PgBouncer**:
   When connecting to Supabase from serverless or Node instances, use port `6543` (transaction mode) rather than direct port `5432` to avoid exhausting PostgreSQL connection limits.

---

## 6. Local Development & Deployment Workflow

### Prerequisites
- Node.js 20+ / 24+
- Supabase project credentials

### Environment Variables (`.env`)
```env
PORT=5000
HOST=0.0.0.0
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

SUPABASE_URL="https://wlivgkosmbfgjtecvznj.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

RESEND_API_KEY="your-resend-key"
NOREPLY_EMAIL="noreply@gargisaha.com"

JWT_SECRET="your-256-bit-jwt-secret"
AUTH_SECRET="your-256-bit-auth-secret"
```

### Essential CLI Commands
```bash
# Install all dependencies including dev tools
npm install --include=dev

# Start hot-reloading development server
npm run dev

# Run strict TypeScript typecheck
npm run typecheck

# Build optimized production bundle
npm run build

# Start production server
npm start
```

---

## 7. Database Migrations Ledger

All database schema versions are tracked in the [`/migrations`](./migrations) directory:
- `0001_initial_schema.sql`: Core products and orders tables.
- `0002_seed_initial_data.sql`: Vedic luxury saree and lehenga catalog.
- `0003_enable_rls_security_policies.sql`: Row-Level Security (RLS) enforcement and role policies.
- `supabase_schema.sql`: Consolidated baseline setup.

---

*Authored for House of Gargi Luxury Handloom Atelier — Scalable, Secure, and Ultra-Fast.*
