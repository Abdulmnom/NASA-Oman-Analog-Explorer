import json

import numpy as np

from analog import export
from analog.compute import LIANG_MODIS, LIANG_OFFSET, liang_albedo


def test_liang_albedo_of_uniform_surface():
    bands = {b: np.full((2, 2), 0.3) for b in LIANG_MODIS}
    expected = 0.3 * sum(LIANG_MODIS.values()) + LIANG_OFFSET
    assert np.allclose(liang_albedo(bands), expected)


def _site(sid, metrics):
    return {"id": sid, "body": "mars", "sources": {"terrain": ["MOLA", "HiRISE DTM"]},
            "resolution_m": {"terrain": 463, "surface": 100}, "provisional_metrics": metrics}


def test_partial_measurement_keeps_site_provisional(tmp_path, monkeypatch):
    monkeypatch.setattr(export, "METRICS_DIR", tmp_path)
    (tmp_path / "a.json").write_text(json.dumps({
        "metrics": {"slope_deg": 2.5, "albedo": 0.17},
        "sources": {"surface": ["TES albedo"]},
        "resolution_m": {"surface": 7410},
    }))
    [site] = export.prepare_sites([_site("a", {"slope_deg": 3, "albedo": 0.2, "carbonate_index": 0.4})])
    assert site["raw"] == {"slope_deg": 2.5, "albedo": 0.17, "carbonate_index": 0.4}
    assert site["measured"] == ["albedo", "slope_deg"]
    assert site["provisional"] is True
    assert site["sources"] == {"terrain": ["MOLA", "HiRISE DTM"], "surface": ["TES albedo"]}
    assert site["resolution_m"] == {"terrain": 463, "surface": 7410}
    assert export.measured_share([site]) == round(2 / 3, 4)


def test_null_metrics_do_not_count_as_missing(tmp_path, monkeypatch):
    monkeypatch.setattr(export, "METRICS_DIR", tmp_path)
    (tmp_path / "moon.json").write_text(json.dumps({"metrics": {"slope_deg": 20.0}}))
    [site] = export.prepare_sites([_site("moon", {"slope_deg": 10, "albedo": None})])
    assert site["provisional"] is False


def test_site_without_pipeline_output_is_provisional(tmp_path, monkeypatch):
    monkeypatch.setattr(export, "METRICS_DIR", tmp_path)
    [site] = export.prepare_sites([_site("b", {"slope_deg": 3})])
    assert site["measured"] == [] and site["provisional"] is True
