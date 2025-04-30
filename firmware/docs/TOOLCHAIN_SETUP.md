# Development Environment Setup

> `TODO`: Update with specific SDK version requirements once finalized.

## Required Tools
1. **Core Development Tools**
   - [Raspberry Pi Pico SDK](https://github.com/raspberrypi/pico-sdk)
   - Python 3.x (for build scripts)
   - Git

2. **Optional but Recommended**
   - [Visual Studio Code](https://code.visualstudio.com/)
   - [Thonny IDE](https://thonny.org/) (for Python development)

## Installation Steps

Follow [Get Started Guide](https://projects.raspberrypi.org/en/projects/get-started-pico-w/1)

### Windows Setup
1. Install [ARM GNU Toolchain](https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-rm/downloads)

2. Install Build Tools:
   ```bash
   # Using Chocolatey (recommended)
   choco install cmake python git
   ```

3. Install Visual Studio Code and extensions:
   - C/C++
   - CMake Tools
   - Cortex-Debug

4. Clone Pico SDK:
   ```bash
   git clone https://github.com/raspberrypi/pico-sdk
   cd pico-sdk
   git submodule update --init
   ```

5. Set environment variable:
   ```bash
   setx PICO_SDK_PATH "C:/path/to/pico-sdk"
   ```

### Linux Setup
1. Install required packages:
   ```bash
   sudo apt update
   sudo apt install cmake gcc-arm-none-eabi libnewlib-arm-none-eabi build-essential python3 git
   ```

2. Clone Pico SDK:
   ```bash
   git clone https://github.com/raspberrypi/pico-sdk
   cd pico-sdk
   git submodule update --init
   ```

3. Set environment variable:
   ```bash
   echo 'export PICO_SDK_PATH="/path/to/pico-sdk"' >> ~/.bashrc
   source ~/.bashrc
   ```

### macOS Setup
1. Install required packages:
   ```bash
   brew install cmake
   brew install --cask gcc-arm-embedded
   brew install python3 git
   ```

2. Follow Linux steps 2-3 for SDK setup

## Project Setup
1. Clone project repository
2. Initialize build directory:
   ```bash
   mkdir build
   cd build
   cmake ..
   ```

3. Build project:
   ```bash
   make
   ```

4. Flash to Pico:
   - Hold BOOTSEL while connecting USB
   - Drag and drop .uf2 file to RPI-RP2 drive

## Debugging Setup
1. Set up Picoprobe (recommended) or other SWD debugger

2. Install OpenOCD:
   ```bash
   # Linux
   sudo apt install openocd

   # macOS
   brew install openocd

   # Windows
   # Download from official website
   ```

3. Configure VS Code launch.json for debugging (template provided in project)

## Common Issues
- SDK path not found
- CMake configuration errors
- USB connection issues
- Debug probe not recognized

## Additional Resources
- [Getting Started with Pico](https://datasheets.raspberrypi.org/pico/getting-started-with-pico.pdf)
- [Pico C/C++ SDK](https://datasheets.raspberrypi.org/pico/raspberry-pi-pico-c-sdk.pdf)
- [Pico Examples](https://github.com/raspberrypi/pico-examples)
- [USB CDC Example](https://github.com/raspberrypi/pico-examples/tree/master/usb/device/dev_cdc_basic) 