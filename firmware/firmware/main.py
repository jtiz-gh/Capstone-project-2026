from picozero import pico_led
from time import sleep_ms

from wlan import init_wlan, try_connect_to_wlan
from networking import try_discover_server_ip, is_server_online, post_json_data
from flash_storage import (
    update_config,
    read_config,
    get_next_session_id,
    write_measurements,
    read_measurements,
    delete_measurement_file,
)
from adc_driver import adc_init, read_adc_burst

wlan = init_wlan()


adc_voltage, adc_current = adc_init()

# Check if the script is being run directly or imported
if __name__ == "__main__":
    print("Starting main program...")

    pico_ip_address = try_connect_to_wlan(wlan, 10000)
    server_ip_address = None
    session_id = None
    next_chunk_id = 0

    if pico_ip_address:
        # Try using the last known server IP
        config = read_config()
        last_server_ip = config.get("last_server_ip")

        if last_server_ip:
            print(f"Found stored server IP: {last_server_ip}. Testing connection...")
            if is_server_online(last_server_ip):
                print("Stored server IP is valid.")
                server_ip_address = last_server_ip
            else:
                print("Stored server IP is not reachable.")

        # If no valid stored IP, try discovery
        if server_ip_address is None:
            print("Attempting server discovery...")
            server_ip_address = try_discover_server_ip(10000)

    if server_ip_address is None:
        print("Failed to discover server IP address.")
        pico_led.off()
    else:
        print(f"Main server IP address is {server_ip_address}")

        # Store the discovered IP address in flash
        update_config("last_server_ip", server_ip_address)
        pico_led.on()

        # Get a new session ID for this run
        session_id = get_next_session_id()
        print(f"Starting session ID: {session_id}")
        next_chunk_id = 0  # Start chunk numbering for this session

    # Main loop
    while True:
        # Read ADC values
        voltage_readings, current_readings = read_adc_burst(
            adc_voltage, adc_current, num_readings=10, duration_s=0.1
        )

        if voltage_readings is not None and current_readings is not None:
            # Process the readings
            print(f"Voltage readings: {voltage_readings}")
            print(f"Current readings: {current_readings}")

            # Prepare data and store it locally first
            data_to_send = {
                "session_id": session_id,
                "chunk_id": next_chunk_id,
                "voltage": voltage_readings,
                "current": current_readings,
            }
            if session_id is not None:
                write_measurements(session_id, next_chunk_id, data_to_send)
                print(
                    f"Stored measurement chunk {next_chunk_id} for session {session_id}"
                )
                next_chunk_id += 1
            else:
                print("Cannot store measurement: session_id is not set.")

        # Attempt to upload stored measurements
        if session_id is not None:
            print("Attempting to upload stored measurements...")
            pico_ip_address = try_connect_to_wlan(
                wlan, 5000
            )  # Shorter timeout for reconnect

            if pico_ip_address:
                # Verify server connection or rediscover
                current_server_ip = server_ip_address  # Use the known IP first
                if not current_server_ip or not is_server_online(current_server_ip):
                    print("Server connection lost or invalid. Trying discovery...")
                    current_server_ip = try_discover_server_ip(5000)
                    if current_server_ip:
                        print(f"Rediscovered server at {current_server_ip}")
                        server_ip_address = current_server_ip  # Update main variable
                        update_config("last_server_ip", server_ip_address)
                    else:
                        print("Server rediscovery failed.")
                        server_ip_address = None  # Clear main variable

                if current_server_ip:
                    print(
                        f"Connected to server {current_server_ip}. Checking for data to upload..."
                    )
                    # Try to upload all chunks for this session that haven't been uploaded yet
                    for upload_chunk_id in range(next_chunk_id):
                        measurement_data = read_measurements(
                            session_id, upload_chunk_id
                        )
                        if measurement_data is not None:
                            print(f"Attempting to upload chunk {upload_chunk_id}...")
                            success, status = post_json_data(
                                current_server_ip, measurement_data
                            )
                            if success:
                                print(
                                    f"Successfully uploaded chunk {upload_chunk_id}. Deleting file."
                                )
                                delete_measurement_file(session_id, upload_chunk_id)
                            else:
                                print(
                                    f"Failed to upload chunk {upload_chunk_id}, status: {status}. Stopping upload attempt for now."
                                )
                                break  # Stop trying for other chunks if one fails
                        # else: File already deleted or never existed, skip
                else:
                    print("Server not reachable. Cannot upload measurements.")
            else:
                print("WiFi not connected. Cannot upload measurements.")

        sleep_ms(1000)
