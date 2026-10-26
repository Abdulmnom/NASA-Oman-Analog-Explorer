"""Similarity index between an Earth site and a planetary target.

score_c   = mean over shared features of (1 - |norm_a - norm_b|)        (0..1)
overall   = sum(w_c * score_c) / sum(w_c)   over criteria with data on both sides
coverage  = sum(w_c available) / sum(w_c with w_c > 0)
res_mean  = sum(w_c * resfactor_c) / sum(w_c available)
confidence = coverage * res_mean

Mirrors web/src/lib/similarity.ts operation-for-operation so both give the same numbers.
"""

from __future__ import annotations

from typing import Any, Mapping, Optional

from .normalize import normalize_value, resolution_factor


def similarity(
    raw_a: Mapping[str, Optional[float]],
    raw_b: Mapping[str, Optional[float]],
    res_a: Mapping[str, Optional[float]],
    res_b: Mapping[str, Optional[float]],
    config: Mapping[str, Any],
    weights: Optional[Mapping[str, float]] = None,
) -> dict[str, Any]:
    criteria = config["criteria"]
    ranges = config["feature_ranges"]
    conf_cfg = config["confidence"]
    k = conf_cfg["resolution_k"]
    min_factor = conf_cfg["resolution_min_factor"]

    per_criterion: dict[str, Optional[float]] = {}
    num = 0.0
    den = 0.0
    total = 0.0
    res_num = 0.0

    for name, spec in criteria.items():
        w = float(weights[name]) if weights and name in weights else float(spec["weight"])
        if w > 0:
            total += w

        diffs_sum = 0.0
        count = 0
        for feature in spec["features"]:
            na = normalize_value(raw_a.get(feature), ranges[feature])
            nb = normalize_value(raw_b.get(feature), ranges[feature])
            if na is None or nb is None:
                continue
            diffs_sum += 1.0 - abs(na - nb)
            count += 1

        if count == 0:
            per_criterion[name] = None
            continue

        score = diffs_sum / count
        per_criterion[name] = score
        if w > 0:
            num += w * score
            den += w
            res_num += w * resolution_factor(res_a.get(name), res_b.get(name), k, min_factor)

    overall = num / den if den > 0 else None
    coverage = den / total if total > 0 else 0.0
    res_mean = res_num / den if den > 0 else 0.0
    return {
        "overall": overall,
        "confidence": coverage * res_mean,
        "coverage": coverage,
        "resolution_factor": res_mean,
        "per_criterion": per_criterion,
    }
