import numpy as np
import pytest

from analog.metrics.terrain import relief_m, resample_block_mean, roughness_rms_m, slope_deg, terrain_metrics


def test_slope_of_tilted_plane():
    res = 30.0
    rows, cols = np.indices((50, 50))
    dem = cols * res * np.tan(np.radians(10))  # 10 degree ramp toward +x
    assert np.allclose(slope_deg(dem, res), 10.0, atol=1e-6)


def test_plane_has_zero_roughness():
    rows, cols = np.indices((60, 60))
    dem = 2.0 * rows + 0.5 * cols + 100
    assert roughness_rms_m(dem, 30.0, window_m=600) == pytest.approx(0.0, abs=1e-6)


def test_relief_of_step():
    dem = np.zeros((20, 20))
    dem[:, 10:] = 250.0
    assert relief_m(dem, 30.0, window_m=600) == pytest.approx(250.0)


def test_resample_block_mean_averages():
    dem = np.arange(16, dtype=float).reshape(4, 4)
    out = resample_block_mean(dem, 1.0, 2.0)
    assert out.shape == (2, 2)
    assert out[0, 0] == pytest.approx(np.mean([0, 1, 4, 5]))


def test_resample_rejects_upsampling():
    with pytest.raises(ValueError):
        resample_block_mean(np.zeros((4, 4)), 463.0, 30.0)


def test_terrain_metrics_keys_and_common_scale():
    rng = np.random.default_rng(0)
    dem = rng.normal(0, 5, size=(300, 300)).cumsum(axis=0)
    m = terrain_metrics(dem, native_res_m=30.0, common_res_m=463.0)
    assert set(m) == {"slope_deg", "roughness_m", "relief_m"}
    assert all(np.isfinite(v) and v >= 0 for v in m.values())
