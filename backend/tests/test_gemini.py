import json
import unittest

from gemini import _parse_tour, _prompt, _validate_payload


class GeminiValidationTests(unittest.TestCase):
    def test_tour_requires_one_to_three_valid_passes(self):
        error, mode = _validate_payload(
            {
                "mode": "tour",
                "place": "Ouachita Mountains",
                "scenes": [
                    {"id": "G123-ASF", "date": "2026-01-02", "imageUrl": ""}
                ],
            }
        )
        self.assertEqual(error, "")
        self.assertEqual(mode, "tour")

    def test_explanation_requires_both_pass_images(self):
        error, mode = _validate_payload(
            {
                "mode": "explain",
                "place": "Amazon floodplain",
                "before": {"id": "G123-ASF", "date": "2026-01-02", "imageUrl": ""},
                "after": {"id": "G124-ASF", "date": "2026-02-02", "imageUrl": ""},
            }
        )
        self.assertTrue(error)
        self.assertIsNone(mode)


class GeminiOutputTests(unittest.TestCase):
    def test_tour_output_requires_the_expected_chapter_count(self):
        text = json.dumps({"chapters": ["A" * 25, "B" * 25, "C" * 25]})
        self.assertEqual(_parse_tour(text, 3), ["A" * 25, "B" * 25, "C" * 25])
        with self.assertRaises(ValueError):
            _parse_tour(text, 2)

    def test_prompts_keep_change_explanations_provisional(self):
        prompt = _prompt(
            {
                "place": "Mississippi Delta",
                "theme": "coastal wetlands",
                "before": {"id": "before", "date": "2026-01-02"},
                "after": {"id": "after", "date": "2026-02-02"},
            },
            "explain",
        )
        self.assertIn("Possible drivers", prompt)
        self.assertIn("not a measurement", prompt)


if __name__ == "__main__":
    unittest.main()
