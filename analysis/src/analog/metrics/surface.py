"""Surface physical properties: albedo and thermal inertia.

Mars (TES/THEMIS) and Moon (Diviner) publish thermal inertia maps directly. For Earth we
estimate it from MODIS albedo and day/night land-surface temperature using apparent
thermal inertia (ATI), calibrated with a simple linear fit to reference surfaces.
"""

from __future__ import annotations

import numpy as np

# ATI -> TI linear calibration (placeholder; refit on known dry sand / bedrock pixels).
ATI_TO_TI_SLOPE = 25000.0
ATI_TO_TI_OFFSET = 0.0


def summary(values: np.ndarray) -> float:
    """Robust site value: median of finite pixels."""
    finite = values[np.isfinite(values)]
    return float(np.median(finite)) if finite.size else float("nan")


def apparent_thermal_inertia(albedo: np.ndarray, t_day_k: np.ndarray, t_night_k: np.ndarray) -> np.ndarray:
    """ATI = (1 - albedo) / (T_day - T_night). Larger day/night swing -> lower inertia."""
    delta = t_day_k.astype(float) - t_night_k.astype(float)
    with np.errstate(divide="ignore", invalid="ignore"):
        ati = (1.0 - albedo) / delta
    ati[delta <= 0] = np.nan
    return ati


def earth_surface_metrics(albedo: np.ndarray, t_day_k: np.ndarray, t_night_k: np.ndarray) -> dict[str, float]:
    ati = apparent_thermal_inertia(albedo, t_day_k, t_night_k)
    return {
        "albedo": summary(albedo),
        "thermal_inertia": summary(ati * ATI_TO_TI_SLOPE + ATI_TO_TI_OFFSET),
    }


def planetary_surface_metrics(albedo: np.ndarray, thermal_inertia: np.ndarray) -> dict[str, float]:
    return {"albedo": summary(albedo), "thermal_inertia": summary(thermal_inertia)}
