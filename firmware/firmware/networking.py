import urequests
import json
import socket
from time import sleep_ms, ticks_ms, ticks_diff  # Add ticks_ms, ticks_diff
from picozero import pico_led

SERVER_PORT = 8000  # Changed from 8080 to 8000 to match main.py ping logic

UDP_PORT = 5555
UDP_RECV_BUFFER_SIZE = 32


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
        response = urequests.post(url, headers=headers, data=json.dumps(data), timeout=1)
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

    Args:
        timeout_ms (int): The maximum time to wait in milliseconds.

    Returns:
        str: The discovered server IP address, or None if timed out.
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

    while server_ip_address is None:
        # Check for timeout
        if ticks_diff(ticks_ms(), start_time) > timeout_ms:
            print("Server discovery timed out.")
            sock.close()
            pico_led.off()
            return None

        pico_led.on()
        sleep_ms(125)
        pico_led.off()
        sleep_ms(125)

        try:
            result = sock.recvfrom(UDP_RECV_BUFFER_SIZE)
            if len(result) != 2:
                print(f"Unexpected UDP result: {result}")
                continue

            data, addr = result
            # The data received is a comma-separated string of potential server IPs
            potential_ips_str = data.decode("utf-8")
            print(f"Received potential server IPs '{potential_ips_str}' from {addr[0]}:{addr[1]}")

            potential_ips = potential_ips_str.split(',')
            for potential_ip in potential_ips:
                potential_ip = potential_ip.strip()
                if not potential_ip:
                    continue

                print(f"Checking potential server IP: {potential_ip}")
                if is_server_online(potential_ip):
                    server_ip_address = potential_ip
                    print(f"Server confirmed online at IP: {server_ip_address}")
                    break
                
        except OSError as e:
            # EAGAIN means no data available on non-blocking socket, so we should ignore it
            if e.errno != 11:  # errno.EAGAIN is 11
                print("Socket error:", e)
                sleep_ms(1000)  # Wait before retrying
        except Exception as e:
            print(f"An unexpected error occurred during UDP receive or processing: {e}")
            sleep_ms(1000)

    sock.close()
    pico_led.on()  # Keep LED on after finding server

    print(f"Server IP address confirmed: {server_ip_address}")
    return server_ip_address
