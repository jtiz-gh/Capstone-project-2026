from machine import ADC, Pin
import time

# Define ADC pins
ADC_VOLTAGE_PIN = 26
ADC_CURRENT_PIN = 27


def adc_init():
    """
    Initializes the ADC on the hardcoded voltage and current pins.

    Returns:
        tuple: A tuple containing the initialized ADC instances (adc_voltage_instance, adc_current_instance).
    """
    adc_voltage_pin = Pin(ADC_VOLTAGE_PIN)
    adc_current_pin = Pin(ADC_CURRENT_PIN)
    adc_voltage_instance = ADC(adc_voltage_pin)
    adc_current_instance = ADC(adc_current_pin)
    print(
        f"ADC initialized on GP{ADC_VOLTAGE_PIN} (Voltage) and GP{ADC_CURRENT_PIN} (Current)"
    )
    return adc_voltage_instance, adc_current_instance


def read_adc_burst(
    adc_voltage_instance, adc_current_instance, num_readings=100, duration_s=0.1
):
    """
    Takes a specified number of ADC readings for both voltage and current over a given duration,
    using the provided ADC instances.

    Args:
        adc_voltage_instance: The initialized ADC instance for voltage.
        adc_current_instance: The initialized ADC instance for current.
        num_readings (int): The number of readings to take for each channel. Defaults to 100.
        duration_s (int): The total duration in seconds over which to take readings. Defaults to 1.

    Returns:
        tuple: A tuple containing two lists: (voltage_readings, current_readings).
    """
    voltage_readings = []
    current_readings = []
    interval_us = int((duration_s * 1_000_000) / num_readings)

    start_time = time.ticks_us()
    for i in range(num_readings):
        adc_raw_voltage = adc_voltage_instance.read_u16()
        voltage = (adc_raw_voltage / 65535) * 3.3
        voltage_readings.append(round(voltage, 4))

        adc_raw_current = adc_current_instance.read_u16()
        # Assuming a similar scaling for current for now, adjust if needed based on sensor/circuit
        current = (adc_raw_current / 65535) * 3.3  # Placeholder scaling
        current_readings.append(round(current, 4))

        current_time = time.ticks_us()

        next_reading_pair_end_time = start_time + (i + 1) * interval_us

        sleep_needed_us = time.ticks_diff(next_reading_pair_end_time, current_time)

        if sleep_needed_us > 0:
            time.sleep_us(sleep_needed_us)

    return voltage_readings, current_readings
