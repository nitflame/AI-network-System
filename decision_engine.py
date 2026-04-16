from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Literal

CongestionLabel = Literal["HIGH", "MEDIUM", "LOW"]

BASE_PRIORITY_WEIGHTS = {
    "high_priority_mbps": 1.0,
    "medium_priority_mbps": 0.7,
    "low_priority_mbps": 0.4,
}

CONGESTION_ADJUSTMENTS = {
    "HIGH": {
        "high_priority_mbps": 1.35,
        "medium_priority_mbps": 0.85,
        "low_priority_mbps": 0.45,
    },
    "MEDIUM": {
        "high_priority_mbps": 1.10,
        "medium_priority_mbps": 1.00,
        "low_priority_mbps": 0.70,
    },
    "LOW": {
        "high_priority_mbps": 0.95,
        "medium_priority_mbps": 1.00,
        "low_priority_mbps": 0.90,
    },
}


@dataclass(frozen=True)
class SliceDemand:
    high_priority_mbps: float
    medium_priority_mbps: float
    low_priority_mbps: float


def _safe_float(value: float) -> float:
    return max(float(value), 0.0)


def _bounded_proportional_allocation(
    total_bandwidth_mbps: float,
    demand: Dict[str, float],
    scores: Dict[str, float],
) -> Dict[str, float]:
    allocation = {key: 0.0 for key in demand}
    remaining = _safe_float(total_bandwidth_mbps)
    active = {key for key, val in demand.items() if val > 0.0}

    while remaining > 1e-9 and active:
        score_total = sum(scores[key] for key in active)
        if score_total <= 1e-9:
            share = remaining / len(active)
            distributed = 0.0
            for key in list(active):
                need = demand[key] - allocation[key]
                grant = min(share, need)
                allocation[key] += grant
                distributed += grant
                if demand[key] - allocation[key] <= 1e-9:
                    active.remove(key)
            if distributed <= 1e-9:
                break
            remaining -= distributed
            continue

        distributed = 0.0
        for key in list(active):
            share = remaining * (scores[key] / score_total)
            need = demand[key] - allocation[key]
            grant = min(share, need)
            allocation[key] += grant
            distributed += grant
            if demand[key] - allocation[key] <= 1e-9:
                active.remove(key)

        if distributed <= 1e-9:
            break
        remaining -= distributed

    return allocation


def allocate_slices(
    total_bandwidth_mbps: float,
    demand: SliceDemand,
    congestion_label: CongestionLabel,
) -> Dict[str, float]:
    demand_map = {
        "high_priority_mbps": _safe_float(demand.high_priority_mbps),
        "medium_priority_mbps": _safe_float(demand.medium_priority_mbps),
        "low_priority_mbps": _safe_float(demand.low_priority_mbps),
    }

    demand_total = sum(demand_map.values())
    if demand_total <= 1e-9:
        return {
            "high_priority_mbps": 0.0,
            "medium_priority_mbps": 0.0,
            "low_priority_mbps": 0.0,
            "unallocated_mbps": _safe_float(total_bandwidth_mbps),
            "utilization_pct": 0.0,
        }

    label = str(congestion_label).upper()
    if label not in CONGESTION_ADJUSTMENTS:
        label = "MEDIUM"

    scores = {
        key: demand_map[key] * BASE_PRIORITY_WEIGHTS[key] * CONGESTION_ADJUSTMENTS[label][key]
        for key in demand_map
    }

    allocation = _bounded_proportional_allocation(_safe_float(total_bandwidth_mbps), demand_map, scores)
    allocated_total = sum(allocation.values())

    return {
        "high_priority_mbps": allocation["high_priority_mbps"],
        "medium_priority_mbps": allocation["medium_priority_mbps"],
        "low_priority_mbps": allocation["low_priority_mbps"],
        "unallocated_mbps": max(_safe_float(total_bandwidth_mbps) - allocated_total, 0.0),
        "utilization_pct": (allocated_total / _safe_float(total_bandwidth_mbps) * 100.0)
        if _safe_float(total_bandwidth_mbps) > 0
        else 0.0,
    }
