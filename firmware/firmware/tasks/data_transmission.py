import drivers.networking
import drivers.wlan
import uasyncio as asyncio
from tasks.data_processing import processed_data, processed_data_lock

TRANSMIT_INTERVAL_MS = 2000
MAX_PACKETS_PER_TRANSMISSION = 20

server_ip = None


async def init():
    await drivers.wlan.connect_wifi()


async def task():
    """Handles Wi-Fi connection, server discovery, and sending processed data."""
    global server_ip
    print("Data Sender task started.")

    while True:
        # Ensure Wi-Fi is connected
        wifi_ip = await drivers.wlan.connect_wifi(timeout_ms=10000)
        if not wifi_ip:
            print("Wi-Fi connection failed. Retrying later...")
            await asyncio.sleep_ms(TRANSMIT_INTERVAL_MS)
            continue

        # Check if server IP is still valid, or needs rediscovery
        verified_server_ip = await drivers.networking.get_server_ip(server_ip)

        if verified_server_ip:
            server_ip = verified_server_ip

            # Create a copy of the processed data to send and clear the original
            data_to_send = []
            async with processed_data_lock:
                if len(processed_data) > 0:
                    data_to_send = list(processed_data[:MAX_PACKETS_PER_TRANSMISSION])

                    del processed_data[: len(data_to_send)]
                    print(
                        f"Taking {len(data_to_send)} packets, {len(processed_data)} remaining in queue"
                    )

            if data_to_send:
                print(
                    f"Attempting to send {len(data_to_send)} processed data packets to {server_ip}..."
                )

                payload = {
                    "id": drivers.wlan.get_mac_address(),
                    # TODO: Increment session_id every time the Pico is power cycled
                    "session_id": 1,
                    # TODO: Increment packet_id for each batch of readings sent
                    "packet_id": 1,
                    "processed_data": data_to_send,
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

        await asyncio.sleep_ms(TRANSMIT_INTERVAL_MS)
