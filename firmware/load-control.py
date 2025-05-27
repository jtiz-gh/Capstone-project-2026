import pyvisa as visa
import sys

rm = visa.ResourceManager()

LOADADDR = "ASRL8::INSTR"  # change to match assigned address for your computer/load
load = rm.open_resource(LOADADDR)

START = 4  # ohm
STOP = 100  # ohm
target = None

if len(sys.argv) > 1:
    input_value = sys.argv[1]

    try:
        if input_value == "off":
            load.write(":INPut OFF")
            load.close()
            sys.exit(1)

        load.write(":INPut ON")  # turn on load
        load.write(":FUNCtion RES")  # CR mode

        voltage = load.query_ascii_values(
            ":MEASure:VOLTage?", converter="s", separator="\n"
        )[0]
        current = load.query_ascii_values(
            ":MEASure:CURRent?", converter="s", separator="\n"
        )[0]
        power = load.query_ascii_values(
            ":MEASure:POWer?", converter="s", separator="\n"
        )[0]
        target = float(input_value)

        if target < START:
            raise ValueError("Target resistance is out of range.")

        print("{")
        print(f'  "voltage": {voltage.replace("V", "")},')
        print(f'  "current": {current.replace("A", "")},')
        print(f'  "power": {power.replace("W", "")}')
        print("}")

        load.write(f":RESistance {target}OHM")
    except ValueError:
        raise ValueError("Target resistance must be a number.")

load.close()
