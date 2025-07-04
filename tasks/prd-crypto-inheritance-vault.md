# Crypto-Inheritance Vault – Product Requirements Document (PRD)

## 1. Introduction / Overview
A Crypto-Inheritance Vault allows a crypto user (the **Owner**) to securely encrypt sensitive files (e.g., seed phrases, wills, PDFs) in-browser using AES-256, store the ciphertext on the Walrus decentralized storage network (<https://www.walrus.xyz/>), which offers scalable on-chain data storage at low cost, and lock the symmetric AES key inside a confidential Solidity smart contract deployed on Oasis Sapphire (EVM). The contract enforces a configurable **proof-of-life** mechanism: the Owner must periodically sign a ping every **J = 30 days**. If no ping is received within *J + 30 days* (grace window), the contract automatically releases the AES key to pre-defined **Heir** wallets. Heirs can then decrypt the vault contents directly in their browsers.

## 2. Goals
1. Guarantee that heirs receive vault contents only after verifiable Owner inactivity/death.
2. Provide an end-to-end, on-chain, trust-minimised workflow—no centralized servers.
3. Offer a frictionless, sleek UI that appeals to both crypto-savvy and mainstream users.
4. Achieve full feature parity across desktop and mobile browsers.

## 3. User Stories
* **As an Owner**, I want to create multiple vaults so I can segregate documents among different heirs.
* **As an Owner**, I want to add or remove files within a vault at any time so I can keep information up-to-date.
* **As an Owner**, I want to configure the proof-of-life interval (J) and grace window so I can set my own risk tolerance.
* **As an Owner**, I want to designate one or more heirs per vault so that each heir receives only the intended files.
* **As an Owner**, I want to add "Contacts" who can vote on my life status, increasing the reliability of the death check.
* **As an Heir**, I want to pass ID verification and then automatically receive the AES key once conditions are met so I can decrypt the files.
* **As a Contact**, I want to submit a vote regarding the Owner's life status so that the system can reach consensus about triggering the inheritance process.

## 4. Functional Requirements
1. **Wallet Connection** – Connect via RainbowKit/Wagmi; support MetaMask, WalletConnect, etc.
2. **Vault CRUD**
   1. Create vault (name, description, file drag-and-drop).
   2. Add/remove files (client-side AES-256 encryption via `crypto-js`).
   3. Delete vault (burn contract reference, optionally unpin IPFS).  
3. **Heir & Contact Management**
   1. Add/remove heirs (wallet address + optional Self ID profile).
   2. Add/remove contacts (wallet address + weight of vote).
4. **Proof-of-Life Workflow**
   1. Owner signs a ping every *J* days; front-end reminder & push notification.
   2. Grace period logic enforced on-chain.
   3. Contract emits `KeyReleased` event when conditions met.
5. **Key Release & Decryption**
   1. Heir authenticates via Self ID SDK v1.
   2. Front-end retrieves AES key from contract and decrypts IPFS files in-browser.
6. **File Storage** – Store encrypted files on **Walrus** programmable storage for high-performance reads/writes (fallback: pin to IPFS via Pinata or web3.storage).
7. **Configurable Parameters** – Owner can update *J* and grace window post-deployment.
8. **Security & Privacy**
   1. AES key never leaves contract until release.
   2. No plaintext files or keys are stored server-side.
9. **Responsive Glassmorphism UI** – TailwindCSS with neon indigo-purple accents, Framer-Motion slide-in/hover animations.

## 5. Integration Plan
* **AI / ML Components:** None planned.
* **Bridges / Oracles (Optional):** Evaluate LayerZero or HashPort for cross-chain relay of `KeyReleased` events (optional).
* **SDK / Tooling:**
  * Smart contracts: Solidity ≥0.8, Hardhat v3 workflow.
  * Client: TypeScript, Viem 1.x / ethers 6.x for on-chain calls.
  * Storage: Walrus JS/TypeScript SDK for upload, retrieval, and on-chain proofs.

## 6. Non-Goals (Out of Scope)
* Fiat on-ramps or fiat inheritance distributions.
* Multi-sig wallet creation for heirs.
* On-chain storage of plaintext files.
* Direct legal compliance modules (jurisdiction-specific probate processes).

## 7. Design Considerations (Optional)
* **Visual Style:** Dark gradient background, frosted-glass cards, neon indigo-purple glow, minimalist line icons.
* **Animation:** Subtle slide-in on route changes, hover lift on cards (Framer-Motion).
* **Accessibility:** Maintain WCAG 2.1 AA color contrast; keyboard-navigable.

## 8. Technical Considerations (Optional)
* **Large Files:** Chunked upload & streaming encryption to support multi-MB PDFs.
* **Gas Costs:** Batch contact/heir updates to minimise gas; consider calldata compression.
* **Key Escrow Logic:** Contract stores AES key in Sapphire confidential storage; ensure confidentiality settings enabled.
* **Contact Voting Mechanism:** Majority ≥ X % or M-of-N scheme configurable per vault.
* **Scalability:** Walrus storage scales to gigabyte-size files at reasonable cost; optionally dual-pin to IPFS for redundancy.

## 9. Acceptance Criteria & Hackathon Deliverables
* ✅ All functional requirements in §4 implemented and unit-tested (≥ 95 % coverage).
* ✅ Smart contract deployed on Oasis Sapphire and verified on its block explorer.
* ✅ Public GitHub repo with README and Hardhat scripts for deployment/testing.
* ✅ 5-minute demo video showing end-to-end flow (create vault → simulate inactivity → heir decrypts), including Walrus file upload & retrieval.
* ✅ Optional cross-chain event mirroring via LayerZero/HashPort.

## 10. Success Metrics
1. ≥ 90 % of created vaults have at least one successful proof-of-life ping within the first cycle.
2. < 1 % unauthorised key releases (false positives).
3. Median time from grace-period expiry to heir decryption < 5 minutes.
4. 100+ active vaults within first month post-launch.

## 11. Optional / Stretch Goals
* Mobile PWA wrapper for offline proof-of-life reminders.
* Optional cross-chain event mirroring via LayerZero/HashPort.
* Social recovery option for Owner wallet (e.g., ERC-4337 guardians).
* AI-powered "Will Analyzer" that flags missing documents (future ML integration).

## 12. Open Questions
1. Final decision on contact voting quorum (simple majority vs weighted).
2. Walrus storage cost estimates and fallback IPFS pinning provider.
3. Specific legal disclaimers required in UI?
4. Should heirs be able to decline inheritance?
5. Whether to burn or retain encrypted files after key release. 