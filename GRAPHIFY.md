# House of Gargi Backend — System Topology & Architectural Graph (Graphify)

> Generated on Thu, 29 Oct 2026 09:09:03 GMT | Total Modules: **45** | Total Dependencies: **36**

## Community Cluster Metrics

| Architectural Tier | Modules Count | Primary Responsibility |
| :--- | :---: | :--- |
| **Configuration & Manifests** | `4` | Clustered subsystems in Configuration & Manifests |
| **Supabase PostgreSQL Migrations** | `19` | Clustered subsystems in Supabase PostgreSQL Migrations |
| **Automation Scripts** | `1` | Clustered subsystems in Automation Scripts |
| **Gateway Core & Server Lifecycle** | `2` | Clustered subsystems in Gateway Core & Server Lifecycle |
| **Configuration & Env Validation** | `1` | Clustered subsystems in Configuration & Env Validation |
| **Database & Realtime Connectors** | `2` | Clustered subsystems in Database & Realtime Connectors |
| **Infrastructure & Telemetry** | `2` | Clustered subsystems in Infrastructure & Telemetry |
| **Security & Auth Guards** | `1` | Clustered subsystems in Security & Auth Guards |
| **Fastify API Routes** | `8` | Clustered subsystems in Fastify API Routes |
| **Domain Business Services** | `4` | Clustered subsystems in Domain Business Services |
| **Test Suites & Verification** | `1` | Clustered subsystems in Test Suites & Verification |

## Top Hub Modules (Highest Degrees)

| Module | In-Degree (Dependents) | Out-Degree (Dependencies) | Community |
| :--- | :---: | :---: | :--- |
| `src/app.ts` | 2 | 10 | Gateway Core & Server Lifecycle |
| `src/db/supabase.ts` | 11 | 1 | Database & Realtime Connectors |
| `src/services/catalog.service.ts` | 4 | 2 | Domain Business Services |
| `src/routes/auth.routes.ts` | 1 | 4 | Fastify API Routes |
| `src/lib/audit.ts` | 3 | 1 | Infrastructure & Telemetry |
| `src/routes/admin.routes.ts` | 1 | 3 | Fastify API Routes |
| `src/routes/seller.routes.ts` | 1 | 3 | Fastify API Routes |
| `src/routes/super-admin.routes.ts` | 1 | 3 | Fastify API Routes |
| `src/routes/orders.routes.ts` | 1 | 2 | Fastify API Routes |
| `src/services/rbac.service.ts` | 2 | 1 | Domain Business Services |

## Complete Component Inventory

### Configuration & Manifests

- **`.env`** (20 lines) — *Module .env in Configuration & Manifests* [In: 0, Out: 0]
- **`package-lock.json`** (2206 lines) — *Module package-lock.json in Configuration & Manifests* [In: 0, Out: 0]
- **`package.json`** (44 lines) — *Module package.json in Configuration & Manifests* [In: 0, Out: 0]
- **`tsconfig.json`** (18 lines) — *Module tsconfig.json in Configuration & Manifests* [In: 0, Out: 0]

### Supabase PostgreSQL Migrations

- **`migrations/0001_initial_schema.sql`** (50 lines) — *Module 0001_initial_schema.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0002_seed_initial_data.sql`** (36 lines) — *Module 0002_seed_initial_data.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0003_enable_rls_security_policies.sql`** (73 lines) — *Module 0003_enable_rls_security_policies.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0004_ecommerce_relational_schema.sql`** (148 lines) — *Module 0004_ecommerce_relational_schema.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0005_roles_and_permissions.sql`** (36 lines) — *Module 0005_roles_and_permissions.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0006_categories_and_collections.sql`** (36 lines) — *Module 0006_categories_and_collections.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0007_artisan_profiles_and_applications.sql`** (66 lines) — *Module 0007_artisan_profiles_and_applications.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0008_products_curation_and_inventory.sql`** (19 lines) — *Module 0008_products_curation_and_inventory.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0009_payouts_and_audit_logs.sql`** (43 lines) — *Module 0009_payouts_and_audit_logs.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0010_assign_super_admin_and_admin_roles.sql`** (17 lines) — *Module 0010_assign_super_admin_and_admin_roles.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0011_admin_super_admin_portal_rbac_enforcement.sql`** (36 lines) — *Module 0011_admin_super_admin_portal_rbac_enforcement.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0012_bespoke_commissions.sql`** (45 lines) — *Module 0012_bespoke_commissions.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0013_product_customer_details.sql`** (37 lines) — *Module 0013_product_customer_details.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0014_tighten_rls_policies.sql`** (38 lines) — *Module 0014_tighten_rls_policies.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0015_clean_categories_and_roles.sql`** (40 lines) — *Module 0015_clean_categories_and_roles.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0016_products_lifecycle_columns.sql`** (34 lines) — *Module 0016_products_lifecycle_columns.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0017_otp_hardening.sql`** (25 lines) — *Module 0017_otp_hardening.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]
- **`migrations/0018_admin_password_auth.sql`** (21 lines) — *SQL migration adding password_hash column and seeding default passwords* [In: 0, Out: 0]
- **`migrations/supabase_schema.sql`** (59 lines) — *Module supabase_schema.sql in Supabase PostgreSQL Migrations* [In: 0, Out: 0]

### Automation Scripts

- **`scripts/generate-graphify.cjs`** (451 lines) — *Module generate-graphify.cjs in Automation Scripts* [In: 0, Out: 0]

### Gateway Core & Server Lifecycle

- **`src/app.ts`** (322 lines) — *Fastify application factory, Helmet security, rate limiter, and CORS* [In: 2, Out: 10]
- **`src/server.ts`** (49 lines) — *Process entrypoint, HTTP server listener, and graceful shutdown handlers* [In: 0, Out: 1]

### Configuration & Env Validation

- **`src/config/env.ts`** (31 lines) — *Module env.ts in Configuration & Env Validation* [In: 1, Out: 0]

### Database & Realtime Connectors

- **`src/db/catalog.ts`** (120 lines) — *Module catalog.ts in Database & Realtime Connectors* [In: 1, Out: 0]
- **`src/db/supabase.ts`** (14 lines) — *Supabase client singleton with service role key and WebSocket transport* [In: 11, Out: 1]

### Infrastructure & Telemetry

- **`src/lib/audit.ts`** (35 lines) — *Module audit.ts in Infrastructure & Telemetry* [In: 3, Out: 1]
- **`src/lib/errors.ts`** (16 lines) — *Module errors.ts in Infrastructure & Telemetry* [In: 0, Out: 0]

### Security & Auth Guards

- **`src/plugins/auth.plugin.ts`** (50 lines) — *Fastify route decorators (requireRole, authenticate) for RBAC enforcement* [In: 1, Out: 1]

### Fastify API Routes

- **`src/routes/admin.routes.ts`** (366 lines) — *Operations curator dashboard, product approvals, and artisan lifecycle* [In: 1, Out: 3]
- **`src/routes/auth.routes.ts`** (348 lines) — *Authentication gateway for patron OTP and administrative email+password sessions* [In: 1, Out: 4]
- **`src/routes/bespoke.routes.ts`** (119 lines) — *Heritage bespoke couture commission pipeline and artisan proposals* [In: 1, Out: 1]
- **`src/routes/categories.routes.ts`** (32 lines) — *Taxonomy, collection management, and storefront banner management* [In: 1, Out: 1]
- **`src/routes/orders.routes.ts`** (250 lines) — *Cart checkout sessions, Razorpay signatures, and patron order tracking* [In: 1, Out: 2]
- **`src/routes/products.routes.ts`** (148 lines) — *Curated luxury catalog retrieval, inventory checks, and product searches* [In: 1, Out: 1]
- **`src/routes/seller.routes.ts`** (517 lines) — *Artisan guild atelier telemetry, portfolio submissions, and payouts* [In: 1, Out: 3]
- **`src/routes/super-admin.routes.ts`** (518 lines) — *Executive Super Admin governance, admin privileges, password reset, and revenue* [In: 1, Out: 3]

### Domain Business Services

- **`src/services/auth.service.ts`** (215 lines) — *Cryptographic HMAC OTP generation, validation, and Resend email client* [In: 1, Out: 0]
- **`src/services/catalog.service.ts`** (187 lines) — *Module catalog.service.ts in Domain Business Services* [In: 4, Out: 2]
- **`src/services/password.service.ts`** (30 lines) — *bcrypt-based password hashing (12 rounds) and default credential verification* [In: 2, Out: 0]
- **`src/services/rbac.service.ts`** (55 lines) — *Authoritative multi-tier role resolution with hardcoded founder seeds* [In: 2, Out: 1]

### Test Suites & Verification

- **`test/api.test.ts`** (134 lines) — *Module api.test.ts in Test Suites & Verification* [In: 0, Out: 1]

