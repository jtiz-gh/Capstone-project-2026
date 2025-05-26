import rp2
from lib.packer import pack_timestamp, pack_voltage_current_measurement
from lib.threadsafe.threadsafe_queue import ThreadSafeQueue
from machine import ADC, Pin

ADC_VOLTAGE_PIN = 26
ADC_CURRENT_PIN = 28

MEASUREMENT_FRAME_SIZE = 2 + 2
TIMESTAMP_FRAME_SIZE = 4

CHUNK_SIZE = 10

SAMPLE_PERIOD_MS = 5

# We try to clear the buffer every CHUNK_SIZE samples
MEASUREMENT_BUFFER_MAX_SAMPLES = 100
# We store timestamps for each CHUNK_SIZE measurements
TIMESTAMP_BUFFER_MAX = 30

# Queue with ADC measurements
adc_queue = ThreadSafeQueue(
    [bytearray(MEASUREMENT_FRAME_SIZE) for _ in range(MEASUREMENT_BUFFER_MAX_SAMPLES)]
)
adc_ring_buffer_data = bytearray(MEASUREMENT_FRAME_SIZE)

# Timestamp buffer for more accurate timing
timestamp_queue = ThreadSafeQueue(
    [bytearray(TIMESTAMP_FRAME_SIZE) for _ in range(TIMESTAMP_BUFFER_MAX)]
)
timestamp_buffer_data = bytearray(TIMESTAMP_FRAME_SIZE)

adc_voltage: ADC
adc_current: ADC

# Counter to track when to push a timestamp
sample_counter = 0

# True = voltage, False = current
sample_state = True
voltage_raw = 0


# Note: This noqa affects the whole file, it won't be checked for errors
# ruff: noqa: F821
@rp2.asm_pio()
def clock_200hz():
    # Total cycle = 5 cycles for 400Hz @ 2000Hz clock
    # 1 + 3 = 4 cycles
    nop()[3]  # type: ignore
    # 1 cycle
    irq(rel(0))  # type: ignore


def blackbox(value):
    pass


@micropython.viper  # type: ignore  # noqa: F821
def adc_pio_irq_callback(pio):  # Renamed and changed parameter
    global \
        adc_queue, \
        adc_ring_buffer_data, \
        timestamp_queue, \
        timestamp_buffer_data, \
        sample_counter, \
        sample_state, \
        voltage_raw

    if sample_state:
        # Sample voltage

        # Get 12-bit ADC values from 16-bit ADC
        # Take a reading and discard the value
        blackbox(adc_voltage.read_u16())
        blackbox(adc_voltage.read_u16())
        blackbox(adc_voltage.read_u16())

        voltage_raw: uint = (  # type: ignore
            (uint(adc_voltage.read_u16()) >> 4) + (uint(adc_voltage.read_u16()) >> 4)  # type: ignore
        ) >> 1
    else:
        # Sample current

        blackbox(adc_current.read_u16())
        blackbox(adc_current.read_u16())
        blackbox(adc_current.read_u16())

        current_raw: uint = (  # type: ignore
            (uint(adc_current.read_u16()) >> 4) + (uint(adc_current.read_u16()) >> 4)  # type: ignore
        ) >> 1

        pack_voltage_current_measurement(adc_ring_buffer_data, voltage_raw, current_raw)

        # Use a new buffer for each measurement to avoid overwrites
        buffer_copy = bytearray(adc_ring_buffer_data)
        adc_queue.put_sync(buffer_copy)

        # Increment the sample counter
        sample_counter = uint(sample_counter) + uint(1)  # type: ignore

        # Push a timestamp after every CHUNK_SIZE samples
        if sample_counter >= CHUNK_SIZE:
            sample_counter = 0
            pack_timestamp(timestamp_buffer_data)
            # Use a new buffer for each timestamp to avoid overwrites
            ts_buffer_copy = bytearray(timestamp_buffer_data)
            timestamp_queue.put_sync(ts_buffer_copy)

    sample_state = not sample_state  # Toggle state


async def init():
    """Set up ADC pins and state machine for timer on PIO to avoid wasting CPU time for software timers."""
    global adc_voltage, adc_current
    print(
        f"Initializing ADC Voltage (Pin {ADC_VOLTAGE_PIN}) and Current (Pin {ADC_CURRENT_PIN})."
    )

    adc_voltage = ADC(Pin(ADC_VOLTAGE_PIN, Pin.IN))
    adc_current = ADC(Pin(ADC_CURRENT_PIN, Pin.IN))

    sm = rp2.StateMachine(0, clock_200hz, freq=2000)  # type: ignore
    rp2.PIO(0).irq(adc_pio_irq_callback)

    sm.active(1)
