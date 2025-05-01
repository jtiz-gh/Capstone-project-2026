# Hardware Changelog

All notable changes to the hardware component will be documented in this file.

## Initial Setup - 18-03-2025
### Added
- Initial directory structure setup
- Basic documentation framework:
  - Component selection template with preliminary requirements
  - Directory structure for PCB, schematics, and production files
- Raspberry Pi Pico W selected as main microcontroller

## [31-03-2025]
### Added
- Basic voltage and current sensing circuit design
  - Battery modeling
  - Voltage and current sensors implementation
  - Power LED integration
### Changed
- Cleaned up SPICE temporary files

## [06-04-2025]
### Added
- Buffer circuit implementation
- ADC reference resistors
- Initial PCB design files and structure
  - Added .gitignore for temporary files
  - Created initial schematic and PCB design files
### Changed
- Updated resistor values to E24 series
- Fixed opamp references
- Improved voltage references for conditioning opamp and ADC
- Optimized buffer circuit design

## [07-04-2025]
### Changed
- Updated VVo and Vis range specification notes in Spice
- Modified VIO parameter notes in Spice

## [08-04-2025]
### Changed
- Updated component values to E12 series
  - ADC reference values
  - Current signal opamp values

## [09-04-2025]
### Added
- Initial PCB design files and libraries
- Complete schematic implementation including:
  - Voltage and current sensing circuits with shunt resistor
  - Current sensor opamp with decoupling capacitor
  - Power MCU section with decoupling capacitors
  - Raspberry Pi Pico W integration with updated footprint
  - Power LED circuit with Red LED library
  - ADC Reference circuit with updated resistor values
  - Component libraries for Raspberry Pi and linear regulator
  - Electrolytic capacitor for linear regulator
### Changed
- Replaced LD1117 with L78L05 linear regulator
  - Updated capacitor values for linear regulator
  - Added electrolytic capacitor
- Updated component footprints and labels
  - U1: Op-amp
  - U2: Linear regulator
  - U3: Raspberry Pi Pico W
- Optimized schematic layout
  - Repositioned current and voltage sensing components
  - Fine-tuned component placement
- Added ports for ADC Reference and MCU pinout
- Updated OpAmp component values and specifications
### Removed
- Cleaned up and removed outdated files from previous meetings
### Todo
- [x] Confirm resistor values and linear regulator specifications
- [x] Begin PCB layout design

## [12-04-2025]
### Added
- Python control script for programmable load testing
