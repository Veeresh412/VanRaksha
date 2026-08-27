import os
import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import pandas as pd
from hotzone.ingestors.isro_ingestor import load_isro_data
from hotzone.ingestors.gfw_ingestor import load_gfw_data
from hotzone.ingestors.flag_ingestor import load_flag_history
from hotzone.scorer import compute_risk_scores
from hotzone.hotzone_classifier import classify_hotzones
from hotzone.report_generator import generate_report

class TestHotzonePredictor(unittest.TestCase):

    def test_isro_ingestor_empty_path_returns_empty_list(self):
        """Point ingestor at non-existent directory. Assert returns [] without raising exception."""
        res = load_isro_data("non_existent_path_12345")
        self.assertEqual(res, [])

    @patch("hotzone.ingestors.gfw_ingestor.os.path.exists")
    @patch("hotzone.ingestors.gfw_ingestor.glob.glob")
    @patch("hotzone.ingestors.gfw_ingestor.pd.read_csv")
    def test_gfw_ingestor_filters_by_lookback_days(self, mock_read_csv, mock_glob, mock_exists):
        """Mock CSV with alerts from 2 years ago and 7 days ago. Assert only the recent alert is returned."""
        mock_exists.return_value = True
        mock_glob.return_value = ["fake_gfw.csv"]
        now = datetime.now()
        recent_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        old_date = (now - timedelta(days=730)).strftime("%Y-%m-%d")

        df = pd.DataFrame([
            {"latitude": 21.93, "longitude": 86.73, "alert_date": recent_date},
            {"latitude": 21.95, "longitude": 86.75, "alert_date": old_date},
        ])
        mock_read_csv.return_value = df

        res = load_gfw_data("fake_dir")
        self.assertEqual(len(res), 1)
        self.assertEqual(res[0]["lat"], 21.93)

    @patch("hotzone.ingestors.flag_ingestor.create_engine")
    def test_flag_ingestor_db_failure_returns_empty(self, mock_create_engine):
        """Mock DB connection to raise exception. Assert returns [] without raising exception."""
        mock_create_engine.side_effect = Exception("DB Connection Refused")
        res = load_flag_history("sqlite:///invalid.db")
        self.assertEqual(res, [])

    @patch("hotzone.scorer.load_isro_data")
    @patch("hotzone.scorer.load_gfw_data")
    @patch("hotzone.scorer.load_flag_history")
    def test_scorer_all_sources_empty_returns_empty(self, mock_flag, mock_gfw, mock_isro):
        """Mock all three ingestors returning []. Assert compute_risk_scores returns []."""
        mock_flag.return_value = []
        mock_gfw.return_value = []
        mock_isro.return_value = []

        res = compute_risk_scores("mayurbhanj")
        self.assertEqual(res, [])

    @patch("hotzone.scorer.os.path.exists")
    @patch("hotzone.scorer.load_isro_data")
    @patch("hotzone.scorer.load_gfw_data")
    @patch("hotzone.scorer.load_flag_history")
    def test_scorer_single_cell_correct_formula(self, mock_flag, mock_gfw, mock_isro, mock_exists):
        """Mock one grid cell with known values for all factors. Assert risk_score matches expected formula output."""
        mock_exists.return_value = False
        mock_flag.return_value = [{"lat": 21.93, "lng": 86.73, "value": 1.0}]
        mock_gfw.return_value = [{"lat": 21.93, "lng": 86.73, "value": 1.0}]
        mock_isro.return_value = [{"district": "mayurbhanj", "lat": 21.93, "lng": 86.73, "value": 1.0}]

        # Expected formula: 0.30*1.0 + 0.25*1.0 + 0.20*1.0 + 0.15*0.2 + 0.10*0.2 = 0.30 + 0.25 + 0.20 + 0.03 + 0.02 = 0.80
        res = compute_risk_scores("mayurbhanj")
        self.assertEqual(len(res), 1)
        self.assertAlmostEqual(res[0]["risk_score"], 0.80, delta=0.01)

    @patch("hotzone.scorer.os.path.exists")
    @patch("hotzone.scorer.load_isro_data")
    @patch("hotzone.scorer.load_gfw_data")
    @patch("hotzone.scorer.load_flag_history")
    def test_scorer_dominant_factor_correct(self, mock_flag, mock_gfw, mock_isro, mock_exists):
        """Mock a cell where historical_flags is clearly the highest weighted contribution."""
        mock_exists.return_value = False
        mock_flag.return_value = [{"lat": 21.93, "lng": 86.73, "value": 1.0}]
        mock_gfw.return_value = [{"lat": 21.93, "lng": 86.73, "value": 0.1}]
        mock_isro.return_value = [{"lat": 21.93, "lng": 86.73, "value": 0.1}]

        res = compute_risk_scores("mayurbhanj")
        self.assertEqual(res[0]["dominant_factor"], "historical_flags")

    def test_classifier_high_threshold(self):
        """Mock scored cells with risk_score = 0.80. Assert classified as HIGH."""
        cells = [{"grid_lat": 21.93, "grid_lng": 86.73, "risk_score": 0.80, "dominant_factor": "historical_flags"}]
        classified = classify_hotzones(cells)
        self.assertEqual(len(classified["high_zones"]), 1)
        self.assertEqual(len(classified["medium_zones"]), 0)

    def test_classifier_medium_threshold(self):
        """Mock scored cells with risk_score = 0.50. Assert classified as MEDIUM."""
        cells = [{"grid_lat": 21.93, "grid_lng": 86.73, "risk_score": 0.50, "dominant_factor": "gfw_alerts"}]
        classified = classify_hotzones(cells)
        self.assertEqual(len(classified["high_zones"]), 0)
        self.assertEqual(len(classified["medium_zones"]), 1)

    def test_classifier_adjacent_cells_clustered(self):
        """Mock two adjacent HIGH cells. Assert they share the same hotzone cluster."""
        cells = [
            {"grid_lat": 21.93, "grid_lng": 86.73, "risk_score": 0.80, "dominant_factor": "historical_flags"},
            {"grid_lat": 21.94, "grid_lng": 86.74, "risk_score": 0.85, "dominant_factor": "historical_flags"},
        ]
        classified = classify_hotzones(cells)
        self.assertEqual(len(classified["high_zones"]), 1)
        self.assertEqual(classified["high_zones"][0]["cell_count"], 2)

    def test_report_generator_contains_disclaimer(self):
        """Call generate_report with mock classified zones. Assert legal disclaimer appears."""
        classified = {
            "high_zones": [{
                "hotzone_id": "HZ-HIGH-01",
                "centroid_lat": 21.93,
                "centroid_lng": 86.73,
                "avg_risk_score": 0.80,
                "dominant_factor": "historical_flags",
                "recommended_action": "Immediate attention recommended."
            }],
            "medium_zones": [],
            "low_zones": [],
            "summary": {"total_cells_analyzed": 1, "high_count": 1, "medium_count": 0, "low_count": 0}
        }
        report = generate_report(classified, "Mayurbhanj, Odisha")
        self.assertIn("does not constitute a legal determination", report)

if __name__ == "__main__":
    unittest.main()
