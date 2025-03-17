# Firmware Directory

> `TODO`: Review and update all sections based on project constraints and requirements

This directory contains the embedded system firmware for the EVolocity Control Unit (ECU) wireless data collection module, running on a Raspberry Pi Pico.

## Documentation

The following documentation is available:
- [Firmware Architecture](docs/FIRMWARE_ARCHITECTURE.md) - Overall system design and component interactions
- [Pin Mapping](docs/PIN_MAPPING.md) - Detailed pin assignments for the Raspberry Pi Pico
- [Toolchain Setup](docs/TOOLCHAIN_SETUP.md) - Development environment setup and build instructions
- [ECU Protocol](docs/ECU_PROTOCOL.md) - Communication protocol specification for ECU data collection
- [Wireless Module](docs/WIRELESS_MODULE.md) - Wireless communication module requirements and implementation

## Getting Started
1. Follow the [Toolchain Setup](docs/TOOLCHAIN_SETUP.md) guide to set up your development environment
2. Review the [Firmware Architecture](docs/FIRMWARE_ARCHITECTURE.md) to understand the system
3. Check [Pin Mapping](docs/PIN_MAPPING.md) for hardware connections

## Development Guidelines
- Follow the established architecture pattern
- Document all hardware interactions
- Test thoroughly before committing
- Update relevant documentation
- Keep CHANGELOG.md up to date

## Building and Flashing
> `TODO`: Add build and flash instructions once toolchain is selected

## Debugging
> `TODO`: Add debugging instructions once development setup is finalized

## Testing
> `TODO`: Add testing guidelines once framework is chosen

## Structure
```
firmware/
├── src/           # Source code
│   ├── core/      # Core system functionality
│   ├── drivers/   # Hardware drivers
│   ├── comms/     # Communication protocols
│   └── utils/     # Utility functions
├── include/       # Header files
├── lib/           # Libraries
├── docs/          # Documentation files
├── tests/         # Test files
├── tools/         # Build and debug tools
└── CHANGELOG.md   # Firmware changes log
``` 