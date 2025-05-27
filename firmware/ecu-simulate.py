import fastf1
import warnings
import matplotlib.pyplot as plt
import numpy as np
import time
import requests
import struct
import random

warnings.simplefilter(action="ignore", category=FutureWarning)

fastf1.Cache.enable_cache("cache")
fastf1.set_log_level("WARNING")

print("Loading session...")
# session = fastf1.get_session(2023, "Silverstone", "Q")
session = fastf1.get_session(2023, "Monza", "Q")
session.load()

driver = "VER"  # SAI, VER, HAM, TSU, LEC
lap = session.laps.pick_driver(driver).pick_fastest()

tel = lap.get_car_data().add_distance()

speed = tel["Speed"].values
time_s = tel["Time"].dt.total_seconds().values
speed_mps = speed * (1000 / 3600)
accel = np.gradient(speed_mps, time_s)

accel_min = np.min(accel)
accel_max = np.max(accel)
accel_clipped = np.clip(accel, accel_min, accel_max)
R = 100 - ((accel_clipped - accel_min) / (accel_max - accel_min)) * (100 - 4)

MOCK_SERVER_URL = "http://localhost:3000/api/sensor-data"


def generate_pico_id():
    return "".join([f"{random.randint(0, 255):02x}" for _ in range(6)]).upper()


PICO_ID = generate_pico_id()
print(f"Generated Pico-ID: {PICO_ID}")

session_event_str = f"{session.event['EventName']}{session.event.year}{driver}"
current_session_id = abs(hash(session_event_str)) % (
    2**10
)  # Changed modulo for a smaller ID (0-1023)
print(f"Generated Session ID: {current_session_id}")

plt.ion()
fig, ax = plt.subplots()
plt.title(
    f"{driver} - Simulated Load from Acceleration\n{session.event['EventName']} {session.event.year}"
)
plt.xlabel("Real Time [s]")
plt.ylabel(r"Load [$\Omega$] (from acceleration data)")
plt.grid(True)

T = 0.05
x_data, y_data = [], []
(line,) = ax.plot([], [], color="red")

ax.set_xlim(0, len(R) * T)
ax.set_ylim(np.min(R) - 5, np.max(R) + 5)

print("Starting experiment (simulation mode)")

total_session_energy = 0.0
all_packets_data = b""
start_time_ms = int(time.time() * 1000)

print(f"Simulating race: {driver} at {session.event['EventName']} {session.event.year}")
print(
    "------------------------------------------------------------------------------------"
)
print(
    "Idx | Resistance (Ω) | Avg V (V) | Avg I (A) | Avg P (W) | Interval E (J) | Total E (J)"
)
print(
    "------------------------------------------------------------------------------------"
)

for i, r in enumerate(R):
    sim_avg_voltage = 12.0 + np.random.uniform(-0.1, 0.1)
    sim_avg_current = sim_avg_voltage / r
    sim_avg_power = sim_avg_voltage * sim_avg_current

    sim_peak_voltage = sim_avg_voltage * (1 + np.random.uniform(0.01, 0.05))
    sim_peak_current = sim_peak_voltage / r
    sim_peak_power = sim_peak_voltage * sim_peak_current

    interval_energy = sim_avg_power * T
    total_session_energy += interval_energy

    print(
        f"{i:3d} | {r:14.2f} | {sim_avg_voltage:9.4f} | {sim_avg_current:9.4f} | {sim_avg_power:9.4f} | {interval_energy:14.4f} | {total_session_energy:11.4f}"
    )

    current_timestamp_ms = int(time.time() * 1000) - start_time_ms
    measurement_id = i
    packet = struct.pack(
        "<LLLfffffff",
        current_timestamp_ms,
        current_session_id,
        measurement_id,
        sim_avg_voltage,
        sim_avg_current,
        sim_avg_power,
        sim_peak_voltage,
        sim_peak_current,
        sim_peak_power,
        interval_energy,
    )
    all_packets_data += packet

    x_data.append(i * T)
    y_data.append(r)
    line.set_data(x_data, y_data)
    plt.pause(T)

print(
    "------------------------------------------------------------------------------------"
)
print("Race simulation complete!")
print(f"Total simulated energy for the session: {total_session_energy:.2f} Joules")

if all_packets_data:
    print(
        f"Uploading {len(all_packets_data)} bytes of simulated data to mock server at {MOCK_SERVER_URL}..."
    )
    try:
        headers = {"Content-Type": "application/octet-stream", "Pico-ID": PICO_ID}
        response = requests.post(
            MOCK_SERVER_URL, data=all_packets_data, headers=headers, timeout=10
        )
        response.raise_for_status()
        print(
            f"Upload successful! Server responded with: {response.status_code} - {response.json()}"
        )
    except Exception as e:
        print(f"Error uploading data to mock server: {e}")
else:
    print("No data to upload.")

print("Script finished. Close the plot window to exit.")
plt.ioff()
plt.show()
