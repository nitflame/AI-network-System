"""
model/train_model.py
====================
AI-Powered Network Intelligence System
Team 1 -- Model Training Module

Upgrades:
- Using ColumnTransformer for categorical (zone) and numeric scaling
- Building an sklearn Pipeline
- RandomizedSearchCV for hyperparameter tuning
"""

import os
import sys
import joblib
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.metrics import classification_report, accuracy_score

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_PATH  = os.path.join(BASE_DIR, "..", "data", "processed_data.csv")
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

# Note we now include string 'zone' and removed the cheat code 'congestion_score'
NUMERIC_FEATURES = [
    "signal_strength", "bandwidth_usage", "latency", 
    "packet_loss", "num_users_in_zone", "time_of_day", "network_stability"
]
CATEGORICAL_FEATURES = ["zone"]
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
TARGET_COL = "priority_class"

def train():
    print("=" * 55)
    print("  AI-Powered Network Intelligence System")
    print("  Pipeline Training & Tuning Module")
    print("=" * 55)

    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Missing {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    
    X = df[ALL_FEATURES]
    y = df[TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"\n[SPLIT] Train: {len(X_train)}  Test: {len(X_test)}")

    # 1. Build Preprocessor Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), NUMERIC_FEATURES),
            ('cat', OneHotEncoder(drop='first'), CATEGORICAL_FEATURES)
        ])

    # 2. Build full Pipeline
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('clf', RandomForestClassifier(class_weight="balanced", random_state=42))
    ])

    # 3. Hyperparameter Tuning Grid
    param_grid = {
        'clf__n_estimators': [100, 200, 300],
        'clf__max_depth': [None, 10, 20],
        'clf__min_samples_split': [2, 5],
    }

    print("\n[MODEL] Running RandomizedSearchCV (Tuning)...")
    search = RandomizedSearchCV(
        pipeline, param_distributions=param_grid, 
        n_iter=5, cv=3, scoring='accuracy', n_jobs=-1, random_state=42
    )
    
    search.fit(X_train, y_train)
    best_model = search.best_estimator_
    
    print(f"[OK] Best params: {search.best_params_}")

    # 4. Evaluate true ML performance (no leakage)
    y_pred = best_model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nTest Accuracy (No Data Leakage): {acc * 100:.2f}%\n")
    print(classification_report(y_test, y_pred))

    joblib.dump(best_model, MODEL_PATH)
    print(f"\n[SAVED] Packaged Model + Preprocessor saved -> {os.path.abspath(MODEL_PATH)}")

if __name__ == "__main__":
    train()
