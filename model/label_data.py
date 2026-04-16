"""
model/label_data.py
===================
AI-Powered Network Intelligence System
Team 1 -- Feature Engineering + Labeling Module

Upgrades:
- KEEP `zone` column so the model can learn location patterns
- DROP `congestion_score` before saving to prevent Target Leakage. This
  forces the AI to learn the true underlying patterns instead of just reading the formula.
"""

import os
import sys
import pandas as pd

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
INPUT_PATH  = os.path.join(BASE_DIR, "..", "data", "network_data.csv")
OUTPUT_DIR  = os.path.join(BASE_DIR, "..", "data")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "processed_data.csv")

def assign_priority(row: pd.Series) -> str:
    # We compute the score here just to create the truth label
    score = row["latency"] + (row["packet_loss"] * 20) + (row["num_users_in_zone"] / 5)
    
    if row["latency"] < 80 and row["packet_loss"] < 1:
        return "HIGH"
    elif score < 200:
        return "MEDIUM"
    else:
        return "LOW"

def main():
    print("=" * 55)
    print("  AI-Powered Network Intelligence System")
    print("  Feature Engineering + Labeling Module")
    print("=" * 55)

    if not os.path.exists(INPUT_PATH):
        raise FileNotFoundError(f"Raw data not found at {INPUT_PATH}.")

    df = pd.read_csv(INPUT_PATH)
    print(f"\n[OK] Loaded {len(df)} rows")

    # Engineer labels
    df["priority_class"] = df.apply(assign_priority, axis=1)
    print("[OK] Priority labels assigned")

    # WE INTENTIONALLY DO NOT SAVE CONGESTION SCORE to prevent target leakage!
    # The model must learn how to predict the class directly from raw specs.
    df["network_stability"] = df["signal_strength"] - df["packet_loss"] * 10
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    
    print(f"\n[OK] Processed data saved -> {os.path.abspath(OUTPUT_PATH)}")
    print(f"     FINAL Features: {list(df.columns)}")
    print("[OK] Labeling complete.\n")

if __name__ == "__main__":
    main()
