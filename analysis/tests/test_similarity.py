import pytest

from analog.export import build, load_config
from analog.similarity import similarity

CONFIG = load_config()
FULL = {
    "slope_deg": 5, "roughness_m": 20, "relief_m": 300,
    "serpentine_index": 0.3, "carbonate_index": 0.4, "chloride_index": 0.1,
    "albedo": 0.25, "thermal_inertia": 500,
}
RES = {"terrain": 30, "mineralogy": 60, "surface": 500}


def test_identical_sites_score_one_with_full_confidence():
    r = similarity(FULL, FULL, RES, RES, CONFIG)
    assert r["overall"] == pytest.approx(1.0)
    assert r["confidence"] == pytest.approx(1.0)


def test_symmetric():
    other = {**FULL, "slope_deg": 20, "albedo": 0.1}
    a = similarity(FULL, other, RES, RES, CONFIG)
    b = similarity(other, FULL, RES, RES, CONFIG)
    assert a["overall"] == pytest.approx(b["overall"])


def test_missing_criteria_lower_confidence_not_score():
    terrain_only = {k: (v if k in ("slope_deg", "roughness_m", "relief_m") else None) for k, v in FULL.items()}
    r = similarity(FULL, terrain_only, RES, RES, CONFIG)
    assert r["overall"] == pytest.approx(1.0)
    assert r["per_criterion"]["mineralogy"] is None
    assert r["coverage"] == pytest.approx(0.4)
    assert r["confidence"] < 0.5


def test_resolution_mismatch_lowers_confidence():
    coarse = {"terrain": 463, "mineralogy": 60, "surface": 500}
    assert similarity(FULL, FULL, RES, coarse, CONFIG)["confidence"] < 1.0


def test_custom_weights_change_result():
    other = {**FULL, "serpentine_index": 0.9}
    terrain_heavy = similarity(FULL, other, RES, RES, CONFIG, {"terrain": 1, "mineralogy": 0, "surface": 0})
    mineral_heavy = similarity(FULL, other, RES, RES, CONFIG, {"terrain": 0, "mineralogy": 1, "surface": 0})
    assert terrain_heavy["overall"] > mineral_heavy["overall"]


def test_zero_weights_give_no_score():
    r = similarity(FULL, FULL, RES, RES, CONFIG, {"terrain": 0, "mineralogy": 0, "surface": 0})
    assert r["overall"] is None and r["confidence"] == 0.0


def test_dataset_scores_every_pair_in_range():
    data = build()
    assert len(data["scores"]) == len(data["earth_sites"]) * len(data["targets"])
    for s in data["scores"]:
        assert s["overall"] is None or 0.0 <= s["overall"] <= 1.0
        assert 0.0 <= s["confidence"] <= 1.0
