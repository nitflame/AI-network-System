"""
model/predict.py
================
AI-Powered Network Intelligence System
Team 1 -- Prediction / Backend Integration Module

Usage:
  python model/predict.py

How it works:
  1. Loads the trained model from model/model.pkl
  2. Accepts a raw network sample (hardcoded; replace with API input)
  3. Recomputes derived features (congestion_score, network_stability)
     exactly as done in label_data.py before prediction
  4. Feeds features in the canonical order used during training
  5. Prints the predicted priority_class with confidence scores

Backend Integration Note:
  Replace RAW_SAMPLE with data passed from your API/backend endpoint.
  The predict_sample() function is importable and can be called directly.
"""

import os
import sys
import joblib
import pandas as pd

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

# -- Paths ---------------------------------------------------------------------
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

# -- Canonical Feature Order (MUST match train_model.py) ----------------------
NUMERIC_FEATURES = [
    "signal_strength",
    "bandwidth_usage",
    "latency",
    "packet_loss",
    "num_users_in_zone",
    "time_of_day",
    "network_stability",
]
CATEGORICAL_FEATURES = ["zone"]
FEATURE_COLS = NUMERIC_FEATURES + CATEGORICAL_FEATURES


# -- Derived Feature Computation (same logic as label_data.py) ----------------
def compute_derived_features(sample: dict) -> dict:
    """
    Recompute network_stability from raw inputs.
    Must mirror the logic in model/label_data.py exactly.
    Note: congestion_score is NOT included — it was removed during training
    to prevent target leakage.
    """
    sample["network_stability"] = (
        sample["signal_strength"] - sample["packet_loss"] * 10
    )
    return sample


# -- Core Prediction Function (importable by backend) -------------------------
def predict_sample(raw_sample: dict) -> dict:
    """
    Given a raw network sample dict, return prediction details.

    Args:
        raw_sample: dict with keys:
            signal_strength, bandwidth_usage, latency, packet_loss,
            num_users_in_zone, time_of_day

    Returns:
        dict with:
            predicted_class : str   ("HIGH" / "MEDIUM" / "LOW")
            confidence      : float (max class probability)
            class_probs     : dict  {class: probability}
            input_features  : dict  (all features including derived)
    """
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}.\n"
            "  -> Run  python model/train_model.py  first."
        )

    # Load model
    model = joblib.load(MODEL_PATH)

    # Compute derived features
    sample = compute_derived_features(raw_sample.copy())

    # Build feature DataFrame in canonical order
    X = pd.DataFrame([sample])[FEATURE_COLS]

    # Predict
    predicted_class = model.predict(X)[0]
    probabilities   = model.predict_proba(X)[0]
    class_labels    = model.classes_

    class_probs = {
        cls: round(float(prob), 4)
        for cls, prob in zip(class_labels, probabilities)
    }
    confidence = max(class_probs.values())

    return {
        "predicted_class": predicted_class,
        "confidence":      confidence,
        "class_probs":     class_probs,
        "input_features":  sample,
    }


# -- Demo Sample Data ----------------------------------------------------------
# Simulates a peak-hour Stadium scenario (replace with real API input)
RAW_SAMPLE = {
    "zone":              "Stadium",
    "signal_strength":   55.0,   # dBm  -- moderate signal
    "bandwidth_usage":    7.5,   # Mbps -- high usage
    "latency":          220.0,   # ms   -- high latency (peak hour)
    "packet_loss":        3.2,   # %    -- noticeable packet loss
    "num_users_in_zone":  280,   # users -- crowded Stadium
    "time_of_day":         20,   # 8 PM -- peak hour
}

# A second sample representing good-network conditions
GOOD_SAMPLE = {
    "zone":              "Library",
    "signal_strength":   85.0,
    "bandwidth_usage":    1.2,
    "latency":           45.0,
    "packet_loss":        0.3,
    "num_users_in_zone":  30,
    "time_of_day":         7,
}


# -- Main ----------------------------------------------------------------------
def main():
    print("=" * 55)
    print("  AI-Powered Network Intelligence System")
    print("  Prediction Module")
    print("=" * 55)

    samples = [
        ("Stadium -- Peak Hour  (congested)", RAW_SAMPLE),
        ("Library -- Off-Peak   (stable)",    GOOD_SAMPLE),
    ]

    for label, sample in samples:
        print(f"\n{'-' * 55}")
        print(f"  Scenario: {label}")
        print(f"{'-' * 55}")

        print("\n  Raw Input:")
        for k, v in sample.items():
            print(f"    {k:<22} = {v}")

        result = predict_sample(sample)

        print("\n  Derived Features (computed):")
        print(f"    network_stability  = {result['input_features']['network_stability']:.2f}")

        cls     = result["predicted_class"]
        tag     = {"HIGH": "[HIGH]", "MEDIUM": "[MEDIUM]", "LOW": "[LOW]"}.get(cls, cls)

        print(f"\n  >> Predicted Priority Class : {tag}")
        print(f"     Confidence              : {result['confidence'] * 100:.1f}%")
        print("\n  Class Probabilities:")
        for c, p in sorted(result["class_probs"].items(), key=lambda x: x[1], reverse=True):
            bar = "#" * int(p * 30)
            print(f"    {c:<8}  {p * 100:5.1f}%  {bar}")

    print(f"\n{'=' * 55}")
    print("  [OK] Prediction complete.")
    print("       Import predict_sample() for backend integration.\n")


if __name__ == "__main__":
    main()
