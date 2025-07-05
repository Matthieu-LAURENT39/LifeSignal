## Relevant Files

- `contracts/ConfidentialInheritanceVault.sol` – Confidential smart contract storing AES key, heirs, proof-of-life intervals, and release logic.
- `contracts/scripts/deploy.ts` – Hardhat deployment script for Sapphire.
- `contracts/hardhat.config.ts` – Hardhat configuration (Solidity version, Sapphire network, plugins).
- `frontend/components/WalletConnectButton.tsx` – Re-usable RainbowKit wallet-connect component with glassmorphism styling.
- `frontend/components/VaultCreator.tsx` – UI for creating a vault, uploading files, and encrypting them client-side with glassmorphism design.
- `frontend/lib/crypto/encryption.ts` – AES-256 encryption/decryption utilities with file support.
- `frontend/hooks/useWalrusStorage.ts` – Walrus storage integration hook with mock implementation for development.
- `frontend/app/vault/page.tsx` – Demo page showcasing the VaultCreator component.
- `frontend/app/dashboard/page.tsx` – Demo page showcasing the VaultDashboard component.
- `frontend/app/test-encryption/page.tsx` – Test lab for encryption/decryption workflow.
- `frontend/app/heir-decrypt/page.tsx` – Demo page showcasing the HeirDecrypt component.
- `frontend/components/VaultDashboard.tsx` – Owner dashboard listing vaults, pings, and heir status.
- `frontend/components/HeirDecrypt.tsx` – Heir view to retrieve AES key and decrypt files.
- `frontend/hooks/useWalrusStorage.ts` – Wrapper around Walrus storage service for upload and retrieval with mock implementation.
- `contracts/tests/ConfidentialInheritanceVault.test.ts` – Unit tests for the smart contract logic.
- `backend/tests/VaultWorkflow.test.ts` – End-to-end test simulating owner inactivity and heir decryption.
- `README.md` – Project overview, setup instructions, and developer guide.
- `package.json` – Root package.json with workspaces configuration and common dev dependencies.
- `.eslintrc.json` – Root ESLint configuration with TypeScript and React support.
- `.prettierrc` – Prettier code formatting configuration.
- `.editorconfig` – EditorConfig settings for consistent code style across editors.
- `.env.example` – Environment variables template with all necessary configuration options.
- `frontend/package.json` – Next.js 15 project configuration with TypeScript, TailwindCSS, and Web3 libraries.
- `frontend/app/` – Next.js app directory with layout.tsx and page.tsx.
- `frontend/lib/wagmi.ts` – Wagmi configuration with Sapphire network and RainbowKit setup.
- `frontend/app/providers.tsx` – Web3 providers wrapper with wagmi, RainbowKit, and React Query.
- `backend/package.json` – Express backend configuration with TypeScript support.
- `backend/src/index.ts` – Main Express server with middleware, basic routes, and error handling.
- `backend/tsconfig.json` – TypeScript configuration for the backend.
- `backend/.env.example` – Environment variables template.
- `contracts/package.json` – Hardhat v2 project configuration with TypeScript support.
- `contracts/hardhat.config.ts` – Hardhat configuration file.
- `contracts/contracts/Lock.sol` – Sample smart contract (to be replaced with inheritance contract).
- `contracts/test/Lock.ts` – Sample test file (to be replaced with inheritance tests).
- `contracts/ignition/modules/Lock.ts` – Sample deployment module.
- `contracts/typechain-types/` – Generated TypeScript types for smart contracts.

### Notes

- Place component tests alongside their component files (e.g., `VaultCreator.test.tsx`).
- Run all tests with `npx jest` or a specific test file with `npx jest path/to/test`.

## Tasks

- [ ] 0.0 Project Scaffold & Initialization
  - [x] 0.1 Create directory structure `/frontend`, `/backend`, `/contracts` inside the repository root.
  - [x] 0.2 Initialise root `package.json` with workspaces pointing to the three sub-projects; add common dev-deps (`eslint`, `prettier`, `husky`, `lint-staged`).
  - [x] 0.3 Scaffold `/frontend` with **Next.js 15 (https://nextjs.org/docs) + TypeScript** (`npx create-next-app@latest`) and set the app directory layout.
  - [x] 0.4 Scaffold `/backend` with **Express + TypeScript** (`npm init`, `ts-node`, `nodemon`) for any off-chain helpers or API routes.
  - [x] 0.5 Scaffold `/contracts` with **Hardhat v2** (`npx hardhat init --typescript`).
  - [x] 0.6 Add shared configuration files (`.eslintrc`, `.prettierrc`, `.editorconfig`) and root `.env.example`.
  - [ ] 0.7 Commit the initial scaffold to Git.

- [ ] 1.0 Front-End & Wallet Integration
  - [x] 1.1 Scaffold Next.js 15 project with React, TypeScript, TailwindCSS, and Framer-Motion. (https://nextjs.org/docs)
  - [x] 1.2 Install and configure `wagmi`, `@rainbow-me/rainbowkit`, and `viem`.
  - [x] 1.3 Implement `WalletConnectButton.tsx` with RainbowKit (https://rainbowkit.com/docs/introduction) themes to match glassmorphism UI. 
  - [ ] 1.4 Create global Tailwind config with dark gradient background and neon indigo-purple accent colors.
  - [x] 1.5 Build `VaultCreator.tsx` for uploading files, client-side AES-256 encryption, and Walrus upload (https://docs.wal.app/).
  - [x] 1.6 Build `VaultDashboard.tsx` listing vaults, contacts assigned to the vault, and controls to add/remove files.
  - [x] 1.7 Build `HeirDecrypt.tsx` to fetch AES key, retrieve encrypted files, and decrypt in-browser.
  - [ ] 1.8 Add Framer-Motion animations for component slide-in and hover effects.
  - [ ] 1.9 Integrate TailwindCSS, Framer-Motion, and glassmorphism theme into the previously scaffolded Next.js front-end.

- [ ] 2.0 Smart-Contract Development (Sapphire) & Walrus Storage
  - [ ] 2.1 Initialise Hardhat v3 (https://hardhat.org/hardhat3-alpha) project and add TypeScript support.
  - [ ] 2.2 Ensure Hardhat project in `/contracts` has required plugins (`@nomicfoundation/hardhat-toolbox`, `@typechain/hardhat`) and TypeScript support.
  - [ ] 2.3 Write `ConfidentialInheritanceVault.sol` implementing:
        • Owner-set AES key (private)
        • Configurable ping interval & grace window
        • Heir & contact management
        • `ping()` function (Owner)
        • `voteOwnerDead()` (Contacts)
        • `releaseKey()` auto/unlock after conditions
        • Events (`PingReceived`, `KeyReleased`)
  - [ ] 2.4 Configure Sapphire network in `hardhat.config.ts` with RPC URL & confidential settings. (https://docs.oasis.io/build/sapphire/)
  - [ ] 2.5 Write deployment & upgrade scripts in `scripts/deploy.ts` and verify on explorer.
  - [ ] 2.6 Generate ABI & TypeScript types via `typechain` for use with `viem` hooks.
  - [ ] 2.7 Create `useWalrusStorage.ts` wrapper: upload encrypted blobs, retrieve via CID, handle large files.
  - [ ] 2.8 Integrate Walrus SDK keys/env vars via `.env.local`.

- [ ] 3.0 Proof-of-Life & Key-Release Workflow
  - [ ] 3.1 Implement periodic ping reminder (browser notification / email) using `service-workers` or cron-like approach.
  - [ ] 3.2 Add UI in `VaultDashboard` to trigger `ping()` transaction and record timestamp.
  - [ ] 3.3 Implement Contact voting UI to call `voteOwnerDead()` with weight/quorum logic.
  - [ ] 3.4 Build listener hook to watch `KeyReleased` events via `viem` WebSocket provider.
  - [ ] 3.5 On `KeyReleased`, auto-fetch AES key, retrieve encrypted files from Walrus, and decrypt.
  - [ ] 3.6 Provide graceful error handling & edge-case messaging (owner revoked heir, lost key, etc.).

- [ ] 4.0 Testing, QA & Security Review
  - [ ] 4.1 Write smart-contract unit tests in `ConfidentialInheritanceVault.test.ts` (ping logic, key release, access control).
  - [ ] 4.2 Add hardhat coverage & gas reporter plugins.
  - [ ] 4.3 Write front-end unit tests using React Testing Library for `VaultCreator`, `VaultDashboard`, and `HeirDecrypt`.
  - [ ] 4.4 Create integration test (`VaultWorkflow.test.ts`) simulating full flow on a local Sapphire node.
  - [ ] 4.5 Run `eslint`, `prettier`, and TypeScript type checks; fix all warnings.
  - [ ] 4.6 **[Human]** Conduct manual UI/UX walkthrough and capture accessibility audit report.
  - [ ] 4.7 **[Human]** Perform security review of contract (check re-entrancy, overflow, access control) and address findings.

- [ ] 5.0 Deployment, Documentation & Demo Preparation
  - [ ] 5.1 Deploy contract to Sapphire testnet; verify source on explorer.
  - [ ] 5.2 Deploy Next.js app to Vercel (or similar) with environment variables for network & Walrus.
  - [ ] 5.3 Write comprehensive `README.md` with setup, dev commands, and architectural overview.
  - [ ] 5.4 Draft demo script covering vault creation → ping cycle → key release → heir decryption.
  - [ ] 5.5 **[Human]** Record ≤ 5-minute demo video following the script.
  - [ ] 5.6 Gather final links (repo, explorer, Walrus CID) for submission. 