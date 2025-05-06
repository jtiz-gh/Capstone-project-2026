import asyncio
import socket
from time import ticks_diff, ticks_ms

import lib.http
from drivers.picozero import pico_led

UDP_PORT = 5555
UDP_RECV_BUFFER_SIZE = 64


async def udp_discover_server(timeout_ms=1000):
    """
    Listens for UDP broadcasts to discover the server's IP address within a timeout.
    Pings potential IPs to confirm they are online.
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
        await asyncio.sleep_ms(125)
        pico_led.off()
        await asyncio.sleep_ms(125)

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
                if lib.http.is_server_online(potential_ip):
                    server_ip_address = potential_ip
                    print(f"Server confirmed online at IP: {server_ip_address}")
                    sock.close()
                    pico_led.on()  # Keep LED on after finding server
                    return server_ip_address

        except OSError as e:
            # EAGAIN means no data available on non-blocking socket
            if e.errno != 11:  # errno.EAGAIN is 11
                print("Socket error during discovery:", e)
                await asyncio.sleep_ms(100)  # Wait briefly on error
        except Exception as e:
            print(f"An unexpected error occurred during UDP receive/processing: {e}")
            await asyncio.sleep_ms(100)

        # Check timeout again before looping
        if ticks_diff(ticks_ms(), start_time) > timeout_ms:
            break

    # Loop finished or timed out without finding a server
    print("Server discovery finished or timed out without finding a confirmed server.")
    sock.close()
    pico_led.off()

    return None
