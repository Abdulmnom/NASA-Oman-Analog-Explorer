"""Unit/scale normalisation shared by the similarity index.

Mirrors web/src/lib/similarity.ts - keep the two in sync (tests/test_parity.py checks it).
"""

from __future__ import annotations

import math
from typing import Mapping, Optional

Raw = Mapping[str, Optional[float]]


def normalize_value(value: Optional[float], value_range: tuple[float, float]) -> Optional[float]:
    """Map a raw value to 0..1 with a fixed range, clipping outliers. None stays None."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    lo, hi = value_range
    t = (value - lo) / (hi - lo)
    return min(1.0, max(0.0, t))


def normalize_site(raw: Raw, feature_ranges: Mapping[str, tuple[float, float]]) -> dict[str, Optional[float]]:
    return {f: normalize_value(raw.get(f), tuple(r)) for f, r in feature_ranges.items()}


def resolution_factor(res_a: Optional[float], res_b: Optional[float], k: float, min_factor: float) -> float:
    """1.0 when both datasets share a resolution, falling as the ratio grows (floored)."""
    if not res_a or not res_b:
        return 1.0
    return max(min_factor, 1.0 - k * abs(math.log2(res_a / res_b)))
