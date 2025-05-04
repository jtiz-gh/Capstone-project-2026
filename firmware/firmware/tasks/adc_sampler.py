import struct

import machine
import rp2
import asyncio
from micropython import RingIO

# TODO: Replace with actual ADC pins
ADC_VOLTAGE_PIN = 27
ADC_CURRENT_PIN = 28

FRAME_SIZE = 2 + 2

BUFFER_MAX_SIZE = FRAME_SIZE * 30

SAMPLE_PERIOD_MS = 10

# RingIO needs 1 extra byte
adc_ring_buffer = RingIO(FRAME_SIZE * BUFFER_MAX_SIZE + 1)

adc_voltage = None
adc_current = None

adc_buffer = []
buffer_lock = asyncio.Lock()


# Note: This noqa affects the whole file, it won't be checked for errors
# ruff: noqa: F821
@rp2.asm_pio()
def clock_100hz():
    # Total cycle = 20 cycles for 100Hz @ 2000Hz clock
    # High phase: 10 cycles (1 + 9 = 10 cycles)
    # 1 cycle
    set(pins, 1)  # type: ignore
    # 1 + 8 = 9 cycles
    nop()[8]  # type: ignore

    # Low phase: 10 cycles (1 + 8 + 1 = 10 cycles)
    label("low_phase")  # type: ignore
    # 1 cycle
    set(pins, 0)  # type: ignore
    # 1 + 7 = 8 cycles
    nop()[7]  # type: ignore
    # 1 cycle
    irq(rel(0))  # type: ignore


def adc_pio_irq_callback(sm):  # Renamed and changed parameter
    global adc_ring_buffer, adc_voltage, adc_current
    if adc_voltage is None or adc_current is None:
        return

    voltage_raw = adc_voltage.read_u16()
    current_raw = adc_current.read_u16()

    try:
        frame_data = struct.pack("<HH", voltage_raw, current_raw)
        adc_ring_buffer.write(frame_data)
    except Exception as e:
        print("Error in PIO IRQ callback:", e)


async def init():
    """Set up ADC pins and state machine for timer on PIO to avoid wasting CPU time for software timers."""
    global adc_voltage, adc_current
    print(
        f"Initializing ADC Voltage (Pin {ADC_VOLTAGE_PIN}) and Current (Pin {ADC_CURRENT_PIN})."
    )
    adc_voltage = machine.ADC(ADC_VOLTAGE_PIN)
    adc_current = machine.ADC(ADC_CURRENT_PIN)

    sm = rp2.StateMachine(0, clock_100hz, freq=2000)  # type: ignore
    rp2.PIO(0).irq(adc_pio_irq_callback)
    sm.active(1)


async def task():
    """Handles reading from the ADC interrupt and storing data in a ring buffer."""
    global adc_buffer, adc_ring_buffer, buffer_lock
    print("ADC Sampler task (ring buffer reader) started.")

    sreader = asyncio.StreamReader(adc_ring_buffer)

    while True:
        await asyncio.sleep_ms(int(SAMPLE_PERIOD_MS / 2))

        try:
            frame_data = await sreader.readexactly(FRAME_SIZE)
            voltage_raw, current_raw = struct.unpack("<HH", frame_data)

            async with buffer_lock:
                if len(adc_buffer) >= BUFFER_MAX_SIZE:
                    adc_buffer.pop(0)

                adc_buffer.append((voltage_raw, current_raw))
        except Exception as e:
            print(f"Error in adc_sampler reading/unpacking: {e}")
