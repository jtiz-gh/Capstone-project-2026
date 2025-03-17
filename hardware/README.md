# Hardware Directory

> `TODO`: Review and update all sections based on project requirements and component selections

This directory contains the hardware design files for the EVolocity Control Unit (ECU) wireless data collection module.

## Documentation

The following documentation is available:
- [Component Selection](docs/COMPONENT_SELECTION.md) - Bill of materials and component justifications
- [Design Constraints](docs/DESIGN_CONSTRAINTS.md) - Physical and electrical requirements
- [Assembly Guide](docs/ASSEMBLY_GUIDE.md) - PCB assembly and testing instructions
- [Testing Procedures](docs/TESTING_PROCEDURES.md) - Hardware validation procedures
- [Enclosure](docs/ENCLOSURE.md) - Enclosure design and assembly instructions

## Project Structure
```
hardware/
├── pcb/              # PCB design files
│   ├── main/         # Main board designs
│   └── modules/      # Optional module designs
├── schematics/       # Circuit schematics
├── docs/             # Documentation files
├── models/           # 3D models and enclosure designs
├── production/       # Manufacturing files
│   ├── gerber/      # Gerber files for PCB fabrication
│   └── bom/         # Bill of Materials
└── CHANGELOG.md      # Hardware revision history
```

## Design Requirements
- Input voltage: TBD
- Operating temperature: TBD
- Form factor: TBD
- Connectivity: USB and Wireless
- Mounting: TBD

## Manufacturing
> `TODO`: Add manufacturing partner requirements and guidelines

## Assembly
> `TODO`: Add assembly instructions and testing procedures

## Testing
> `TODO`: Add testing requirements and validation procedures

## Safety Considerations
- All designs must comply with NZ electrical safety standards
- Proper isolation for vehicle electrical system
- Protection against reverse polarity
- EMI/EMC considerations
- Thermal management 