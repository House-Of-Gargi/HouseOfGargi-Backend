# House of Gargi — Backend API Service

High-performance Fastify v5 enterprise microservice powering the House of Gargi luxury fashion atelier.

---

## Features

- **Fastify v5**: Blazing fast HTTP framework handling 35k–50k requests/sec.
- **OpenAPI 3.1 & Swagger**: Interactive documentation at `/documentation`.
- **Cryptographic OTP Authentication**: 6-digit access codes signed with HMAC SHA-256 and dispatched via Resend transactional email API.
- **Authoritative Checkout**: Server-side price validation preventing client-side spoofing.
- **PostgreSQL / Supabase Integration**: Cloud data persistence with WebSocket real-time transport.
- **Real-Time WebSockets**: `/ws/sync` hub for cross-device cart, wishlist, and stock sync.

---

## Getting Started

### 1. Prerequisites
- Node.js 20+
- npm or pnpm

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
HOST=0.0.0.0
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

SUPABASE_URL="https://wlivgkosmbfgjtecvznj.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

RESEND_API_KEY="your-resend-api-key"
NOREPLY_EMAIL="noreply@gargisaha.com"

JWT_SECRET="your-jwt-secret"
AUTH_SECRET="your-auth-secret"
```

### 3. Installation & Local Development
```bash
# Install dependencies
npm install

# Start development server with live reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check & uptime |
| `GET` | `/documentation` | Interactive Swagger UI |
| `GET` | `/api/v1/products` | Catalog listing with filters |
| `GET` | `/api/v1/products/:id` | Full product detail |
| `GET` | `/api/v1/products/categories` | Curated luxury categories |
| `POST` | `/api/v1/auth/otp/send` | Send 6-digit OTP to patron email |
| `POST` | `/api/v1/auth/otp/verify` | Verify OTP & issue JWT |
| `POST` | `/api/v1/orders/checkout/session` | Create verified checkout session |
| `POST` | `/api/v1/orders` | Place patron order |
| `GET` | `/api/v1/seller/analytics` | Telemetry & revenue stats |
| `WS` | `/ws/sync` | Real-time WebSocket sync hub |
