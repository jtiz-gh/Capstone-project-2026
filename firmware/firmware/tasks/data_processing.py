# TODO: Process the data from the ADC buffer into a smaller, more manageable chunks
# ADC (adc_handler) -> DSP / digital signal processing (data_processing) -> Data transmission (data_transmission)
# Calculate (from raw ADC readings):
# - Corrected values (using lookup table or quadratic interpolation calibration curve):
#   - Corrected voltage
#   - Corrected current
#
# - Average corrected values:
#   - Average voltage
#   - Average current
#
# - Peak instantaneous power
#   - Current at peak power
#   - Voltage at peak power
#
# - Energy