import time

import drivers.flash_storage
import uasyncio as asyncio
from drivers.adc_sampler import (
    MEASUREMENT_FRAME_SIZE,
    SAMPLE_PERIOD_MS,
    adc_ring_buffer,
)
from micropython import RingIO
from util.packer import (
    PROCESSED_FRAME_SIZE,
    pack_processed_float_data,
    unpack_voltage_current_measurement,
)

PACKET_INTERVAL_MS = 500
CHUNK_SIZE = int(PACKET_INTERVAL_MS / SAMPLE_PERIOD_MS)

# TODO: Calibration coefficients (replace with actual calibration values)
VOLTAGE_SCALE = 3.3 / 65535
CURRENT_SCALE = 3.3 / 65535
VOLTAGE_OFFSET = 0
CURRENT_OFFSET = 0

PROCESSED_BUFFER_MAX_DATA = 60
# Processed data buffer
processed_ring_buffer = RingIO(PROCESSED_FRAME_SIZE * PROCESSED_BUFFER_MAX_DATA + 1)
processed_ring_buffer_data = bytearray(PROCESSED_FRAME_SIZE)

# Buffer for accumulating samples until we have enough to process
accumulated_measurements = []

start_time = time.ticks_ms()

session_id: int = drivers.flash_storage.get_next_session_id()
measurement_id: int = 0


async def init():
    """Initialize data processing task."""
    print("Initializing data processing...")
    # No specific initialization needed at this time
    pass


@micropython.viper  # type: ignore  # noqa: F821
def apply_calibration(raw_value, scale, offset):
    """Apply calibration to raw ADC values."""
    return (raw_value * scale) + offset


@micropython.viper  # type: ignore  # noqa: F821
def calculate_power(voltage, current):
    """Calculate instantaneous power."""
    return voltage * current


@micropython.native  # type: ignore  # noqa: F821
def calculate_energy(power_samples):
    """Calculate energy using Simpson's rule for numerical integration.

    Args:
        power_samples: List of power values
        time_interval: Time interval between samples in seconds

    Returns:
        Total energy in joules (watt-seconds)
    """
    time_interval: float = float(SAMPLE_PERIOD_MS) / 1000

    n = len(power_samples)
    if n < 3:
        # Not enough points for Simpson's rule, use trapezoidal rule instead
        if n == 2:
            return (power_samples[0] + power_samples[1]) * time_interval / 2
        elif n == 1:
            return power_samples[0] * time_interval
        else:
            return 0

    # Simpson's rule for integration
    # For odd number of intervals (even number of points)
    if n % 2 == 1:
        result: float = power_samples[0] + power_samples[-1]

        # Add 4 times the odd-indexed points
        for i in range(1, n, 2):
            result += 4 * power_samples[i]

        # Add 2 times the even-indexed points (excluding first and last)
        for i in range(2, n - 1, 2):
            result += 2 * power_samples[i]

        return result * time_interval / 3
    else:
        # For even number of intervals, use composite Simpson's rule
        # Use Simpson's rule for all but the last interval, then use trapezoidal rule for the last interval
        result: float = calculate_energy(power_samples[:-1])
        # Add trapezoidal rule for the last interval
        result += (power_samples[-2] + power_samples[-1]) * time_interval / 2
        return result


# TODO: Attempt to use Viper to speed up this function
async def task():
    """Process data from the ADC buffer."""
    global \
        processed_ring_buffer, \
        processed_ring_buffer_data, \
        accumulated_measurements, \
        measurement_id

    print("Data Processing task started.")

    sreader = asyncio.StreamReader(adc_ring_buffer)

    while True:
        await asyncio.sleep_ms(0)

        # Read from ADC until we have at least CHUNK_SIZE samples
        while len(accumulated_measurements) < CHUNK_SIZE:
            try:
                frame_data = await sreader.readexactly(MEASUREMENT_FRAME_SIZE)
                voltage_raw, current_raw = unpack_voltage_current_measurement(
                    frame_data
                )

                accumulated_measurements.append((voltage_raw, current_raw))
            except EOFError:
                pass

        # Process in chunks of CHUNK_SIZE samples until we have less than CHUNK_SIZE samples left
        while len(accumulated_measurements) >= CHUNK_SIZE:
            samples_to_process = accumulated_measurements[:CHUNK_SIZE]
            accumulated_measurements = accumulated_measurements[CHUNK_SIZE:]

            # Preallocate lists for performance
            voltages = [0] * CHUNK_SIZE
            currents = [0] * CHUNK_SIZE
            power_samples = [0] * CHUNK_SIZE

            for voltage_raw, current_raw in samples_to_process:
                voltage = apply_calibration(voltage_raw, VOLTAGE_SCALE, VOLTAGE_OFFSET)
                current = apply_calibration(current_raw, CURRENT_SCALE, CURRENT_OFFSET)

                voltages.append(voltage)
                currents.append(current)

                power = calculate_power(voltage, current)
                power_samples.append(power)

            avg_voltage = sum(voltages) / len(voltages) if voltages else 0
            avg_current = sum(currents) / len(currents) if currents else 0
            avg_power = sum(power_samples) / len(power_samples) if power_samples else 0

            # Find peak power and corresponding voltage/current
            if power_samples:
                peak_power_index = power_samples.index(max(power_samples))
                peak_power = power_samples[peak_power_index]
                peak_voltage = voltages[peak_power_index]
                peak_current = currents[peak_power_index]
            else:
                peak_power = peak_voltage = peak_current = 0

            energy = calculate_energy(power_samples)

            # Pack processed data packet
            pack_processed_float_data(
                # Buffer
                processed_ring_buffer_data,
                # Metadata
                time.ticks_ms() - start_time,
                session_id,
                measurement_id,
                # Data
                avg_voltage,
                avg_current,
                avg_power,
                peak_voltage,
                peak_current,
                peak_power,
                energy,
            )

            measurement_id += 1

            processed_ring_buffer.write(processed_ring_buffer_data)

            print(f"Processed {CHUNK_SIZE} samples.")
            print(
                f"Avg V: {avg_voltage:.4f}, Avg I: {avg_current:.4f}, Peak P: {peak_power:.4f}W, "
                f"Peak V: {peak_voltage:.4f}, Peak I: {peak_current:.4f}, Energy: {energy:.4f}J"
            )
