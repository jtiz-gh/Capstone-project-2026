import rp2
from machine import ADC
from micropython import RingIO
from lib.packer import pack_voltage_current_measurement

# TODO: Replace with actual ADC pins
ADC_VOLTAGE_PIN = 27
ADC_CURRENT_PIN = 28

MEASUREMENT_FRAME_SIZE = 2 + 2

SAMPLE_PERIOD_MS = 4

# We try to clear the buffer every 125 samples
MEASUREMENT_BUFFER_MAX_SAMPLES = 250

# RingIO needs 1 extra byte
adc_ring_buffer = RingIO(MEASUREMENT_FRAME_SIZE * MEASUREMENT_BUFFER_MAX_SAMPLES + 1)
adc_ring_buffer_data = bytearray(MEASUREMENT_FRAME_SIZE)

adc_voltage: ADC
adc_current: ADC


# Note: This noqa affects the whole file, it won't be checked for errors
# ruff: noqa: F821
@rp2.asm_pio()
def clock_250hz():
    # Total cycle = 8 cycles for 250Hz @ 2000Hz clock
    # 1 + 6 = 7 cycles
    nop()[6]  # type: ignore
    # 1 cycle
    irq(rel(0))  # type: ignore


@micropython.viper  # type: ignore  # noqa: F821
def adc_pio_irq_callback(pio):  # Renamed and changed parameter
    global adc_ring_buffer, adc_ring_buffer_data

    voltage_raw: uint = uint(adc_voltage.read_u16())  # type: ignore
    current_raw: uint = uint(adc_current.read_u16())  # type: ignore

    pack_voltage_current_measurement(adc_ring_buffer_data, voltage_raw, current_raw)

    adc_ring_buffer.write(adc_ring_buffer_data)


async def init():
    """Set up ADC pins and state machine for timer on PIO to avoid wasting CPU time for software timers."""
    global adc_voltage, adc_current
    print(
        f"Initializing ADC Voltage (Pin {ADC_VOLTAGE_PIN}) and Current (Pin {ADC_CURRENT_PIN})."
    )
    adc_voltage = ADC(ADC_VOLTAGE_PIN)
    adc_current = ADC(ADC_CURRENT_PIN)

    sm = rp2.StateMachine(0, clock_250hz, freq=2000)  # type: ignore
    rp2.PIO(0).irq(adc_pio_irq_callback)

    sm.active(1)
