# Component Selection

## Circuit Design Overview

The circuit design includes:

- Current and voltage sensing
- Amplifier for current sensing signal
- LED for debugging
- Linear voltage regulator
- Voltage divider for ADC reference

### Key Design Requirements

- Voltage and current sensing for EVolocity power monitoring
- ADC range limited to 0-3.3V (RPi Pico W requirement)
- 5V supply requirement for RPi Pico W system
- Input voltage regulation from 12V to 5V

## Core Components

### Microcontroller (Raspberry Pi Pico W)

- **Selected**: Raspberry Pi Pico W
- **Key Features**:
  - Dual-core ARM Cortex M0+
  - 264KB RAM
  - USB 1.1 controller
  - ADC range: 0-3.3V
- **Justification**: Project requirement for wireless connectivity and processing capabilities

### Operational Amplifier

- **Selected**: LM324
- **Key Features**:
  - Unity-gain bandwidth: 1.2MHz
  - Slew rate: 0.5 V/μs
- **Justification**:
  - Cost-effective compared to alternatives (LM324: $179.40 for 50 units vs LT6221: $386.12)
  - Sufficient performance for 200Hz sampling frequency
  - Meets amplification requirements for current sensing signal

### Linear Voltage Regulator

- **Selected**: L78L05
- **Key Features**:
  - Output voltage range: 4.6V to 5.4V
  - Dropout voltage: 2V
- **Justification**:
  - More cost-effective than LD1117V50 ($14.92 vs $21.06 for 50 units)
  - Meets voltage regulation requirements
  - Suitable for 12V to 5V conversion

### Current Sensing Components

- **Shunt Resistors**:
  - Value: 0.1 Ω
  - Power rating: 3W
  - Justification: Allows maximum current flow while maintaining accuracy

### Capacitors

- **Electrolytic Capacitor**:
  - Purpose: Output voltage storage for linear regulator
  - Range: Microfarad
- **Ceramic Capacitors**:
  - Purpose: Decoupling
  - Range: Nanofarad
  - Justification: Lower equivalent inductance and resistance

### Protection Components

- **Schottky Diode**:
  - Purpose: Prevents excessive current before 5V supply
- **LED**:
  - Purpose: Debug indicator for 5V power supply

## Bill of Materials

Prices are quoted for a batch order of 50 units. Last updated **25/05/2025**

| Item No. | Component  | Part Number | Quantity | Supplier | Unit Cost (excl GST) |
|----------|------------|-------------|----------|----------|-----------|
| 1 | Raspberry Pi Pico W | SC0918 | 1 | DigiKey | $7.65 |
| 2 | Op-Amp | LM324DR2G | 1 | DigiKey | $0.1744 |
| 3 | Shunt Resistor | ER74R10KT | 2 | DigiKey | $0.6399 |
| 4 | Linear Regulator | L78L05 | 1 | DigiKey | $0.1524 |
| 5 | LED | LTST-C191KRKT | 1 | DigiKey |$0.100 |
| 6 | Test points | 5003 | 5 | DigiKey |$0.2223 |
| 7 | Electrolytic Capacitors | TH | 1 | DigiKey | $0.1426 |
| 8 | Ceramic Capacitors | 0805 SMT | 5 | DigiKey | $0.0072 |
| 9 | Resistors | 0805 SMT | 11 | DigiKey |$0.0199 |
| 10 | Female Header Pins | 20 positions | 2 | DigiKey |$3.0143 |
| 11 | Schottky Diode | SP304 | 1 | Element14 |$0.923 |
| 12 | PCB | - | 1 | PCBWay | $5.00 |
| | | |  |**Total** | **$21.06** |

## Supplier Information

- [Element14](https://nz.element14.com/)
- [DigiKey](https://www.digikey.co.nz/)
- [PCBWay](https://www.pcbway.com/)

## Design Considerations

- Component availability
- Cost constraints
- Assembly requirements
- Environmental conditions
- Reliability requirements
- Noise reduction through kilo-ohm range resistors
- Power dissipation in current sensing components
- ADC compatibility and signal conditioning

## References

- [Raspberry Pi Pico Datasheet]
- [NZ Radio Equipment Standards]
- [Vehicle Electrical Standards]
