from __future__ import annotations

import random
from typing import Any, Dict, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from decision_engine import SliceDemand, allocate_slices
from model_service import model_service
from simulation.simulation import generate_row

CongestionLabel = Literal["HIGH", "MEDIUM", "LOW"]


class PredictPayload(BaseModel):
    zone: str = Field(..., min_length=1)
    signal_strength: float = Field(..., ge=0)
    bandwidth_usage: float = Field(..., ge=0)
    latency: float = Field(..., ge=0)
    packet_loss: float = Field(..., ge=0)
    num_users_in_zone: int = Field(..., ge=0)
    time_of_day: int = Field(..., ge=0, le=23)


class SimulatePayload(BaseModel):
    zone: Optional[str] = None
    signal_strength: Optional[float] = Field(default=None, ge=0)
    bandwidth_usage: Optional[float] = Field(default=None, ge=0)
    latency: Optional[float] = Field(default=None, ge=0)
    packet_loss: Optional[float] = Field(default=None, ge=0)
    num_users_in_zone: Optional[int] = Field(default=None, ge=0)
    time_of_day: Optional[int] = Field(default=None, ge=0, le=23)


class DemandPayload(BaseModel):
    high_priority_mbps: float = Field(..., ge=0)
    medium_priority_mbps: float = Field(..., ge=0)
    low_priority_mbps: float = Field(..., ge=0)


class AllocatePayload(BaseModel):
    total_bandwidth_mbps: float = Field(..., gt=0)
    demand_mbps: DemandPayload
    congestion_label: Optional[CongestionLabel] = None
    prediction_features: Optional[PredictPayload] = None


app = FastAPI(
    title="AI Network System - Team 2 Backend",
    description="Simulation, congestion prediction, and 5G slicing allocation APIs.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _simulation_with_overrides(payload: SimulatePayload | None) -> Dict[str, Any]:
    base = generate_row(random.randint(0, 100000))
    if payload is None:
        return base

    override = payload.model_dump(exclude_none=True)
    base.update(override)
    return base


def _rounded_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for key, value in data.items():
        if isinstance(value, float):
            out[key] = round(value, 3)
        else:
            out[key] = value
    return out


@app.get("/")
def root() -> Dict[str, Any]:
    return {
        "service": "AI Network System Backend",
        "endpoints": ["/simulate", "/predict", "/allocate", "/health"],
    }


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "model_available": model_service.model_available,
        "model_path": model_service.model_path,
    }


@app.post("/simulate")
def simulate(payload: SimulatePayload | None = None) -> Dict[str, Any]:
    simulation = _simulation_with_overrides(payload)
    prediction = model_service.predict_network_state(simulation)

    return {
        "simulation": _rounded_dict(simulation),
        "prediction": prediction.to_dict(),
    }


@app.post("/predict")
def predict(payload: PredictPayload) -> Dict[str, Any]:
    features = payload.model_dump()
    prediction = model_service.predict_network_state(features)

    return {
        "input": features,
        "prediction": prediction.to_dict(),
    }


@app.post("/allocate")
def allocate(payload: AllocatePayload) -> Dict[str, Any]:
    selected_label = payload.congestion_label
    label_source = "manual"
    prediction_details: Dict[str, Any] | None = None

    if selected_label is None and payload.prediction_features is None:
        raise HTTPException(
            status_code=400,
            detail="Provide either congestion_label or prediction_features.",
        )

    if selected_label is None and payload.prediction_features is not None:
        predict_input = payload.prediction_features.model_dump()
        prediction = model_service.predict_network_state(predict_input)
        selected_label = prediction.congestion_label
        label_source = prediction.source
        prediction_details = {
            "input": predict_input,
            "output": prediction.to_dict(),
        }

    demand = SliceDemand(
        high_priority_mbps=payload.demand_mbps.high_priority_mbps,
        medium_priority_mbps=payload.demand_mbps.medium_priority_mbps,
        low_priority_mbps=payload.demand_mbps.low_priority_mbps,
    )

    allocation = allocate_slices(
        total_bandwidth_mbps=payload.total_bandwidth_mbps,
        demand=demand,
        congestion_label=selected_label,
    )

    demand_total = (
        payload.demand_mbps.high_priority_mbps
        + payload.demand_mbps.medium_priority_mbps
        + payload.demand_mbps.low_priority_mbps
    )
    served = (
        allocation["high_priority_mbps"]
        + allocation["medium_priority_mbps"]
        + allocation["low_priority_mbps"]
    )

    return {
        "congestion_label": selected_label,
        "label_source": label_source,
        "demand_mbps": payload.demand_mbps.model_dump(),
        "allocation": _rounded_dict(allocation),
        "demand_served_pct": round((served / demand_total) * 100.0, 2) if demand_total > 0 else 0.0,
        "prediction_details": prediction_details,
    }
