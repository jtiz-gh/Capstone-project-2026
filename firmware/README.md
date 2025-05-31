# Firmware Documentation

This directory holds the MicroPython firmware for the EVolocity Control Unit (ECU) wireless data collection module. It's designed to run on the Raspberry Pi Pico W microcontroller.

## Getting Started

### Main firmware: MicroPython in VS Code
To edit the MicroPython code, a VS Code extension can be really helpful. `paulober.pico-w-go` is a good one. It lets you browse files on the Pico and use the REPL, among other things.

Alternatively, you can use Thonny, a Python IDE that supports MicroPython development. Thonny is user-friendly and provides a simple interface for uploading and running MicroPython scripts on the Pico W and in my experience has been more reliable when connecting with the development board. However, it lacks some features that you may be used to in other IDEs.

### Flashing the MicroPython Firmware
To flash the firmware onto the Raspberry Pi Pico W, you need to follow these steps:
1. **Download the MicroPython firmware**: Get the latest MicroPython firmware for the Raspberry Pi Pico W from the [official MicroPython website](https://micropython.org/download/RPI_PICO_W/).
2. **Connect the Pico W**: Connect the Raspberry Pi Pico W to your computer while holding down the BOOTSEL button. This will mount the Pico as a USB mass storage device.
3. **Copy the firmware**: Copy the downloaded MicroPython firmware file (usually named `micropython-<version>-rp2-pico-w.uf2`) to the mounted Pico W drive.
4. **Eject the Pico W**: After copying the firmware, safely eject the Pico W drive from your computer.
5. **Install the MicroPico extension**: If you're using VS Code, install the `paulober.pico-w-go` extension to manage your MicroPython project.
6. **Open the project**: Open the project folder in VS Code or Thonny, and you should see the MicroPython files ready for editing.

### Run project on Pico W (VS Code)

To copy files to the Pico W using VS Code, follow these steps:
1. **Open the Command Palette**: Press `Ctrl + Shift + P` to open the Command Palette.
2. **Connect to the Pico W**: Type `MicroPico: Connect` and select it. This will establish a connection to your Pico W. Wait for the terminal to open and show the REPL prompt (`>>>`) in green.
3. **Select the Copy Command**: Type `MicroPico: Upload project to Pico` in the Command Palette and select it.
4. **Run main.py**: After uploading, you can run the main script opening the `main.py` file typing `MicroPico: Run run current file` in the Command Palette. This will execute the main script on the Pico W.


## Testing

### Mock Server
The mock server (`mock-server.js`) implements all the API endpoints that the ECU expects. To the ECU, it acts like the main backend, so you can test the firmware without connecting to the real system. It takes telemetry data from the ECUs, shows it in your console, and lets the firmware practice sending data and clearing its flash storage.

The mock server is built with Node.js, so you need to have Node.js installed on your machine. The mock server has been tested with Node.js 22 and 24. You can run the server with:
```sh
node mock-server.js
```


### Python Scripts
The Python scripts in the main `firmware` folder need a few packages:

- **`ecu-simulate.py`**: Needs `fastf1`, `matplotlib`, `numpy`, and `requests`.
- **`load-control.py`**: Needs `pyvisa`.

To install them, run:
```sh
pip install fastf1 matplotlib numpy requests pyvisa
```

### ECU Simulation
The `ecu-simulate.py` script simulates the behavior of the ECU by fetching telemetry data from Formula 1 races using the FastF1 library. The uploads the data to the mock or real backend server, simulating the ECU's data transmission.

This is useful for testing the software stack without needing the actual hardware or the ECU. It allows verification of data ingestion endpoints and display of telemetry data in the web interface.

You can change the sessions and driver in the script to adjust which telemetry data is fetched by adjusting the following lines:

```py
# session = fastf1.get_session(2023, "Silverstone", "Q")
session = fastf1.get_session(2023, "Monza", "Q")
session.load()

driver = "VER"  # SAI, VER, HAM, TSU, LEC
```

### Load Control
The `load-control.py` script controls a programmable load using the `pyvisa` library. It communicates with the load via VISA (Virtual Instrument Software Architecture) to control the programmable load's resistance. The script is used to test the firmware's accuracy and performance by simulating different load conditions.

The script allows you to set the load resistance to a specific value, which can be useful for testing the ECU's response to different load conditions. You can run the script with a specified resistance value as an argument:
```sh
python load-control.py 4
```

You can also turn the load off by running:
```sh
python load-control.py off
```

### Hardware Setup

These instructions outline a basic hardware test for the firmware and PCB.

**Prerequisites:**

1.  **Mock Server Running:**
    *   Navigate to the `firmware` directory: `cd /home/excigma/Documents/repos/capstone-project-2025-team_19/firmware`
    *   Start the mock server: `node ./mock-server.js`
2.  **Python Dependencies:**
    *   Ensure Python dependencies for the load control script are installed. If you encounter errors, you might need to install `fastf1`, `pyvisa`, and potentially other packages:
        ```sh
        pip install fastf1 pyvisa
        ```

**Setup and Test Procedure:**

1.  **Configure Power Supply:**
    *   Set your power supply to a maximum of 12V (whilst the power supply is open circuited).
    *   Set a current limit of 3A (short the power supply to set this. Make sure you are using the thicker wires in the lab if possible).
2.  **Connect Components:**
    *   Plug the power supply and the programmable load into the PCB.
    *   Connect your laptop to the programmable load (e.g., via USB).
3.  **Initialize Load Control:**
    *   Navigate to the `firmware` directory if you aren't already there
    *   Find the correct COM port for the programmable load using Device Manager (Windows), and edit the `load-control.py` script to set the correct VISA address (e.g., `ASRL3::INSTR`).
    *   Turn off the load initially: `python ./load-control.py off`
4.  **Power On System:**
    *   Turn on the power supply.
    *   The firmware on the Pico W should power on via the onboard regulator and attempt to connect to the configured Wi-Fi network.
5.  **Set Load Resistance:**
    *   Set the load to 100 ohms: `python ./load-control.py 100`
6.  **Observe System Behaviour:**
    *   **LED Indicators:**
        *   **Slow blink:** Pico W is attempting to connect to Wi-Fi.
        *   **Fast blink:** Connected to Wi-Fi, but not yet connected to the server.
        *   **Constant ON:** Successfully connected to the server.
    *   **Data Stability:** The voltage and current readings (from the load or a multimeter) should be relatively stable, with only minor fluctuations (e.g., ~0.01V/A). Significant jumps, especially if the table is disturbed, might indicate a poor connection which could lead to overheating and poor accuracy.
    *   **Firmware Data Upload:** The firmware will automatically batch measurements (in groups of 80 at time of writing, but this value is configurable) and upload them to the mock server.
    *   **Mock Server Output:** The `mock-server.js` script will store received readings into a `measurements.json` file (note: this file is often overwritten on each new packet or restart). It will also calculate and print the energy usage to the console each time a packet is received. Restart the mock server script to reset the energy counter.

## Folder Structure

Here’s what’s in the main `/home/excigma/Documents/repos/capstone-project-2025-team_19/firmware/` directory:

*   **`.gitignore`**: Specifies intentionally untracked files that Git should ignore.
*   **`initial-experiments/`**: Contains MicroPython code related to ADC (Analog-to-Digital Converter) functionality for early testing of our project.
*   **`CHANGELOG.md`**: Tracks changes and updates to the firmware.
*   **`README.md`**: This file, providing an overview of the firmware and its components.
*   **`docs/`**: Contains documentation files related to the firmware.
*   **`ecu-simulate.py`**: Python script to simulate ECU behaviour, for purposes of testing the software. It uses FastF1 library to get F1 telemetry data and simulate load.
*   **`firmware/`**: This directory contains the core MicroPython source code for the Pico W. It's structured as follows:
```
firmware/
├── .micropico/             # VS Code MicroPico extension specific file to mark the directory as a MicroPython project
├── constants.py            # Global constants for the firmware
├── delete_files.py         # Python script to delete files on the device
├── main.py                 # Main entry point of the MicroPython application
├── drivers/             # Hardware drivers for peripherals
│   ├── adc_sampler.py      # ADC sampling driver that utilizes the PIO
│   ├── button.py           # Button driver for handling button inputs
│   ├── flash_storage.py    # Flash storage driver for reading/writing data and configuration
│   ├── picozero.py         # PicoZero library for LED control
│   └── wlan.py             # Wi-Fi driver for managing wireless connectivity
├── lib/                 # Utility libraries and modules
│   ├── calculations.py     # Contains various calculations used in the firmware
│   ├── calibration.py      # DNL calibration module for the ADC
│   ├── http.py             # HTTP client implementation on top of TCP/IP
│   ├── packer.py           # Binary data packing and unpacking utilities
│   ├── ringbuf_queue.py    # Ring buffer queue implementation for data handling
│   ├── tcp.py              # TCP client implementation for network communication
│   ├── threadsafe/         # Thread-safe data structures to pass data between threads and tasks
│   └── udp.py              # UDP client implementation receiving server IP broadcast
└── tasks/               # Manages different tasks
    ├── __init__.py
    ├── data_processing.py   # Task for processing data collected from the ADC
    └── data_transmission.py # Task for transmitting data to the backend server
```
*   **`load-control.py`**: Python script for controlling a programmable load, using `pyvisa` for instrument communication.
*   **`mock-server.js`**: Node.js script that implements a mock server, for simulating the backend system that the ECU communicates with before it was completed.