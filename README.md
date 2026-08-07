# Dialecta - Speak. Score. Improve.

Master the art of debate and public speaking with AI-powered feedback. Practice daily, track your progress, and become a confident speaker.

## Getting Started

Follow these steps to set up and run the project locally:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd speak-score-elevate-mycopy

# Step 3: Install the necessary dependencies
npm install

# Step 4: Start the development server
npm run dev
```

## Technologies

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

## Analytics (GA4)

Google Analytics 4 is installed site-wide and tracks pageviews for every React Router route change (SPA-safe).

- Default Measurement ID: `G-7TYF234V14`
- Optional override: set `VITE_GA_MEASUREMENT_ID` (e.g. in `.env.local`)
- Note: analytics events only send in production builds (`npm run build` / `npm run preview`)

## Project Structure

- `/src` - Source code
  - `/components` - React components
  - `/pages` - Page components
  - `/services` - API and service integrations
  - `/contexts` - React context providers
  - `/lib` - Utility libraries
- `/supabase` - Supabase configuration and migrations
