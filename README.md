# TrackSense - Personal Growth & Life Management Platform

The mobile rebuild is in `mobile/`. See [rebuild progress and local setup](docs/REBUILD_PROGRESS.md) for the new Expo Router application, backend changes, verification commands and remaining work. The root Vite app is retained as the legacy web implementation.

A full-stack web application for managing multiple life domains in one unified system.

## Project Setup

### Prerequisites
- Node.js 18+ LTS
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── pages/           # Page components for each module
├── components/      # Reusable UI components
├── stores/          # Zustand state management
├── services/        # API client and service functions
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
└── App.jsx          # Main application component
```

## Technology Stack

### Frontend
- **React 18+** - UI framework
- **Vite** - Build tool
- **Tailwind CSS 3+** - Styling
- **React Router 6+** - Client-side routing
- **Zustand** - State management
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Recharts** - Data visualization

### Environment Variables

Create a `.env` file with:

```
VITE_API_URL=http://localhost:3000/api/v1
```

## Available Routes

- `/` - Dashboard
- `/goals` - Goal Management
- `/tasks` - Tasks & Productivity
- `/study` - Academic / Study Module
- `/spiritual` - Spiritual Module
- `/projects` - Project Management
- `/timer` - Timer & Focus
- `/analytics` - Analytics & Reporting

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Features (In Development)

- Dashboard with unified overview
- Goal management with milestones
- Task management (list, Kanban, calendar views)
- Academic tracking (courses, assignments, exams)
- Spiritual discipline tracking
- Project management
- Focus/Pomodoro timer
- Cross-module analytics

## License

Confidential - TrackSense Development
