import asyncio
from time import ticks_diff, ticks_ms

from drivers.picozero import pico_led
from network import STA_IF, WLAN

# Configuration
WIFI_SSID = "Test"
WIFI_PASSWORD = "aaaaaab1"

# Global variables
_mac_address = None
_wlan = None  # Global WLAN object


def _get_wlan():
    """Returns the global WLAN object, initializing it if necessary."""
    global _wlan
    if _wlan is None:
        _wlan = WLAN(STA_IF)
        _wlan.active(True)

    return _wlan


def get_mac_address():
    """Returns the MAC address as a short string without colons.
    Caches the result for improved performance on subsequent calls."""
    global _mac_address

    if _mac_address is not None:
        return _mac_address

    try:
        wlan = _get_wlan()
        mac = wlan.config("mac")
        # Remove hex to save a marginal amount of bytes
        _mac_address = "".join("{:02x}".format(b) for b in mac)
        return _mac_address
    except Exception as e:
        print(f"Error getting MAC address: {e}")
        return None

def is_connected():
    """Checks if the device is connected to Wi-Fi."""
    wlan = _get_wlan()
    return wlan.isconnected()

async def connect_wifi(timeout_ms=5000):
    """Connects to the configured Wi-Fi network."""
    wlan = _get_wlan()

    if wlan.isconnected():
        return wlan.ifconfig()[0]

    start_time = ticks_ms()

    print(f"Connecting to Wi-Fi... {WIFI_SSID}")
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)

    while not wlan.isconnected():
        # Check if the connection attempt has timed out
        if ticks_diff(ticks_ms(), start_time) > timeout_ms:
            return None

        pico_led.toggle()
        await asyncio.sleep_ms(250)

    pico_led.on()
    pico_ip_addr = wlan.ifconfig()[0]

    print(f"Connected to Wi-Fi, our IP address is: {pico_ip_addr}")

    return pico_ip_addr
