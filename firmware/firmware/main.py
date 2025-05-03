import uasyncio as asyncio
import network
from drivers.picozero import pico_led

import tasks.adc_sampler
import tasks.data_transmission

async def main():
    print("Initialising drivers...")
    await tasks.data_transmission.init()
    await tasks.adc_sampler.init()

    print("Creating tasks...")
    sampler_task = asyncio.create_task(tasks.adc_sampler.task())
    sender_task = asyncio.create_task(tasks.data_transmission.task())

    print("Running tasks...")
    await asyncio.gather(sampler_task, sender_task)

if __name__ == "__main__":
    print("Starting main application...")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Program stopped by user.")
    except Exception as e:
        print(f"An error occurred: {e}")
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
