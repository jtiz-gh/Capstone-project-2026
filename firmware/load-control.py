import pyvisa as visa
import sys

rm = visa.ResourceManager()

LOADADDR = "ASRL4::INSTR"  # change to match assigned address for your computer/load
load = rm.open_resource(LOADADDR)

load.write(":INPut ON")  # turn on load
load.write(":FUNCtion RES")  # CR mode


voltage = load.query_ascii_values(":MEASure:VOLTage?", converter="s", separator="\n")[0]
current = load.query_ascii_values(":MEASure:CURRent?", converter="s", separator="\n")[0]
power = load.query_ascii_values(":MEASure:POWer?", converter="s", separator="\n")[0]

print("{")
print(f'  "voltage": {voltage.replace("V", "")},')
print(f'  "current": {current.replace("A", "")},')
print(f'  "power": {power.replace("W", "")}')
print("}")

START = 4  # ohm
STOP = 100  # ohm
target = None

if len(sys.argv) > 1:
    try:
        target = float(sys.argv[1])
    except ValueError:
        raise ValueError("Target resistance must be a number.")

    if target < START or target > STOP:
        raise ValueError("Target resistance is out of range.")

    load.write(f":RESistance {target}OHM")

load.close()
