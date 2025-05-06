import time

import drivers.flash_storage
import uasyncio as asyncio
from drivers.adc_sampler import (
    MEASUREMENT_FRAME_SIZE,
    SAMPLE_PERIOD_MS,
    adc_ring_buffer,
)
from lib.calculations import calculate_energy, find_peak
from lib.calibration import calculate_power, calibrate_current, calibrate_voltage
from lib.packer import (
    PROCESSED_FRAME_SIZE,
    pack_processed_float_data,
    unpack_voltage_current_measurement,
)
from lib.ringbuf_queue import RingbufQueue

PACKET_INTERVAL_MS = 500
CHUNK_SIZE = int(PACKET_INTERVAL_MS / SAMPLE_PERIOD_MS)

PROCESSED_BUFFER_MAX_DATA = 60
# Processed data buffer
processed_ring_buffer = RingbufQueue(PROCESSED_BUFFER_MAX_DATA)
processed_ring_buffer_data = bytearray(PROCESSED_FRAME_SIZE)

# Buffer for accumulating samples until we have enough to process
accumulated_measurements = []

start_time = time.ticks_ms()

session_id: int = drivers.flash_storage.get_next_session_id()
measurement_id: int = 0


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

            await processed_ring_buffer.put(processed_ring_buffer_data)

            print(
                f"Processed {CHUNK_SIZE} samples | E: {energy:.2f}J | "
                + f"Avg V: {avg_voltage:.2f}V, I: {avg_current:.2f}A, P: {avg_power:.2f}W | "
                + f"Peak V: {peak_voltage:.2f}V, I: {peak_current:.2f}A, P: {peak_power:.2f}W"
            )
