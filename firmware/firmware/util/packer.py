import struct
import micropython


# ruff: noqa: F821
@micropython.viper  # type: ignore
def pack_voltage_current_measurement(buffer, voltage: uint, current: uint):  # type: ignore
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
    avg_voltage,
    avg_current,
    avg_power,
    peak_voltage,
    peak_current,
    peak_power,
    energy,
):
    b: ptr32 = ptr32(buffer)  # type: ignore

    # The loop has been unwound to avoid the overhead of a loop with an unknown number of iterations.
    # The code is very ugly, but it is faster than using a loop.

    # for i in range(0, len(arguments)):
    #     # Pack each argument as a float (4 bytes)
    #     packed_data: bytes = struct.pack("f", arguments[i])
    #     b[i * 4 + 2 : (i + 1) * 4 + 2] = packed_data

    # Pack avg_voltage (first float)
    packed_data: int = struct.unpack("<I", struct.pack("f", avg_voltage))[0]
    b[0] = int(packed_data)

    # Pack avg_current (second float)
    packed_data: int = struct.unpack("<I", struct.pack("f", avg_current))[0]
    b[1] = int(packed_data)

    # Pack avg_power (third float)
    packed_data: int = struct.unpack("<I", struct.pack("f", avg_power))[0]
    b[2] = int(packed_data)

    # Pack peak_voltage (forth float)
    packed_data: int = struct.unpack("<I", struct.pack("f", peak_voltage))[0]
    b[3] = int(packed_data)

    # Pack peak_current (fifth float)
    packed_data: int = struct.unpack("<I", struct.pack("f", peak_current))[0]
    b[4] = int(packed_data)

    # Pack peak_power (sixth float)
    packed_data: int = struct.unpack("<I", struct.pack("f", peak_power))[0]
    b[5] = int(packed_data)

    # Pack energy (seventh float)
    packed_data: int = struct.unpack("<I", struct.pack("f", energy))[0]
    b[6] = int(packed_data)


@micropython.viper  # type: ignore
def unpack_processed_float_data(buffer):
    (
        avg_voltage,
        avg_current,
        avg_power,
        peak_voltage,
        peak_current,
        peak_power,
        energy,
    ) = struct.unpack("<fffffff", buffer)

    return (
        avg_voltage,
        avg_current,
        avg_power,
        peak_voltage,
        peak_current,
        peak_power,
        energy,
    )
