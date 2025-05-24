import gc
import sys

import drivers.adc_sampler
import drivers.button
import network
import tasks.data_processing
import tasks.data_transmission
import uasyncio as asyncio
from drivers.picozero import pico_led


async def main():
    print("Initialising drivers...")
    gc.enable()

    await drivers.button.init()
    await drivers.adc_sampler.init()

    print("Initializing data processing...")
    # This will start the data processing thread
    await tasks.data_processing.init()

    print("Creating tasks...")
    sender_task = asyncio.create_task(tasks.data_transmission.task())

    print("Running tasks...")
    # The main thread handles ADC reading and data transmission
    await sender_task


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
        tasks.data_processing.should_exit_program = True
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
        sys.exit(1)
