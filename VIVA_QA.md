# VoteChain BD — Viva Q&A Preparation Guide
This document serves as the core defense template for CSE412/CSE347 examiners, defending design choices, architectural transitions, security mechanisms, and performance constraints.

---

## 🔒 The "Observer" Role Removal Defense

### Q1: Your requirements checklist originally listed an "Observer" role. Why did you remove it from the system?
**Answer:**
"The Observer role was deliberately removed to support a stronger security and auditing design. In traditional digital voting systems, a human observer is a weak point—they can be bribed, make errors, or miss split-second database changes. 

In **VoteChain BD**, we replaced passive human observation with **automated, mathematical transparency**:
1. **Public Verification Engine:** Any citizen can verify that their individual vote exists in the blockchain using an anonymous receipt.
2. **Sequential SHA-256 Chain Auditing:** The system automatically re-audits the entire database hash chain.
3. **Real-time AI Anomalies Engine:** Automated fraud detectors identify sybil attacks and device collisions instantly, publishing the security logs to the database.

By replacing subjective human observers with continuous cryptographic checks, we made the system more transparent, secure, and resilient."

---

## 🧱 The Blockchain Implementation Defense

### Q2: Is this a 'real' blockchain? Why didn't you build it on Ethereum or Hyperledger?
**Answer:**
"This is a **hash-chain audit ledger** that implements the primary mathematical principles of a blockchain—hash linkage, tamper evidence, and append-only immutability—without a decentralized ledger. 

A distributed blockchain (like Ethereum or Hyperledger) is not suitable for a national election system because:
1. **High Cost & Latency:** Casting 10,000 votes a minute on a public blockchain is expensive and slow.
2. **Centralized Authority:** The Bangladesh Election Commission (EC) is the constitutionally mandated central authority for elections. A fully decentralized network conflicts with this legal framework.

Our hash-chain design provides complete tamper-evidence. If the EC or an attacker attempts to alter a past vote in our database, the SHA-256 chain links break, and the public verification check fails. This gives us blockchain-grade security with database-grade speed."

---

## 🕵️ Secrecy & Zero-Knowledge Receipts

### Q3: How does your Zero-Knowledge verification work? Can the EC find out who I voted for?
**Answer:**
"In VoteChain BD, it is mathematically impossible to link a voter's identity to their candidate choice. 

Our database schema enforces this separation:
1. **User Table:** Contains standard voter registrations and NIDs.
2. **VoterElection Table:** Records whether a specific voter has voted in an election to prevent double voting. It contains **no** information about the voter's choice.
3. **Vote Table:** Stores the cast ballot, candidate ID, and blockchain hashes. Crucially, the Vote table **does not have a `voter_id` field**.
4. **VoteToken Table:** Stores the verification UUID receipt. It is linked to a `vote_id`, but contains **no reference to the voter**.

Because there is physically no column linking `user_id` to `vote_id` or `candidate_id` anywhere in the database, even an administrator with full root database access cannot trace a vote back to the voter who cast it. This is a robust, schema-level zero-knowledge guarantee."

---

## 🎯 Double Voting Prevention

### Q4: How is duplicate voting prevented? Is it just verified in your React/Express code?
**Answer:**
"We enforce double-voting protection at the database level using a **strict unique compound constraint**. 

In our Prisma schema, the `VoterElection` join table features:
```prisma
model VoterElection {
  voter_id    Int
  election_id Int
  has_voted   Boolean @default(false)
  
  @@unique([voter_id, election_id])
}
```

Even if a malicious user bypasses our frontend and triggers thousands of API requests at the exact same millisecond, the PostgreSQL engine blocks duplicate writes. We wrap this check inside a database `$transaction` block to prevent race conditions. Duplicate votes are instantly rejected with a `403 Forbidden` error."

---

## ⚙️ Non-Functional Requirements (NFRs) & Scale

### Q5: What is your most critical Non-Functional Requirement (NFR), and how did you verify it?
**Answer:**
"Our most critical NFR is **NFR4 — High Concurrency (10,000 concurrent updates)**. 
While we designed our platform to handle heavy loads, we could not run physical load tests of that size on our production server due to cost and hosting limits.

To support high concurrency, we structured our architecture to handle heavy traffic:
1. **Stateless JWT Authentication:** The backend does not store sessions in memory, allowing it to scale horizontally.
2. **Fast Hashing Algorithmic Links:** Blockchain verification takes only milliseconds because SHA-256 checks are fast and light.
3. **Optimized Indexes:** We added unique indexes on compound keys to ensure lookups run in $O(1)$ time."

---

## 🧑‍💼 Candidate Self-Registration Benefits

### Q6: How does Candidate Self-Registration improve on standard electronic voting systems?
**Answer:**
"In older electronic voting designs, election administrators had to manually enter candidate details, manifestos, and photos. This created administrative bottlenecks and led to data entry mistakes.

By introducing Candidate Self-Registration, we **decentralize the data entry workload**:
1. Candidates upload their own profiles and manifestos to the portal.
2. The Election Commission transitions from a slow data-entry clerk into a **review and approval authority**.
3. This process matches real-world election operations, where candidates submit nominations and officials verify them."
