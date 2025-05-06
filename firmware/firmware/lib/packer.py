import struct
import time

import micropython

PROCESSED_DATA_FMT = "<" + "LLL" + "fff" + "fff" + "f"  # 1 uint32 + 7 float values
PROCESSED_FRAME_SIZE = struct.calcsize(PROCESSED_DATA_FMT)  # 36 bytes

# Define timestamp size - 4 bytes for uint32_t timestamp value
TIMESTAMP_FRAME_SIZE = 4


start_time = time.ticks_ms()  # type: ignore


# ruff: noqa: F821
@micropython.viper  # type: ignore
def pack_voltage_current_measurement(buffer, voltage: uint, current: uint):  # type: ignore
    # Avoid using struct for packing to reduce overhead
    b: ptr16 = ptr16(buffer)  # type: ignore

    # Pack voltage (first uint16)
    b[0] = voltage

    # Pack current (second uint16)
    b[1] = current


@micropython.viper  # type: ignore
def unpack_voltage_current_measurement(buffer):  # type: ignore
    b: ptr16 = ptr16(buffer)  # type: ignore

    # Unpack voltage (first uint16)
    voltage = b[0]  # type: ignore

    # Unpack current (second uint16)
    current = b[1]  # type: ignore

    return voltage, current


@micropython.viper  # type: ignore
def pack_timestamp(buffer):  # type: ignore
    # Pack current timestamp directly (uint32)
    timestamp: uint = uint(time.ticks_ms()) - uint(start_time)  # type: ignore
    struct.pack_into("<I", buffer, 0, timestamp)


@micropython.viper  # type: ignore
def unpack_timestamp(buffer):  # type: ignore
    # Unpack timestamp directly
    return struct.unpack("<I", buffer)[0]


@micropython.viper  # type: ignore
def pack_processed_float_data(
    buffer,
    timestamp,
    session_id,
    measurement_id,
    avg_voltage,
    avg_current,
    avg_power,
    peak_voltage,
    peak_current,
    peak_power,
    energy,
):
    struct.pack_into(
        PROCESSED_DATA_FMT,
        buffer,
        0,
        timestamp,
        session_id,
        measurement_id,
        avg_voltage,
        avg_current,
        avg_power,
        peak_voltage,
        peak_current,
        peak_power,
        energy,
    )


@micropython.viper  # type: ignore
def unpack_processed_float_data(buffer):
    (
        timestamp,
        session_id,
        measurement_id,
        avg_voltage,
        avg_current,
        avg_power,
        peak_voltage,
        peak_current,
        peak_power,
        energy,
    ) = struct.unpack(PROCESSED_DATA_FMT, buffer)

    return (
        timestamp,
        session_id,
        measurement_id,
        avg_voltage,
        avg_current,
        avg_power,
        peak_voltage,
        peak_current,
        peak_power,
        energy,
    )


def unpack_processed_float_data_to_dict(frame_data):
    """Unpacks binary frame data and returns it as a dictionary."""
    (
        timestamp,
        session_id,
        measurement_id,
        avg_voltage,
        avg_current,
        avg_power,
        peak_voltage,
        peak_current,
        peak_power,
        energy,
    ) = unpack_processed_float_data(frame_data)

    return {
        "timestamp": timestamp,
        "session_id": session_id,
        "measurement_id": measurement_id,
        "avg_voltage": f"{avg_voltage:.4f}",
        "avg_current": f"{avg_current:.4f}",
        "avg_power": f"{avg_power:.4f}",
        "peak_voltage": f"{peak_voltage:.4f}",
        "peak_current": f"{peak_current:.4f}",
        "peak_power": f"{peak_power:.4f}",
        "energy": f"{energy:.4f}",
    }
