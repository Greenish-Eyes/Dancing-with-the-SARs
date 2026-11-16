"""Quantitative analysis of NISAR L2 GCOV products (HDF5). Run offline; not part of the Worker.

    pip install h5py numpy pyproj
    python analysis/gcov_analyze.py stats  scene.h5 [--bbox W S E N] [--looks 4]
    python analysis/gcov_analyze.py change before.h5 after.h5 [--bbox W S E N] [--looks 4] [--k 3]
    python analysis/gcov_analyze.py series scene1.h5 scene2.h5 ... [--bbox W S E N]

GCOV terms are linear-power covariance (gamma0 by default). Values are averaged in linear
power BEFORE converting to dB. Change detection requires the same track, frame and direction
(identical grid). Dataset paths follow the published GCOV layout; verify against your product
version's spec before publishing results. Provisional products: results are exploratory.
"""
import argparse, csv, json, math, sys
import numpy as np  # type: ignore[import-not-found]

GRID = "/science/LSAR/GCOV/grids/frequencyA"
DB = 10 / math.log(10)


def to_db(power):
    with np.errstate(divide="ignore", invalid="ignore"):
        return 10 * np.log10(power)


def multilook(a, n):
    """Block-average linear power, ignoring NaN/<=0 pixels."""
    if n <= 1:
        return a
    h, w = (a.shape[0] // n) * n, (a.shape[1] // n) * n
    b = a[:h, :w].reshape(h // n, n, w // n, n)
    return np.nanmean(b, axis=(1, 3))


def clean(power):
    p = power.astype("float64")
    p[~np.isfinite(p) | (p <= 0)] = np.nan
    return p


def rvi(hh, hv):
    """Dual-pol radar vegetation index, 4*HV/(HH+HV), linear power."""
    return 4 * hv / (hh + hv)


def stats(a):
    v = a[np.isfinite(a)]
    if v.size == 0:
        return {"n": 0}
    p = np.percentile(v, [5, 25, 50, 75, 95])
    return {"n": int(v.size), "mean": float(v.mean()), "std": float(v.std()),
            "p05": float(p[0]), "p25": float(p[1]), "median": float(p[2]), "p75": float(p[3]), "p95": float(p[4])}


def log_ratio(before, after, eq_looks, k=3.0):
    """dB difference plus significance. For L equivalent looks, var(ln I) ~ 1/L, so the
    log-ratio of two independent intensities has sigma_dB ~ 4.343*sqrt(2/L). Assumes
    uncorrelated looks; treat the threshold as a lower bound on the true noise."""
    d = to_db(after) - to_db(before)
    sigma = DB * math.sqrt(2.0 / max(eq_looks, 1))
    sig = np.abs(d) > k * sigma
    valid = np.isfinite(d)
    return d, {"noise_sigma_db": sigma, "threshold_db": k * sigma, "k": k,
               "valid_pixels": int(valid.sum()),
               "significant_fraction": float(sig[valid].mean()) if valid.any() else None,
               "increase_fraction": float((d[valid] > k * sigma).mean()) if valid.any() else None,
               "decrease_fraction": float((d[valid] < -k * sigma).mean()) if valid.any() else None,
               "diff_db": stats(d)}


def load(path, pol, bbox=None):
    import h5py  # type: ignore[import-not-found]
    with h5py.File(path, "r") as f:
        g = f[GRID]
        x, y = g["xCoordinates"][:], g["yCoordinates"][:]
        sl = (slice(None), slice(None))
        if bbox:
            from pyproj import Transformer  # type: ignore[import-not-found]
            epsg = int(g["projection"][()]) if g["projection"].shape == () else int(g["projection"].attrs["epsg_code"])
            t = Transformer.from_crs(4326, epsg, always_xy=True)
            x0, y0 = t.transform(bbox[0], bbox[1]); x1, y1 = t.transform(bbox[2], bbox[3])
            xi = np.where((x >= min(x0, x1)) & (x <= max(x0, x1)))[0]
            yi = np.where((y >= min(y0, y1)) & (y <= max(y0, y1)))[0]
            if xi.size == 0 or yi.size == 0:
                raise SystemExit("bbox does not intersect this scene")
            sl = (slice(yi[0], yi[-1] + 1), slice(xi[0], xi[-1] + 1))
        look = g["numberOfLooks"][sl] if "numberOfLooks" in g else None
        meta = {"file": path, "polarization": pol,
                "native_looks_median": float(np.nanmedian(look)) if look is not None else None,
                "x_spacing": float(g["xCoordinateSpacing"][()]), "grid_shape": [int(y[sl[0]].size), int(x[sl[1]].size)]}
        return clean(g[pol][sl]), (x[sl[1]], y[sl[0]]), meta


def cmd_stats(a):
    hh, c, meta = load(a.files[0], "HHHH", a.bbox); hv, _, _ = load(a.files[0], "HVHV", a.bbox)
    hh, hv = multilook(hh, a.looks), multilook(hv, a.looks)
    print(json.dumps({**meta, "HH_dB": stats(to_db(hh)), "HV_dB": stats(to_db(hv)),
                      "HV_over_HH_dB": stats(to_db(hv) - to_db(hh)), "RVI": stats(rvi(hh, hv)),
                      "multilook_block": a.looks}, indent=1))


def cmd_change(a):
    if len(a.files) != 2:
        raise SystemExit("change needs exactly two files")
    out = {}
    (b, cb, mb), (n, cn, mn) = load(a.files[0], a.pol, a.bbox), load(a.files[1], a.pol, a.bbox)
    if b.shape != n.shape or not (np.array_equal(cb[0], cn[0]) and np.array_equal(cb[1], cn[1])):
        raise SystemExit("Grids differ: scenes must share track, frame and direction. Refusing to difference.")
    eq = (mb["native_looks_median"] or 1) * a.looks ** 2
    d, res = log_ratio(multilook(b, a.looks), multilook(n, a.looks), eq, a.k)
    np.save("change_db.npy", d)
    print(json.dumps({"before": mb, "after": mn, "equivalent_looks": eq, **res, "saved": "change_db.npy"}, indent=1))


def cmd_series(a):
    w = csv.writer(sys.stdout)
    w.writerow(["file", "pol", "mean_dB", "median_dB", "std_dB", "valid_pixels"])
    for f in a.files:
        for pol in ("HHHH", "HVHV"):
            p, _, _ = load(f, pol, a.bbox); s = stats(to_db(multilook(p, a.looks)))
            w.writerow([f, pol, s.get("mean"), s.get("median"), s.get("std"), s.get("n")])


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=["stats", "change", "series"]); ap.add_argument("files", nargs="+")
    ap.add_argument("--bbox", type=float, nargs=4, metavar=("W", "S", "E", "N"))
    ap.add_argument("--looks", type=int, default=4, help="block-average factor (pixels per side)")
    ap.add_argument("--pol", default="HVHV"); ap.add_argument("--k", type=float, default=3.0)
    args = ap.parse_args()
    {"stats": cmd_stats, "change": cmd_change, "series": cmd_series}[args.cmd](args)
