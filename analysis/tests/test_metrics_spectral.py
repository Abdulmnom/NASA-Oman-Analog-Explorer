import numpy as np
import pytest

from analog.metrics.mineralogy import SERPENTINE_BAND, band_depth, mineral_metrics
from analog.metrics.surface import apparent_thermal_inertia, summary

WL = np.round(np.arange(1.50, 2.60, 0.01), 2)


def flat_cube(value=0.3, shape=(4, 4)):
    return np.full((WL.size, *shape), value)


def test_flat_spectrum_has_no_band_depth():
    assert np.allclose(band_depth(flat_cube(), WL, SERPENTINE_BAND), 0.0)


def test_absorption_detected_as_serpentine_not_carbonate():
    cube = flat_cube()
    cube[np.argmin(np.abs(WL - 2.32))] = 0.24  # 20% dip at 2.32 um only
    m = mineral_metrics(cube, WL)
    assert m["serpentine_index"] > 0.9
    assert m["carbonate_index"] == 0.0  # no 2.5 um band -> not carbonate


def test_bright_featureless_blue_slope_is_chloride():
    cube = np.linspace(0.6, 0.45, WL.size)[:, None, None] * np.ones((1, 3, 3))
    assert mineral_metrics(cube, WL)["chloride_index"] == pytest.approx(1.0)


def test_ati_drops_with_larger_temperature_swing():
    albedo = np.array([0.3, 0.3])
    ati = apparent_thermal_inertia(albedo, np.array([320.0, 340.0]), np.array([300.0, 300.0]))
    assert ati[0] > ati[1]


def test_summary_ignores_nan():
    assert summary(np.array([1.0, np.nan, 3.0])) == 2.0
