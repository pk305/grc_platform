"""Risk criteria (ISO 31000 §6.3.4). Must stay in lockstep with the frontend's
risk-register level thresholds — likelihood × impact, both 1-5.
"""

CRITICAL_THRESHOLD = 16
HIGH_THRESHOLD = 10
MEDIUM_THRESHOLD = 5


def level_for_score(likelihood: int, impact: int) -> str:
    score = likelihood * impact
    if score >= CRITICAL_THRESHOLD:
        return "critical"
    if score >= HIGH_THRESHOLD:
        return "high"
    if score >= MEDIUM_THRESHOLD:
        return "medium"
    return "low"
