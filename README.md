# SSC Smart Revision System

A student performance and revision dashboard for Fahad's Tutorial.

## Features

- Student performance overview and subject search
- Learning-gap summaries
- Personalized revision plans
- Weekly progress charts
- CSV import and export
- Admin, Teacher, Student, and Parent preview views

The dashboard currently uses sample data. Imported records are held in memory, and the assessment form does not yet save results.

## Run locally

Requires Node.js 22.13 or newer.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173 in your browser. On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

## Commands

```sh
npm run dev      # Start the development server
npm run build    # Build the application
npm start        # Preview the production build locally
npm run lint     # Run ESLint
```

## Technology

React, TypeScript, Vinext/Vite, Tailwind CSS, and Recharts. Database schema and migration files are included for further development.
