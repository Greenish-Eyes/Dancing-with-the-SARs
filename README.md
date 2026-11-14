# Surface Signals — NISAR Earth change explorer

Surface Signals is an interactive map for exploring real NISAR scene coverage at four study areas and anywhere else on the map. It searches NASA's Common Metadata Repository (CMR) for the provisional Level 2 Geocoded Polarimetric Covariance (GCOV) collection, then displays scene footprints, acquisition dates, ASF browse images, and links to the source products.

The map uses Esri World Imagery. Drag or zoom to an area and choose **Search this area** to look up its NISAR passes. Choose a study site or a date window from 90 days through five years, or search all dates, to refresh the catalog results. Up to the 100 most recent scenes are shown per map extent. Select a footprint, timeline point, or scene to inspect the available browse images. When two or more passes are available, **Compare passes** opens a swipe comparison between their quicklooks; the play control animates chronologically through the timeline. Available polarimetric browse channels are called out for each selected pass. Site-specific radar context is presented as a hypothesis, not a measured change.

## Project layout

- `frontend/` contains the browser application.
- `backend/` contains the Python Cloudflare Worker and its API/data-access modules.
- `migrations/` contains the D1 schema.

## Run locally

```sh
uv sync
npx wrangler d1 migrations apply fieldnotes-db --local
uv run pywrangler dev --local
```

`--local` keeps development on local bindings and avoids the workers.dev subdomain required for remote preview mode. Alternatively, install dependencies with `python -m pip install -r backend/requirements.txt`, apply the local D1 migration, then run `pywrangler dev --local` from the activated environment.

Open the local URL printed by Wrangler. NASA CMR and the map and browse-image providers must be reachable for live data and imagery. Local D1 and R2 data are separate from the remote production resources. Run Python unit tests with `uv run --directory backend python -m unittest discover -s tests`.

Before deploying, create the configured R2 bucket if it does not exist:

```sh
npx wrangler r2 bucket create fieldnotes-images
```

## Data notes

- The catalog endpoint searches the public NISAR Provisional L2 GCOV v1 collection (`C2854338529-ASF`) through NASA CMR.
- Footprints and acquisition dates are returned by CMR. Browse imagery and product downloads are linked from the ASF DAAC.
- These products are provisional. Browse images support visual exploration, not quantitative change detection. Analyze calibrated product pixels before drawing conclusions about surface change.
- Polarization browse images are available when linked by a scene. Polarimetric channels vary by acquisition mode.
- The UI offers date windows through five years and an all-dates search. API date ranges may span up to ten years, and each map-extent search is capped at the 100 most recent scenes.

## Python data workflow

The attached notebook demonstrates NASA Earthdata searches with `earthaccess`, temporal and bounding-box filters, granule downloads, and array-based visualization for MODIS HDF4 data. This app applies the search pattern to NISAR GCOV through NASA CMR and returns NISAR metadata and ASF browse images. It does not reuse the notebook's MODIS-specific HDF4 reader or temperature scaling for NISAR products.

The notebook's `earthaccess.login()` is only needed for authenticated NASA data downloads; the app's public CMR catalog search does not need Earthdata credentials. Set `EARTHDATA_USERNAME` in your local shell before running the notebook and let `earthaccess` prompt for any missing credentials. Do not put account passwords in the Worker or repository.

## API

- `GET /api/nisar/granules?bbox=west,south,east,north&from=YYYY-MM-DD&to=YYYY-MM-DD` — search the GCOV collection; D1 provides a stored fallback if CMR is unavailable.
- `GET /api/nisar/browse?url=<encoded-ASF-or-NASA-PNG-URL>` — validate, proxy, and cache NISAR PNG browse images in R2.
- `GET /api/nisar/feed?site=amazon&limit=8` — list recently cataloged passes from D1.
- `POST /api/nisar/explain` — compare two browse images with Workers AI.
- An hourly Cron Trigger refreshes the four study-site catalogs into D1.
