import unittest

from browse import parse_browse_url
from nisar import bbox_of, parse_bounds, parse_cmr_entry, parse_footprint, snap_bounds
from runtime import from_js


class BoundsTests(unittest.TestCase):
    def test_parse_bounds_accepts_geographic_box(self):
        self.assertEqual(parse_bounds("-61,-4,-59,-2"), [-61.0, -4.0, -59.0, -2.0])

    def test_parse_bounds_rejects_invalid_order_and_out_of_range(self):
        self.assertIsNone(parse_bounds("-59,-4,-61,-2"))
        self.assertIsNone(parse_bounds("-181,-4,-59,-2"))

    def test_snap_bounds_expands_outward(self):
        self.assertEqual(snap_bounds([-60.91, -3.99, -59.01, -2.01]), [-61.0, -4.0, -59.0, -2.0])


class CmrParsingTests(unittest.TestCase):
    def test_parse_footprint_returns_latitude_longitude_pairs(self):
        self.assertEqual(
            parse_footprint([[["1 2 3 4 5 6 1 2"]]]),
            [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0], [1.0, 2.0]],
        )
        self.assertIsNone(parse_footprint([]))

    def test_parse_cmr_entry_selects_browse_channel_and_product(self):
        entry = {
            "id": "G123-ASF",
            "title": "granule title",
            "producer_granule_id": "NISAR_L2_PR_GCOV_TEST",
            "time_start": "2026-10-21T00:00:00Z",
            "polygons": [[["1 2 3 4 5 6 1 2"]]],
            "links": [
                {"rel": "browse#image", "href": "https://asf.alaska.edu/NISAR/test_LATLON_thumbnail.png"},
                {"rel": "native", "title": "NATIVE_A_HHHH.png", "href": "https://asf.alaska.edu/NISAR/test_NATIVE_A_HHHH.png"},
                {"rel": "data#h5", "href": "https://asf.alaska.edu/NISAR/test.h5"},
            ],
        }
        parsed = parse_cmr_entry(entry)
        self.assertEqual(parsed["title"], "NISAR_L2_PR_GCOV_TEST")
        self.assertEqual(parsed["browseChannels"][0]["polarization"], "HHHH")
        self.assertTrue(parsed["browseUrl"].endswith("_LATLON_thumbnail.png"))
        self.assertTrue(parsed["downloadUrl"].endswith(".h5"))
        self.assertEqual(bbox_of(parsed["footprint"]), {"west": 2.0, "south": 1.0, "east": 6.0, "north": 5.0})


class BrowseUrlTests(unittest.TestCase):
    def test_only_allowed_nisar_png_sources_are_accepted(self):
        allowed = "https://nisar.asf.earthdatacloud.nasa.gov/BROWSE/NISAR/file_LATLON_thumbnail.png"
        rejected = "https://example.com/NISAR/file_LATLON_thumbnail.png"
        self.assertEqual(parse_browse_url(allowed), allowed)
        self.assertIsNone(parse_browse_url(rejected))


class RuntimeConversionTests(unittest.TestCase):
    def test_from_js_keeps_native_d1_rows(self):
        rows = [{"id": "G123-ASF"}]
        self.assertIs(from_js(rows), rows)


if __name__ == "__main__":
    unittest.main()
