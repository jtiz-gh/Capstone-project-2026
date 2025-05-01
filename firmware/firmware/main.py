from picozero import pico_led
from wlan import init_wlan, try_connect_to_wlan, WLAN
from networking import try_discover_server_ip, is_server_online, post_json_data
from flash_storage import update_config, read_config

wlan: WLAN | None = None


def init():
    """Initializes the Pico's components."""
    # pylint: disable=global-statement
    global wlan

    wlan = init_wlan()


# Check if the script is being run directly or imported
if __name__ == "__main__":
    print("Starting main program...")

    init()

    pico_ip_address = try_connect_to_wlan(wlan, 10000)
    server_ip_address = None

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

        # Send a POST request to the server
        data_to_send = {"message": "Pico connected", "ip": pico_ip_address}
        success, status = post_json_data(server_ip_address, data_to_send)