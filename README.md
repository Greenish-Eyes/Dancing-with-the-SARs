# Fieldnotes — NISAR Earth change explorer

Fieldnotes is an interactive map for exploring real NISAR scene coverage at four study areas and anywhere else on the map. It searches NASA's Common Metadata Repository (CMR) for the provisional Level 2 Geocoded Polarimetric Covariance (GCOV) collection, then displays scene footprints, acquisition dates, ASF browse images, and links to the source products.

The map uses OpenStreetMap and CARTO tiles. Drag or zoom to an area and choose **Search this area** to look up its NISAR passes. Choose a study site or date window to refresh the catalog results. Select a footprint, timeline point, or scene to inspect the available browse images. When two or more passes are available, **Compare with previous pass** places their browse images side by side.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Wrangler. NASA CMR and the map and browse-image providers must be reachable for live data and imagery.

## Data notes

- The catalog endpoint searches the public NISAR Provisional L2 GCOV v1 collection (`C2854338529-ASF`) through NASA CMR.
- Footprints and acquisition dates are returned by CMR. Browse imagery and product downloads are linked from the ASF DAAC.
- These products are provisional. Browse images support visual exploration, not quantitative change detection. Analyze calibrated product pixels before drawing conclusions about surface change.
- Polarization browse images are available when linked by a scene. Polarimetric channels vary by acquisition mode.
- The default API date range is supplied by the UI and limited to one year; results are capped at the 20 most recent scenes.

## API and docs

- `GET /api/nisar/granules?bbox=west,south,east,north&from=YYYY-MM-DD&to=YYYY-MM-DD` — search the GCOV collection.
- `GET /docs` — OpenAPI documentation for the example task routes.
