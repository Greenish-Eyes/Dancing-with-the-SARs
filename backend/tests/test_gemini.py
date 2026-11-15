import json
import unittest

from gemini import (
    DEFAULT_MODEL,
    _parse_tour,
    _model_candidates,
    _provider_error_message,
    _prompt,
    _request_body,
    _response_text,
    _validate_payload,
)


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
    def test_low_latency_model_falls_back_to_supported_flash_model(self):
        self.assertEqual(
            _model_candidates(DEFAULT_MODEL),
            [DEFAULT_MODEL, "gemini-3.6-flash"],
        )
        self.assertEqual(_model_candidates("gemini-3.6-flash"), ["gemini-3.6-flash"])

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

    def test_interactions_request_supports_images_and_structured_tours(self):
        body = _request_body(
            "gemini-2.5-flash",
            "Tour prompt",
            [{"type": "image", "data": "encoded", "mime_type": "image/png"}],
            "tour",
        )
        self.assertEqual(body["model"], "gemini-2.5-flash")
        self.assertEqual(body["input"][0], {"type": "text", "text": "Tour prompt"})
        self.assertEqual(body["input"][1]["type"], "image")
        self.assertEqual(body["response_format"]["mime_type"], "application/json")
        self.assertFalse(body["store"])

    def test_interactions_response_reads_model_output_text(self):
        text = _response_text(
            {
                "steps": [
                    {"type": "user_input", "content": [{"type": "text", "text": "ignore"}]},
                    {"type": "model_output", "content": [{"type": "text", "text": "Answer"}]},
                ]
            }
        )
        self.assertEqual(text, "Answer")

    def test_provider_error_message_redacts_credentials(self):
        message = _provider_error_message(
            '{"error":{"message":"Invalid key SECRET_VALUE for model."}}',
            "SECRET_VALUE",
        )
        self.assertEqual(message, "Invalid key [redacted] for model.")


if __name__ == "__main__":
    unittest.main()
