# Pin Mapping Documentation

## Overview
Pin configurations for the Raspberry Pi Pico W in this project.

## Pin Assignments

### Analog-to-Digital Converter (ADC)
| Pin  | ADC Channel | Function        | Description              |
|------|-------------|-----------------|--------------------------|
| GP26 | ADC0        | Voltage Input   | Measures battery voltage |
| GP28 | ADC2        | Current Input   | Measures current draw    |

### Power Management
| Pin  | Function          | Description                                                |
|------|-------------------|------------------------------------------------------------|
| VSYS | Vehicle Power In  | 5VDC from vehicle (input protected by a Schottky diode)    |
| 3V3  | Regulated Output  | 3.3V supply for Pico and potentially external components   |
| GND  | Ground            | Common ground reference                                    |
| AGND | Analogue Ground   | Common ground reference                                    |

### Other Interfaces
-   **USB Interface:** Used for programming, serial communication (REPL), and 5V power (VBUS).
-   **Wireless Module (CYW43439):** Integrated on the Pico W for Wi-Fi. Communication is internal. The on-board LED is connected to WL_GPIO0.

## Notes
-   The primary power source is VSYS, protected by a Schottky diode to avoid a short circuit if the USB power is connected while the vehicle is powered. It also protects the Pico W from reverse polarity.
-   Accurate ADC readings depend on stable power and proper grounding. Our initial revision of the PCB did not connect the AGND pin to the main ground properly, instead, we needed to use a jumper wire to connect the AGND pin to the main ground. This introduces inductance and has been fixed in the latest revision of the PCB.