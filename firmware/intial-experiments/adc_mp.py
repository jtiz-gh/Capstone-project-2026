from machine import ADC, Pin
import time
import ujson
import ubinascii

# Set the number of arrays along with how many buffer arrays we require
num_array = 12
array_size = 5

# Calculate the sampling rate using array size and number of arrays
sampling_rate = 60 / (num_array * array_size)  # in seconds

# Create different packets to send data in stages rather than all at once
adc_data = [[{} for _ in range(array_size)] for _ in range(num_array)]
current_array = 0
current_index = 0

# Initialize ADC on Pin 26 (GPIO26)
adc = ADC(Pin(26))

# initial session id if we want to later think about the different sessions
session_id = int(time.ticks_ms())


# calculate CRC32 checksum
def calculate_crc32(json_data):
    return ubinascii.crc32(json_data)


# the function stores adc_value, along with a timestamp in a packet. that packet is then stored
# with its checksum into a new packet.
def store_adc_value(adc_value, timestamp):
    # populate 1 array
    global current_array, current_index
    adc_data[current_array][current_index] = {
        "timestamp": timestamp,
        "voltage": round(adc_value, 4),
    }
    current_index += 1

    # if array is full then create a packet
    if current_index == array_size:
        packet = {"chunk_id": current_array, "measurements": current_array}

        json_str = ujson.dumps(packet)
        checksum = calculate_crc32(json_str)

        # final packet storing the of packet along with its checksum
        full_packet = {"data": packet, "crc32": checksum}
        # for value in adc_data[current_array]:
        #     print("{:.4f}".format(value), end=' ')
        # print()

        # simulating sending data (WOULD NEED TO BE UPDATED)
        print(ujson.dumps(full_packet))

        # Move on to the next array to store the data
        current_array = (current_array + 1) % num_array
        current_index = 0


def main():
    print("ADC connection secured")

    adc_index = 0
    total_samples = num_array * array_size

    while adc_index < total_samples:
        adc_raw_V = adc.read_u16()  # 16-bit value (0 to 65535)
        voltage = (adc_raw_V / 65535) * 3.3  # Scale to 3.3V
        timestamp = time.ticks_ms()

        # checking data is being read properly (WOULD NEED TO BE CHANGED IN FINAL IMPLIMENTATION)
        print(
            "The current voltage is: {:.4f}V at the time: {}".format(voltage, timestamp)
        )
        store_adc_value(voltage, timestamp)
        adc_index += 1
        time.sleep(sampling_rate)


if __name__ == "__main__":
    main()
