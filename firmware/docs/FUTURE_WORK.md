# Future Work

- [ ] Add type hints to firmware to improve code readability and maintainability.
- [ ] Move all constants and configuration to `constants.py` to centralise configuration management.
- [ ] Add a default IP address for the backend server in `constants.py` to allow for a fallback in case of UDP broadcast failure.
- [ ] Add support for better indicators and feedback in the firmware through the use of more LEDs, a display or a buzzer.
- [ ] Improve hot (commonly run) algorithms to be in C/C++ for better performance, especially for the ADC sampling and data processing tasks.
- [ ] Add support for more sensors and data types, such as temperature or GPS (the onboard temperature sensor was not deemed to be useful or accurate enough for use).
- [ ] Explore the use of alternative communication protocols (e.g., BLE, MQTT, radio, LoRa(WAN)).
- [ ] Increase ADC sampling rate for better voltage and current measurements.
- [ ] Implement error detection for flash storage operations to ensure data integrity.
- [ ] Add support for remote firmware updates over the air (OTA).
- [ ] Implement compression for the data packets to reduce storage and transmission size.
- [ ] Use an external real-time clock (RTC) module for accurate timekeeping.
- [ ] Use an external EEPROM, or external flash storage (such as an SD card) for larger data storage capacity, better equipment longevity and better reliability.
- [ ] Implement a way to turn off the ECU after a race to conserve power, such as a sleep mode or a power-off command.
- [ ] Implement better power management features to reduce power consumption during idle periods.