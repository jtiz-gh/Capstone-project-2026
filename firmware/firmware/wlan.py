from network import STA_IF, WLAN
from time import sleep_ms, ticks_ms, ticks_diff  # Add ticks_ms, ticks_diff
from picozero import pico_led

ssid = "Test"
password = "aaaaaab1"


def init_wlan():
    """Initializes the WLAN interface."""
    wlan = WLAN(STA_IF)
    wlan.active(True)

    return wlan


def try_connect_to_wlan(wlan, timeout_ms=0):
    """Connects to the specified Wi-Fi network within a timeout and returns the IP address of the Pico.

    Args:
        wlan (WLAN): The WLAN interface to use for the connection.
        timeout_ms (int): The maximum time to wait for a connection in milliseconds.

    Returns:
        str: The IP address of the Pico if connected, None otherwise.
    """

    if wlan is None:
        return None

    print(f"Connecting to Wi-Fi... {ssid}")

    wlan.connect(ssid, password)

    start_time = ticks_ms()
    while not wlan.isconnected():
        if ticks_diff(ticks_ms(), start_time) > timeout_ms:
            print("Wi-Fi connection timed out.")
            return None

        pico_led.toggle()
        sleep_ms(250)

    pico_led.on()
    pico_ip_addr = wlan.ifconfig()[0]

    print(f"Connected to Wi-Fi, our IP address is: {pico_ip_addr}")

    return pico_ip_addr
