# TODO: Persist values to flash to protect against power loss.
# In main loop:
# - Check for new data
#   - Check if Wi-Fi is connected
#   - If not connected, store current values to flash
#   - If connected, check if server IP is available.
#     - If old data exists, store current data to flash and upload old data
#     - If no old data exists, upload current data and store to flash if upload fails
#
# - Check for old data on flash
#   - If old data exists, check if Wi-Fi is connected
#     - If not connected, wait for Wi-Fi to connect
#     - If connected, check if server IP is available
#       - If server IP is available, try uploading data
#         - If upload fails, store data to flash
#         - If upload succeeds, delete data from flash

import drivers.networking
import drivers.wlan
import uasyncio as asyncio
from tasks.adc_sampler import adc_buffer, buffer_lock

SEND_INTERVAL_S = 5

server_ip = None


async def init():
    await drivers.wlan.connect_wifi()


async def task():
    """Handles Wi-Fi connection, server discovery, and sending buffered ADC data."""
    global server_ip
    print("Data Sender task started.")

    while True:
        # Ensure Wi-Fi is connected
        wifi_ip = await drivers.wlan.connect_wifi(timeout_ms=10000)
        if not wifi_ip:
            print("Wi-Fi connection failed. Retrying later...")
            await asyncio.sleep(SEND_INTERVAL_S)
            continue

        # Check if server IP is still valid, or needs rediscovery
        verified_server_ip = await drivers.networking.get_server_ip(server_ip)

        if verified_server_ip:
            server_ip = verified_server_ip

            # Create a copy of the buffer to send and clear the original
            data_to_send = []
            async with buffer_lock:
                print(adc_buffer)
                if len(adc_buffer) > 0:
                    data_to_send = list(adc_buffer)
                    adc_buffer.clear()

            if data_to_send:
                print(
                    f"Attempting to send {len(data_to_send)} samples to {server_ip}..."
                )
                readings_json = []
                for voltage_raw, current_raw in data_to_send:
                    voltage = (voltage_raw / 65535) * 3.3
                    current = (current_raw / 65535) * 3.3
                    readings_json.append(
                        {
                            "v": round(voltage, 4),
                            "c": round(current, 4),
                        }
                    )

                payload = {
                    "id": drivers.wlan.get_mac_address(),
                    # Increment session_id every time the Pico is power cycled
                    "session_id": 1,
                    # Increment packet_id for each batch of readings sent
                    "packet_id": 1,
                    "readings": readings_json,
                }
                success, status = drivers.networking.post_json_data(server_ip, payload)

                if success:
                    print(f"Data sent successfully (Status: {status}).")
                else:
                    print(f"Failed to send data (Reason: {status}).")

                    if isinstance(status, str) and (
                        "ECONNREFUSED" in status
                        or "ETIMEDOUT" in status
                        or "EHOSTUNREACH" in status
                        or "ECONNABORTED" in status
                        or "ECONNRESET" in status
                    ):
                        print(
                            "Connection error detected, clearing server IP for rediscovery."
                        )
                        server_ip = None

            else:
                print("No new data to send.")
        else:
            # get_server_ip returned None
            print("No verified server IP available. Waiting...")
            server_ip = None

        await asyncio.sleep(SEND_INTERVAL_S)
