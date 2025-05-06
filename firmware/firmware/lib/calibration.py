# Calibration constants
VOLTAGE_SCALE = 3.3 / 65535
CURRENT_SCALE = 3.3 / 65535
VOLTAGE_OFFSET = 0
CURRENT_OFFSET = 0


@micropython.native  # type: ignore  # noqa: F821
def calibrate_voltage(raw_value):
    """
    Apply calibration to a raw voltage value.
    """
    return raw_value * VOLTAGE_SCALE + VOLTAGE_OFFSET


@micropython.native  # type: ignore  # noqa: F821
def calibrate_current(raw_value):
    """
    Apply calibration to a raw current value.
    """
    return raw_value * CURRENT_SCALE + CURRENT_OFFSET


@micropython.native  # type: ignore  # noqa: F821
def calculate_power(voltage, current):
    """
    Calculate power from voltage and current
    """
    return voltage * current
