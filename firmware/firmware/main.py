import sys

import drivers.adc_sampler
import drivers.wlan
import network
import tasks.data_processing
import tasks.data_transmission
import uasyncio as asyncio
from drivers.picozero import pico_led


async def main():
    print("Initialising drivers...")
    await drivers.adc_sampler.init()
    await drivers.wlan.connect_wifi()

    await tasks.data_transmission.init()
    await tasks.data_processing.init()

    print("Creating tasks...")
    processor_task = asyncio.create_task(tasks.data_processing.task())
    sender_task = asyncio.create_task(tasks.data_transmission.task())

    print("Running tasks...")
    await asyncio.gather(processor_task, sender_task)


if __name__ == "__main__":
    print("Starting main application...")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Program stopped by user.")
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.print_exception(e)
    finally:
        print("Performing cleanup...")
        try:
            wlan_interface = network.WLAN(network.STA_IF)
            if wlan_interface.isconnected():
                wlan_interface.disconnect()
            wlan_interface.active(False)
            print("Wi-Fi disconnected.")
        except Exception as e:
            print(f"Error during Wi-Fi cleanup: {e}")
        pico_led.off()
        print("Cleanup complete.")
