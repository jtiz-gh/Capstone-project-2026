import time
import _thread
import drivers.flash_storage
import uasyncio as asyncio
from lib.threadsafe.threadsafe_queue import ThreadSafeQueue
from drivers.adc_sampler import (
    CHUNK_SIZE,
    SAMPLE_PERIOD_MS,
    adc_queue,
    timestamp_queue,
)
from lib.calculations import calculate_energy, find_peak
from lib.calibration import calculate_power, calibrate_current, calibrate_voltage
from lib.packer import (
    PROCESSED_FRAME_SIZE,
    pack_processed_float_data,
    unpack_timestamp,
    unpack_voltage_current_measurement,
)

# Should be the same as STREAMING_BATCH_SIZE
PROCESSED_BUFFER_MAX_DATA = 10
# Processed data buffer
processed_queue = ThreadSafeQueue(
    [bytearray(PROCESSED_FRAME_SIZE) for _ in range(PROCESSED_BUFFER_MAX_DATA)]
)
processed_ring_buffer_data = bytearray(PROCESSED_FRAME_SIZE)

# Buffer for accumulating samples until we have enough to process
accumulated_measurements = []

session_id: int = drivers.flash_storage.get_next_session_id()

start_time = time.ticks_ms()


async def init():
    # Start the data processing thread
    _thread.start_new_thread(
        process_data_thread, (adc_queue, timestamp_queue, processed_queue)
    )

# TODO: Attempt to use Viper to speed up this function
def process_data_thread(adc_queue, timestamp_queue, processed_queue):
    """Process data from the ADC buffer in a separate thread."""

    measurement_id: int = 0
    accumulated_measurements = []

    print("Data Processing thread started.")

    while True:
        # Check if we have data in the ADC queue
        if adc_queue.qsize() > 0:
            try:
                # Get the measurement from the queue
                frame_data = adc_queue.get_sync(block=False)
                voltage_raw, current_raw = unpack_voltage_current_measurement(
                    frame_data
                )
                accumulated_measurements.append((voltage_raw, current_raw))
            except IndexError:
                # Queue was empty
                time.sleep_ms(1)
                continue

        # Process in chunks of CHUNK_SIZE samples when we have enough data
        if len(accumulated_measurements) >= CHUNK_SIZE:
            # Try to get timestamp from the timestamp queue
            timestamp = None
            if timestamp_queue.qsize() > 0:
                try:
                    timestamp_buffer = timestamp_queue.get_sync(block=False)
                    timestamp = unpack_timestamp(timestamp_buffer)
                except IndexError:
                    # No timestamp available
                    print("Warning: No timestamp available, using fallback")
                    timestamp = time.ticks_ms() - start_time
            else:
                # No timestamp available
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

            # Pack processed data packet with timestamp
            processed_buffer = bytearray(PROCESSED_FRAME_SIZE)
            pack_processed_float_data(
                # Buffer
                processed_buffer,
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

            # Add to processed queue
            processed_queue.put_sync(processed_buffer)

            print(
                f"Processed {CHUNK_SIZE} samples | E: {energy:.2f}J | "
                + f"Avg V: {avg_voltage:.2f}V, I: {avg_current:.2f}A, P: {avg_power:.2f}W | "
                + f"Peak V: {peak_voltage:.2f}V, I: {peak_current:.2f}A, P: {peak_power:.2f}W"
            )
        else:
            # Not enough samples yet, sleep a bit to avoid hogging the CPU
            time.sleep_ms(1)
