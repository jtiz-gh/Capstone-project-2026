import time

import drivers.flash_storage
import drivers.wlan
import lib.http
import rp2
import uasyncio as asyncio
from drivers.picozero import pico_led

NOTIFICATION_PATH = "api/notification"


async def init():
    try_send = False
    server_ip = None

    pico_led.on()

    time.sleep(1)

    if rp2.bootsel_button():
        print("BOOTSEL button pressed")
        try_send = True
    else:
        print("BOOTSEL button not pressed")

    if try_send:
        # Flash LED very quickly for 3 seconds
        for _ in range(5):
            pico_led.on()
            await asyncio.sleep_ms(75)
            pico_led.off()
            await asyncio.sleep_ms(75)

    # Check if button is still held
    try_send = rp2.bootsel_button() == 1

    while try_send:
        # Try connecting to the network
        if not drivers.wlan.is_connected():
            wifi_ip = await drivers.wlan.connect_wifi()
            if wifi_ip:
                print(f"Wi-Fi connected with IP: {wifi_ip}")

        if drivers.wlan.is_connected() and not lib.http.has_server_ip():
            # Try to discover server
            server_ip = await lib.http.try_discover_server_ip_wrapper()

        if server_ip is not None:
            await lib.http.post_json_data(
                NOTIFICATION_PATH,
                server_ip,
                {
                    "message": drivers.flash_storage.get_pico_id(),
                },
            )

            while True:
                pico_led.on()
                await asyncio.sleep_ms(2000)
                pico_led.off()
                await asyncio.sleep_ms(2000)
