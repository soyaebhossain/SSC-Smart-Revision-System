# SSC Smart Revision System

A student performance and revision dashboard for Fahad's Tutorial.

## Features

- Student performance overview and subject search
- Learning-gap summaries
- Personalized revision plans
- Weekly progress charts
- CSV import and export
- Separate Admin, Teacher, Student, and Parent dashboards with scoped navigation and actions

## Role workspaces

| Role | Records shown | Available actions |
| --- | --- | --- |
| Admin | All students | Import new students, export results, record assessments, assign teachers |
| Teacher | Students assigned to Fahad Rahman | Record assessments, assign revision plans, export class results, write parent updates |
| Student | Ayesha Rahman's record | Read results and complete assigned revision tasks |
| Parent | Ayesha Rahman's record | Follow revision progress, read results and acknowledge teacher updates |

Use **Preview role** to switch workspaces. Navigation, learner selection and search reset when switching roles. School and class totals are calculated from the actual visible records.

Changes are saved in browser local storage and shared between these preview roles, including after refresh. A teacher's result appears for the linked student and parent; student task completion updates their revision progress; parent acknowledgements appear in the teacher's updates. Admin teacher assignments immediately change the teacher's visible class. CSV imports add new student IDs without replacing existing learners or account links.

This is a sample workspace, not an authenticated multi-user service. The role selector and client-side workflow checks are for demonstration. Real accounts require login, server-side authorization and database-backed storage; browser data does not sync across devices. The included database schema is not connected to these preview workflows.

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
npm test         # Check role scope, write permissions and shared workflows
```

## Technology

React, TypeScript, Vinext/Vite, Tailwind CSS, and Recharts. Database schema and migration files are included for further development.
