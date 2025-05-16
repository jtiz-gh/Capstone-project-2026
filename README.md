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

## Setting Up Local Supabase Database

To run the project locally with a working Supabase backend, follow these steps:

1. **Ensure `.env` is configured correctly**  
   Copy the example file if needed:
   ```bash
   cp .env.example .env
   ```
   Update any missing secrets, especially:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   > 🔁 Ask Jackson if you're unsure about the correct values.

2. **Navigate to the local Supabase project directory**  
   For example:
   ```bash
   cd ../local-supabase-project
   ```

3. **Start Supabase using Docker Compose**  
   Ensure Docker Desktop is installed and running, then:
   ```bash
   docker compose up -d
   ```
   > ✅ This spins up the Supabase services locally.  
   > ⚠️ **You do *not* need to run `supabase start`** — that is only required if you're using the Supabase CLI workflow. This setup uses plain Docker Compose.

4. **Push your Prisma schema to the local database**  
   Navigate back to the software directory and run:
   ```bash
   cd ../software
   npx prisma db push
   ```

5. **Open Prisma Studio (optional, for inspecting the DB)**  
   ```bash
   npx prisma studio
   ```

6. **Seed your local database with fake data**  
   Run:
   ```bash
   npm run prisma:seed
   ```

You're now ready to run the full app locally!
