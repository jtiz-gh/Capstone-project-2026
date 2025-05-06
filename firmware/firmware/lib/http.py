import json

import drivers.flash_storage
import urequests
from lib.packer import unpack_processed_float_data_to_dict
from lib.udp import udp_discover_server

SERVER_PORT = 8000

server_ip: str | None = None


def is_server_online(server_ip):
    """Checks if the server is reachable and responding to pings."""
    if server_ip is None:
        return False

    ping_url = f"http://{server_ip}:{SERVER_PORT}/ping"

    try:
        response = urequests.get(ping_url, timeout=5)
        is_online = response.status_code == 200
        if is_online:
            print("Server is online.")
        else:
            print(f"Server ping failed with status: {response.status_code}")
        response.close()
        return is_online
    except Exception as e:
        print(f"Error pinging server {server_ip}: {e}")
        return False


async def upload_data(frame_data_list: list[bytes]):
    """Unpacks binary frame data and attempts to upload to server."""
    global server_ip

    if not frame_data_list:
        return True

    processed_data_list = []

    # Unpack all the binary data
    for frame_data in frame_data_list:
        processed_data = unpack_processed_float_data_to_dict(frame_data)
        processed_data_list.append(processed_data)

    payload = {
        "id": drivers.flash_storage.get_pico_id(),
        "processed_data": processed_data_list,
    }

    success, status = post_json_data(server_ip, payload)

    if success:
        print(f"Data batch sent (Status: {status}, Count: {len(processed_data_list)}).")
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


def post_json_data(server_ip, data):
    """Sends a POST request with JSON data to the specified server IP and port."""
    url = f"http://{server_ip}:{SERVER_PORT}/data"
    headers = {"Content-Type": "application/json"}

    try:
        response = urequests.post(
            url,
            headers=headers,
            data=json.dumps(data, separators=(",", ":")),
            timeout=1,
        )
        print(
            f"POST to {url}, Status: {response.status_code}, Response: {response.text}"
        )
        response.close()
        return True, response.status_code
    except OSError as e:
        print(f"Error posting data to {url}: {e}")
        return False, str(e)
    except Exception as e:
        print(f"An unexpected error occurred during POST: {e}")
        return False, str(e)


def has_server_ip():
    """Checks if a server IP address is set."""
    return server_ip is not None


async def try_discover_server_ip_wrapper(timeout_ms=1000):
    """Wrapper for UDP discovery that updates global server_ip"""
    global server_ip
    server_ip = await udp_discover_server(timeout_ms)
    return server_ip
