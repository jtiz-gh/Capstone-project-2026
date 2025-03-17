# Pin Mapping Documentation

> `TODO`: Update this template with actual pin configurations once hardware design is finalized.

## Overview
Pin configuration for the Raspberry Pi Pico interfacing with ECU and wireless module.

## Pin Assignments

### USB Interface
- USB data pins are handled by Pico's USB hardware

### UART Interface (ECU Backup Connection)
| Pin | Function | Description |
|-----|----------|-------------|
| GPx | TX       | UART TX to ECU |
| GPx | RX       | UART RX from ECU |
| GPx | 5V       | 5V from ECU |
| GND | Ground   | Ground |

### Wireless Module
| Pin | Function | Description |
|-----|----------|-------------|
| GPx | Module specific pins | TBD based on chosen module |

### Power Management
| Pin | Function | Description |
|-----|----------|-------------|
| VSYS| Power In | 16-60VDC from vehicle |
| VBUS| USB Power| 5V from USB |
| 3V3 | Power Out| 3.3V regulated |
| GND | Ground   | Ground |

### Status LEDs
| Pin | Function | Description |
|-----|----------|-------------|
| GPx | LED1     | Power/Status |
| GPx | LED2     | ECU Connection |
| GPx | LED3     | Wireless Status |

### Debug Interface
| Pin | Function | Description |
|-----|----------|-------------|
| GPx | Debug TX | Debug UART TX |
| GPx | Debug RX | Debug UART RX |

## Notes
- Power input protection required for vehicle battery input
- Consider noise isolation for UART lines
- Status LEDs should be visible when installed
- Debug interface should be accessible for testing 