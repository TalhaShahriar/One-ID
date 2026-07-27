# VoteChain BD — Interactive 7-Minute Demo Script
This script provides the precise, minute-by-minute step-by-step sequence for presenting **VoteChain BD** to viva examiners or stakeholders.

---

## ⏱️ Minute 1: System Overview & Architecture
### 🎤 What to Say:
> "Honorable Examiners, welcome to the demonstration of **VoteChain BD**—Bangladesh's first prototype of a cryptographically secure, blockchain-audited digital voting platform. 
> Developed to fit within current sovereign rules, VoteChain BD supports all three main election forms in our country: **National Parlimentary Jatiya Sangsad, Local Government (Union Parishad/City Corporation), and Presidential** elections.
> Let's look at the home screen: we feature a clean, high-contrast, responsive dashboard. On mobile, constituents can install our fully configured Progressive Web App (PWA) with a single tap for offline-ready, push-notification-enabled mobile voting."

### 🖱️ Action:
1. Open the landing page of **VoteChain BD** in your browser.
2. Scroll down gracefully to reveal the core features: **Identity verification via NID hashing, decentralized SHA-256 hash chains, zero-knowledge receipt verification, and real-time live statistical boards.**
3. Resize the browser to show the fully optimized mobile responsive layout.

---

## ⏱️ Minute 2: Candidate Self-Registration
### 🎤 What to Say:
> "In traditional digital voting models, election officials must type candidate details manually. This is slow and prone to errors. 
> To solve this, VoteChain BD introduces **Candidate Self-Registration**. Candidates register their own accounts under specific administrative units, specify their political party, and upload their official manifesto, photo, and educational history. Let's do this live."

### 🖱️ Action:
1. Click **"Register"** or go directly to the registration page.
2. Register an account with `Role: CANDIDATE` (e.g., `testcandidate@party.bd`).
3. Complete the registration form and navigate to the **Candidate Dashboard**.
4. Show the **"PENDING"** application banner: *"Your candidacy profile is currently pending review by the Jatiya Sangsad Elec Commission."*

---

## ⏱️ Minute 3: Administrator Review & Approval
### 🎤 What to Say:
> "Once candidate profiles are uploaded, they do not automatically go live. To prevent bad actors, an **Admin from the Bangladesh Election Commission** must review and approve them. Let's log in as the Administrator."

### 🖱️ Action:
1. Log out, and log in with the administrator account:
   - **Email:** `admin@votechain.bd`
   - **Password:** `Admin@123`
2. Navigate to `/admin/candidates` or the **Candidate Reviews Queue**.
3. Locate the pending candidate we just registered.
4. Click **"Approve Candidate"**.
5. Once clicked, show that the state instantly changes to **APPROVED**. Explain: *"An automated transactional notification email has been dispatched to the candidate's verified address."*

---

## ⏱️ Minute 4: Live Voting & Real-Time Dashboard Updates (The Visual Peak)
### 🎤 What to Say:
> "Now, let's witness the core of the voting experience. In one browser window, we have the Admin's Real-time Analytics Dashboard. In another window on the right, we will log in as a registered voter from the **Dhaka-1 constituency** to cast a ballot live. Let's see the live web sockets update in real time."

### 🖱️ Action:
1. Position the Admin Dashboard (`/admin/elections`) on the left half of the screen, revealing the bar charts and turnout metrics of **"Dhaka-1 Constituency By-Election Demo"**.
2. On the right half of the screen (or in an incognito window), log in as a registered voter from Dhaka-1:
   - **Email:** `voter01@test.bd`
   - **Password:** `Test@123`
3. Click on the active **Dhaka-1 By-Election Demo** card.
4. Choose candidate **Aminul Islam** (Awami League) and click **"Cast Vote securely"**.
5. Respond to the mock OTP modal by typing `123456`, then click **"Confirm Ballot"**.
6. **IMMEDIATELY POINT TO THE ADMIN WINDOW ON THE LEFT**: Notice the live chart animate and update from `7` to `8` votes without reloading! The voter turnout gauge updates instantly!

---

## ⏱️ Minute 5: Zero-Knowledge Verification Receipt
### 🎤 What to Say:
> "Once a vote is cast, we face a major challenge: how does a voter verify that their vote was recorded, without violating their constitutional right to a secret ballot? 
> VoteChain BD solves this with our **Zero-Knowledge (ZK) Receipt Verification**. 
> The system generates an anonymous UUID token. The database relation links this token to a vote, but contains *no* reference to the Voter ID or the Choice. Let's verify the token."

### 🖱️ Action:
1. Show the success screen with the digital **Verification Receipt**, complete with its unique SHA-256 vote hash and a scannable **QR Code**.
2. Copy the **Receipt Token UUID**.
3. Log out and navigate to the public `/verify` page.
4. Paste the receipt token into the field and click **"Audit Token"**.
5. Show the green success message: **"Vote verified in ledger ✓ — Cast on [Timestamp] for Dublin/Dhaka Election."**
6. Highlight: *"The interface confirms that this vote exists in the blockchain. It cannot show WHO voted or FOR WHOM they voted, providing perfect secrecy."*

---

## ⏱️ Minute 6: Blockchain Status & Tamper Evidence
### 🎤 What to Say:
> "Now, how can society trust that the election commission didn't alter votes inside the database at midnight? 
> Every vote acts as a cryptographic block. The hash calculation of block `N` includes the hash of block `N-1`. This creates an unbroken chain. If an attacker alters even a single character of a past vote, the entire subsequent chain breaks."

### 🖱️ Action:
1. Log back in as Admin (`admin@votechain.bd` / `Admin@123`).
2. Navigate to the **"Blockchain Audit Trail"** tab (`/admin/blockchain-status`).
3. Point to the green status: **"Chain Integrity: INTACT ✓"** showing 16 votes.
4. Click **"Verify Chain Now"**—it recalculates all SHA-256 hashes sequentially across the database in milliseconds.
5. *(Optional/Explanation)*: *"If an attacker directly updates a cell in our PostgreSQL database, clicking this button instantly flashes a red alarm indicating the broken block index and the exact modified Vote UUID."*

---

## ⏱️ Minute 7: AI Fraud Detection, Audit Logs & Professional Reporting
### 🎤 What to Say:
> "Beyond mathematical chains, we protect our election gates. Our automated **Anomaly Detection Engine** checks voter activity against rules like IP Rate Spikes and Hardware Device Collision. Here on the Admin board, we can see flagged anomalies.
> Finally, we compile everything into a professional export. Let's download the certified results."

### 🖱️ Action:
1. From the Admin Dashboard, click on the **Anomaly Flags** section inside the election details.
2. Show the two high-severity flags:
   - **IP_RATE_SPIKE**: Indicates 37 requests from a single IP address try-loading multiple voting attempts.
   - **DEVICE_COLLISION**: Identifies two different voter logins from the same hardware browser fingerprint.
3. Scroll to the election list, and click **"PDF"** to export.
4. Open the downloaded high-quality PDF featuring turnout percentages, voter statistics, and the official commission seal and SHA-256 checksum verification block.
5. Close the presentation with confidence: *"VoteChain BD meets all functional requirements, features an optimized ledger, and guarantees that every single ballot is untamperable and mathematically verified. Thank you."*
