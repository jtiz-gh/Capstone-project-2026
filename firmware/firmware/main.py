import network
import socket
from time import sleep
from picozero import pico_led
import rp2
import sys

ssid = "Test"
password = "aaaaaab1"

def connect_to_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(ssid, password)
    while not wlan.isconnected():
        if rp2.bootsel_button() == 1:
            sys.exit()
        print("Waiting for connection...")
        pico_led.on()
        sleep(0.5)
        pico_led.off()
        sleep(0.5)
    ip = wlan.ifconfig()[0]

    print(f"Connected to Wi-Fi, our IP address is: {ip}")
    pico_led.on()
    return ip


ip = connect_to_wifi()

# --- UDP Broadcast Receiver / Responder ---
UDP_PORT = 5555

# To store an IP address
UDP_RECV_BUFFER_SIZE = 32

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.setblocking(False)

sock.bind(("0.0.0.0", UDP_PORT))
print(f"Listening on 0.0.0.0:{UDP_PORT} for UDP broadcasts...")

ip_address = ""

while True:
    pico_led.on()
    sleep(0.15)
    pico_led.off()
    sleep(0.15)

    try:
        result = sock.recvfrom(UDP_RECV_BUFFER_SIZE)
        if len(result) != 2:
            print(result)
            continue

        data, addr = result
        print(f"Received {data!r} from {addr[0]}:{addr[1]}")

        # Echo response
        sock.sendto(data, addr)
        break
    except Exception as e:
        print("Socket error:", e)
        sleep(1)

pico_led.on()
