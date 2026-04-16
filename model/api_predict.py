"""
model/api_predict.py
====================
AI-Powered Network Intelligence System
Team 1 -- FastAPI Backend Integration

Run this server locally using:
  uvicorn model.api_predict:app --reload

Test it by navigating to:
  http://localhost:8000/docs
"""

import os
import joblib
import pandas as pd
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException

# Initialize App
app = FastAPI(
    title="Network Intelligence Priority API",
    description="Predicts traffic priority based on telemetry.",
    version="1.0.0"
)

# Load pipeline globally
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

model_pipeline = None

@app.on_event("startup")
def load_model():
    global model_pipeline
    if os.path.exists(MODEL_PATH):
        model_pipeline = joblib.load(MODEL_PATH)
    else:
        print("Warning: model.pkl not found. Train the model first.")

# Request Schema Structure
class NetworkPayload(BaseModel):
    zone: str
    signal_strength: float
    bandwidth_usage: float
    latency: float
    packet_loss: float
    num_users_in_zone: int
    time_of_day: int

@app.post("/predict")
def predict_priority(payload: NetworkPayload):
    if not model_pipeline:
        raise HTTPException(status_code=500, detail="Model is not loaded.")

    data_dict = payload.model_dump()
    
    # Calculate internally derived features first (since training had network_stability)
    data_dict["network_stability"] = data_dict["signal_strength"] - (data_dict["packet_loss"] * 10)

    # Note columns must match training exactly 
    # (The pipeline handles scale & encode automatically)
    df = pd.DataFrame([data_dict])
    
    try:
        predicted_class = model_pipeline.predict(df)[0]
        class_probs = model_pipeline.predict_proba(df)[0]
        classes = model_pipeline.classes_
        
        prob_dict = {cls: round(float(prob), 4) for cls, prob in zip(classes, class_probs)}
        
        return {
            "prediction": predicted_class,
            "confidence": max(prob_dict.values()),
            "probabilities": prob_dict,
            "processed_input": data_dict
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")

@app.get("/")
def health_check():
    return {"status": "Active", "model_loaded": model_pipeline is not None}
