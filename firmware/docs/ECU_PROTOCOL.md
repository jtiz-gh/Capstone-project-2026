# ECU Communication Protocol

## Overview
This document outlines the communication protocol used by the EVolocity Control Unit (ECU) firmware to send measurement data to a backend server. The primary communication method is HTTP POST requests over Wi-Fi.

## Communication Interfaces
- **Primary:** Wi-Fi (IEEE 802.11)
- **Protocol:** HTTP/1.1 implemented over TCP/IP
- **Server Discovery:** UDP broadcast on port 5555. The server broadcasts its IP address(es) on this port. The ECU listens on UDP port 8888 for these broadcasts.
- **Data Transmission:** HTTP POST to `/api/sensor-data` on the discovered server IP, port 3000.

## Data Structures

### Measurement Packet
The ECU tries to send measurement data in batches. Each batch consists of one or more measurement packets. Each individual measurement packet is 40 bytes long and has the following structure, packed in little-endian format (`<`):

| Offset (bytes) | Length (bytes) | Data Type      | Field Name        | Description                                     |
|----------------|----------------|----------------|-------------------|-------------------------------------------------|
| 0              | 4              | `uint32_t`     | `timestamp`       | Milliseconds since ECU boot                     |
| 4              | 4              | `uint32_t`     | `session_id`      | Identifier for the current operational session  |
| 8              | 4              | `uint32_t`     | `measurement_id`  | Sequential ID for this measurement within the session |
| 12             | 4              | `float`        | `avg_voltage`     | Average voltage during the measurement interval |
| 16             | 4              | `float`        | `avg_current`     | Average current during the measurement interval |
| 20             | 4              | `float`        | `avg_power`       | Average power (avg_voltage * avg_current)       |
| 24             | 4              | `float`        | `peak_voltage`    | Peak voltage during the measurement interval    |
| 28             | 4              | `float`        | `peak_current`    | Peak current during the measurement interval    |
| 32             | 4              | `float`        | `peak_power`      | Peak power (peak_voltage * peak_current)        |
| 36             | 4              | `float`        | `energy`          | Calculated energy for this measurement interval |

**Struct Format String (Python `struct` module):** `<LLLfffffff`

### HTTP POST Request Body
The body of the HTTP POST request to `/api/sensor-data` is a raw binary concatenation of one or more Measurement Packets.
- **Content-Type:** `application/octet-stream`
- **Pico-ID:** A custom HTTP header `Pico-ID` is included, containing the unique identifier of the Raspberry Pi Pico W.
- **Content-Length:** The total length of the binary data in bytes, which is the number of packets multiplied by 40 bytes.
- **Pico-Timestamp:** The timestamp of the ECU's boot time in milliseconds, for reference.

## Communication Flow

1.  **Wi-Fi Connection:**
    *   The ECU attempts to connect to the pre-configured Wi-Fi network.
    *   LED Status:
        *   Slow blink: Attempting to connect to Wi-Fi.
2.  **Server Discovery (UDP Broadcast):**
    *   Once connected to Wi-Fi, the ECU listens on UDP port 8888 for broadcast messages from the server.
    *   The backend server (through instrumentation.ts) and the mock server periodically broadcasts its IP address(es) on UDP port 5555 to `255.255.255.255`.
    *   LED Status:
        *   Fast blink: Connected to Wi-Fi, attempting to discover server.
3.  **Data Collection & Buffering:**
    *   The ECU continuously (using interrupts) collects sensor data and processes it into Measurement Packets.
    *   Packets are initially stored in an in-memory buffer.
4.  **Data Transmission (HTTP POST):**
    *   Once the server IP is discovered, the ECU will attempt to send data.
    *   LED Status:
        *   Solid ON: Connected to Wi-Fi and server.
    *   **Streaming Mode:** If the connection is stable and there is no backlog, the ECU batches `STREAMING_BATCH_SIZE` (currently 80) Measurement Packets and sends them as a single binary blob in an HTTP POST request to `http://<server_ip>:3000/api/sensor-data`.
    *   **Backlog Processing:** If there is data stored in flash memory (due to previous failed transmissions or no server connection), the ECU will prioritize sending this backlog. It reads `BACKLOG_BATCH_SIZE` (currently 2500) worth of Measurement Packets from flash and sends them.
    *   **Transmission Failure:**
        *   If the firmware is unable to allocate enough memory for the batch, it will attempt to send half the size of the batch (i.e., `STREAMING_BATCH_SIZE // 2`) over the TCP socket until it can successfully send a batch.
        *   If an HTTP POST request fails (e.g., server unreachable, network error), the unsent Measurement Packets (from the current in-memory buffer or those intended for backlog processing) are written/retained in the flash storage on the ECU.
        *   The ECU will attempt to re-establish a connection and re-send the data later. There is a `SERVER_CONNECT_COOLDOWN_SEC` (currently 8 seconds) before retrying a connection after a failure.
5.  **Server Response:**
    *   The server should respond with HTTP status code `2XX OK` upon successful receipt and processing of the data. The response body is currently ignored by the ECU.
    *   If the server responds with an error status code or the request times out, the data is considered unsent and will be stored/retried.

## Error Handling
-   **Wi-Fi Disconnection:** If Wi-Fi disconnects, the ECU will attempt to reconnect. Data collected during this time is buffered in memory and then written to flash if the buffer is full or the connection cannot be re-established quickly.
-   **Server Unreachable:** If the server cannot be reached (after successful discovery), data is written to flash. The ECU will periodically retry server discovery and connection.
-   **Flash Storage:** Measurement data is stored in a binary file on the Pico W's flash memory if it cannot be immediately transmitted. This data is processed in a FIFO manner.

## Implementation Notes
- The `timestamp` in the Measurement Packet is relative to the ECU's epoch, which may not be relative to boot time.
- The `session_id` can be used to group measurements from a single power cycle or operational period of the ECU.
- The `measurement_id` is a sequential counter for packets within a session.