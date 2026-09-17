# FoundryHub

**A collaborative platform connecting founders, freelancers, investors, and buyers — from idea validation to MVP marketplace.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/omm-prog/FoundryHub?style=flat)](https://github.com/omm-prog/FoundryHub/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/omm-prog/FoundryHub?style=flat)](https://github.com/omm-prog/FoundryHub/network/members)
[![GitHub issues](https://img.shields.io/github/issues/omm-prog/FoundryHub?style=flat)](https://github.com/omm-prog/FoundryHub/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Live Demo](#) · [Report Bug](https://github.com/omm-prog/FoundryHub/issues) · [Request Feature](https://github.com/omm-prog/FoundryHub/issues)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Seeding Demo Data](#seeding-demo-data)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Overview

FoundryHub is a full-stack ecosystem for startup ideation, team formation, investment, and MVP sales. It connects four distinct personas — **Founders**, **Freelancers**, **Investors**, and **Buyers** — into a single collaborative workspace, backed by an AI co-pilot for startup advisory, real-time team pods, sweat-equity tracking, and a marketplace for validated MVPs.

A guided demo mode is available so evaluators can explore any of the four roles without registering an account.

## Features

- **AI Startup Co-Pilot** — Powered by Google Gemini 1.5 Flash, provides MVP scoping advice, pitch deck guidance, and equity structuring recommendations. Conversation history persists per user via Firestore.
- **Project Pods** — Role-governed workspaces with real-time messaging, team applications, and dedicated founder–investor deal rooms.
- **Sweat Equity Engine** — Freelancers log verified hours; founders review and approve equity allocation.
- **MVP Marketplace** — Public listings with pricing, tech stack tags, and live demo links for buyers to browse and purchase.
- **Community Forum** — Cross-role discussion space for feedback and feature ideas.
- **Demo Mode** — One-click access to four pre-seeded demo accounts sharing a live data environment, useful for reviewers and QA.

## User Roles

| Role | Description | Key Capabilities |
|---|---|---|
| **Founder** | Builds and manages a startup | Launch projects, review applications, negotiate with investors, list MVPs |
| **Investor** | Backs promising startups | Discover startups, chat with founders, track equity/ROI, review pitch decks |
| **Freelancer** | Contributes skills to projects | Showcase portfolio, join pods, log hours, track contributions |
| **Buyer** | Purchases validated products | Browse MVPs, message sellers, purchase, submit reviews |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, React Router v7 |
| Styling | Tailwind CSS v4, Flowbite React, Lucide Icons |
| Backend-as-a-Service | Firebase 11 (Firestore, Authentication, Storage) |
| AI | Google Gemini API (`@google/generative-ai`, `gemini-1.5-flash`) |
| Tooling | Firebase Admin SDK (Node.js) for data seeding |
| Deployment | Netlify, Render |

## Architecture

```
FoundryHub/
├── startup/
│   ├── public/
│   │   └── _redirects               # Netlify SPA routing rules
│   ├── src/
│   │   ├── components/
│   │   │   ├── AICopilot.jsx        # Floating Gemini AI assistant
│   │   │   ├── CommunityForum.jsx   # Team & public forum discussions
│   │   │   ├── InvestorChat.jsx     # Founder-investor chatroom
│   │   │   ├── LoadingSkeleton.jsx  # Skeleton loading states
│   │   │   ├── MobileNav.jsx        # Mobile bottom navigation
│   │   │   ├── ProfileSetup.jsx     # Role selection & onboarding
│   │   │   ├── ProjectCard.jsx      # Project showcase card
│   │   │   └── ProtectedRoute.jsx   # Auth & role-based route guard
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx      # Firebase Auth session provider
│   │   ├── firebase/
│   │   │   └── config.js            # Firebase client SDK init
│   │   ├── hooks/
│   │   │   └── useGeminiChat.js     # Gemini chat hook with memory sync
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateProject.jsx
│   │   │   ├── ProjectDetails.jsx
│   │   │   ├── Teams.jsx
│   │   │   ├── Investors.jsx
│   │   │   └── dashboards/
│   │   │       ├── FounderDashboard.jsx
│   │   │       ├── InvestorDashboard.jsx
│   │   │       ├── FreelancerDashboard.jsx
│   │   │       └── BuyerDashboard.jsx
│   │   ├── services/
│   │   │   ├── geminiService.js     # Gemini API calls & prompts
│   │   │   └── memoryService.js     # Firestore chat persistence
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── netlify.toml
│   └── vite.config.js
├── render.yaml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js v18 or later
- npm, yarn, or pnpm
- A Firebase project with Firestore and Authentication enabled
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Installation

```bash
git clone https://github.com/omm-prog/FoundryHub.git
cd FoundryHub/startup
npm install
```

### Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

`startup/.env`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

> **Never commit `.env` files.** Ensure `.env` is listed in `.gitignore` and that keys are rotated if accidentally exposed.

### Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Seeding Demo Data

To populate four demo accounts with shared projects, investments, and chat history:

1. Download a Firebase service account key and save it as `serviceAccountKey.json` in `startup/`.
2. Run:

```bash
node seed-demo-users.cjs
```

`serviceAccountKey.json` and seed scripts are excluded from version control via `.gitignore` — never commit service account credentials.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Build an optimized production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the codebase |

## Testing

> _Add your test runner and instructions here once a test suite is in place, e.g._

```bash
npm run test
```

Consider adding unit tests (Vitest/Jest), component tests (React Testing Library), and end-to-end tests (Playwright/Cypress) as the codebase matures. Contributions that add test coverage are especially welcome.

## Deployment

### Netlify (recommended)

1. Connect the GitHub repository at [app.netlify.com](https://app.netlify.com/).
2. Configure build settings:
   - **Base directory**: `startup`
   - **Build command**: `npm run build`
   - **Publish directory**: `startup/dist`
3. Add the environment variables listed above under **Site configuration → Environment variables**.
4. Deploy. SPA routing is handled automatically via `public/_redirects` and `netlify.toml`.

### Render

Use the included [`render.yaml`](render.yaml) blueprint to deploy as a static site with one click.

## Security

If you discover a security vulnerability, please **do not open a public issue**. Instead, report it privately by emailing the maintainers (see [Contact](#contact)) so it can be addressed before public disclosure.

General guidelines:
- Firebase security rules should enforce role-based access at the database level, not just in the client.
- Rotate API keys immediately if they are ever exposed in a commit, log, or public URL.
- Review `firestore.rules` and `storage.rules` (if present) before deploying to production.

## Roadmap

- [ ] Automated test suite (unit, integration, e2e)
- [ ] CI/CD pipeline (GitHub Actions) for lint/test/build on PRs
- [ ] Formal Firestore security rules documentation
- [ ] Payment integration for marketplace transactions
- [ ] Notification system (email/in-app)

See [open issues](https://github.com/omm-prog/FoundryHub/issues) for a full list of proposed features and known issues.

## Contributing

Contributions make the open-source community a great place to learn and build. Any contributions are **greatly appreciated**.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please open an issue first for major changes to discuss what you'd like to change. See `CONTRIBUTING.md` for detailed guidelines (add one if it doesn't exist yet).

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

## Contact

Maintained by the FoundryHub team. For questions, bug reports, or security disclosures, please open an [issue](https://github.com/omm-prog/FoundryHub/issues) or reach out directly.

Project Link: [https://github.com/omm-prog/FoundryHub](https://github.com/omm-prog/FoundryHub)
