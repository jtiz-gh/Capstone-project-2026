# Branch and Pull Request Workflow  
*(Single Shared GitHub Classroom Repository)*

## Overview

All students work in **one shared GitHub Classroom repository**.  
The `main` branch represents the **stable, assessable codebase**.  
All development happens in **short-lived feature branches**, which are merged into `main` **only via Pull Requests (PRs)**.

This workflow promotes:
- parallel work without conflicts
- peer review and discussion
- traceability of contributions
- protection of the main branch

---

## Branching Model

### Main Branch
- `main` is **protected**
- always in a **working, releasable state**
- **no direct commits** allowed
- only updated via approved Pull Requests

### Feature Branches
- Each task or change is done in a **separate branch**
- Branches are named descriptively, for example:
  - `feature/login-page`
  - `bugfix/crash-on-startup`
  - `docs/api-readme`
- Branches are created from the latest `main`

---

## Typical Student Workflow

1. **Sync with `main`**
   - Pull the latest changes from `main`
   - Ensures work starts from the most recent code

2. **Create a feature branch**
   - One branch per task or issue
   - Keeps changes focused and reviewable

3. **Develop locally**
   - Make small, meaningful commits
   - Commit messages describe *why* the change was made

4. **Push the branch to GitHub**
   - The branch becomes visible to the whole team

5. **Open a Pull Request**
   - Target branch: `main`
   - PR description explains:
     - what was changed
     - why the change is needed
     - how it was tested

6. **Review and discussion**
   - Teammates review code, comment, and request changes
   - CI checks (if enabled) run automatically
   - The author updates the branch if changes are requested

7. **Merge**
   - Once approved, the PR is merged into `main`
   - The feature branch is deleted after merging

---

## Roles and Responsibilities

### All Students
- Work only in branches
- Review at least one peer Pull Request regularly
- Keep branches small and task-focused

### Team Lead / Teaching Staff (Optional)
- Enforce branch protection rules
- Resolve merge conflicts if needed
- Monitor PR quality and participation

---

## Why This Works Well for GitHub Classroom

- **Single source of truth**: one repository per team
- **Fair assessment**: PR history shows individual contributions
- **Reduced conflicts**: parallel work via branches
- **Authentic practice**: mirrors industry workflows
- **Low admin overhead**: no forks to manage

---

## Common Rules to State Explicitly

- No direct commits to `main`
- Every change requires a Pull Request
- Pull Requests must include:
  - a clear description
  - at least one reviewer
- Small Pull Requests are preferred over large ones
