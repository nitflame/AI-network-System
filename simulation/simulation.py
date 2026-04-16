"""
simulation/simulation.py
========================
AI-Powered Network Intelligence System
Team 1 -- Data Simulation Module

Upgrades:
- Continuous time-series flow using sine waves
- Gaussian noise injection for realism
"""

import os
import sys
import math
import numpy as np
import pandas as pd

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

np.random.seed(42)

NUM_ROWS = 4000  # Increased for better tuning
ZONES = ["Hostel", "Library", "Cafeteria", "Academic_Block", "Stadium"]

ZONE_CONGESTION_FACTOR = {
    "Hostel":         1.2,
    "Library":        0.8,
    "Cafeteria":      1.0,
    "Academic_Block": 0.9,
    "Stadium":        1.5,
}

def generate_row(row_index: int) -> dict:
    zone   = np.random.choice(ZONES)
    factor = ZONE_CONGESTION_FACTOR[zone]
    hour   = np.random.randint(0, 24)
    minute = np.random.randint(0, 60)
    
    # 1. Advanced Time-Series Pattern (Sine wave peaking around 20:00)
    time_val = hour + (minute / 60.0)
    time_effect = math.sin((time_val - 14) * (math.pi / 12)) + 1 # ranges 0 to 2

    # 2. Base Users based on time effect + zone
    base_users = 50 + (100 * time_effect)
    num_users = int(np.random.normal(base_users * factor, 20))
    num_users = max(10, num_users)

    # 3. Latency with exponential correlation & Gaussian noise
    # As users grow, latency spikes exponentially
    latency_base = 20 + (num_users ** 1.1) * 0.15 
    latency_noise = np.random.normal(0, 15)  # Data Jitter
    latency = max(5.0, round(latency_base + latency_noise, 2))

    # 4. Signal strength (Random with slight drop if congested)
    signal_strength = round(np.random.uniform(40, 95) - (num_users * 0.02), 2)

    # 5. Bandwidth usage
    max_bw = min(10.0, 0.5 + num_users * 0.03)
    bandwidth_usage = round(np.random.uniform(0.5, max_bw), 3)

    # 6. Packet loss with noise
    loss_base = (latency / 200) ** 1.5
    loss_noise = np.random.normal(0, 0.5)
    packet_loss = round(np.clip((loss_base * factor) + loss_noise, 0, 8), 3)

    return {
        "zone":              zone,
        "signal_strength":   signal_strength,
        "bandwidth_usage":   bandwidth_usage,
        "latency":           latency,
        "packet_loss":       packet_loss,
        "num_users_in_zone": num_users,
        "time_of_day":       hour,
    }

def main():
    print("=" * 55)
    print("  AI-Powered Network Intelligence System")
    print("  Simulation Module -- Generating Data...")
    print("=" * 55)

    records = [generate_row(i) for i in range(NUM_ROWS)]
    df = pd.DataFrame(records)

    output_dir  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "network_data.csv")
    df.to_csv(output_path, index=False)

    print(f"\n[OK] Generated {len(df)} rows -> {os.path.abspath(output_path)}")
    print("[OK] Simulation complete.\n")

if __name__ == "__main__":
    main()
