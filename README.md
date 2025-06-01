# Capstone Project 2025 - Team 19

## Project Overview

This project implements a wireless data acquisition system for EVolocity's electric vehicle competitions. The system enables real-time wireless transmission of ECU data, eliminating the need for manual retrieval via USB-C connections. It improves collection accuracy, speed, and scalability while supporting EVolocity's educational mission.

Key features:

- Custom ECU with accurate voltage and current sensing
- Real-time wireless data transmission
- Web-based interface for competition management
- Offline-capable operation with cloud sync
- Mobile-friendly design for race day use

Project brief can be found on [Google Drive](https://docs.google.com/document/d/1vH7OvMVSJteDKoSW-FQfeeVJb95oDqaqZ6kooqCCcWs/edit?usp=sharing)

## Repository Structure

```md
.
├── software/          # Web application code
│   ├── src/           # Source code
│   │   ├── app/       # Next.js app router pages
│   │   ├── components/# React components
│   │   ├── lib/       # Utility functions and services
│   │   ├── hooks/     # Custom React hooks
│   │   ├── types/     # TypeScript type definitions
│   │   └── assets/    # Static assets
│   ├── prisma/        # Database schema and migrations
│   ├── cypress/       # End-to-end tests
│   ├── __test__/      # Unit tests
│   ├── public/        # Public static files
│   ├── docs/          # Documentation
│   └── local-supabase-project/ # Local development database
├── firmware/          # Embedded system firmware
│   ├── firmware/      # Core MicroPython source code
│   │   ├── drivers/   # Hardware drivers for peripherals
│   │   ├── lib/       # Utility libraries and modules
│   │   └── tasks/     # Task management
│   ├── docs/          # Firmware documentation
│   ├── initial-experiments/ # Early ADC testing code
│   ├── ecu-simulate.py     # ECU simulation script
│   ├── load-control.py     # Programmable load control
│   └── mock-server.js      # Mock backend server
├── hardware/          # PCB and hardware designs
│   ├── pcb/           # PCB design files and libraries
│   ├── implementation/# Circuit implementation files
│   ├── testing/       # Testing and validation files
│   └── docs/          # Documentation files
└── CONTRIBUTING.md    # Development guidelines
```

## Quick Start

1. Clone the repository

   ```bash
   git clone git@github.com:ECSECapstone/capstone-project-2025-team_19.git
   cd capstone-project-2025-team_19
   ```

2. Follow setup instructions in respective directories:
   - [Software Setup](software/README.md)
   - [Firmware Setup](firmware/README.md)
   - [Hardware Setup](hardware/README.md)

## Development Workflow

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before starting development
- Create feature/bugfix branches from `main`
- Keep branches up to date with `main`
- Submit pull requests for review
- For hardware changes update `CHANGELOG.md` file

## Team Members

- Project Lead
  - **Pulasthi Lenaduwa**
- Software Team
  - **Chulshin Kim** - Software Lead
  - Chris Valenzuela
  - Jackson Schofield
  - Zhiyu He
- Firmware Team
  - **Tai Wei Loh** - Firmware Lead
  - Saarthak Negi
- Hardware Team
  - **Jin Shim** - Hardware Lead
  - Aldonza Watt
  - Vinayak Verma

## Project Status

Current project phase and milestones:

- [x] Initial Setup
- [x] Hardware Design
  - [x] Circuit design and simulation
  - [x] PCB layout and manufacturing
  - [x] Component testing and validation
- [x] Firmware Development
  - [x] Sensor data acquisition
  - [x] Wireless transmission
  - [x] Data storage and processing
- [x] Software Development
  - [x] Web interface
  - [x] Database management
  - [x] Competition management features
- [x] Integration Testing
- [x] Final Documentation

## Documentation

### Firmware Documentation (`firmware/docs/`)

- [Firmware Architecture](firmware/docs/FIRMWARE_ARCHITECTURE.md) - System design and data flow
- [ECU Protocol](firmware/docs/ECU_PROTOCOL.md) - Communication protocol specifications
- [Pin Mapping](firmware/docs/PIN_MAPPING.md) - Hardware interface and pin configurations
- [Toolchain Setup](firmware/docs/TOOLCHAIN_SETUP.md) - Development environment setup
- [Future Work](firmware/docs/FUTURE_WORK.md) - Planned improvements and optimizations
- Testing and validation procedures
- ADC calibration procedures
- Hardware interface documentation

### Hardware Documentation (`hardware/docs/`)

- [Component Selection](hardware/docs/COMPONENT_SELECTION.md) - Detailed component specifications and selection rationale

### Project Documentation (Google Drive)

Project management documentation stored in Google Drive:

- [Project brief](https://docs.google.com/document/d/1vH7OvMVSJteDKoSW-FQfeeVJb95oDqaqZ6kooqCCcWs/edit?usp=sharing)
- [Meeting minutes](https://drive.google.com/drive/folders/1z7YsXZboZKT3bY4RvGdQBiedCJfJxP-C?usp=sharing)
- [Logbooks](https://drive.google.com/drive/folders/1cl1ZUcF_Y9H9Y0-6AfLaIR1GfmjoznK_?usp=sharing)
- Assessment documents can be found in the [docs directory](docs/)
- [Presentation slides](https://docs.google.com/presentation/d/1s20KIIMT4N6qa7-0XX3COPQOuuCE7ozxVFRD11GFjZc/edit?usp=sharing)

Development guidelines are in [CONTRIBUTING.md](CONTRIBUTING.md)
