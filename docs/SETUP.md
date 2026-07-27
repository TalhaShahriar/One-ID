# Installation & Configuration Guide (OneID Bangladesh)

This document provides complete instructions for cloning, configuring, migrating, seeding, and running the sovereign **OneID Bangladesh** unified digital identity platform node on a local environment or production server container.

---

## 🛠️ Prerequisites

To deploy and execute the platform node, ensure the following core tools are installed:
* **Node.js**: v18.0.0 or higher is required (v20+ recommended).
* **NPM**: v9.0.0 or higher.
* **PostgreSQL**: v14.0 or higher (required for relational schemas, JSON support, and secure block trigger constraints).
* **K6 (Optional)**: Installed on path if executing load stress tests.

---

## 🚀 Step-by-Step Installation

### Step 1: Clone & Setup Workspace
Navigate into your desired installation directory and run:
```bash
git clone <repository-url> oneid-bangladesh
cd oneid-bangladesh
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file at the root of the project. Copy and populate the following required parameters based on your network and database credentials:

```env
# Node Environment Mode
NODE_ENV=development
PORT=3000

# Client Navigation Endpoint
CLIENT_URL=http://localhost:3000
APP_URL=http://localhost:3000

# PostgreSQL Database Connection URI
# Format: postgresql://<username>:<password>@<host>:<port>/<database>?schema=public
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/oneid_db?schema=public"

# JSON Web Token Secret
JWT_SECRET="oneid-sovereign-bd-jwt-cryptokey-session-987654"

# Blockchain HMAC Secret (Sovereign Sector Keys)
LEDGER_HMAC_SECRET="bangladesh-e-gov-super-hmac-secret-key-salt-9876"

# Automated Email System Parameters (SMTP)
EMAIL_SERVICE=gmail
EMAIL_USER="your-oneid-node@gmail.com"
EMAIL_PASS="your-google-app-password"
```

### Step 3: Run Database Migrations
Initialize the database schemas, relational models, indexes, and constraints with Prisma:
```bash
# Push schemas directly to local database node
npx prisma db push

# Generate Prisma Client models
npx prisma generate
```

### Step 4: Run E-Gov Seed Data
Execute the seed script to wipe historical tables and establish the complete, realistic Bangladesh e-gov profiles. This includes 14 exact users across administrative and citizen tiers, tax profiles, vehicles, properties, Nikahnama documents, and 16 sequential ledger registrations.
```bash
npx tsx prisma/seed.ts
```
Expected success output:
`✓ Seeded 14 users, 3 tax records, 2 vehicles, 2 properties, 2 marriage records, 16 ledger records`

### Step 5: Start Dev Platform Server
Launch the unified Express backend service along with the integrated Vite frontend:
```bash
npm run dev
```

The terminal log will verify blockchain core health checks on booting:
```
⏰ [OneID Schedulers] Initializing multi-sector audit & compliance daemon...
✓ VOTE chain: 0 records, valid
✓ TAX chain: 3 records, valid
✓ VEHICLE chain: 7 records, valid
✓ PROPERTY chain: 3 records, valid
✓ CIVIL_REGISTRY chain: 3 records, valid
🚀 OneID Bangladesh Server active on http://0.0.0.0:3000
```

---

## 📊 Verification & Tests

### Executing Load Stress Tests
To execute the k6 performance load test (30 concurrent users ramping over 30s, holding for 60s, checking 5 endpoints), ensure your server is running (on port 3000) and execute:
```bash
k6 run tests/stress/oneid.stress.js
```

### Checking Linter & Code Quality
Ensure typescript emissions and code qualities conform to standard rules:
```bash
npm run lint
```

---

## 🌐 Default Access URLs

Once running, access the node services under these primary entrypoints:
* **Citizen Portal Navigation (SPA)**: `http://localhost:3000/`
* **Secure login interface**: `http://localhost:3000/login`
* **System health status API**: `http://localhost:3000/api/health`
* **Core ledger metrics API**: `http://localhost:3000/api/ledger/stats`

---
*Prepared in accordance with Bangladesh E-Governance development criteria, Days 26–28.*
