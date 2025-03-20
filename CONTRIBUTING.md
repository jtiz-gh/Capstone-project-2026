# Branching Conventions

We follow a structured branching strategy to ensure smooth development and deployment. Below are the details of each branch type:

> **⚠️ IMPORTANT**
> 
> - **NEVER** commit or push directly to the `main` branch
> - **DO NOT** delete branches on the remote repository
> - **ALWAYS** create a feature, bugfix, hardware, or docs branch for your work
> - **NEVER** merge your own pull requests without review

### Main Branch (`main`)
- The `main` branch contains the production-ready code.
- This branch should be stable and contain thoroughly tested code.
- Only updated via **feature**, **bugfix**, **hardware**, or **docs** branch merges.

### Feature Branches (`feature/*`)
- Used for both software and firmware development.
- Feature branches are used to develop new features.
- Each feature branch is created from the `main` branch and is merged back into `main` once the feature is complete and tested.
- Naming convention: `feature/feature-name`

### Bugfix Branches (`bugfix/*`)
- Used for fixing software and firmware issues.
- Bugfix branches are used to fix bugs in the `main` branch.
- They are merged back into `main` after the bug is fixed.
- Naming convention: `bugfix/bug-description`

### Hardware Branch (`hardware/*`)
- A dedicated branch for hardware-related work (PCB designs, schematics, etc).
- Used instead of individual feature/bugfix branches since files are typically binary and do not support traditional vcs.
- All modifications should be documented in `hardware/CHANGELOG.md` before merging into main.
- Naming convention: `hardware/module/version-number`

### Documentation Branches (`docs/*`)
- Used for documentation-**ONLY** changes and improvements.
- Can be used for all types of documentation (general, software, firmware, hardware).
- Naming convention: `docs/document-description`

## Branch Naming Guidelines
- Use lowercase letters for all branch names.
- Use hyphens (-) to separate words in branch names.
- For hardware branches, use dots for version numbers (e.g., v1.3).
- Keep names concise but descriptive.
- Examples:
  - `feature/add-login-page`
  - `bugfix/fix-sensor-readings`
  - `hardware/pcb/v1.3`
  - `docs/update-readme`

## Branch Lifetime
- Branches should be relatively short-lived.
- Aim to merge feature and bugfix branches within 1-2 weeks.
- Regular merges from main into your branch help prevent complex merge conflicts.

## Keeping Your Branch Updated
To avoid complex merge conflicts, regularly update your branch with changes from `main`:

1. Make sure your local changes are committed: `git add .` and `git commit -m "<type> [Discipline/Component]: Brief description"`
2. Switch to the main branch: `git checkout main`
3. Pull the latest changes: `git pull origin main`
4. Switch back to your branch: `git checkout your-branch-name`
5. Merge main into your branch: `git merge main`
6. Resolve any conflicts if they occur
7. Push your updated branch: `git push origin your-branch-name`

With multiple team members working on software and firmware, it's recommended to do this at least 2-3 times per week or whenever significant changes are merged into `main`.

## Workflow Examples

### Creating a Feature Branch
1. Create a feature branch: `git checkout -b feature/awesome-feature main`
2. Work on the feature, commit changes, and push to the remote repository.
3. Create a pull request to merge into `main`
4. After review and approval, merge the feature branch into `main`

### Fixing a Bug
1. Create a bugfix branch: `git checkout -b bugfix/fix-login main`
2. Fix the bug, commit changes, and push to the remote repository.
3. Create a pull request to merge into `main`
4. After review and approval, merge the bugfix branch into `main`

### Hardware Changes
1. Create a hardware branch: `git checkout -b hardware/pcb/v1.2 main`
2. Make hardware changes and document them in `hardware/CHANGELOG.md`
3. Commit changes and push to the remote repository.
4. Create a pull request to merge into `main`
5. After review and approval, merge the hardware branch into `main`

### Documentation Changes
1. Create a docs branch: `git checkout -b docs/update-api-docs main`
2. Make documentation changes.
3. Commit changes and push to the remote repository.
4. Create a pull request to merge into `main`
5. After review and approval, merge the docs branch into `main`

# Changelog Guidelines

Maintaining changelogs helps track progress and communicate changes to team members. Each discipline should maintain appropriate changelog documentation.

## Software & Firmware Changelog
For software and firmware changes, update the changelog in the respective directory:
- Software: `software/CHANGELOG.md`
- Firmware: `firmware/CHANGELOG.md`

Example changelog entry:
```markdown
## 18-03-2025
### Added
- New feature X that does Y
### Changed
- Improved performance of Z function
### Fixed
- Bug in login process
```

## Hardware Changelog
For hardware changes, document in `hardware/CHANGELOG.md`:

Example hardware changelog entry:
```markdown
## PCB v1.2 - 18-03-2025
### Changed
- Relocated power components to reduce noise
- Updated USB connector to Type-C
### Fixed
- Corrected footprint for IC3
```

# Commit Message Guidelines

Write clear, concise commit messages following the Conventional Commits specification combined with our discipline-based tagging:

```
:gitmoji: <type> [Discipline/Component]: Brief description

[optional body]

[optional footer(s)]
```

Where `<type>` is one of:

### General Types:
- ✨ `feat`: A new feature
- 🐛 `fix`: A bug fix
- 📝 `docs`: Documentation only changes
- 💄 `style`: Changes that don't affect code meaning (formatting, etc)
- ♻️ `refactor`: Code changes that neither fix a bug nor add a feature
- ✅ `test`: Adding or modifying tests
- 🔧 `chore`: Changes to build process or auxiliary tools
- 👷 `ci`: Changes to CI configuration files and scripts

### Hardware-specific Types:
- 📐 `design`: Changes to schematic or PCB layout
- 🔍 `footprint`: Updates to component footprints
- ⚡ `routing`: PCB trace/routing changes
- 📦 `bom`: Bill of Materials updates
- 🛠️ `mech`: Mechanical design changes
- 🔬 `sim`: Simulation or analysis updates

> **📝 NOTE**: Hardware changes can use either hardware-specific types or general types depending on the context:
> - Use hardware-specific types for detailed technical changes (e.g., `routing [Hardware/PCB]: Optimize power traces`)
> - Use general types for high-level features or fixes (e.g., `feat [Hardware/PCB]: Add USB-C support`)

### Discipline Tags:
- `[Software]` or `[Software/Component]`: For software changes
  - Components: UI, API, Database, Auth, etc.
- `[Firmware]` or `[Firmware/Component]`: For firmware changes
  - Components: Sensors, Comms, Power, etc.
- `[Hardware]` or `[Hardware/Component]`: For hardware changes
  - Components: PCB, Schematic, Enclosure, etc.

> **📝 NOTE**: For documentation-only changes, use the `docs` type with:
> - A discipline tag if the documentation is specific to that discipline
> - No tag for general documentation

### Examples:
```
✨ feat [Software/UI]: Add user authentication system

- Implement JWT-based authentication with secure password hashing.
- Add login and registration endpoints.
```

🐛 fix [Firmware/Sensors]: Correct temperature reading overflow

Fix integer overflow in readings above 100°C.
```

📐 design [Hardware/PCB]: Add power regulation circuit

- Added LM317 voltage regulator
- Included filtering capacitors
- Added thermal relief to ground plane
```

📝 docs [Software]: Add API endpoint documentation
```

📝 docs: Update repository README
```

### Combined Usage Examples (for multiple commits on the same branch):

#### Software Feature Example:
```
Branch: feature/user-authentication
Commits:
- ✨ feat [Software/API]: Add JWT authentication endpoints
- ✨ feat [Software/UI]: Create login form
- ✅ test [Software]: Add authentication unit tests
- 📝 docs [Software]: Document authentication flow
```

#### Firmware Bug Fix Example:
```
Branch: bugfix/sensor-readings
Commits:
- 🐛 fix [Firmware/Sensors]: Correct temperature overflow
- ✅ test [Firmware]: Add overflow test cases
- 💄 style [Firmware]: Format sensor module
- 📝 docs [Firmware]: Update sensor documentation
```

#### Hardware Design Example:
```
Branch: hardware/pcb/v1.2
Commits:
- 📐 design [Hardware/PCB]: Add power regulation
- ⚡ routing [Hardware/PCB]: Optimize power traces
- 🔍 footprint [Hardware/PCB]: Update USB connector
- 📝 docs [Hardware]: Update schematic documentation
```

For breaking changes, add an exclamation mark before the colon:
```
✨ feat! [Software/API]: Change authentication token format

BREAKING CHANGE: New token format is not backward compatible
```

# Git Ignore Guidelines

Each discipline should maintain appropriate `.gitignore` files to prevent unnecessary or sensitive files from being committed to the repository.

### Root .gitignore
The root `.gitignore` file contains patterns for common files that should be ignored across all disciplines:
- OS-specific files (e.g., `.DS_Store`, `Thumbs.db`)
- Editor/IDE files (e.g., `.vscode/`, `.idea/`)
- Log files
- Environment files with sensitive information

### Discipline-Specific .gitignore
Each discipline may add their own `.gitignore` file in their respective directories:
- Software: Ignore dependencies, build artifacts, etc.
- Firmware: Ignore compiled binaries, debug files, etc.
- Hardware: Ignore backup files, temporary files, etc.

> **📝 NOTE**
>
> If you're unsure whether a file should be committed, consult with your team lead or specialisation lead.