# Calibration constants to fix errata in the RP2040 ADC from non linearities in integral non linearity (INL) and differential non linearity (DNL)
USE_RAW = False

VOLTAGE_A = 0.0161875
VOLTAGE_B = -19.62771

CURRENT_A = 0.00192227
CURRENT_B = -0.0176718

# Delta percentages from https://pico-adc.markomo.me/INL-DNL/#why-does-the-dnl-spike
rp2040_adc_correction_factors = [
    1.0000,  # Bit 1 (MSB)
    1.0000,  # Bit 2
    1.0083,  # Bit 3
    1 - 0.0084,  # Bit 4
    1 - 0.0085,  # Bit 5
    1 - 0.0084,  # Bit 6
    1 - 0.0084,  # Bit 7
    1 - 0.0084,  # Bit 8
    1 - 0.0086,  # Bit 9
    1 - 0.0071,  # Bit 10
    1 - 0.0070,  # Bit 11
    1 - 0.0073,  # Bit 12 (LSB)
]


# Corrects DNL behaviour of the ADC
@micropython.native  # type: ignore  # noqa: F821
def correct_adc_value(adc_12bit):
    corrected = 0

    for i in range(12):
        bit = (adc_12bit >> (11 - i)) & 0x1
        corrected += bit * (2 ** (11 - i)) * rp2040_adc_correction_factors[i]

    return corrected


@micropython.native  # type: ignore  # noqa: F821
def calibrate_voltage(raw_value):
    """
    Apply calibration to a raw voltage value.
    """
    x = correct_adc_value(raw_value)

    if USE_RAW:
        return x

    return (VOLTAGE_A * x) + VOLTAGE_B


@micropython.native  # type: ignore  # noqa: F821
def calibrate_current(raw_value):
    """
    Apply calibration to a raw current value.
    """
    x = correct_adc_value(raw_value)

    if USE_RAW:
        return x

    scaled = (CURRENT_A * x) + CURRENT_B

    return scaled


@micropython.native  # type: ignore  # noqa: F821
def calculate_power(voltage, current):
    """
    Calculate power from voltage and current
    """
    return voltage * current
