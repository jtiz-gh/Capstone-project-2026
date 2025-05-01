import json
from os import remove

CONFIG_FILE = "config.json"

DEFAULT_CONFIG = {"last_server_ip": None}


def read_config() -> dict:
    """Reads configuration data from the config file."""
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            config_data = json.load(f)
            print(f"Read config: {config_data}")

            # Merge default config with existing config
            for key, value in DEFAULT_CONFIG.items():
                if key not in config_data:
                    config_data[key] = value

            return config_data
    except OSError:
        print(
            f"Config file '{CONFIG_FILE}' not found or invalid. Returning default config."
        )
        return DEFAULT_CONFIG
    except ValueError:
        print(f"Error decoding JSON from '{CONFIG_FILE}'. Returning default config.")
        return DEFAULT_CONFIG


def write_config(config_data: dict):
    """Writes configuration data to the config file."""
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config_data, f)
            print(f"Wrote config: {config_data}")
    except OSError as e:
        print(f"Error writing config file '{CONFIG_FILE}': {e}")


def update_config(key: str, value):
    """Reads the current config, updates a specific key, and writes it back."""
    config = read_config()
    config[key] = value
    write_config(config)

def delete_config():
    """Deletes the config file."""
    try:
        remove(CONFIG_FILE)
        print(f"Deleted config file '{CONFIG_FILE}'.")
    except OSError as e:
        print(f"Error deleting config file '{CONFIG_FILE}': {e}")
