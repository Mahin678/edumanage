# EduManage

A student information management system built with Next.js, Prisma, and PostgreSQL (Neon). It supports two views — **Staff** and **Student** — with a simple role toggle (no authentication required).

---

## Features

- **Staff view** — manage students, programmes, fee records, and grades
- **Student view** — view personal profile, enrolled programme, fee status, and grades
- PostgreSQL database via [Neon](https://neon.tech), accessed through Prisma ORM
- Seed script with demo data: 5 students, 2 programmes, fees, and sample grades

---

## Tech Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Prisma](https://www.prisma.io) ORM
- [Neon](https://neon.tech) — serverless PostgreSQL
- [Tailwind CSS](https://tailwindcss.com)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Mahin678/edumanage.git
cd edumanage
```

### 2. Install dependencies

```bash
npm i
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```dotenv
DATABASE_URL="postgresql://neondb_owner:YOURPASSWORD@ep-raspy-dream-amu6wvh5-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

Replace `YOURPASSWORD` with your actual Neon database password.

### 4. Generate Prisma client

```bash
npx prisma generate
```

### 5. Push the schema to the database

```bash
npx prisma db push
```

### 6. Seed demo data

```bash
npx prisma db seed
```

This loads:

- 5 students
- 2 programmes
- Fee records per student
- Sample grade entries

### 7. Run the development server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable       | Description                                                     |
| -------------- | --------------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string from Neon (with `sslmode=require`) |

---

## Role Separation

There is no authentication. The app uses a **role toggle** in the UI to switch between:

- **Staff view** — full access to student records, programmes, fees, and grades; can add/edit data
- **Student view** — read-only access to a selected student's own data (profile, programme, fees, grades)

To switch roles, use the toggle button available on the main navigation.

---

## Project Structure

```
edumanage/
├── app/              # Next.js App Router pages and components
├── prisma/           # Prisma schema and seed script
├── public/           # Static assets
├── .env              # Environment variables (not committed)
└── package.json
```

---

## How I Used AI During the Build

### Project Analysis & Planning

- AI was used to break down the assignment into four core Registry workflows: Student Management, Programme Management, Fee Management, and Assessment & Results Management.
- AI helped identify key entities, relationships, and user flows before implementation.
- The scope was refined with AI assistance to focus specifically on the Registry Administrator's daily operations rather than building a full-scale student management platform.
- Edge cases such as overdue fees, status transitions, and result publication flows were discussed and refined with AI assistance.

### Project Structure & Architecture

- AI assisted in generating an initial project structure for the Next.js application, including API routes, database layers, and reusable components.
- The structure was reorganised and refined to follow a feature-based architecture for better maintainability.
- Separation of concerns between API handlers, business logic, and UI components was implemented based on both AI suggestions and manual design decisions.

### Schema & Migrations

- I described the data relationships (students → programmes → fees → assessments → submissions → grades), and AI helped draft an initial Prisma schema.
- Field types, constraints, and relationships were manually reviewed and adjusted before running migrations.
- Final schema decisions were validated through testing and iterative refinement.

### API Routes

- CRUD API routes for students, programmes, assessments, fees, and results were scaffolded with AI assistance.
- These routes were refined with proper validation, error handling, and alignment with the final schema.
- Business logic was manually adjusted to ensure correctness and consistency.

### UI Implementation

- AI helped generate initial layouts for dashboards, tables, forms, filters, and modal components.
- The UI was refined to match Registry workflow requirements with a focus on usability and clarity.
- Reusable components were implemented for consistency across student, programme, fee, and assessment modules.
- Special attention was given to real-time balance visibility, status indicators, filtering, and responsive design.

### Debugging & Troubleshooting

- AI was used to resolve issues related to Prisma configuration, database connectivity, seed script failures, and Next.js runtime errors.
- Suggested fixes were verified using documentation and iterative testing before implementation.

### AI Tools Used

- **Claude Haiku 4.5** and **MiniMax 3** were used primarily through AI agentic workflows for planning, code generation, debugging, and architecture support.
- These tools helped speed up development and explore multiple implementation approaches.
- All AI outputs were reviewed, validated, and adapted before integration into the final system.

### Final Ownership

While AI significantly accelerated development, all final decisions regarding architecture, schema design, UI structure, and business logic were independently reviewed and implemented.
