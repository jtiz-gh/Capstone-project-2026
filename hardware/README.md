# Hardware Directory

This directory contains the hardware design files for the EVolocity Control Unit (ECU) wireless data collection module.

## Documentation

The following documentation is available:

- [Component Selection](docs/COMPONENT_SELECTION.md) - Bill of materials and component justifications

## Project Structure

```md
hardware/
├── pcb/                    # PCB design files and libraries
│   ├── capstone_pcb/      # Main PCB design files
│   ├── SC0918/           # RPi Pico W library files
│   └── *.IntLib          # Component libraries
├── implementation/        # Circuit implementation files
│   ├── energy_monitor.asc # Main circuit schematic
│   └── LM324.lib         # Op-amp library
├── testing/              # Testing and validation files
│   ├── ORingSim.asc      # ORing circuit simulation
│   ├── programmable_load.py    # Load testing script
│   ├── real_load_test.py       # Real load testing
│   └── requirements.txt        # Python dependencies
├── docs/                 # Documentation files
├── CHANGELOG.md          # Hardware revision history
└── .gitignore           # Git ignore rules
```

## Design Requirements

- Input voltage: 12V (Vehicle power)
- Operating voltage: 5V (regulated)
- ADC range: 0-3.3V
- Operating temperature: -40°C to +85°C
- Form factor: PCB with enclosure
- Connectivity:
  - USB (for programming and debugging)
  - Wireless (RPi Pico W built-in)
- Mounting: Vehicle mounting bracket

## Circuit Design Overview

The ECU hardware includes:

- Current and voltage sensing circuits
- Signal conditioning with operational amplifier
- Power regulation and protection
- Debug indicators
- Test points for validation

## Manufacturing

- PCB Fabrication: PCBWay
- Component Suppliers:
  - DigiKey (primary)
  - Element14 (secondary)
- Batch size: 50 units
- Lead time: 2-3 weeks

## Assembly

- Surface mount components (SMT)
- Through-hole components (THT)
- Manual assembly with reflow soldering
- Visual inspection required
- Functional testing after assembly

## Testing

- Power supply validation
- Current sensing accuracy
- Voltage regulation stability
- Wireless connectivity
- Environmental testing
- EMC/EMI compliance

## Safety Considerations

- All designs must comply with NZ electrical safety standards
- Proper isolation for vehicle electrical system
- Protection against reverse polarity
- EMI/EMC considerations
- Thermal management
- Overcurrent protection
- Voltage regulation stability
