# SaaS Subscription and Analytics Platform

A backend service and web platform designed to automate subscription processing, test-mode payment checkouts, background queue management, automated PDF invoicing, Redis performance caching, and an AI agent integration using the Model Context Protocol (MCP).

---

## Technical Stack

- Frontend: React with Vite, JavaScript (ES6+), Glassmorphic CSS styling, SVG analytics charts.
- Backend: Node.js with Express (ES Modules).
- Database: PostgreSQL 16 using native connection pooling.
- Caching and Background Queue: Redis 7 with ioredis, BullMQ background worker queue, and node-cron scheduler.
- Payment Gateway: Stripe Test Mode (Checkout Sessions and Webhook signature verification).
- Document and Mail Delivery: PDFKit for invoice generation, Nodemailer with Mailtrap Sandbox SMTP for email delivery.
- AI Agent Integration: Model Context Protocol SDK (@modelcontextprotocol/sdk) supporting stdio and HTTP bridge transports.
- Infrastructure: Docker Compose for PostgreSQL and Redis services.

---

## Core Features Implemented

### 1. Subscription Checkout and Webhooks
The backend handles Stripe Test Mode checkout sessions using pre-configured Price IDs for Basic, Pro, and Elite subscription tiers. An asynchronous webhook endpoint (/api/webhooks/stripe) verifies Stripe signatures for payment success and subscription cancellation events, updating user profiles and subscription states in PostgreSQL.

### 2. Automated PDF Invoicing and Email Delivery
Upon successful payment, the service uses PDFKit to generate a formatted PDF invoice, saves it to local disk storage, and sends a confirmation email containing subscription details and the PDF invoice attachment via Mailtrap SMTP. Invoices are also accessible via a dedicated download API route.

### 3. Subscription Lifecycle Management and Redis Performance Tuning
Platform performance is optimized by caching executive revenue metrics (MRR, ARR, churn rate, active subscriber counts) in Redis with automatic TTL invalidation on subscription changes. A scheduled node-cron task runs periodically to detect subscriptions expiring within 3 days, queueing renewal alert jobs in BullMQ for asynchronous email processing.

### 4. AI Agent Interface (MCP Integration)
A custom Model Context Protocol (MCP) server allows AI assistants (such as Claude Desktop or LLM clients) to query platform data and execute actions. Available tools include:
- get_platform_statistics: Returns active subscribers, MRR, ARR, total revenue, and plan breakdown.
- get_subscriber_details: Retrieves customer subscription status by email.
- get_expiring_subscriptions: Lists subscriptions approaching renewal dates.
- trigger_renewal_reminder: Pushes a renewal reminder email job to the BullMQ queue.

An HTTP bridge endpoint (/api/mcp/execute) is also provided for interactive testing from the admin UI.

---

## Installation and Local Setup

### Prerequisites
- Node.js version 18 or higher
- Docker Desktop or Docker Engine

### Step 1: Clone Repository and Environment Setup
```bash
git clone https://github.com/iconghost06/Saas-Application.git
cd Saas-Application
cp .env.example .env
```

### Step 2: Configure Environment Variables
Edit the .env file with your local database, Stripe, and Mailtrap credentials:
```env
DATABASE_URL=postgresql://saas_user:saas_password@localhost:5432/saas_db
REDIS_HOST=localhost
REDIS_PORT=6379

STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_username
SMTP_PASS=your_mailtrap_password
```

### Step 3: Start Database and Redis Containers
```bash
docker-compose up -d
```

### Step 4: Install Dependencies and Start Backend Server
```bash
cd backend
npm install
npm run dev
```
The backend server listens at http://localhost:3000.

### Step 5: Install Dependencies and Start Frontend Application
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend interface runs at http://localhost:5173.

---

## Verification and Background Jobs Testing

### 1. Pre-configured Test Accounts
Refer to user_credentials.txt for the full list of 15 seeded accounts across active, expiring, and canceled states.
- System Admin: admin@saasplatform.com / admin123
- Standard Client: client@example.com / client123
- Expiring Client (2.5 days remaining): user04.expiring@saasdemo.com / client123

### 2. Manual Background Queue Trigger
To test the expiration cron task and BullMQ worker queue manually, execute:
```bash
curl -X POST http://localhost:3000/api/subscriptions/trigger-cron-check
```
This queries PostgreSQL for subscriptions expiring in 3 days, enqueues BullMQ jobs, and dispatches renewal emails to Mailtrap.

### 3. Testing MCP Server Tools via HTTP Bridge
To verify the MCP tool interface:
```bash
curl -X POST http://localhost:3000/api/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{"toolName":"get_platform_statistics","args":{"forceRefresh":true}}'
```

---

## Submission Deliverables

- Source code repository containing backend services and frontend interface.
- Docker Compose configuration for PostgreSQL 16 and Redis 7.
- Sample environment file (.env.example) and seed credentials (user_credentials.txt).
- Technical documentation covering setup, background processing, and MCP server configuration.
