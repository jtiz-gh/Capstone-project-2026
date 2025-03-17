# ECU Communication Protocol

> `TODO`: Update with actual protocol details once ECU communication is implemented and tested.

## Overview
Documentation for communicating with the EVolocity Control Unit (ECU) via USB CDC ACM interface or UART.

## Communication Interfaces

### Primary: USB CDC ACM
- Interface Type: USB CDC ACM (Communications Device Class)
- Connection: USB-C port on ECU
- Power: 5V available from USB

### Backup: UART
- Voltage Level: 5V
- Connection: UART header on ECU
- Power: 5V available from header

## Data Structures

### Configuration Data
```c
struct ECU_Config {
    uint32_t serial_number;     // ECU serial number
    uint32_t team_number;       // Team identifier
    enum {
        STANDARD = 0,  // 350W
        OPEN = 1       // 2kW
    } vehicle_class;
    enum {
        BIKE = 0,
        KART = 1
    } vehicle_type;
};
```

### Status Data
```c
struct ECU_Status {
    uint32_t flash_usage;    // Flash memory usage
    float temperature;       // Internal temperature
    float voltage;          // Current voltage
    float current;          // Current amperage
};
```

### Energy Frame
```c
struct Energy_Frame {
    uint32_t timestamp;     // Time of measurement
    float avg_voltage;      // Average voltage
    float avg_current;      // Average current
    float energy;          // Energy since last frame
};
```

## Communication Protocol

### Initialization
1. Establish USB CDC ACM connection
2. If USB fails, attempt UART connection
3. Request ECU configuration data
4. Verify communication with status request

### Data Collection
1. Poll status data at regular intervals
2. Collect energy frames as they become available
3. Store data in local buffer
4. Transmit to central system via wireless link

### Error Handling
1. Connection loss detection
2. Automatic reconnection attempts
3. Buffer management for data preservation
4. Interface failover (USB to UART)

## Example Communication Flow
```
[Device] -------- USB/UART Connect --------> [ECU]
[Device] -------- Request Config ----------> [ECU]
[Device] <------- Config Data ------------< [ECU]
[Device] -------- Request Status ----------> [ECU]
[Device] <------- Status Data ------------< [ECU]
[Device] <------- Energy Frame -----------< [ECU]
```

## Implementation Notes
- Implement timeout handling for all communications
- Buffer data locally if wireless connection is lost
- Log all communication errors for debugging
- Maintain timestamps for all collected data
- Handle power state changes gracefully

## Testing
- Test both USB and UART interfaces
- Verify data integrity across interfaces
- Test connection loss recovery
- Validate data format compliance
- Test buffer overflow conditions

## References
- [USB CDC ACM Specification]
- [Pico USB CDC Example](https://github.com/raspberrypi/pico-examples/tree/master/usb/device/dev_cdc_basic)
- [ECU Documentation] (TODO: Add link when available) 