"""Mineral indices from reflectance cubes (EMIT, ASTER SWIR, CRISM).

A cube is a numpy array shaped (bands, rows, cols) with matching `wavelengths_um`.
Indices are band depths (0 = no absorption) turned into a 0..1 abundance proxy by taking
the fraction of valid pixels above a detection threshold, weighted by mean depth.
"""

from __future__ import annotations

import numpy as np

# (center, left shoulder, right shoulder) in micrometres
SERPENTINE_BAND = (2.32, 2.25, 2.38)
CARBONATE_BAND = (2.33, 2.27, 2.40)
CARBONATE_BAND_2 = (2.50, 2.43, 2.56)


def _band(cube: np.ndarray, wavelengths_um: np.ndarray, target: float) -> np.ndarray:
    return cube[int(np.argmin(np.abs(wavelengths_um - target)))].astype(float)


def band_depth(cube: np.ndarray, wavelengths_um: np.ndarray, band: tuple[float, float, float]) -> np.ndarray:
    """Classic band depth: 1 - R_center / continuum, continuum interpolated between shoulders."""
    center, left, right = band
    r_c, r_l, r_r = (_band(cube, wavelengths_um, w) for w in (center, left, right))
    t = (center - left) / (right - left)
    continuum = (1 - t) * r_l + t * r_r
    with np.errstate(divide="ignore", invalid="ignore"):
        depth = 1.0 - r_c / continuum
    return np.clip(depth, 0.0, 1.0)


def abundance_proxy(depth: np.ndarray, threshold: float = 0.02, saturation: float = 0.15) -> float:
    """Fraction of pixels with detectable absorption, scaled by how deep it is (0..1)."""
    valid = depth[np.isfinite(depth)]
    if valid.size == 0:
        return float("nan")
    detected = valid > threshold
    if not detected.any():
        return 0.0
    strength = min(1.0, float(np.mean(valid[detected])) / saturation)
    return float(detected.mean() * strength)


def chloride_index(cube: np.ndarray, wavelengths_um: np.ndarray) -> float:
    """Chlorides are bright and spectrally featureless with a blue SWIR slope.

    Proxy: fraction of pixels that are bright (R_1.6 > 0.35), have a negative 1.6->2.2 um
    slope, and show no 2.3 um absorption.
    """
    r16 = _band(cube, wavelengths_um, 1.60)
    r22 = _band(cube, wavelengths_um, 2.20)
    no_feature = band_depth(cube, wavelengths_um, CARBONATE_BAND) < 0.02
    mask = (r16 > 0.35) & (r22 < r16) & no_feature
    valid = np.isfinite(r16) & np.isfinite(r22)
    return float(mask[valid].mean()) if valid.any() else float("nan")


def mineral_metrics(cube: np.ndarray, wavelengths_um: np.ndarray) -> dict[str, float]:
    serp = abundance_proxy(band_depth(cube, wavelengths_um, SERPENTINE_BAND))
    carb_depth = np.minimum(
        band_depth(cube, wavelengths_um, CARBONATE_BAND),
        band_depth(cube, wavelengths_um, CARBONATE_BAND_2),
    )  # carbonates need BOTH bands; serpentine alone has no 2.5 um feature
    return {
        "serpentine_index": serp,
        "carbonate_index": abundance_proxy(carb_depth),
        "chloride_index": chloride_index(cube, wavelengths_um),
    }
