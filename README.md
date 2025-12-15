# Software
capstone-project-2025-team_19
This directory contains the web application built with React, Tailwind CSS, Prisma, and SQLite.

## Tech Stack

- **Frontend**: React with Tailwind CSS
- **Database**: SQLite
- **ORM**: Prisma

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Git

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Update the following in your `.env`:
   - `DATABASE_URL="file:C:/path/to/your/database.db"` (replace with your desired SQLite database path)

3. Initialize and seed the database:

   ```bash
   npm run prisma:generate
   npm run prisma:seed
   ```

> NOTE: For a **fresh** database do NOT run `npm run prism:seed`

4. Build and start the application:

   ```bash
   npm run build
   npm run start
   ```

## Development Guidelines

- Follow React best practices and hooks guidelines
- Use Tailwind CSS for styling
- Keep components small and reusable
- Document API integrations
- Update CHANGELOG.md for significant changes

## Project Structure

```md
software/
├── src/             # Source code
│   ├── app/         # Next.js app router pages
│   ├── components/  # React components
│   ├── lib/         # Utility functions and services
│   ├── hooks/       # Custom React hooks
│   ├── types/       # TypeScript type definitions
│   └── assets/      # Static assets
├── prisma/          # Database schema and migrations
├── cypress/         # End-to-end tests
├── __test__/        # Unit tests
├── public/          # Public static files
├── docs/            # Documentation
└── CHANGELOG.md     # Software changes log
```

## Useful Commands

```bash
# Development
npm run dev         # Start development server

npm run build
npm run dev

# Database
npx prisma studio   # Open Prisma database UI
npx prisma generate # Generate Prisma client
npx prisma db push  # Push schema changes to database

# Building
npm run build       # Create production build
npm run start       # Start production server
```

## Documentation

Key documentation will be maintained in the `docs/` directory:

- API endpoints and usage
- Database schema
- Component documentation
- Setup troubleshooting

## Additional Resources

- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)