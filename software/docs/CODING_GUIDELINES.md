# Coding Guidelines

> `TODO`: This is a template of coding guidelines. The software lead should review and modify these guidelines to match the team's specific needs and preferences.

## General Principles
- Write self-documenting code
- Follow DRY (Don't Repeat Yourself) principles
- Keep functions small and focused
- Use meaningful variable and function names

## React Guidelines
### Components
- One component per file
- Use functional components with hooks
- Keep components small and focused
- Use proper prop-types or TypeScript interfaces

### State Management
- Use React Query for server state
- Use local state when possible
- Document complex state logic

### File Structure
```
components/
├── common/         # Reusable components
├── features/       # Feature-specific components
└── layouts/        # Layout components
```

## Naming Conventions
### Files and Folders
- Use PascalCase for component files (e.g., `Button.tsx`)
- Use kebab-case for other files (e.g., `api-utils.ts`)
- Group related files in folders

### Components and Functions
- Use PascalCase for component names
- Use camelCase for function names
- Use camelCase for variables

## CSS/Tailwind Guidelines
- Use Tailwind utility classes
- Create custom classes only when necessary
- Follow mobile-first approach
- Use consistent spacing and sizing

## TypeScript Guidelines
- Use proper type annotations
- Avoid `any` type
- Create interfaces for complex objects
- Use generics when appropriate

## Testing Guidelines
- Write tests for critical functionality
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test edge cases

## Code Review Guidelines
- Review for functionality
- Check for proper error handling
- Verify code style consistency
- Ensure adequate test coverage

## Documentation
- Document complex logic
- Add JSDoc comments for functions
- Keep README files updated
- Document API integrations 