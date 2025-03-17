# Software

This directory contains the web application built with React, Tailwind CSS, Prisma, and Supabase.

## Tech Stack
- **Frontend**: React with Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: Supabase Auth

## Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- Git

## Getting Started
> `TODO` Update these steps once project is initialized with specific requirements

1. Install dependencies after project creation:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the following in your `.env`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `DATABASE_URL`

3. Initialize Prisma:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Development Guidelines
> `TODO` Add specific coding standards and practices once agreed upon by the team
- Follow React best practices and hooks guidelines
- Use Tailwind CSS for styling
- Keep components small and reusable
- Document API integrations
- Update CHANGELOG.md for significant changes

## Project Structure
> `TODO` Update with actual project structure once created

Once created, the project will follow standard React project structure:
```
software/
├── public/          # Static files
├── src/             # Source code (auto-generated)
├── docs/            # Documentation
├── prisma/          # Database schema and migrations
└── CHANGELOG.md     # Software changes log
```

## Useful Commands
> `TODO` Add project-specific commands and scripts once configured
```bash
# Development
npm run dev         # Start development server

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
> `TODO` Update with actual documentation once created
- API endpoints and usage
- Database schema
- Component documentation
- Setup troubleshooting

## Additional Resources
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs) 