"""
Helper functions for various calculations.
"""


@micropython.native  # type: ignore  # noqa: F821
def calculate_energy(power_samples, time_interval: float):
    """Calculate energy using Simpson's rule for numerical integration.

    Args:
        power_samples: List of power values
        time_interval: Time interval between samples in seconds

    Returns:
        Total energy in joules (watt-seconds)
    """
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
        result: float = calculate_energy(power_samples[:-1], time_interval)
        # Add trapezoidal rule for the last interval
        result += (power_samples[-2] + power_samples[-1]) * time_interval / 2
        return result


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
