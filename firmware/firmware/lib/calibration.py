# Calibration constants to fix errata in the RP2040 ADC from non linearities in integral non linearity (INL) and differential non linearity (DNL)

# voltage = 0.0161725x-19.75297
VOLTAGE_A = 0.0161725
VOLTAGE_B = -19.753

# current = \left(7.30061\times10^{-14}\right)x^{4}-\left(2.07346\times10^{-10}\right)x^{3}+\left(1.64498\times10^{-7}\right)x^{2}+0.00189667x-0.0232733
CURRENT_A = 7.30061e-14
CURRENT_B = -2.07346e-10
CURRENT_C = 1.64498e-7
CURRENT_D = 0.00189667
CURRENT_E = -0.0233

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
    scaled = (VOLTAGE_A * x) + (VOLTAGE_B)

    return scaled


@micropython.native  # type: ignore  # noqa: F821
def calibrate_current(raw_value):
    """
    Apply calibration to a raw current value.
    """
    x = correct_adc_value(raw_value)
    scaled = (
        CURRENT_A * x**4
        + CURRENT_B * x**3
        + CURRENT_C * x**2
        + CURRENT_D * x
        + CURRENT_E
    )

    return scaled


@micropython.native  # type: ignore  # noqa: F821
def calculate_power(voltage, current):
    """
    Calculate power from voltage and current
    """
    return voltage * current
