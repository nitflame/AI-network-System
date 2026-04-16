from __future__ import annotations

import os
from dataclasses import dataclass, asdict
from typing import Any, Dict, Mapping

from model.predict import predict_sample


@dataclass
class PredictionOutcome:
    priority_class: str
    congestion_label: str
    confidence: float
    source: str
    model_loaded: bool

    def to_dict(self) -> Dict[str, Any]:
        payload = asdict(self)
        payload["confidence"] = round(float(payload["confidence"]), 4)
        return payload


PRIORITY_TO_CONGESTION = {
    "LOW": "HIGH",
    "MEDIUM": "MEDIUM",
    "HIGH": "LOW",
}


class ModelService:
    def __init__(self, model_path: str | None = None) -> None:
        default_model_path = os.path.join("model", "model.pkl")
        self.model_path = model_path or os.getenv("MODEL_PATH", default_model_path)

    @property
    def model_available(self) -> bool:
        return os.path.exists(self.model_path)

    def predict_network_state(self, features: Mapping[str, Any]) -> PredictionOutcome:
        model_input = {
            "zone": str(features.get("zone", "Academic_Block")),
            "signal_strength": float(features.get("signal_strength", 70.0)),
            "bandwidth_usage": float(features.get("bandwidth_usage", 2.0)),
            "latency": float(features.get("latency", 50.0)),
            "packet_loss": float(features.get("packet_loss", 0.5)),
            "num_users_in_zone": int(features.get("num_users_in_zone", 60)),
            "time_of_day": int(features.get("time_of_day", 12)),
        }

        if self.model_available:
            try:
                prediction = predict_sample(model_input)
                priority = str(prediction["predicted_class"]).upper()
                if priority not in PRIORITY_TO_CONGESTION:
                    priority = "MEDIUM"
                return PredictionOutcome(
                    priority_class=priority,
                    congestion_label=PRIORITY_TO_CONGESTION[priority],
                    confidence=float(prediction["confidence"]),
                    source="model",
                    model_loaded=True,
                )
            except Exception:
                # Fall back to heuristic path when model input/schema mismatch happens.
                pass

        return self._heuristic_prediction(model_input)

    def _heuristic_prediction(self, features: Mapping[str, Any]) -> PredictionOutcome:
        latency = max(float(features.get("latency", 50.0)), 0.0)
        packet_loss = max(float(features.get("packet_loss", 0.5)), 0.0)
        users = max(int(features.get("num_users_in_zone", 60)), 0)
        usage = max(float(features.get("bandwidth_usage", 2.0)), 0.0)

        risk_score = (
            0.45 * min(latency / 250.0, 1.0)
            + 0.25 * min(packet_loss / 8.0, 1.0)
            + 0.20 * min(users / 350.0, 1.0)
            + 0.10 * min(usage / 10.0, 1.0)
        )

        if risk_score >= 0.68:
            congestion = "HIGH"
            priority = "LOW"
        elif risk_score >= 0.40:
            congestion = "MEDIUM"
            priority = "MEDIUM"
        else:
            congestion = "LOW"
            priority = "HIGH"

        confidence = max(0.55, min(0.96, 0.55 + abs(risk_score - 0.5)))

        return PredictionOutcome(
            priority_class=priority,
            congestion_label=congestion,
            confidence=confidence,
            source="heuristic",
            model_loaded=False,
        )


model_service = ModelService()
