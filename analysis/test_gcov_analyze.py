import math, unittest
import numpy as np  # type: ignore[import-not-found]
import gcov_analyze as g


class Stats(unittest.TestCase):
    def test_noise_model_matches_speckle(self):
        rng = np.random.default_rng(0); L = 16
        a, b = rng.gamma(L, 1 / L, (400, 400)), rng.gamma(L, 1 / L, (400, 400))
        d, r = g.log_ratio(a, b, L)
        self.assertAlmostEqual(float(np.std(d)), r["noise_sigma_db"], delta=0.1)

    def test_multilook_makes_3db_change_detectable(self):
        rng = np.random.default_rng(1); L = 16
        a, b = rng.gamma(L, 1 / L, (400, 400)), 2 * rng.gamma(L, 1 / L, (400, 400))
        d, r = g.log_ratio(g.multilook(a, 4), g.multilook(b, 4), L * 16)
        self.assertGreater(r["significant_fraction"], 0.9)

    def test_rvi(self):
        self.assertAlmostEqual(float(g.rvi(np.array([1.0]), np.array([1.0]))[0]), 2.0)


if __name__ == "__main__":
    unittest.main()
