import json
import socket
from time import sleep_ms, ticks_diff, ticks_ms

import urequests
from drivers.picozero import pico_led

SERVER_PORT = 8000

UDP_PORT = 5555
UDP_RECV_BUFFER_SIZE = 64


def is_server_online(server_ip):
    """Checks if the server is reachable and responding to pings."""
    ping_url = f"http://{server_ip}:{SERVER_PORT}/ping"
    print(f"Pinging server at {ping_url}...")
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


def try_discover_server_ip(timeout_ms=10000):
    """
    Listens for UDP broadcasts to discover the server's IP address within a timeout.
    Pings potential IPs to confirm they are online.

    Args:
        timeout_ms (int): The maximum time to wait in milliseconds.

    Returns:
        str: The discovered and confirmed server IP address, or None if timed out or none found.
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.setblocking(False)

    try:
        sock.bind(("0.0.0.0", UDP_PORT))
        print(f"Listening on 0.0.0.0:{UDP_PORT} for UDP broadcasts...")
    except OSError as e:
        print(f"Error binding UDP socket: {e}")
        sock.close()
        return None

    server_ip_address = None
    print("Waiting for server IP address broadcast...")
    start_time = ticks_ms()

    while ticks_diff(ticks_ms(), start_time) <= timeout_ms:  # Check timeout first
        pico_led.on()
        sleep_ms(125)
        pico_led.off()
        sleep_ms(125)

        try:
            result = sock.recvfrom(UDP_RECV_BUFFER_SIZE)
            if len(result) != 2:
                continue

            data, addr = result
            # The data received is a comma-separated string of potential server IPs
            potential_ips_str = data.decode("utf-8")
            print(
                f"Received potential server IPs '{potential_ips_str}' from {addr[0]}:{addr[1]}"
            )

            potential_ips = potential_ips_str.split(",")
            for potential_ip in potential_ips:
                potential_ip = potential_ip.strip()
                if not potential_ip:
                    continue

                print(f"Checking potential server IP: {potential_ip}")
                if is_server_online(potential_ip):
                    server_ip_address = potential_ip
                    print(f"Server confirmed online at IP: {server_ip_address}")
                    sock.close()
                    pico_led.on()  # Keep LED on after finding server
                    return server_ip_address  # Return immediately once found

        except OSError as e:
            # EAGAIN means no data available on non-blocking socket
            if e.errno != 11:  # errno.EAGAIN is 11
                print("Socket error during discovery:", e)
                sleep_ms(500)  # Wait briefly on error
        except Exception as e:
            print(f"An unexpected error occurred during UDP receive/processing: {e}")
            sleep_ms(500)

        # Check timeout again before looping
        if ticks_diff(ticks_ms(), start_time) > timeout_ms:
            break

    # Loop finished or timed out without finding a server
    print("Server discovery finished or timed out without finding a confirmed server.")
    sock.close()
    pico_led.off()
    return None  # Explicitly return None if no server found


async def get_server_ip(current_ip=None, discovery_timeout_ms=1000):
    """
    Gets a verified server IP. Checks current IP first, then attempts discovery.

    Args:
        current_ip (str, optional): The last known server IP. Defaults to None.
        discovery_timeout_ms (int): Timeout for the discovery process.

    Returns:
        str: A verified server IP address, or None if unavailable.
    """
    if current_ip and is_server_online(current_ip):
        print(f"Current server IP {current_ip} is online.")
        return current_ip
    elif current_ip:
        print(f"Current server IP {current_ip} is offline or invalid.")

    print("Attempting to discover a new server...")
    discovered_ip = try_discover_server_ip(timeout_ms=discovery_timeout_ms)
    if discovered_ip:
        print(f"Discovered and verified server at {discovered_ip}")
        return discovered_ip
    else:
        print("Failed to discover a server.")
        return None
