import gc
import time

import drivers.flash_storage
import drivers.wlan
import lib.http
import uasyncio as asyncio
from tasks.data_processing import PROCESSED_FRAME_SIZE, processed_ring_buffer

TRANSMIT_INTERVAL_MS = 2000
# Number of items to batch together when connected to the server and streaming.
# Should be minimised to reduce the chance of data loss in the event of a power loss.
STREAMING_BATCH_SIZE = 10
# Number of items to batch together when clearing a backlog of previously measured data.
BACKLOG_BATCH_SIZE = 40
# Cooldown period between connection attempts (in seconds)
SERVER_CONNECT_COOLDOWN_SEC = 10

last_wifi_connect_attempt = 0  # Timestamp of the last connection attempt

pico_id: str = drivers.flash_storage.get_pico_id()


async def init():
    pass


async def task():
    """Handles Wi-Fi connection, server discovery, and sending processed data."""
    global last_wifi_connect_attempt
    print("Data Sender task started.")

    frame_buffer = []

    while True:
        await asyncio.sleep_ms(0)

        try:
            if should_process_backlog():
                await process_backlog()

            new_frame_data = bytearray(await processed_ring_buffer.get())
            frame_buffer.append(new_frame_data)

            while (
                not processed_ring_buffer.empty()
                and len(frame_buffer) < BACKLOG_BATCH_SIZE
            ):
                new_frame_data = bytearray(await processed_ring_buffer.get())
                frame_buffer.append(new_frame_data)

            if drivers.wlan.is_connected() and lib.http.has_server_ip():
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
                        if not await lib.http.upload_data(frame_buffer):
                            # If upload fails, dump buffer to storage
                            print(f"Storing {len(frame_buffer)} frames to flash.")
                            drivers.flash_storage.write_measurements(frame_buffer)

                        frame_buffer = []
            else:
                # Not connected: Store immediately, don't buffer
                print("No server connection. Storing data immediately to flash.")
                drivers.flash_storage.write_measurements(frame_buffer)
                frame_buffer = []

                # Try to establish server connection for next iteration
                current_time = time.time()
                if (
                    current_time - last_wifi_connect_attempt
                    >= SERVER_CONNECT_COOLDOWN_SEC
                ):
                    last_wifi_connect_attempt = current_time
                    print(
                        f"Attempting to connect to server after {SERVER_CONNECT_COOLDOWN_SEC}s cooldown"
                    )

                    if not drivers.wlan.is_connected():
                        wifi_ip = await drivers.wlan.connect_wifi()
                        if wifi_ip:
                            print(f"Wi-Fi connected with IP: {wifi_ip}")

                    if drivers.wlan.is_connected() and not lib.http.has_server_ip():
                        # Try to discover server
                        await lib.http.try_discover_server_ip_wrapper()

        except EOFError:
            pass


def should_process_backlog():
    """Check if backlog processing should be done."""

    return (
        drivers.wlan.is_connected()
        and lib.http.has_server_ip()
        and processed_ring_buffer.empty()
        and drivers.flash_storage.measurement_backlog_size() > 0
    )


async def process_backlog():
    """Process and upload backlog data from the single measurements file."""
    measurement_backlog_size = drivers.flash_storage.measurement_backlog_size()
    frames_available = measurement_backlog_size // PROCESSED_FRAME_SIZE

    print(f"Processing backlog with {frames_available} measurements.")

    # Process in batches to avoid memory issues
    frames_processed = 0
    while frames_processed < frames_available:
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
        result = await lib.http.upload_data(frame_data_batch)

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

        await asyncio.sleep_ms(60)
