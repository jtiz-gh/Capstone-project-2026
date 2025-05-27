import gc
import json
import os

import drivers.wlan
from constants import BACKLOG_BATCH_SIZE
from lib.packer import PROCESSED_FRAME_SIZE

CONFIG_FILENAME = "config.json"
MEASUREMENT_FILENAME = "measurements.dat"
DEFAULT_CHUNK_SIZE = 50

DEFAULT_CONFIG = {"session_id": 0, "pico_id": drivers.wlan.get_mac_address()}

# Cache for config to avoid repeated flash reads
_config_cache = None


def read_config() -> dict:
    """Reads configuration data from the config file using the helper."""
    global _config_cache

    # Return the cached config if available
    if _config_cache is not None:
        return _config_cache.copy()  # Return a copy to avoid modifying the cache

    # Read JSON configuration data
    try:
        with open(CONFIG_FILENAME, "r", encoding="utf-8") as f:
            config_data = json.load(f)
            print(f"Read data from {CONFIG_FILENAME}: {config_data}")
    except OSError:
        print(f"File '{CONFIG_FILENAME}' not found or cannot be read.")
        config_data = None
    except ValueError:
        print(f"Error decoding JSON from '{CONFIG_FILENAME}'.")
        config_data = None

    if config_data is None:
        print("Using default config.")
        _config_cache = DEFAULT_CONFIG.copy()
        return _config_cache.copy()

    # Merge default config with existing config
    merged_config = DEFAULT_CONFIG.copy()
    merged_config.update(config_data)

    # Update the cache
    _config_cache = merged_config

    return _config_cache.copy()


def write_config(config_data: dict):
    """Writes configuration data to the config file using the helper."""
    global _config_cache

    try:
        with open(CONFIG_FILENAME, "w", encoding="utf-8") as f:
            json.dump(config_data, f)
            print(f"Wrote data to {CONFIG_FILENAME}: {config_data}")
    except OSError as e:
        print(f"Error writing to file '{CONFIG_FILENAME}': {e}")

    # Update the cache when we write new config
    _config_cache = config_data.copy()


def update_config(key: str, value):
    """Reads the current config, updates a specific key, and writes it back."""
    config = read_config()
    config[key] = value
    write_config(config)


def delete_config():
    """Deletes the config file."""
    global _config_cache
    try:
        os.remove(CONFIG_FILENAME)
        print(f"Deleted config file '{CONFIG_FILENAME}'.")
        # Clear the cache when config is deleted
        _config_cache = DEFAULT_CONFIG
    except OSError as e:
        print(f"Error deleting config file '{CONFIG_FILENAME}': {e}")


def get_next_session_id() -> int:
    """Reads the last session ID from config, increments it, saves it back, and returns the new ID."""
    config = read_config()
    last_id = config.get("session_id", 0)
    next_id = last_id + 1
    config["session_id"] = next_id
    write_config(config)
    print(f"New session ID: {next_id}")
    return next_id


def get_pico_id() -> str:
    """Gets the Pico ID from the configuration."""
    config = read_config()
    pico_id = config.get("pico_id", "")
    return pico_id


def write_measurements(data_list: list[bytes]):
    """Appends multiple measurement frames to the end of the measurements file.

    Args:
        data_list: List of binary measurement data frames to append
    """
    if not data_list:
        return

    total_data_size = sum(len(data) for data in data_list)

    # Check for available storage space before writing
    try:
        s = os.statvfs("/")
        # f_bsize (block size) * f_bavail (number of free blocks for unprivileged users)
        available_space = s[0] * s[4]
        print(f"Storage: {available_space} bytes free, writing {total_data_size} bytes")
        if total_data_size > (available_space / 2):
            print(
                f"Error: Not enough space to write {total_data_size} bytes. Available: {available_space} bytes."
            )
            return
        else:
            print(
                f"{available_space} bytes free. Remaining readings: {available_space // PROCESSED_FRAME_SIZE} frames."
            )
    except OSError as e:
        print(f"Error checking disk space: {e}")
        return

    try:
        # Open file in append mode to add data to the end
        with open(MEASUREMENT_FILENAME, "ab") as f:
            for data in data_list:
                f.write(data)
            print(f"Appended {len(data_list)} measurements to {MEASUREMENT_FILENAME}")
    except OSError as e:
        print(f"Error writing measurements to file '{MEASUREMENT_FILENAME}': {e}")


def read_measurements(count: int) -> list[bytes]:
    """Reads a specified number of measurements from the start of the file."""
    result: list[bytes] = []

    try:
        with open(MEASUREMENT_FILENAME, "rb") as f:
            for _ in range(count):
                # Read one measurement frame at a time
                frame = f.read(PROCESSED_FRAME_SIZE)
                if not frame or len(frame) < PROCESSED_FRAME_SIZE:
                    # End of file or incomplete frame
                    break
                result.append(frame)

        return result
    except OSError as e:
        print(f"Error reading measurements from file '{MEASUREMENT_FILENAME}': {e}")
        return result


def stream_file_data(filename, chunk_size=None):
    """Generator function that streams data from a file in chunks."""

    if chunk_size is None:
        chunk_size = PROCESSED_FRAME_SIZE

    # Limit the total amount of data to BACKLOG_BATCH_SIZE frames
    max_bytes = BACKLOG_BATCH_SIZE * PROCESSED_FRAME_SIZE
    bytes_read = 0

    try:
        with open(filename, "rb") as f:
            while bytes_read < max_bytes:
                gc.collect()

                # Calculate remaining bytes within our limit
                remaining = max_bytes - bytes_read
                # Read the smaller of chunk_size or remaining bytes
                read_size = min(chunk_size, remaining)

                while read_size > 0:
                    try:
                        chunk = f.read(read_size)
                        if not chunk:
                            return
                        bytes_read += len(chunk)

                        yield chunk
                        break
                    except MemoryError:
                        # Try a smaller chunk if we run out of memory
                        read_size //= 2

        print(f"Streamed {bytes_read} bytes from file '{filename}'")
    except OSError as e:
        print(f"Error streaming data from file '{filename}': {e}")
        return


def delete_measurements(count: int) -> bool:
    """Deletes a specified number of measurements from the start of the file."""
    try:
        # Check if file is smaller than what we want to delete
        file_size = os.stat(MEASUREMENT_FILENAME)[6]  # Get file size
        bytes_to_skip = count * PROCESSED_FRAME_SIZE

        if file_size <= bytes_to_skip:
            # Just delete the entire file if we're deleting all content or more
            os.remove(MEASUREMENT_FILENAME)
            print(f"Deleted entire measurements file '{MEASUREMENT_FILENAME}'.")
            return True

        # Need to keep some content - create a temporary file
        temp_filename = f"{MEASUREMENT_FILENAME}.tmp"

        with open(MEASUREMENT_FILENAME, "rb") as src_file:
            # Skip the frames we want to delete
            src_file.seek(bytes_to_skip)

            # Write remaining data to temp file
            with open(temp_filename, "wb") as dest_file:
                # Copy data in chunks to avoid loading the entire file
                chunk_size = 512
                while True:
                    chunk = src_file.read(chunk_size)
                    if not chunk:
                        break
                    dest_file.write(chunk)

        # Replace original file with temp file
        os.remove(MEASUREMENT_FILENAME)
        os.rename(temp_filename, MEASUREMENT_FILENAME)

        print(f"Deleted {count} measurements from the start of {MEASUREMENT_FILENAME}")
        return True
    except OSError as e:
        print(f"Error deleting measurements from file '{MEASUREMENT_FILENAME}': {e}")
        return False


def measurement_backlog_size() -> int:
    """Returns the size of the measurement backlog file in bytes."""
    try:
        # .st_size [6] returns the size of the file in bytes
        file_size = os.stat(MEASUREMENT_FILENAME)[6]
        return file_size
    except OSError:
        return 0
