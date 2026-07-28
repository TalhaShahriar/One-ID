# 🇧🇩 OneID Bangladesh — Unified E-Governance & Blockchain Platform

**OneID Bangladesh** is a unified, secure e-governance infrastructure for citizens of Bangladesh. It brings together national identity management, cryptographic voting, digital taxation, land property registry, vehicle licensing, and civil registry services into a single citizen portal powered by an immutable blockchain ledger.

---

## 🚀 Key Features

### 🆔 1. Unified Citizen Identity (OneID)
- Centralized digital identity generation (`BD-XXXX-XXXX`).
- Multi-Factor Authentication (MFA) with OTP and WebAuthn (Biometric Touch ID / Face ID) integration.
- Public Identity Verification endpoint for verifiers with privacy-preserving PII minimization.

### 🗳️ 2. Digital Voting & Blockchain Ledger
- Anonymous, tamper-evident vote casting with cryptographic hashing (`computeVoteHash`).
- Real-time election tracking and live Socket.io block updates.
- Verification receipts (`QRCode` + receipt tokens) for public verification without exposing voter identity.
- Automated hourly blockchain verification cron job ensuring ledger sequence integrity.

### 📜 3. Property & Land Registry
- Land title deed registration with khatian, plot numbers, boundary details, and Mouza records.
- Smart transfer workflows requiring seller signature, buyer sign-off, and administrative mutation approval.
- Boundary dispute flagging system that intercepts and halts active transfers.
- Integrated tax arrears clearance check prior to title mutation.

### 🚘 4. BRTA Vehicle & Driving License Portal
- Driving license application processing (Approve / Reject workflows with auto-expiry calculations).
- Physical vehicle registration with engine/chassis number verification.
- Road tax renewal and automatic expiration notification scheduling.
- Traffic violation logging, automated license suspension after 5 tickets, and fine settlement.

### 📄 5. E-Taxation & Revenue System (NBR)
- Automated e-TIN certificate generation and downloadable PDF certificates.
- Progressive tax slab calculation based on income, age, gender, and municipal region.
- Automated anomaly detection flagging drastic income drops (>40%) or high first-time filings (>10M BDT).
- Tax return payment handling with instant electronic receipts.

### 🏛️ 6. Civil Registry (Birth, Marriage, Death & Divorce)
- Official birth and death certificate issuance with downloadable digital PDFs.
- Kazi marriage registration & application review portal.
- Divorce arbitration tracking with automated 90-day finalization cron routines.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Socket.io-client
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: PostgreSQL / SQLite (via Prisma)
- **Security & Crypto**: Custom Ledger Engine, SHA-256 Merkle Block Sealing, HMAC Record Signatures, JWT, WebAuthn
- **Services**: Node-Cron (Schedulers), PDFKit (Document Generation), QRCode (Receipt Tokens)

---

## 💻 Local Setup & Development

### Prerequisites
- Node.js (v18+)
- npm or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory based on `.env.example`:
```env
PORT=3000
JWT_SECRET=your_secure_jwt_secret_here
LEDGER_HMAC_SECRET=your_secure_hmac_secret_here
NODE_ENV=development
```

### 3. Database Migration
```bash
npx prisma migrate dev
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 🛡️ Security & Integrity Assurances

- **Immutable Ledger**: Multi-sector blockchain ledger (`VOTE`, `TAX`, `VEHICLE`, `PROPERTY`, `CIVIL_REGISTRY`) sealed with Merkle blocks.
- **Audit Alarm System**: Automatic email alerts dispatched to Super Administrators upon detection of hash chain discontinuities or record tampering.
- **Rate Limiting & Cyberdefense**: Strict API rate limiters protecting authentication, OTP, and sensitive governance endpoints.
