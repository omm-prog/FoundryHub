# 🚀 FoundryHub

<div align="center">

[![FoundryHub Identity](https://img.shields.io/badge/FoundryHub-Collaborative_Innovation_Platform-4F46E5?style=for-the-badge&logo=rocket&logoColor=white)](https://github.com/omm-prog/FoundryHub)

**✨ Transform Ideas into Reality Through Collaborative Innovation & AI ✨**

---

[![GitHub stars](https://img.shields.io/github/stars/omm-prog/FoundryHub?style=for-the-badge&logo=star&logoColor=white&color=FFD700)](https://github.com/omm-prog/FoundryHub/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/omm-prog/FoundryHub?style=for-the-badge&logo=git-branch&logoColor=white&color=28A745)](https://github.com/omm-prog/FoundryHub/network/members)
[![GitHub issues](https://img.shields.io/github/issues/omm-prog/FoundryHub?style=for-the-badge&logo=github&logoColor=white&color=DC3545)](https://github.com/omm-prog/FoundryHub/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge&logo=open-source-initiative&logoColor=white)](https://opensource.org/licenses/MIT)

</div>

---

## 🌟 What is FoundryHub?

> **The Full-Stack Ecosystem for Startup Ideation, Team Formation, Investment & Marketplace** 🎯

FoundryHub connects **Founders**, **Freelancers**, **Investors**, and **Buyers** into a unified collaborative ecosystem. From initial AI-assisted validation to sweat equity staking, seed funding, and MVP marketplace sales, FoundryHub provides the complete infrastructure to launch ideas into real-world ventures.

<div align="center">

### 🎪 **Connect • Collaborate • Create • Capitalize**
*Try any role instantly with 1-click Demo Mode — no registration required!*

</div>

---

## ✨ Why Choose FoundryHub?

<table>
<tr>
<td width="33%" align="center">

### 🤖 **Gemini AI Startup Co-Pilot**
Transform raw concepts into actionable roadmaps, team specs, and investor pitch decks with conversational memory.

</td>
<td width="33%" align="center">

### 🤝 **Collaborative Pods**
Role-governed workspaces with real-time Firestore communication, team applications, and deal rooms.

</td>
<td width="33%" align="center">

### 💎 **Sweat Equity & Marketplace**
Earn equity by logging verified hours and buy/sell validated MVPs in an open marketplace.

</td>
</tr>
</table>

---

## 🎭 4 Distinct Persona Dashboards

<div align="center">

<table>
<tr>
<td width="25%" align="center">

### 🚀 **Founder**
![Founder](https://img.shields.io/badge/-Visionary-FF6B6B?style=for-the-badge)

**The Builder**
- 💡 Launch & manage projects
- 👥 Review freelancer applications
- 💼 Negotiate with investors
- 🛒 List MVPs on the marketplace

</td>
<td width="25%" align="center">

### 💼 **Investor**
![Investor](https://img.shields.io/badge/-Strategist-45B7D1?style=for-the-badge)

**The Backer**
- 🔍 Discover high-potential startups
- 💬 Direct deal chat with founders
- 📊 Track equity & investment ROI
- 📄 Review pitch decks & metrics

</td>
<td width="25%" align="center">

### 💻 **Freelancer**
![Freelancer](https://img.shields.io/badge/-Creator-4ECDC4?style=for-the-badge)

**The Maker**
- 🎨 Showcase skills & portfolio
- 🤝 Join startup pods & squads
- ⏱️ Log hours & claim sweat equity
- 📈 Track project contributions

</td>
<td width="25%" align="center">

### 🛒 **Buyer**
![Buyer](https://img.shields.io/badge/-Pioneer-96CEB4?style=for-the-badge)

**The Acquirer**
- 🚀 Browse verified early-stage MVPs
- 💬 Chat directly with sellers
- 💳 Purchase software & products
- 💡 Submit product reviews

</td>
</tr>
</table>

</div>

---

## 🎯 Key Features & Capabilities

### 🧠 **Google Gemini 1.5 Flash AI Co-Pilot**
- **Startup Advisory**: Personalized advice for MVP scoping, pitch deck formulation, and equity distribution.
- **Conversational Memory**: Chat sessions persist seamlessly in Firestore (`aiMemory` collection) across user sessions.
- **Floating Global Widget**: Accessible anytime across all dashboards and project views.

### ⚡ **1-Click Interactive Demo Accounts**
- **Instant Guest Access**: Recruiters and evaluators can jump straight into any of the 4 roles from the Login screen.
- **Shared Live Data**: All 4 demo accounts (Alex Chen, Sarah Jenkins, Marcus Vance, Elena Rostova) interact within the same live Firebase data room.
- **Automated Seeding**: Ready-to-use Admin script (`seed-demo-users.cjs`) to populate rich test data instantly.

### 🏢 **Project Pods & Team Workspaces**
- **Role-Based Access**: Founder-only controls, public discovery, and secure team channels.
- **Direct Investor Chat**: Encrypted deal flow room between founders and interested investors.
- **Community Forum**: Cross-disciplinary discussions and feature brainstorming feeds.

### 📈 **Sweat Equity Engine & Marketplace**
- **Transparent Hourly Logging**: Freelancers log work and founders approve stakes.
- **MVP Marketplace**: Public listings with pricing, tech stack tags, and demo links.

---

## 🛠️ Tech Stack

<div align="center">

| Area | Technologies |
|:-----|:-------------|
| **Frontend Framework** | **React 19**, **Vite 6**, **React Router v7** |
| **Styling & UI** | **Tailwind CSS v4**, **Flowbite React**, **Lucide Icons** |
| **Backend as a Service** | **Firebase 11** (Firestore, Authentication, Storage) |
| **Artificial Intelligence**| **Google Gemini API** (`@google/generative-ai` / `gemini-1.5-flash`) |
| **Admin & Seeding** | **Firebase Admin SDK** (Node.js) |
| **Deployment** | **Netlify**, **Render** |

</div>

---

## 🏗️ Project Architecture

```
FoundryHub/
├── startup/
│   ├── public/                      # Static assets & SPA redirect config
│   │   └── _redirects               # Netlify SPA routing rules
│   ├── src/
│   │   ├── components/              # Modular UI components
│   │   │   ├── AICopilot.jsx        # Floating Gemini AI assistant
│   │   │   ├── CommunityForum.jsx   # Team & public forum discussions
│   │   │   ├── InvestorChat.jsx     # Dedicated founder-investor chatroom
│   │   │   ├── LoadingSkeleton.jsx  # Glassmorphic skeleton screens
│   │   │   ├── MobileNav.jsx        # Bottom navigation for mobile devices
│   │   │   ├── ProfileSetup.jsx     # Role selection & profile onboarding
│   │   │   ├── ProjectCard.jsx      # Animated project showcase cards
│   │   │   └── ProtectedRoute.jsx   # Auth & role-based route guard
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx      # Firebase Auth session state provider
│   │   ├── firebase/
│   │   │   └── config.js            # Firebase client SDK initialization
│   │   ├── hooks/
│   │   │   └── useGeminiChat.js     # Gemini chat hook with memory synchronization
│   │   ├── pages/
│   │   │   ├── Landing.jsx          # Dark glassmorphic landing page
│   │   │   ├── Login.jsx            # Sign-in + 4 interactive demo accounts
│   │   │   ├── Signup.jsx           # Account creation with role selection
│   │   │   ├── Dashboard.jsx        # Role-based dashboard router
│   │   │   ├── CreateProject.jsx    # Project publishing wizard
│   │   │   ├── ProjectDetails.jsx   # Pod workspace & equity view
│   │   │   ├── Teams.jsx            # Team discovery & squad matching
│   │   │   ├── Investors.jsx        # Investor directory & pitches
│   │   │   └── dashboards/
│   │   │       ├── FounderDashboard.jsx     # Founder command center
│   │   │       ├── InvestorDashboard.jsx    # Investor portfolio center
│   │   │       ├── FreelancerDashboard.jsx  # Freelancer jobs & hours log
│   │   │       └── BuyerDashboard.jsx       # MVP marketplace checkout
│   │   ├── services/
│   │   │   ├── geminiService.js     # Gemini API calls & system prompts
│   │   │   └── memoryService.js     # Firestore chat history persistence
│   │   ├── App.jsx                  # Route definitions
│   │   └── main.jsx                 # React root render
│   ├── netlify.toml                 # Netlify deployment configuration
│   └── vite.config.js               # Vite bundler & plugin config
├── render.yaml                      # Render Blueprint specification
└── README.md                        # Project documentation
```

---

## 🚀 Quick Start Guide

### 📋 Prerequisites
- **Node.js**: `v18+` recommended
- **npm** or **yarn** / **pnpm**
- **Firebase Project**: Firestore & Authentication enabled
- **Gemini API Key**: from [Google AI Studio](https://aistudio.google.com/)

---

### ⚡ Setup Instructions

```bash
# 1️⃣ Clone the repository
git clone https://github.com/omm-prog/FoundryHub.git
cd FoundryHub/startup

# 2️⃣ Install dependencies
npm install

# 3️⃣ Configure Environment Variables
# Copy the example environment file:
cp .env.example .env
```

Add your credentials inside `startup/.env`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

```bash
# 4️⃣ Launch the development server 🚀
npm run dev
```

The application will be live at `http://localhost:5173`.

---

### 🧪 Seeding Demo Users & Projects (Optional)

To populate the 4 demo users with shared projects, investments, and chats:

1. Download your Firebase service account key as `serviceAccountKey.json` into the `startup/` directory.
2. Run the seed script:
```bash
node seed-demo-users.cjs
```
*(Note: `serviceAccountKey.json` and seed scripts are gitignored to ensure security).*

---

## 🌐 Deploying to Production

### 🅰️ Deploy on Netlify (Recommended)

1. Connect your GitHub repository to **[Netlify](https://app.netlify.com/)**.
2. Set the build settings:
   - **Base directory**: `startup`
   - **Build command**: `npm run build`
   - **Publish directory**: `startup/dist`
3. Under **Site configuration > Environment variables**, add:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_GEMINI_API_KEY`
4. Click **Deploy Site**. Netlify handles client-side SPA routing automatically via `public/_redirects` and `netlify.toml`.

### 🅱️ Deploy on Render

Use the included [`render.yaml`](file:///c:/Documents/PROJECT/START_UP/FounderHub/FoundryHub/render.yaml) blueprint to deploy a static site service directly with one click.

---

## 📱 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | 🔥 Starts the Vite local dev server with HMR |
| `npm run build` | 📦 Builds optimized production bundle into `dist/` |
| `npm run preview` | 👀 Previews the production build locally |
| `npm run lint` | 🔍 Runs ESLint checks across JSX and JS files |

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute.

---

<div align="center">

**Built with 💖 by the FoundryHub Team**

*Empowering founders, creators, and investors to build the future together.* ✨

</div>
