import time

import drivers.flash_storage
import uasyncio as asyncio
from drivers.adc_sampler import (
    CHUNK_SIZE,
    MEASUREMENT_FRAME_SIZE,
    SAMPLE_PERIOD_MS,
    TIMESTAMP_FRAME_SIZE,
    adc_ring_buffer,
    timestamp_ring_buffer,
)
from lib.calculations import calculate_energy, find_peak
from lib.calibration import calculate_power, calibrate_current, calibrate_voltage
from lib.packer import (
    PROCESSED_FRAME_SIZE,
    pack_processed_float_data,
    unpack_timestamp,
    unpack_voltage_current_measurement,
)
from lib.ringbuf_queue import RingbufQueue

# Should be the same as STREAMING_BATCH_SIZE
PROCESSED_BUFFER_MAX_DATA = 10
# Processed data buffer
processed_ring_buffer = RingbufQueue(PROCESSED_BUFFER_MAX_DATA)
processed_ring_buffer_data = bytearray(PROCESSED_FRAME_SIZE)

# Buffer for accumulating samples until we have enough to process
accumulated_measurements = []

session_id: int = drivers.flash_storage.get_next_session_id()
measurement_id: int = 0

start_time = time.ticks_ms()


async def init():
    pass


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
    timestamp_reader = asyncio.StreamReader(timestamp_ring_buffer)
    timestamp_buffer = bytearray(TIMESTAMP_FRAME_SIZE)

    while True:
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
            # Get timestamp from the timestamp queue
            try:
                timestamp_buffer = await timestamp_reader.readexactly(
                    TIMESTAMP_FRAME_SIZE
                )
                timestamp = unpack_timestamp(timestamp_buffer)
            except EOFError:
                # If no timestamp is available, use a fallback (less accurate)
                print("Warning: No timestamp available, using fallback")
                timestamp = time.ticks_ms() - start_time

            samples_to_process = accumulated_measurements[:CHUNK_SIZE]
            accumulated_measurements = accumulated_measurements[CHUNK_SIZE:]

            # Preallocate lists for performance
            voltages = [0] * CHUNK_SIZE
            currents = [0] * CHUNK_SIZE
            power_samples = [0] * CHUNK_SIZE

            for i, (voltage_raw, current_raw) in enumerate(samples_to_process):
                voltages[i] = calibrate_voltage(voltage_raw)
                currents[i] = calibrate_current(current_raw)
                power_samples[i] = calculate_power(voltages[i], currents[i])

            avg_voltage = sum(voltages) / len(voltages) if voltages else 0
            avg_current = sum(currents) / len(currents) if currents else 0
            avg_power = sum(power_samples) / len(power_samples) if power_samples else 0

            # Find peak power and corresponding voltage/current
            peak_power, (peak_voltage, peak_current) = find_peak(
                power_samples, voltages, currents
            )

            time_interval = float(SAMPLE_PERIOD_MS) / 1000
            energy = calculate_energy(power_samples, time_interval)

            # Pack processed data packet with timestamp from ISR
            pack_processed_float_data(
                # Buffer
                processed_ring_buffer_data,
                # Metadata
                timestamp,
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

            await processed_ring_buffer.put(processed_ring_buffer_data)

            print(
                f"Processed {CHUNK_SIZE} samples | E: {energy:.2f}J | "
                + f"Avg V: {avg_voltage:.2f}V, I: {avg_current:.2f}A, P: {avg_power:.2f}W | "
                + f"Peak V: {peak_voltage:.2f}V, I: {peak_current:.2f}A, P: {peak_power:.2f}W"
            )
