# OneID Bangladesh — Live Demonstration Walkthrough Script
This document outlines the step-by-step procedure for showcasing **OneID Bangladesh** to the Viva Board panel. It guides the presenter from the sovereign landing page through individual citizen utility lifecycle events, concluding with the cryptographic blockchain security audits.

---

## 🟢 DEMO PHASE 1 — Public Trust & National Identity

### Step 1: Sovereign Landing Portal
* **Visual Focus**: The main landing page styled with clean Bangladesh flag red/green geometric borders, official Bangla localized titles, and 5 interactive module cards.
* **Demonstrate**: 
  1. Point out the high-contrast Bangla welcome headings: `এক নাগরিক, এক পরিচয়` (One Citizen, One Identity).
  2. Scroll down to show live real-time metrics showing overall citizen registrants, sealed blocks, and verified blockchain transactions.
  3. Explore responsive hover transitions on the 5 core module cards (Elections, Tax, Vehicle, Land, Civil Registry).

### Step 2: Register New Citizen
* **Visual Focus**: The standard public Registration screen.
* **Demonstrate**:
  1. Click **Register** on the top right.
  2. Input a new realistic citizen's profile (e.g., name, phone number, division: "Dhaka", constituency: "Dhaka-1").
  3. Click **Submit Registration**.
  4. **Key Moment**: Show the screen automatically generating a brand-new official **OneID** identifier in the sovereign format: `BD-2026-X` where X is a unique serial digit (e.g., `BD-2026-SNT001` format). Highlight that this ID instantly maps all corresponding e-services.

### Step 3: Unified Citizen Dashboard Hub
* **Visual Focus**: The central unified dashboard logged in as **Sheikh Talha Shahriar** (`talha@citizen.bd`).
* **Demonstrate**:
  1. Point out the customized, visually distinct digital **OneID Smart Card** showing the user photo, official ID serial, unique blood group card, and QR Code containing the encrypted profile payload.
  2. Show the summary panels representing live status for each of the 5 active e-government modules.
  3. Draw attention to the **Recent Activity Feed** detailing audit events (successful logins, profile scans, status updates).

---

## 🔵 DEMO PHASE 2 — Multi-Sector Sovereign Modules

### Step 4: Tax & Revenue Service (NBR Desk)
* **Visual Focus**: **Tax & Revenue Cabinet** page.
* **Demonstrate**:
  1. Explain that Bangladesh uses progressive slab tax rates (First BDT 350,000 free, next levels at 5%, 10%, 15%, etc.).
  2. Fill in gross income BDT 800,000. Click **Calculate Tax Breakdown**. Show the detailed NBR tax-brackets breakdown showing exact rates per tier.
  3. Click **File Official Tax Return**. 
  4. **Key Moment**: Point out the green glowing **LedgerBadge** stamp showing "Sealed in NBR Blockchain". Click the badge to reveal the cryptographic hash, sequence number, and HMAC secure signature backing this return.

### Step 5: Vehicle Registrar (BRTA Console)
* **Visual Focus**: **Vehicle Registrar** dashboard.
* **Demonstrate**:
  1. Display the official BRTA Holographic **Digital Driving License Card** featuring a metallic silver shimmer effect, custom category icons, and live status.
  2. Scroll to the registered vehicles timeline to show Talha’s **Toyota Corolla (DHAKA-GA-KH-5678)**.
  3. Point out the chronological timeline showing historical registration records and active traffic violations. Explain how road tax renewals are tracked and alert cron events are generated.

### Step 6: Land title Registry (Ministry of Land)
* **Visual Focus**: **Property & Real Estate Ledger**.
* **Demonstrate**:
  1. Show the list of lands owned by Talha, highlighting **Apartment 4B, Mirpur-10, Dhaka**.
  2. Click **View Chain of Title History**. Show the chronological lineage of deeds and ownership handoffs (Mehnaz Rahman $\rightarrow$ Sheikh Talha Shahriar).
  3. Open the Property Transfer page. Explain the smart-contract conditions backing real estate handoffs: (a) Clear Tax profile check, (b) Seller signature, (c) Buyer Signature, (d) Registrar Approval. Note that all four must resolve true before property records are mutated.

### Step 7: Marriage & Civil Registry (Nikah Desk)
* **Visual Focus**: **Civil Registry Marriage & Divorce** panels.
* **Demonstrate**:
  1. Click **View Nikahnaama Certificate** for Talha’s active marriage record with Sadia Islam.
  2. **Key Moment**: Point out the highly formal, traditional cream-colored parchment contract framed by deep emerald double-borders, containing local Kazi details, official Ministry seal, witness IDs, and the unique signature blockchain checksum at the bottom margin.
  3. View the Divorce proceedings as Mehnaz Rahman. Highlight the 90-day countdown timer representing the statutory reconciliation period required under local municipal law before auto-finalization crons execute.

---

## 🔴 DEMO PHASE 3 — Blockchain Integrity & Public Transparency

### Step 8: Super Admin Console — Chain Verification
* **Visual Focus**: System Operations Dashboard logged in as **Arif Hossain** (`arif@oneid.gov.bd`).
* **Demonstrate**:
  1. Click the **Global Ledger Auditor** tab.
  2. Click **Verify All Chains**.
  3. **Key Moment**: Point out the 5 green audit badges representing the 5 sectors (VOTE, TAX, VEHICLE, PROPERTY, CIVIL_REGISTRY). All show "INTEGRITY GREEN (Valid & Sealed)". Explain that the backend verified every node's Hash, Previous Hash, sequence sequence numbers, and HMAC sector signatures successfully.

### Step 9: Tamper Demonstration
* **Visual Focus**: Verification failure scenario.
* **Demonstrate**:
  1. Explain that for demonstration purposes, if an intruder bypassed database security and updated a database row without updating the blockchain sequence hashes, the platform instantly registers a tamper event.
  2. Show a simulated tamper action (e.g. updating a gross-income values or a property title address).
  3. Clicking **Verify All Chains** again.
  4. **Key Moment**: The corresponding module (e.g. TAX) immediately flashes red: `✗ TAMPER DETECTED in TAX`. Point out that the system pinpoints the exact sequence block number, layer, and reason for the failure. Showcase that an automated alert email has been fired off to all logged SUPER_ADMIN accounts.

### Step 10: Public Ledger Verifier
* **Visual Focus**: Public verification portal (no authentication required).
* **Demonstrate**:
  1. Log out of the Citizen session.
  2. Navigate to the public **Ledger Verification** page.
  3. Input any specific transaction UUID / record ID (e.g. NBR receipt code, Nikahnaama certificate hash, or property deed ID).
  4. Click **Inspect Blockchain Proof**.
  5. Show that the portal displays the reduced verification footprint: Block Sector, registration timestamp, block sequence index, and Merkle Seal confirmation. Highlight that citizens can independently verify state records and confirm the authenticity of receipts from any device without credentials.

---
*Created in high compliance with Bangladesh E-Governance guidelines, Day 26–28.*
