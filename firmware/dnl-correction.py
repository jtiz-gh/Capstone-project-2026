# Delta percentages from https://pico-adc.markomo.me/INL-DNL/#why-does-the-dnl-spike
deltas = [
    0.0000,  # Bit 1 (MSB)
    0.0000,  # Bit 2
    0.0083,  # Bit 3
    -0.0084,  # Bit 4
    -0.0085,  # Bit 5
    -0.0084,  # Bit 6
    -0.0084,  # Bit 7
    -0.0084,  # Bit 8
    -0.0086,  # Bit 9
    -0.0071,  # Bit 10
    -0.0070,  # Bit 11
    -0.0073,  # Bit 12 (LSB)
]

correction_factors = [1 + d for d in deltas]


# Corrects DNL behaviour of the ADC
def correct_adc_value(adc_12bit):
    corrected = 0
    for i in range(12):
        bit = (adc_12bit >> (11 - i)) & 0x1
        corrected += bit * (2 ** (11 - i)) * correction_factors[i]
    return corrected


input_file = "_voltage_results.log"
output_file = "_voltage_results_corrected.log"

with open(input_file, "r") as infile, open(output_file, "w") as outfile:
    for line in infile:
        if not line.strip():
            continue
        raw, actual = map(float, line.strip().split())
        raw_12bit = int(raw) >> 4
        corrected = correct_adc_value(raw_12bit)
        outfile.write(f"{corrected}\t{actual}\n")

print(f"Corrected values written to: {output_file}")
