import json
import os

CONFIG_FILE = "config.json"

DEFAULT_CONFIG = {"last_server_ip": None, "last_session_id": 0}


def _read_json_file(filepath: str) -> dict | list | None:
    """Helper function to read JSON data from a file."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            print(f"Read data from {filepath}: {data}")
            return data
    except OSError:
        print(f"File '{filepath}' not found or cannot be read.")
        return None
    except ValueError:
        print(f"Error decoding JSON from '{filepath}'.")
        return None


def _write_json_file(filepath: str, data: dict | list):
    """Helper function to write data to a file in JSON format."""
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f)
            print(f"Wrote data to {filepath}: {data}")
    except OSError as e:
        print(f"Error writing to file '{filepath}': {e}")


def read_config() -> dict:
    """Reads configuration data from the config file using the helper."""
    config_data = _read_json_file(CONFIG_FILE)

    if config_data is None:
        print("Using default config.")
        return DEFAULT_CONFIG.copy()  # Return a copy to avoid modifying the default

    # Merge default config with existing config
    merged_config = DEFAULT_CONFIG.copy()
    merged_config.update(config_data)

    return merged_config


def write_config(config_data: dict):
    """Writes configuration data to the config file using the helper."""
    _write_json_file(CONFIG_FILE, config_data)


def update_config(key: str, value):
    """Reads the current config, updates a specific key, and writes it back."""
    config = read_config()
    config[key] = value
    write_config(config)


def delete_config():
    """Deletes the config file."""
    try:
        os.remove(CONFIG_FILE)
        print(f"Deleted config file '{CONFIG_FILE}'.")
    except OSError as e:
        print(f"Error deleting config file '{CONFIG_FILE}': {e}")


def get_next_session_id() -> int:
    """Reads the last session ID from config, increments it, saves it back, and returns the new ID."""
    config = read_config()
    last_id = config.get("last_session_id", 0)
    next_id = last_id + 1
    config["last_session_id"] = next_id
    write_config(config)
    print(f"Next session ID: {next_id}")
    return next_id


def _get_measurement_filename(session_id: int, chunk_id: int) -> str:
    """Generates the filename for measurements based on session and chunk ID."""
    return f"measurements_s{session_id}_c{chunk_id}.json"


def write_measurements(session_id: int, chunk_id: int, measurements_data: list | dict):
    """Writes measurements data to a file named by session and chunk ID."""
    filepath = _get_measurement_filename(session_id, chunk_id)
    print(f"Attempting to write measurements to {filepath}")
    _write_json_file(filepath, measurements_data)


def read_measurements(session_id: int, chunk_id: int) -> list | dict | None:
    """Reads measurements data from a file named by session and chunk ID."""
    filepath = _get_measurement_filename(session_id, chunk_id)
    print(f"Attempting to read measurements from {filepath}")
    return _read_json_file(filepath)


def delete_measurement_file(session_id: int, chunk_id: int):
    """Deletes the specified measurement file."""
    filepath = _get_measurement_filename(session_id, chunk_id)
    try:
        os.remove(filepath)
        print(f"Deleted measurement file: {filepath}")
    except OSError as e:
        print(f"Error deleting file {filepath}: {e}")
