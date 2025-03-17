# Firmware Architecture

> `TODO`: Update this template with actual firmware architecture once design is finalized.

## Overview
Firmware for the wireless ECU data collection module, running on Raspberry Pi Pico. The system interfaces with EVolocity Control Units (ECUs) via USB CDC ACM or UART, and transmits data wirelessly to the central system.

## System Architecture
```
[Raspberry Pi Pico]
├── Core
│   ├── System Initialization
│   ├── USB CDC ACM Handler
│   └── Wireless Communication
├── Drivers
│   ├── USB Interface
│   ├── UART Interface
│   └── WiFi/BT Module
├── Data Management
│   ├── ECU Data Structures
│   ├── Data Buffer Management
│   └── Error Handling
└── Application
    ├── Main State Machine
    └── Power Management
```

## Module Descriptions

### Core System
- USB CDC ACM communication with ECU
- Wireless module initialization and management
- System state management
- Error handling and recovery

### Drivers Layer
- USB CDC ACM driver for ECU communication
- UART driver (backup communication)
- Wireless module driver (WiFi/BT)
- Power management for different sources

### Data Management
- ECU configuration data structures:
  - Serial number (uint)
  - Team number (uint)
  - Vehicle class (enum)
  - Vehicle type (enum)
- Status data structures:
  - Flash memory usage
  - Temperature
  - Voltage
  - Current
- Energy frame data structures:
  - Timestamp
  - Average Voltage
  - Average Current
  - Energy

### Application Layer
- Main state machine for data collection
- Wireless connection management
- Data transmission scheduling
- Power source management

## State Machine
```
[INIT] -> [CONNECT_ECU] -> [READ_CONFIG] -> [COLLECT_DATA] -> [TRANSMIT]
   ^            |              |                   |             |
   |            v              v                   v             v
   +--------- [ERROR] <---- [ERROR] <----- [BUFFER_FULL] <- [DISCONNECT]
```

## Communication Protocols
### ECU Interface
- USB CDC ACM (primary)
  - Baud rate: TBD
  - Data format: TBD
- UART (backup)
  - Baud rate: TBD
  - Voltage level: 5V
  - Pin configuration: TBD

### Wireless Interface
- Protocol: WiFi/BT (TBD)
- Range: >10m required
- Data rate: >128kB/s required
- Security: TBD

## Power Management
- Sources:
  - USB 5V (from ECU)
  - Vehicle battery (16-60VDC)
- Power states:
  - Active collection
  - Wireless transmission
  - Idle/Sleep

## Error Handling
- Connection loss recovery
- Data buffer overflow
- Power source switching
- Wireless reconnection

## Testing Strategy
- USB communication testing
- Wireless range testing
- Power source switching tests
- Data integrity verification
- Connection recovery testing

## Performance Requirements
- Wireless range: >10m
- Data rate: >128kB/s
- Quick connection recovery
- Efficient power management

## Build Configuration
- Debug vs Release builds
- Optimization levels
- Memory layout

## Safety Considerations
- Watchdog implementation
- Error checking
- Fail-safe mechanisms 