"""
Helper functions for various calculations.
"""

# power = 0.0161725x - 19.75297
POWER_A = 1.105

@micropython.native  # type: ignore  # noqa: F821
def calculate_energy(power_samples, time_interval: float):
    """Calculate energy using the trapezoidal rule for numerical integration.

    Args:
        power_samples: List of power values
        time_interval: Time interval between samples in seconds

    Returns:
        Total energy in joules (watt-seconds)
    """
    n = len(power_samples)
    if n == 0:
        return 0
    elif n == 1:
        return power_samples[0] * time_interval
    else:
        result = 0.5 * (power_samples[0] + power_samples[-1])
        for i in range(1, n - 1):
            result += power_samples[i]
        energy = result * time_interval

        return energy * POWER_A


@micropython.native  # type: ignore  # noqa: F821
def find_peak(values_array, *corresponding_arrays):
    """
    Find the peak value in an array and corresponding values from other arrays.

    Args:
        values_array: The array to find the peak value in
        corresponding_arrays: Other arrays to extract corresponding values from

    Returns:
        A tuple containing (peak_value, [corresponding_values])
    """
    if not values_array:
        return 0, [0] * len(corresponding_arrays)

    peak_index: int = 0
    peak_value: float = values_array[0]

    for i in range(1, len(values_array)):
        if values_array[i] > peak_value:
            peak_index = i
            peak_value = values_array[i]

    corresponding_values = [arr[peak_index] for arr in corresponding_arrays]
    return peak_value, corresponding_values
