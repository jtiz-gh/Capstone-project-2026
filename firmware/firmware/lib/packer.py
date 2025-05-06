import struct

import micropython

PROCESSED_DATA_FMT = "<" + "LLL" + "fff" + "fff" + "f"  # 1 uint32 + 7 float values
PROCESSED_FRAME_SIZE = struct.calcsize(PROCESSED_DATA_FMT)  # 36 bytes


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
