import gc
import time

import drivers.flash_storage
import drivers.networking
import drivers.wlan
import uasyncio as asyncio
from lib.packer import unpack_processed_float_data
from tasks.data_processing import PROCESSED_FRAME_SIZE, processed_ring_buffer

TRANSMIT_INTERVAL_MS = 2000
# Number of items to batch together when connected to the server and streaming.
# Should be minimised to reduce the chance of data loss in the event of a power loss.
STREAMING_BATCH_SIZE = 10
# Number of items to batch together when clearing a backlog of previously measured data.
BACKLOG_BATCH_SIZE = 40
# Cooldown period between connection attempts (in seconds)
WIFI_CONNECT_COOLDOWN_SEC = 10

server_ip = None
last_wifi_connect_attempt = 0  # Timestamp of the last connection attempt

pico_id: str = drivers.flash_storage.get_pico_id()


async def init():
    pass


async def upload_data(frame_data_list: list[bytes]):
    """Unpacks binary frame data and attempts to upload to server."""
    global server_ip

    if not frame_data_list:
        return True

    processed_data_list = []

    # Unpack all the binary data
    for frame_data in frame_data_list:
        (
            timestamp,
            session_id,
            measurement_id,
            avg_voltage,
            avg_current,
            avg_power,
            peak_voltage,
            peak_current,
            peak_power,
            energy,
        ) = unpack_processed_float_data(frame_data)

        processed_data = {
            "timestamp": timestamp,
            "session_id": session_id,
            "measurement_id": measurement_id,
            "avg_voltage": avg_voltage,
            "avg_current": avg_current,
            "avg_power": avg_power,
            "peak_voltage": peak_voltage,
            "peak_current": peak_current,
            "peak_power": peak_power,
            "energy": energy,
        }

        processed_data_list.append(processed_data)

    payload = {
        "id": drivers.wlan.get_mac_address(),
        "processed_data": processed_data_list,
    }

    success, status = drivers.networking.post_json_data(server_ip, payload)

    if success:
        print(
            f"Data batch sent successfully (Status: {status}, Count: {len(processed_data_list)})."
        )
        return True
    else:
        print(f"Failed to send data batch (Reason: {status}).")

        # Check for connection errors to clear server IP
        if isinstance(status, str) and (
            "ECONNREFUSED" in status
            or "ETIMEDOUT" in status
            or "EHOSTUNREACH" in status
            or "ECONNABORTED" in status
            or "ECONNRESET" in status
        ):
            print("Connection error detected, clearing server IP for rediscovery.")
            server_ip = None
        return False


async def task():
    """Handles Wi-Fi connection, server discovery, and sending processed data."""
    global server_ip, last_wifi_connect_attempt
    print("Data Sender task started.")

    frame_buffer = []

    while True:
        await asyncio.sleep_ms(0)

        try:
            if should_process_backlog():
                await process_backlog()

            new_frame_data = bytearray(await processed_ring_buffer.get())

            if drivers.wlan.is_connected() and server_ip:
                # Connected: Add to buffer and process if batch is full
                frame_buffer.append(new_frame_data)

                # Check if there's a backlog
                if drivers.flash_storage.measurement_backlog_size() > 0:
                    # Dump buffer to storage, try to upload the backlog first
                    print(f"Adding {len(frame_buffer)} frames to measurement backlog.")
                    drivers.flash_storage.write_measurements(frame_buffer)
                    frame_buffer = []

                    if should_process_backlog():
                        await process_backlog()
                else:
                    # Try stream to server once we have enough data
                    if len(frame_buffer) >= STREAMING_BATCH_SIZE:
                        if not await upload_data(frame_buffer):
                            # If upload fails, dump buffer to storage
                            print(f"Storing {len(frame_buffer)} frames to flash.")
                            drivers.flash_storage.write_measurements(frame_buffer)
                        frame_buffer = []

            else:
                # Not connected: Store immediately, don't buffer
                print("No Wi-Fi connection. Storing data immediately to flash.")
                drivers.flash_storage.write_measurements([new_frame_data])

                # Try to establish Wi-Fi connection for next iteration
                current_time = time.time()
                if (
                    current_time - last_wifi_connect_attempt
                    >= WIFI_CONNECT_COOLDOWN_SEC
                ):
                    last_wifi_connect_attempt = current_time
                    print(
                        f"Attempting to connect to Wi-Fi after {WIFI_CONNECT_COOLDOWN_SEC}s cooldown"
                    )
                    wifi_ip = await drivers.wlan.connect_wifi()
                    if wifi_ip:
                        print(f"Wi-Fi connected with IP: {wifi_ip}")

                    if drivers.wlan.is_connected() and not server_ip:
                        # Try to discover server
                        new_server_ip = await drivers.networking.get_server_ip(None)
                        if new_server_ip:
                            server_ip = new_server_ip
                else:
                    remaining = WIFI_CONNECT_COOLDOWN_SEC - (
                        current_time - last_wifi_connect_attempt
                    )
                    print(
                        f"Waiting for cooldown: {remaining:.1f}s remaining before next connection attempt"
                    )

        except EOFError:
            pass


def should_process_backlog():
    """Check if backlog processing should be done."""
    measurement_backlog_size = drivers.flash_storage.measurement_backlog_size()
    return processed_ring_buffer.empty() and measurement_backlog_size > 0


async def process_backlog():
    """Process and upload backlog data from the single measurements file."""
    measurement_backlog_size = drivers.flash_storage.measurement_backlog_size()
    frames_available = measurement_backlog_size // PROCESSED_FRAME_SIZE

    print(f"Processing backlog with {frames_available} measurements.")

    # Process in batches to avoid memory issues
    frames_processed = 0
    while frames_processed < frames_available:
        await asyncio.sleep_ms(0)

        # Check if there are any new frames on the buffer
        if not processed_ring_buffer.empty():
            print("New frames available in the buffer, skipping backlog processing.")
            return

        # Calculate batch size for this iteration
        batch_size = min(BACKLOG_BATCH_SIZE, frames_available - frames_processed)

        # Read a batch of measurements from the start of the file
        frame_data_batch = drivers.flash_storage.read_measurements(batch_size)

        if not frame_data_batch:
            # No data read or error occurred
            break

        # Try to upload the batch
        result = await upload_data(frame_data_batch)

        # Force garbage collection to free up memory
        gc.collect()

        if result:
            # Delete successfully uploaded measurements
            drivers.flash_storage.delete_measurements(len(frame_data_batch))
            frames_processed += len(frame_data_batch)
            print(
                f"Backlog batch with {len(frame_data_batch)} frames sent successfully."
            )
        else:
            print("Failed to send backlog batch. Will retry later.")
            break
