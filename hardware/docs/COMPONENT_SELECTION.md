# Component Selection

> `TODO`: Update with actual component selections and justifications

## Core Components

### Microcontroller (Raspberry Pi Pico)
- **Selected**: Raspberry Pi Pico
- **Key Features**:
  - Dual-core ARM Cortex M0+
  - 264KB RAM
  - USB 1.1 controller
- **Justification**: Project requirement

### Wireless Module
- **Selected**: TBD
- **Requirements**:
  - Operating voltage: 3.3V compatible
  - Range: Minimum 10m
  - Protocol: NZ ISM band compliant
  - Interface: UART/SPI
- **Options Under Consideration**:
  1. Option 1
  2. Option 2

## Power Management

### Voltage Regulator
- **Selected**: TBD
- **Requirements**:
  - Input: Vehicle power (12V)
  - Output: 3.3V and 5V
  - Current: TBD
- **Options Under Consideration**:
  1. Option 1
  2. Option 2

### Protection Circuits
- **Selected**: TBD
- **Requirements**:
  - Reverse polarity protection
  - Overvoltage protection
  - Current limiting

## Connectors

### USB Connector
- **Selected**: TBD
- **Requirements**:
  - Type: USB-C preferred
  - Mounting: Through-hole for durability
  - Current rating: TBD

### Vehicle Interface
- **Selected**: TBD
- **Requirements**:
  - Voltage rating: >12V
  - Environmental protection
  - Secure connection method

## Bill of Materials Template

| Component | Description | Package | Quantity | Supplier | Part Number | Unit Cost | Notes |
|-----------|-------------|----------|-----------|-----------|--------------|------------|--------|
| RPi Pico  | Microcontroller | THT | 1 | | | | Required |
| | | | | | | | |

## Supplier Information
- Supplier 1: [Link]
- Supplier 2: [Link]

## Design Considerations
- Component availability
- Cost constraints
- Assembly requirements
- Environmental conditions
- Reliability requirements

## References
- [Raspberry Pi Pico Datasheet]
- [NZ Radio Equipment Standards]
- [Vehicle Electrical Standards] 