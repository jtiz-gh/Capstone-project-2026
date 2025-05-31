# Development Environment Setup

This document outlines the setup for the EVolocity ECU firmware development environment, which is based on MicroPython for the Raspberry Pi Pico W.

## Core Requirements
- **Python 3.x:** Required for running helper scripts and by some development tools.
- **Git:** For version control.
- **Node.js:** Required for running the mock server (`mock-server.js`). Tested with Node.js versions 22 and 24.

## MicroPython Development on Raspberry Pi Pico W

There are two primary recommended IDEs for MicroPython development with the Pico W:

### 1. Visual Studio Code (VS Code) with MicroPico Extension
This is the tried and tested setup by our team, offering good project management and REPL integration.

**Installation & Setup:**
1.  **Install Visual Studio Code:** Download and install from [code.visualstudio.com](https://code.visualstudio.com/).
2.  **Install Python:** If not already installed, get Python from [python.org](https://python.org).
3.  **Install Node.js:** Download and install from [nodejs.org](https://nodejs.org/).
4.  **Install Git:** If not already installed, get Git from [git-scm.com](https://git-scm.com/).
5.  **Install MicroPico VS Code Extension:**
    *   Open VS Code.
    *   Go to the Extensions view (Ctrl+Shift+X or Cmd+Shift+X).
    *   Search for `paulober.pico-w-go` and install it.

### 2. Thonny IDE
Thonny is a beginner-friendly Python IDE with built-in support for MicroPython and the Raspberry Pi Pico.

**Installation & Setup:**
1.  **Install Thonny IDE:** Download and install from [thonny.org](https://thonny.org/).
2.  **Configure Interpreter:**
    *   Open Thonny.
    *   Go to `Run` > `Select interpreter...`.
    *   Choose `MicroPython (Raspberry Pi Pico)` as the interpreter.
    *   Thonny may prompt you to install or update the MicroPython firmware on your Pico if it's outdated or not present.

## Flashing MicroPython Firmware to Pico W
Before you can run MicroPython scripts, you need to flash the MicroPython firmware onto the Pico W:
1.  **Download MicroPython UF2 file:** Get the latest stable firmware for the "Raspberry Pi Pico W" from the [MicroPython downloads page](https://micropython.org/download/RPI_PICO_W/).
2.  **Enter BOOTSEL Mode:**
    *   Disconnect your Pico W from USB.
    *   Press and hold the `BOOTSEL` button on the Pico W.
    *   While holding `BOOTSEL`, connect the Pico W to your computer via USB.
    *   Release the `BOOTSEL` button. The Pico W should now appear as a mass storage device (like a USB drive) named `RPI-RP2`.
3.  **Copy UF2 File:** Drag and drop the downloaded `.uf2` firmware file onto the `RPI-RP2` drive.
4.  **Reboot:** The Pico W will automatically reboot after the file is copied. If it appears as a drive again, eject it. It's now running MicroPython.

## Running Your Project on Pico W

### Using VS Code with MicroPico:
1.  **Connect to Pico:**
    *   Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P).
    *   Type `MicroPico: Connect` and select it. Choose your Pico's serial port.
    *   The MicroPico terminal should open and show the MicroPython REPL prompt (`>>>`).
2.  **Upload Project:**
    *   In the Command Palette, type `MicroPico: Upload project to Pico` and select it. This will copy all files from your local `firmware/firmware/` directory (or the configured project directory in MicroPico settings) to the Pico W.
3.  **Run `main.py`:**
    *   To run the main script (`firmware/firmware/main.py`), you can either:
        *   Open `main.py` in the editor, then in the Command Palette, type `MicroPico: Run current file on Pico`.
        *   Or, as set to run on boot (which is standard for MicroPython), simply resetting the Pico (e.g., by power cycling or using `machine.reset()` in the REPL) will start it after the project is uploaded.

### Using Thonny:
1.  **Open Files:** Open your project files (e.g., `main.py` and any library files) in Thonny.
2.  **Save to Pico:**
    *   For each file you want on the Pico, open it, then go to `File` > `Save copy...`.
    *   Choose `Raspberry Pi Pico` as the destination.
    *   Save the file with the same name in the root directory of the Pico's filesystem.
3.  **Run `main.py`:**
    *   Open `main.py` from the Pico (Thonny's file browser should show files on the computer and the Pico).
    *   Click the "Run current script" button (green play icon) or press F5.

## Helper Scripts and Mock Server

### Mock Server (`mock-server.js`)
-   **Purpose:** Simulates the backend API for testing firmware communication.
-   **Setup:**
    *   Ensure Node.js is installed.
    *   Navigate to the `firmware/` directory.
-   **Running:**
    ```sh
    node mock-server.js
    ```

### Python Utility Scripts
The project includes Python scripts like `ecu-simulate.py` and `load-control.py` in the `firmware/` directory.
-   **Dependencies:** These scripts may have dependencies such as `fastf1`, `matplotlib`, `numpy`, `requests`, and `pyvisa`.
-   **Installation:**
    ```sh
    pip install fastf1 matplotlib numpy requests pyvisa
    ```
-   **Running:** Execute them as standard Python scripts, e.g.:
    ```sh
    python load-control.py off
    python ecu-simulate.py
    ```

## Additional Resources
-   [Raspberry Pi Pico W Datasheet](https://datasheets.raspberrypi.com/picow/pico-w-datasheet.pdf)
-   [MicroPython Documentation](https://docs.micropython.org/)
-   [MicroPico Extension README](https://github.com/paulober/MicroPico) (Provides more details on extension features)