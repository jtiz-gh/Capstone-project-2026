import time

import uasyncio as asyncio
from tasks.adc_sampler import SAMPLE_PERIOD_MS, adc_buffer, buffer_lock

# Processed data buffer
processed_data = []
processed_data_lock = asyncio.Lock()

PROCESS_INTERVAL_MS = 300
PACKET_INTERVAL_MS = 500
CHUNK_SIZE = int(PACKET_INTERVAL_MS / SAMPLE_PERIOD_MS)

# Calibration coefficients (replace with actual calibration values)
# These would typically be determined through calibration procedures
VOLTAGE_SCALE = 3.3 / 65535
CURRENT_SCALE = 3.3 / 65535
VOLTAGE_OFFSET = 0
CURRENT_OFFSET = 0

# Buffer for accumulating samples until we have enough to process
accumulated_samples = []

start_time = time.ticks_ms()


async def init():
    """Initialize data processing task."""
    print("Initializing data processing...")
    # No specific initialization needed at this time
    pass


@micropython.native  # type: ignore  # noqa: F821
def apply_calibration(raw_value, scale, offset):
    """Apply calibration to raw ADC values."""
    return (raw_value * scale) + offset


@micropython.native  # type: ignore  # noqa: F821
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


async def task():
    """Process data from the ADC buffer."""
    global processed_data, accumulated_samples
    print("Data Processing task started.")

    while True:
        await asyncio.sleep_ms(PROCESS_INTERVAL_MS)

        # Copy the ADC buffer and clear it
        current_adc_data = []
        async with buffer_lock:
            if len(adc_buffer) > 0:
                current_adc_data = list(adc_buffer)
                adc_buffer.clear()
            else:
                continue

        accumulated_samples.extend(current_adc_data)

        # Process in chunks of CHUNK_SIZE samples
        while len(accumulated_samples) >= CHUNK_SIZE:
            samples_to_process = accumulated_samples[:CHUNK_SIZE]
            accumulated_samples = accumulated_samples[CHUNK_SIZE:]

            voltages = []
            currents = []
            power_samples = []

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

            # Create processed data packet
            processed_packet = {
                # Time since program start in ms
                "timestamp": time.ticks_ms() - start_time,
                # Average values
                "avg_voltage": round(avg_voltage, 4),
                "avg_current": round(avg_current, 4),
                "avg_power": round(avg_power, 4),
                # Peak values
                "peak_power": round(peak_power, 4),
                "peak_voltage": round(peak_voltage, 4),
                "peak_current": round(peak_current, 4),
                # Energy
                "energy": round(energy, 4),
            }

            async with processed_data_lock:
                processed_data.append(processed_packet)

            print(f"Processed {CHUNK_SIZE} samples.")
            print(
                f"Avg V: {avg_voltage:.4f}, Avg I: {avg_current:.4f}, Peak P: {peak_power:.4f}W, "
                f"Peak V: {peak_voltage:.4f}, Peak I: {peak_current:.4f}, Energy: {energy:.4f}J"
            )

        if accumulated_samples:
            print(
                f"Waiting for more samples: {len(accumulated_samples)}/{CHUNK_SIZE} accumulated"
            )
