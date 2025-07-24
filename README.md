FoundryHub is a collaborative platform that connects freelancers, founders, investors, and buyers to build, fund, and launch innovative products. It provides a full-stack ecosystem for ideation, team formation, project management, investment, and marketplace listing.

## Features

- **AI Startup Co-Pilot**: Breaks down ideas into actionable steps, suggests required team roles, and can generate investor pitch decks.
- **Collaboration Pods**: Each project becomes a pod with role-based permissions for founders, team members, investors, and buyers.
- **Micro-Investments**: Contributors can earn sweat equity by staking hours, with transparent tracking.
- **Marketplace**: List and sell MVPs to early adopters and gather feedback.
- **Role-Based Dashboards**: Custom dashboards for founders, freelancers, investors, and buyers.
- **Team Community**: In-app chat and community features for project teams.
- **Investor Chat**: Secure, project-specific chat between founders and investors.
- **Profile Setup**: Rich freelancer profiles with skills, experience, and project history.
- **Protected Routes**: Authenticated access to sensitive pages and actions.

## Tech Stack

- **Frontend**: React (with Vite for fast development)
- **Styling**: Tailwind CSS, Flowbite, Flowbite React
- **Routing**: React Router DOM
- **Backend/Database**: Firebase (Firestore)
- **Authentication**: Firebase Auth
- **AI Integration**: OpenAI API for project analysis and suggestions
- **Linting**: ESLint

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd ColabNest/startup
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up Firebase:

   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Enable Firestore and Authentication.
   - Copy your Firebase config to `src/firebase/config.js`.

4. (Optional) Set up OpenAI API key for AI features.

### Running the App

- Start the development server:

  ```bash
  npm run dev
  ```

- Build for production:

  ```bash
  npm run build
  ```

- Preview production build:

  ```bash
  npm run preview
  ```

- Lint the code:
  ```bash
  npm run lint
  ```

## Project Structure

```
startup/
  src/
    components/      # Reusable UI components (chat, cards, protected routes, etc.)
    contexts/        # React context providers (e.g., AuthContext)
    firebase/        # Firebase configuration
    pages/           # Main pages and dashboards for each user role
      dashboards/    # Role-specific dashboards
    assets/          # Static assets
    App.jsx          # Main app and routing
    main.jsx         # Entry point
  public/            # Static public assets
  package.json       # Project metadata and scripts
  vite.config.js     # Vite configuration
```

## User Roles

- **Founder**: Create and manage projects, form teams, seek investment, and list products.
- **Freelancer**: Set up a profile, apply to join projects, and collaborate in teams.
- **Investor**: Browse projects, chat with founders, make offers, and track investments.
- **Buyer**: Discover and purchase MVPs or products.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.


