# READ THIS FIRST - Project Handoff

## What this project is
An AI-driven network intelligence system that predicts congestion trends and applies 5G slicing principles for smarter resource allocation in high-density environments.

## Why this matters
In crowded zones (college campus, stadium, events), network load spikes and critical communication suffers.
This project helps by predicting state and prioritizing traffic classes before failures get worse.

## Team modules
- Team 1: simulation and ML model training
- Team 2: backend APIs and slicing decision engine
- Team 3: dashboard and presentation

## Team 2 work added in this repo
- `app.py` - FastAPI backend with `/simulate`, `/predict`, `/allocate`, `/health`
- `model_service.py` - integrates Team 1 model with fallback heuristic
- `decision_engine.py` - traffic-slice allocation logic
- `README.md` - run instructions and endpoint examples

## How to run
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Open:
- `http://127.0.0.1:8000/docs`

## Model requirement
Expected model file path:
- `model/model.pkl`

Optional env override:
```bash
set MODEL_PATH=D:\path\to\model.pkl
```

If model is missing, API still works using heuristic prediction fallback.

## Endpoint purpose summary
- `/simulate`: creates a live simulated network snapshot and prediction output
- `/predict`: returns prediction for given telemetry input
- `/allocate`: applies slicing policy based on congestion label or prediction input

## Slicing policy intent
- HIGH congestion: strongest preference to high-priority traffic
- MEDIUM congestion: balanced distribution
- LOW congestion: broader sharing and lower restriction

## Final pitch line
The system uses AI plus 5G slicing principles to proactively improve communication reliability in high-density environments through predictive and priority-aware allocation.
