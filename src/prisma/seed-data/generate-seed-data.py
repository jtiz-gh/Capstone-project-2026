import fastf1
import warnings
import matplotlib.pyplot as plt
import numpy as np
import time
import requests
import struct
import random
import json

warnings.simplefilter(action="ignore", category=FutureWarning)

fastf1.Cache.enable_cache("cache")
fastf1.set_log_level("WARNING")

print("Loading session...")
session = fastf1.get_session(2023, "Monza", "Q")
session.load()

MOCK_SERVER_URL = "http://localhost:3000/api/sensor-data"


def generate_pico_id():
    return "".join([f"{random.randint(0, 255):02x}" for _ in range(6)]).upper()


PICO_ID = generate_pico_id()
print(f"Generated Pico-ID: {PICO_ID}")

drivers = ["SAI", "VER", "HAM", "TSU", "LEC"]

for driver in drivers:
    print(f"\n=== Processing driver: {driver} ===")
    lap = session.laps.pick_driver(driver).pick_fastest()
    if lap is None:
        print(f"No lap data for driver {driver}, skipping.")
        continue
    tel = lap.get_car_data().add_distance()

    speed = np.array(tel["Speed"].values, dtype=float)
    time_s = np.array(tel["Time"].dt.total_seconds().values, dtype=float)
    speed_mps = speed * (1000.0 / 3600.0)
    accel = np.gradient(speed_mps, time_s)

    accel_min = np.min(accel)
    accel_max = np.max(accel)
    accel_clipped = np.clip(accel, accel_min, accel_max)
    R = 100 - ((accel_clipped - accel_min) / (accel_max - accel_min)) * (100 - 4)

    session_event_str = f"{session.event['EventName']}{session.event.year}{driver}"
    current_session_id = abs(hash(session_event_str)) % (2**10)
    OUTPUT_JSON = f"simdata_{driver}.json"
    json_data = []
    T = 0.05

    for i, r in enumerate(R):
        sim_avg_voltage = 12.0 + np.random.uniform(-0.1, 0.1)
        sim_avg_current = sim_avg_voltage / r
        sim_avg_power = sim_avg_voltage * sim_avg_current

        sim_peak_voltage = sim_avg_voltage * (1 + np.random.uniform(0.01, 0.05))
        sim_peak_current = sim_peak_voltage / r
        sim_peak_power = sim_peak_voltage * sim_peak_current

        interval_energy = sim_avg_power * T

        # 20ms intervals
        current_timestamp_ms = int(i * (1 / T))
        measurement_id = i
        json_data.append({
            "timestamp": current_timestamp_ms,
            "sessionId": int(current_session_id),
            "recordId": "",  # Placeholder, to be set by seed script
            "deviceId": "",  # Placeholder, to be set by seed script
            "measurementId": int(measurement_id),
            "avgPower": float(sim_avg_power),
            "avgVoltage": float(sim_avg_voltage),
            "avgCurrent": float(sim_avg_current),
            "peakPower": float(sim_peak_power),
            "peakVoltage": float(sim_peak_voltage),
            "peakCurrent": float(sim_peak_current),
            "energy": float(interval_energy),
        })

    with open(OUTPUT_JSON, "w") as f:
        f.write(json.dumps(json_data))
    print(f"Dumped {len(json_data)} data points to {OUTPUT_JSON}")

print("Script finished.")
