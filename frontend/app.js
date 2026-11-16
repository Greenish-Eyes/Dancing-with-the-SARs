const sites = {
	amazon: {
		name: "Amazon floodplain",
		theme: "seasonal flooding and forest structure along a large river floodplain",
		region: "AMAZONAS, BRAZIL",
		impactQuestion: "Where should field teams prioritize checks for seasonal inundation beneath forest canopy?",
		validationData: "river-stage and rainfall records, land-cover data, and calibrated repeat-pass products",
		headline: ["THE", "RHYTHM", "OF WATER"],
		eyebrow: "LIVE STUDY / WETLAND DYNAMICS",
		story: "Following seasonal inundation through the forest canopy.",
		fieldNote: "Seasonal river levels may shape wetland extent. Compare calibrated backscatter before treating a visual difference as change.",
		radarContext: {
			summary: "The long L-band wavelength can interact with woody trunks beneath canopy; flooded forest may produce a trunk–water double-bounce. Seasonal inundation is a hypothesis to test, not a flood measurement from this browse image.",
			HHHH: "HH co-polarization can emphasize trunk–water geometry, but vegetation structure and viewing geometry also affect the return.",
			HVHV: "HV cross-polarization is more sensitive to depolarizing canopy-volume scattering; compare it with HH and calibrated data when testing for inundation.",
		},
		hypotheses: [
			"Seasonal river stage and rainfall may change inundation beneath forest canopy; test this against water levels and repeat calibrated HH/HV observations.",
			"Vegetation structure and acquisition geometry can also change the return, so a browse-image difference alone is not evidence of flooding.",
		],
		center: [-3.1, -60.0],
		zoom: 7,
		bounds: [-61, -4, -59, -2],
	},
	louisiana: {
		name: "Mississippi Delta",
		theme: "coastal wetlands, marsh loss, and river delta flooding",
		region: "LOUISIANA, USA",
		impactQuestion: "Where should coastal teams investigate possible changes along the marsh–water boundary?",
		validationData: "tide and water-level records, elevation, land-cover data, and calibrated repeat-pass products",
		headline: ["WHERE", "LAND", "MEETS TIDE"],
		eyebrow: "LIVE STUDY / COASTAL WETLANDS",
		story: "Following the shifting edge between tidal marsh and open water.",
		fieldNote: "Wetland boundaries respond to tides, storms, and sediment supply. Use repeat calibrated observations to investigate possible change.",
		radarContext: {
			summary: "Marsh stems, open water, soil moisture, and tides all shape L-band returns. River discharge, storms, subsidence, levees, and wetland restoration are possible drivers to investigate with repeat observations.",
			HHHH: "HH co-polarization can emphasize water–stem or building–ground double-bounce; that pattern does not uniquely identify marsh loss or flooding.",
			HVHV: "HV cross-polarization is more sensitive to depolarizing vegetation-volume scattering; a difference may reflect marsh structure or moisture, not necessarily lost wetland.",
		},
		hypotheses: [
			"Tides, storms, river discharge, and subsidence may alter the marsh–water boundary.",
			"Levees, navigation channels, wetland restoration, and sediment supply are human or managed drivers to investigate with tide, elevation, and land-cover records.",
		],
		center: [29.5, -90.0],
		zoom: 7,
		bounds: [-91, 28, -89, 31],
	},
	iceland: {
		name: "South Iceland",
		theme: "glaciers, snow and ice, and volcanic terrain",
		region: "SOUTHERN REGION, ICELAND",
		impactQuestion: "Which ice and snow areas merit same-season follow-up observations?",
		validationData: "weather and snow records, glacier observations, and calibrated repeat-pass products",
		headline: ["ICE", "ON THE", "MOVE"],
		eyebrow: "LIVE STUDY / GLACIER DYNAMICS",
		story: "Exploring radar observations over ice, meltwater, and volcanic terrain.",
		fieldNote: "Radar returns over ice vary with melt, roughness, and snow conditions. A browse image alone cannot identify glacier motion.",
		radarContext: {
			summary: "Snow and ice returns vary with surface roughness, liquid water, and internal structure. Seasonal melt or changing ice-surface texture are hypotheses; compare repeat passes from similar seasons.",
			HHHH: "HH co-polarization emphasizes surface and geometry contributions; wet snow can strongly alter the return.",
			HVHV: "HV cross-polarization is more sensitive to depolarizing volume and rough-surface scattering; it is not a direct measure of glacier motion.",
		},
		hypotheses: [
			"Seasonal snowmelt, snow wetness, accumulation, and changing ice-surface roughness may alter radar returns.",
			"Use same-season repeats and independent glacier, weather, and optical observations to distinguish surface-condition changes from longer-term ice change.",
		],
		center: [64.0, -19.0],
		zoom: 7,
		bounds: [-20, 63, -18, 65],
	},
	jakarta: {
		name: "Jakarta basin",
		theme: "dense urban area with land subsidence and coastal flooding",
		region: "JAKARTA, INDONESIA",
		impactQuestion: "Where should investigators prioritize validation of possible surface or water-pattern changes?",
		validationData: "repeat-pass interferometry, ground-position measurements, and local water-level records",
		headline: ["A CITY", "AT THE", "WATER'S EDGE"],
		eyebrow: "LIVE STUDY / URBAN CHANGE",
		story: "Exploring radar observations across a growing coastal megacity.",
		fieldNote: "Urban radar returns depend on buildings, surface moisture, and viewing geometry. Measuring subsidence requires calibrated interferometric data.",
		radarContext: {
			summary: "Dense buildings, wet ground, and coastal water create different scattering paths. Groundwater extraction, land reclamation, drainage, and coastal flooding are possible drivers; subsidence requires repeat-pass InSAR, not browse-image contrast.",
			HHHH: "HH co-polarization can emphasize building–ground double-bounce; the return also depends on building orientation and look geometry.",
			HVHV: "HV cross-polarization is more sensitive to depolarizing and volume scattering from urban structure; it does not measure subsidence by itself.",
		},
		hypotheses: [
			"Groundwater extraction, land reclamation, drainage, and urban growth may influence subsidence risk and surface-water patterns.",
			"Coastal water levels and heavy rainfall can also change inundation; measuring subsidence requires repeat-pass InSAR and ground observations.",
		],
		center: [-6.2, 106.8],
		zoom: 8,
		bounds: [106, -7, 108, -5],
	},
};

const mapAreaStory = {
	name: "Selected map area",
	theme: "surface change across a user-selected region",
	region: "USER-DEFINED MAP EXTENT",
	impactQuestion: "What surface patterns in this area warrant closer investigation?",
	validationData: "local land-cover, weather, water-level, and elevation records alongside calibrated NISAR products",
	headline: ["A REGION", "IN", "MOTION"],
	eyebrow: "LIVE STUDY / USER-DEFINED AREA",
	story: "Explore NISAR observations across the current map extent.",
	fieldNote: "Potential physical and human drivers depend on local land cover and conditions. Treat browse-image differences as leads to investigate, not measured change.",
	radarContext: {
		summary: "L-band radar returns respond to moisture, roughness, surface structure, and viewing geometry. Use repeat, calibrated observations and local context to test possible changes.",
		HHHH: "HH co-polarization can emphasize surface geometry and double-bounce; it does not identify a unique cause of change.",
		HVHV: "HV cross-polarization is more sensitive to depolarizing volume scattering; compare it with HH and independent land-cover data.",
	},
	hypotheses: [
		"Possible drivers depend on local land cover, weather, water levels, and human activity; the geographic quicklooks alone cannot distinguish them.",
		"Compare calibrated repeat-pass NISAR data with local elevation, land-cover, and event records before drawing conclusions.",
	],
};

const map = L.map("map", { zoomControl: true, attributionControl: false }).setView(
	sites.amazon.center,
	sites.amazon.zoom,
);
const mapLayers = {
	satellite: {
		layer: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
			attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
			maxZoom: 19,
		}),
		attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
	},
	topographic: {
		layer: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
			attribution: "Topographic map © Esri, HERE, Garmin, Intermap, NGA, USGS, EPA",
			maxZoom: 19,
		}),
		attribution: "Topographic map © Esri, HERE, Garmin, Intermap, NGA, USGS, EPA",
	},
	hillshade: {
		layer: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}", {
			attribution: "Elevation hillshade © Esri",
			maxZoom: 16,
		}),
		attribution: "Elevation hillshade © Esri",
	},
};
let activeMapLayer = mapLayers.satellite.layer;
activeMapLayer.addTo(map);

const footprintLayer = L.featureGroup().addTo(map);
const siteMarker = L.circleMarker(sites.amazon.center, {
	radius: 4,
	color: "#d3f074",
	weight: 1,
	fillColor: "#d3f074",
	fillOpacity: 0.95,
}).addTo(map);

const ui = {
	site: document.getElementById("site-select"),
	dateWindow: document.getElementById("date-window"),
	placeSearchForm: document.getElementById("place-search-form"),
	placeQuery: document.getElementById("place-query"),
	placeSearchSubmit: document.getElementById("place-search-submit"),
	placeSearchStatus: document.getElementById("place-search-status"),
	placeSearchResults: document.getElementById("place-search-results"),
	mapLayer: document.getElementById("map-context-layer"),
	mapAttribution: document.getElementById("map-attribution"),
	message: document.getElementById("map-message"),
	sceneStatus: document.getElementById("scene-status"),
	sceneCount: document.getElementById("scene-count"),
	centerCoordinate: document.getElementById("center-coordinate"),
	mapCoordinates: document.getElementById("map-coordinates"),
	timeline: document.getElementById("timeline-track"),
	sceneList: document.getElementById("scene-list"),
	selectedIndex: document.getElementById("selected-index"),
	selectedDateCopy: document.getElementById("selected-date-copy"),
	previewLabel: document.getElementById("preview-channel-label"),
	preview: document.getElementById("preview-content"),
	channel: document.getElementById("channel-select"),
	channelAvailability: document.getElementById("channel-availability-list"),
	compare: document.getElementById("compare-button"),
	compareAI: document.getElementById("compare-ai"),
	compareCount: document.getElementById("compare-count"),
	compareInsight: document.getElementById("compare-insight"),
	download: document.getElementById("download-link"),
	explain: document.getElementById("explain-button"),
	explainPanel: document.getElementById("explain-panel"),
	fieldNoteAi: document.getElementById("field-note-ai"),
	fieldNoteAiOutput: document.getElementById("field-note-ai-output"),
	feedList: document.getElementById("feed-list"),
	feedStatus: document.getElementById("feed-status"),
	exportGranules: document.getElementById("export-granules"),
	missionSceneCount: document.getElementById("mission-scene-count"),
	missionDateRange: document.getElementById("mission-date-range"),
	missionWindow: document.getElementById("mission-window"),
	missionQuestion: document.getElementById("mission-question"),
	missionInsight: document.getElementById("mission-insight"),
	siteRegion: document.getElementById("site-region"),
	siteName: document.getElementById("site-name"),
	storyEyebrow: document.getElementById("story-eyebrow"),
	storyFirst: document.getElementById("story-first"),
	storyEmphasis: document.getElementById("story-emphasis"),
	storyLast: document.getElementById("story-last"),
	storyCopy: document.getElementById("story-copy"),
	fieldNoteCopy: document.getElementById("field-note-copy"),
	radarContextCopy: document.getElementById("radar-context-copy"),
	radarContextPass: document.getElementById("radar-context-pass"),
	storyOpen: document.getElementById("story-open"),
	storyDialog: document.getElementById("story-dialog"),
	storyClose: document.getElementById("story-close"),
	storyStepCount: document.getElementById("story-step-count"),
	storyStepLabel: document.getElementById("story-step-label"),
	storyStepTitle: document.getElementById("story-step-title"),
	storyStepCopy: document.getElementById("story-step-copy"),
	storyAiCopy: document.getElementById("story-ai-copy"),
	storyAiStatus: document.getElementById("story-ai-status"),
	storyHypotheses: document.getElementById("story-hypotheses"),
	storyMedia: document.getElementById("story-media"),
	storyPrevious: document.getElementById("story-prev"),
	storyNext: document.getElementById("story-next"),
	panelSceneCount: document.getElementById("panel-scene-count"),
	latestPassDate: document.getElementById("latest-pass-date"),
	latestPassHint: document.getElementById("latest-pass-hint"),
	selectedDateCopy: document.getElementById("selected-date-copy"),
	timelinePlay: document.getElementById("timeline-play"),
};

let granules = [];
let catalogStatus = "loading";
let selectedId = null;
let selectedChannel = "quicklook";
let compareMode = false;
let requestNumber = 0;
let explainNumber = 0;
let pendingSelectId = null;
let explainKey = null;
let timelineTimer = null;
let storySteps = [];
let storyStepIndex = 0;
let storyAiChapters = [];
let storyAiNumber = 0;
let fieldNoteRequestNumber = 0;
let compareInsightNumber = 0;
let compareInsightKey = null;
let customPlace = null;
let lastPlaceSearchAt = 0;
const polygonById = new Map();

function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
	return new Intl.DateTimeFormat("en", { timeZone: "UTC", ...options }).format(new Date(value));
}

function formatCoordinate(value, positive, negative) {
	return `${Math.abs(value).toFixed(1)}° ${value < 0 ? negative : positive}`;
}

function formatMapCoordinate(value, positive, negative) {
	const absolute = Math.abs(value);
	const degrees = Math.floor(absolute);
	const minutes = Math.round((absolute - degrees) * 60);
	return `${String(degrees).padStart(2, "0")}° ${String(minutes).padStart(2, "0")}′ ${value < 0 ? negative : positive}`;
}

function setMessage(text, state = "loading") {
	ui.message.classList.remove("hidden", "error");
	ui.message.querySelector("span:last-child").textContent = text;
	ui.message.querySelector(".spinner").style.display = state === "loading" ? "" : "none";
	if (state === "error") ui.message.classList.add("error");
	if (state === "hidden") ui.message.classList.add("hidden");
}

function updateMapCenter() {
	const center = map.getCenter();
	ui.centerCoordinate.textContent = `${formatCoordinate(center.lat, "N", "S")}, ${formatCoordinate(center.lng, "E", "W")}`;
	ui.mapCoordinates.textContent = `${formatMapCoordinate(center.lat, "N", "S")}   ${formatMapCoordinate(center.lng, "E", "W")}`;
}

function currentBounds() {
	const bounds = map.getBounds();
	return [
		Math.max(-180, bounds.getWest()),
		Math.max(-90, bounds.getSouth()),
		Math.min(180, bounds.getEast()),
		Math.min(90, bounds.getNorth()),
	];
}

function clearSceneLayers() {
	footprintLayer.clearLayers();
	polygonById.clear();
}

function selectGranule(id) {
	selectedId = id;
	compareMode = false;
	renderResults();
	if (timelineTimer !== null) {
		ui.timeline.querySelector(".timeline-item.active")?.scrollIntoView({
			block: "nearest",
			inline: "center",
			behavior: "smooth",
		});
	}
}

function getSelectedGranule() {
	return granules.find((granule) => granule.id === selectedId) ?? granules[0] ?? null;
}

function renderFootprints() {
	clearSceneLayers();
	for (const granule of granules) {
		if (!granule.footprint || granule.footprint.length < 4) continue;
		const selected = granule.id === selectedId;
		const polygon = L.polygon(granule.footprint, {
			color: selected ? "#d3f074" : "#c89edb",
			weight: selected ? 2 : 1,
			opacity: selected ? 1 : 0.67,
			fillColor: selected ? "#d3f074" : "#bf95d1",
			fillOpacity: selected ? 0.18 : 0.09,
		}).addTo(footprintLayer);
		polygon.bindTooltip(
			`<strong>${selected ? "Selected pass" : "NISAR pass"}</strong><br>${formatDate(granule.timeStart)}`,
			{ direction: "top", opacity: 0.96 },
		);
		polygon.on("click", () => selectGranule(granule.id));
		polygonById.set(granule.id, polygon);
	}
}

function renderSceneList() {
	ui.sceneList.replaceChildren();
	for (const [index, granule] of granules.entries()) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = `scene-row${granule.id === selectedId ? " selected" : ""}`;
		button.setAttribute("aria-label", `Select scene acquired ${formatDate(granule.timeStart)}`);
		const date = document.createElement("span");
		date.className = "scene-date";
		date.textContent = formatDate(granule.timeStart, { month: "short", day: "numeric" });
		const orbit = document.createElement("span");
		orbit.className = "scene-orbit";
		orbit.textContent = granule.title.replace(/^NISAR_L2_PR_GCOV_/, "Orbit ");
		button.append(date, orbit);
		button.addEventListener("click", () => selectGranule(granule.id));
		ui.sceneList.append(button);
		if (index === 4) break;
	}
}

function renderTimeline() {
	ui.timeline.replaceChildren();
	if (granules.length === 0) {
		const empty = document.createElement("div");
		empty.className = "timeline-empty";
		empty.textContent = "New passes will appear here when the catalog has coverage for this area.";
		ui.timeline.append(empty);
		return;
	}

	const ordered = [...granules].reverse().slice(0, 100);
	ordered.forEach((granule, index) => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = `timeline-item${granule.id === selectedId ? " active" : ""}`;
		button.setAttribute("aria-label", `Select NISAR pass from ${formatDate(granule.timeStart)}`);
		const point = document.createElement("span");
		point.className = "timeline-point";
		const label = document.createElement("span");
		label.textContent = formatDate(granule.timeStart, { month: "short", day: "numeric" });
		button.append(point, label);
		button.addEventListener("click", () => selectGranule(granule.id));
		ui.timeline.append(button);
	});
}

function browseImageUrl(url) {
	return `/api/nisar/browse?url=${encodeURIComponent(url)}`;
}

function renderPreview(granule) {
	ui.preview.replaceChildren();
	if (!granule) {
		ui.previewLabel.textContent = "RADAR QUICKLOOK";
		ui.preview.innerHTML = `<div class="preview-placeholder"><div class="placeholder-orbit"><span></span><i></i></div><strong>NO SCENE SELECTED</strong><small>Choose a place to look for NISAR passes</small></div>`;
		return;
	}

	if (compareMode) {
		const pair = comparePair(granule);
		if (pair) {
			const beforeUrl = pair.channel?.before.href ?? pair.before.browseUrl;
			const afterUrl = pair.channel?.after.href ?? pair.after.browseUrl;
			const layerLabel = pair.channel
				? `FREQUENCY ${pair.channel.frequency} · ${pair.channel.polarization}`
				: "GEOGRAPHIC QUICKLOOK";
			ui.previewLabel.textContent = `PASS-TO-PASS SWIPE · ${layerLabel}`;
			const comparison = document.createElement("div");
			comparison.className = "compare-swipe";
			comparison.style.setProperty("--compare-split", "50%");
			for (const [scene, url, side, label] of [
				[pair.before, beforeUrl, "earlier", "EARLIER"],
				[pair.after, afterUrl, "later", "NEWER"],
			]) {
				const image = document.createElement("img");
				image.className = `compare-image compare-${side}`;
				image.src = browseImageUrl(url);
				image.alt = `NISAR radar quicklook from ${formatDate(scene.timeStart)}`;
				image.loading = "lazy";
				comparison.append(image);
				const dateLabel = document.createElement("span");
				dateLabel.className = `compare-date compare-date-${side}`;
				dateLabel.textContent = `${label} · ${formatDate(scene.timeStart, { month: "short", day: "numeric", year: "2-digit" })}`;
				comparison.append(dateLabel);
			}
			if (pair.channelFallback) {
				const note = document.createElement("span");
				note.className = "compare-mode-note";
				note.textContent = "This channel is not linked for both passes; showing geographic quicklooks.";
				comparison.append(note);
			}
			const sliderLabel = document.createElement("label");
			sliderLabel.className = "compare-slider-label";
			sliderLabel.textContent = "Reveal newer pass";
			const slider = document.createElement("input");
			slider.className = "compare-slider";
			slider.type = "range";
			slider.min = "0";
			slider.max = "100";
			slider.value = "50";
			slider.setAttribute(
				"aria-label",
				`Reveal newer pass from ${formatDate(pair.after.timeStart)} against earlier pass from ${formatDate(pair.before.timeStart)}`,
			);
			slider.addEventListener("input", () => {
				comparison.style.setProperty("--compare-split", `${slider.value}%`);
			});
			sliderLabel.append(slider);
			comparison.append(sliderLabel);
			ui.preview.append(comparison);
			return;
		}
	}

	const channel = granule.browseChannels.find(
		(item) => `${item.frequency}-${item.polarization}` === selectedChannel,
	);
	const imageUrl = channel?.href ?? granule.browseUrl;
	ui.previewLabel.textContent = channel
		? `FREQUENCY ${channel.frequency} · ${channel.polarization}`
		: "GEOGRAPHIC RADAR QUICKLOOK";
	if (!imageUrl) {
		ui.preview.innerHTML = `<div class="preview-placeholder"><div class="placeholder-orbit"><span></span><i></i></div><strong>QUICKLOOK UNAVAILABLE</strong><small>Open the product at ASF DAAC for data access</small></div>`;
		return;
	}

	const image = document.createElement("img");
	image.src = browseImageUrl(imageUrl);
	image.alt = `NISAR ${channel ? `frequency ${channel.frequency} ${channel.polarization}` : "geographic"} browse image from ${formatDate(granule.timeStart)}`;
	image.loading = "lazy";
	image.addEventListener(
		"error",
		() => {
			image.remove();
			ui.preview.innerHTML = `<div class="preview-placeholder"><div class="placeholder-orbit"><span></span><i></i></div><strong>QUICKLOOK UNAVAILABLE</strong><small>Open the product at ASF DAAC for data access</small></div>`;
		},
		{ once: true },
	);
	ui.preview.append(image);
}

function renderChannelOptions(granule) {
	ui.channel.replaceChildren();
	const geographic = document.createElement("option");
	geographic.value = "quicklook";
	geographic.textContent = "Geographic quicklook";
	ui.channel.append(geographic);
	for (const channel of granule?.browseChannels ?? []) {
		const option = document.createElement("option");
		option.value = `${channel.frequency}-${channel.polarization}`;
		option.textContent = `Frequency ${channel.frequency} · ${channel.polarization}`;
		ui.channel.append(option);
	}
	ui.channelAvailability.replaceChildren();
	const channels = granule?.browseChannels ?? [];
	if (channels.length === 0) {
		const empty = document.createElement("span");
		empty.className = "channel-empty";
		empty.textContent = granule ? "No polarization browse channels linked for this pass." : "Choose a pass to check channel availability.";
		ui.channelAvailability.append(empty);
	} else {
		for (const channel of channels) {
			const chip = document.createElement("span");
			chip.className = "channel-chip";
			const polarization = { HHHH: "HH", HVHV: "HV" }[channel.polarization] ?? channel.polarization;
			chip.textContent = `F${channel.frequency} · ${polarization}`;
			chip.title = `Frequency ${channel.frequency} · ${channel.polarization}`;
			ui.channelAvailability.append(chip);
		}
	}
	ui.channelAvailability.setAttribute(
		"aria-label",
		channels.length ? `Available polarization browse layers: ${channels.map((item) => `${item.frequency} ${item.polarization}`).join(", ")}` : "No polarization browse channels available",
	);
	ui.channel.disabled = !granule || (!granule.browseUrl && channels.length === 0);
	if (selectedChannel !== "quicklook" && !granule?.browseChannels.some(
		(channel) => `${channel.frequency}-${channel.polarization}` === selectedChannel,
	)) {
		selectedChannel = "quicklook";
	}
	ui.channel.value = selectedChannel;
}

function comparePair(granule) {
	if (!granule) return null;
	const match = SurfaceAnalysis.comparablePrevious(granules, granule);
	const previous = match.previous;
	if (!previous) return null;
	if (selectedChannel !== "quicklook") {
		const beforeChannel = previous.browseChannels.find(
			(channel) => `${channel.frequency}-${channel.polarization}` === selectedChannel,
		);
		const afterChannel = granule.browseChannels.find(
			(channel) => `${channel.frequency}-${channel.polarization}` === selectedChannel,
		);
		if (beforeChannel && afterChannel) {
			return {
				before: previous,
				after: granule,
				channel: { frequency: afterChannel.frequency, polarization: afterChannel.polarization, before: beforeChannel, after: afterChannel },
				channelFallback: false,
			};
		}
	}
	if (granule.browseUrl && previous.browseUrl) {
		return {
			before: previous,
			after: granule,
			channel: null,
			channelFallback: selectedChannel !== "quicklook",
		};
	}
	return null;
}

function describePlace() {
	const site = activeStudyArea();
	if (site !== mapAreaStory) return { place: site.name, theme: site.theme };
	const center = map.getCenter();
	return {
		place: `the area near ${formatCoordinate(center.lat, "N", "S")}, ${formatCoordinate(center.lng, "E", "W")}`,
		theme: mapAreaStory.theme,
	};
}

function activeStudyArea() {
	if (customPlace) {
		const [west, south, east, north] = customPlace.bounds;
		const center = map.getCenter();
		if (center.lng >= west && center.lng <= east && center.lat >= south && center.lat <= north) {
			return customPlace;
		}
	}
	return siteAtMapCenter() ?? mapAreaStory;
}

function siteAtMapCenter() {
	const center = map.getCenter();
	for (const site of Object.values(sites)) {
		const [west, south, east, north] = site.bounds;
		if (center.lng >= west && center.lng <= east && center.lat >= south && center.lat <= north) return site;
	}
	return null;
}

function renderRadarContext(granule) {
	const site = activeStudyArea();
	const context = site?.radarContext;
	const polarization = selectedChannel.endsWith("HHHH")
		? "HHHH"
		: selectedChannel.endsWith("HVHV")
			? "HVHV"
			: null;
	ui.radarContextCopy.textContent = context
		? `${context.summary}${polarization ? ` ${context[polarization]}` : ""}`
		: "L-band returns vary with moisture, roughness, surface structure, and viewing geometry. Compare repeat passes and polarization-aware calibrated data; a browse image alone does not establish change.";
	if (!granule) {
		ui.radarContextPass.textContent = "Select a pass to anchor this hypothesis in time.";
		return;
	}
	const layer = granule.browseChannels.find(
		(item) => `${item.frequency}-${item.polarization}` === selectedChannel,
	);
	ui.radarContextPass.textContent = `${formatDate(granule.timeStart)} · ${layer ? `FREQUENCY ${layer.frequency} · ${layer.polarization}` : "GEOGRAPHIC QUICKLOOK"}`;
}

function representativeStoryScenes() {
	const byDate = new Map();
	for (const granule of [...granules].sort((left, right) => left.timeStart.localeCompare(right.timeStart))) {
		const date = granule.timeStart.slice(0, 10);
		if (!byDate.has(date)) byDate.set(date, granule);
	}
	const scenes = [...byDate.values()];
	if (scenes.length <= 3) return scenes;
	return [scenes[0], scenes[Math.floor((scenes.length - 1) / 2)], scenes[scenes.length - 1]];
}

function renderStoryStep() {
	const step = storySteps[storyStepIndex];
	ui.storyStepCount.textContent = `CHAPTER ${storyStepIndex + 1} / ${storySteps.length}`;
	ui.storyStepLabel.textContent = step.label;
	ui.storyStepTitle.textContent = step.title;
	ui.storyStepCopy.textContent = step.copy;
	ui.storyAiCopy.textContent = storyAiChapters[storyStepIndex] ?? "";
	ui.storyAiCopy.parentElement.hidden = !ui.storyAiCopy.textContent;
	ui.storyHypotheses.replaceChildren();
	for (const hypothesis of step.hypotheses ?? []) {
		const item = document.createElement("li");
		item.textContent = hypothesis;
		ui.storyHypotheses.append(item);
	}
	ui.storyHypotheses.hidden = !step.hypotheses?.length;
	ui.storyMedia.replaceChildren();
	if (step.scene) {
		selectedId = step.scene.id;
		compareMode = false;
		renderResults();
		if (step.scene.browseUrl) {
			const image = document.createElement("img");
			image.src = browseImageUrl(step.scene.browseUrl);
			image.alt = `NISAR geographic radar quicklook from ${formatDate(step.scene.timeStart)}`;
			image.loading = "lazy";
			const caption = document.createElement("figcaption");
			caption.textContent = `GEOGRAPHIC QUICKLOOK · ${formatDate(step.scene.timeStart)}`;
			ui.storyMedia.append(image, caption);
		} else {
			ui.storyMedia.textContent = "No geographic quicklook is linked for this acquisition.";
		}
	} else {
		ui.storyMedia.textContent = "The map shows the currently selected study area.";
	}
	ui.storyPrevious.disabled = storyStepIndex === 0;
	ui.storyNext.textContent = storyStepIndex === storySteps.length - 1 ? "Finish tour" : "Next observation →";
}

async function openStoryMode() {
	ui.storyOpen.disabled = true;
	try {
		let scenes = representativeStoryScenes();
		if (scenes.length < 2 && ui.dateWindow.value !== "all") {
			ui.dateWindow.value = "all";
			await searchArea();
			scenes = representativeStoryScenes();
		}
		const site = activeStudyArea();
		if (scenes.length < 2) {
			storySteps = [{
				label: "CATALOG CHECK",
				title: "A multi-date sequence is not available yet",
				copy: "This area needs at least two distinct NISAR acquisition dates. The all-dates search returned fewer than two; try another site or check back as new passes are added.",
			}];
		} else {
			storySteps = [
				{
					label: "FIELD GUIDE",
					title: `${site.name}: a radar story`,
					copy: `FIELD QUESTION: ${site.impactQuestion} ${site.story} NASA NISAR provides repeat L-band observations to help identify patterns for follow-up—not to confirm a hazard or measure change from a browse image. This tour follows up to three distinct acquisition dates, then closes with hypotheses to test.`,
				},
				...scenes.map((scene, index) => ({
					label: `PASS ${index + 1} OF ${scenes.length}`,
					title: formatDate(scene.timeStart),
					copy: `${site.radarContext.summary} Inspect this pass as one point in a time series; the provisional quicklook is not a calibrated change measurement.`,
					scene,
				})),
				{
					label: "WHAT COULD DRIVE THE PATTERN?",
					title: "Hypotheses to test",
					copy: "These are plausible physical or human drivers for this study area, not conclusions from the browse images. Test them with calibrated NISAR products and independent local data.",
					hypotheses: site.hypotheses,
				},
			];
		}
		storyStepIndex = 0;
		storyAiChapters = [];
		ui.storyAiStatus.textContent = "";
		ui.storyDialog.showModal();
		renderStoryStep();
		if (scenes.length >= 2) {
			void generateGeminiTour(site, scenes);
		} else {
			ui.storyAiStatus.textContent = "Gemini tour narration needs at least two distinct passes.";
		}
	} finally {
		ui.storyOpen.disabled = false;
	}
}

function hideExplanation() {
	explainNumber++;
	explainKey = null;
	ui.explainPanel.classList.add("hidden");
	ui.explainPanel.replaceChildren();
	ui.explain.classList.remove("busy");
	ui.explain.textContent = "";
	ui.explain.append(Object.assign(document.createElement("span"), { className: "explain-icon", textContent: "✦" }), " Explain this change");
}

function showGeminiPanel(panel, kicker, text, footnote, state = "ready") {
	panel.replaceChildren();
	panel.classList.remove("hidden", "error");
	if (state === "error") panel.classList.add("error");
	const head = document.createElement("div");
	head.className = "explain-kicker";
	head.textContent = kicker;
	panel.append(head);
	for (const paragraph of text.split(/\n+/).map((line) => line.trim()).filter(Boolean)) {
		const p = document.createElement("p");
		p.textContent = paragraph;
		panel.append(p);
	}
	if (footnote) {
		const foot = document.createElement("div");
		foot.className = "explain-foot";
		foot.textContent = footnote;
		panel.append(foot);
	}
}

function showExplanation(kicker, paragraphs, footnote, state = "ready") {
	showGeminiPanel(ui.explainPanel, kicker, paragraphs.join("\n"), footnote, state);
}

function clearCompareInsight() {
	compareInsightNumber++;
	compareInsightKey = null;
	ui.compareAI.classList.remove("busy");
	ui.compareAI.disabled = false;
	ui.compareInsight.classList.add("hidden");
	ui.compareInsight.replaceChildren();
}

function resetGeneratedInsights() {
	fieldNoteRequestNumber++;
	ui.fieldNoteAi.disabled = false;
	ui.fieldNoteAiOutput.textContent = "";
	ui.fieldNoteAiOutput.classList.remove("error");
	clearCompareInsight();
}

function activeChannelLabel(granule = getSelectedGranule()) {
	const channel = granule?.browseChannels.find(
		(item) => `${item.frequency}-${item.polarization}` === selectedChannel,
	);
	return channel ? `FREQUENCY ${channel.frequency} · ${channel.polarization}` : "Geographic quicklook";
}

function sceneStamp(scene, channelSelection = selectedChannel) {
	const channel = scene.browseChannels?.find(
		(item) => `${item.frequency}-${item.polarization}` === channelSelection,
	);
	return {
		id: scene.id,
		date: scene.timeStart.slice(0, 10),
		imageUrl: channel?.href ?? scene.browseUrl ?? "",
	};
}

function geminiContext() {
	const area = activeStudyArea();
	const { place, theme } = describePlace();
	const selected = getSelectedGranule();
	return {
		place,
		theme,
		channel: activeChannelLabel(selected),
		date: selected?.timeStart.slice(0, 10) ?? "",
		radarContext: area.radarContext?.summary ?? "",
		fieldNote: area.fieldNote ?? "",
		hypotheses: area.hypotheses ?? [],
	};
}

async function requestGeminiInsight(mode, extra = {}) {
	const response = await fetch("/api/nisar/insight", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ ...geminiContext(), mode, ...extra }),
	});
	let result;
	try {
		result = await response.json();
	} catch {
		throw new Error("The Gemini response could not be read.");
	}
	if (!response.ok) throw new Error(result.error || `Gemini request failed (${response.status}).`);
	return result;
}

async function generateGeminiTour(site, scenes) {
	const thisRequest = ++storyAiNumber;
	ui.storyAiStatus.textContent = "Gemini is preparing the guided narration…";
	try {
		const result = await requestGeminiInsight("tour", {
			radarContext: site.radarContext.summary,
			fieldNote: site.fieldNote,
			hypotheses: site.hypotheses,
			scenes: scenes.map(sceneStamp),
		});
		if (thisRequest !== storyAiNumber || !ui.storyDialog.open) return;
		if (!Array.isArray(result.chapters) || result.chapters.length !== storySteps.length) {
			throw new Error("Gemini returned an incomplete tour.");
		}
		storyAiChapters = result.chapters;
		ui.storyAiStatus.textContent = `${result.cached ? "CACHED · " : ""}GOOGLE GEMINI · ${result.model}`;
		renderStoryStep();
	} catch (error) {
		if (thisRequest !== storyAiNumber || !ui.storyDialog.open) return;
		ui.storyAiStatus.textContent = `Gemini tour narration unavailable: ${error instanceof Error ? error.message : "request failed"}. The field guide remains available.`;
	}
}

async function generateGeminiFieldNote() {
	const thisRequest = ++fieldNoteRequestNumber;
	ui.fieldNoteAi.disabled = true;
	ui.fieldNoteAiOutput.classList.remove("error");
	ui.fieldNoteAiOutput.textContent = "Gemini is preparing a field note…";
	try {
		const selected = getSelectedGranule();
		const result = await requestGeminiInsight("field_note", {
			scene: selected ? sceneStamp(selected) : undefined,
		});
		if (thisRequest !== fieldNoteRequestNumber) return;
		ui.fieldNoteAiOutput.textContent = `${result.text}\n\n${result.cached ? "CACHED · " : ""}GOOGLE GEMINI · ${result.model}`;
	} catch (error) {
		if (thisRequest !== fieldNoteRequestNumber) return;
		ui.fieldNoteAiOutput.classList.add("error");
		ui.fieldNoteAiOutput.textContent = `Gemini field note unavailable: ${error instanceof Error ? error.message : "request failed"}`;
	} finally {
		if (thisRequest === fieldNoteRequestNumber) ui.fieldNoteAi.disabled = false;
	}
}

async function generateGeminiComparison() {
	const pair = comparePair(getSelectedGranule());
	if (!pair) return;
	const thisRequest = ++compareInsightNumber;
	const key = `${pair.before.id}:${pair.after.id}:${selectedChannel}`;
	compareInsightKey = key;
	const channelSelection = pair.channel ? selectedChannel : "quicklook";
	showGeminiPanel(ui.compareInsight, "GEMINI PASS COMPARISON", "Comparing the selected passes…", null);
	ui.compareAI.disabled = true;
	ui.compareAI.classList.add("busy");
	try {
		const result = await requestGeminiInsight("compare", {
			channel: pair.channel
				? `FREQUENCY ${pair.channel.frequency} · ${pair.channel.polarization}`
				: "Geographic quicklook",
			before: sceneStamp(pair.before, channelSelection),
			after: sceneStamp(pair.after, channelSelection),
		});
		if (thisRequest !== compareInsightNumber || compareInsightKey !== key) return;
		showGeminiPanel(
			ui.compareInsight,
			"GEMINI COMPARISON · VISUAL HYPOTHESES",
			result.text,
			`${result.cached ? "CACHED · " : ""}GOOGLE GEMINI · ${result.model}`,
		);
	} catch (error) {
		if (thisRequest !== compareInsightNumber || compareInsightKey !== key) return;
		showGeminiPanel(
			ui.compareInsight,
			"GEMINI COMPARISON UNAVAILABLE",
			error instanceof Error ? error.message : "The request failed.",
			null,
			"error",
		);
	} finally {
		if (thisRequest === compareInsightNumber) {
			ui.compareAI.classList.remove("busy");
			renderSelection();
		}
	}
}

async function explainSelectedChange() {
	const pair = comparePair(getSelectedGranule());
	if (!pair) return;
	const channelSelection = pair.channel ? selectedChannel : "quicklook";
	if (!sceneStamp(pair.before, channelSelection).imageUrl || !sceneStamp(pair.after, channelSelection).imageUrl) return;
	const key = `${pair.before.id}:${pair.after.id}:${selectedChannel}`;
	const thisRequest = ++explainNumber;
	explainKey = key;
	compareMode = true;
	renderSelection();
	ui.explain.disabled = true;
	ui.explain.classList.add("busy");
	showExplanation("GOOGLE GEMINI · CHANGE EXPLANATION", ["Comparing the two passes…"], null);
	try {
		const result = await requestGeminiInsight("explain", {
			channel: pair.channel
				? `FREQUENCY ${pair.channel.frequency} · ${pair.channel.polarization}`
				: "Geographic quicklook",
			before: sceneStamp(pair.before, channelSelection),
			after: sceneStamp(pair.after, channelSelection),
		});
		if (thisRequest !== explainNumber || explainKey !== key) return;
		const paragraphs = result.text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
		showExplanation(
			"GEMINI READING · HYPOTHESES, NOT MEASUREMENTS",
			paragraphs,
			`${result.cached ? "CACHED · " : ""}GOOGLE GEMINI · ${result.model}`,
		);
	} catch (error) {
		if (thisRequest !== explainNumber) return;
		const detail = error instanceof Error ? error.message : "The Gemini request failed.";
		showExplanation("GEMINI READING UNAVAILABLE", [detail], null, "error");
	} finally {
		if (thisRequest === explainNumber) {
			ui.explain.classList.remove("busy");
			renderSelection();
		}
	}
}

function renderSelection() {
	const granule = getSelectedGranule();
	if (!granule) {
		ui.selectedIndex.textContent = "—";
		ui.selectedDateCopy.textContent = "Choose an observation";
		ui.latestPassDate.textContent = "No pass in view";
		ui.latestPassHint.textContent = "Try another area or time window";
		ui.compare.disabled = true;
		ui.compareAI.disabled = true;
		ui.compareAI.hidden = true;
		ui.explain.disabled = true;
		ui.compareCount.textContent = "0 passes";
		if (compareInsightKey) clearCompareInsight();
		ui.download.classList.add("disabled");
		ui.download.removeAttribute("href");
		renderChannelOptions(null);
		renderRadarContext(null);
		renderPreview(null);
		return;
	}

	renderChannelOptions(granule);
	renderRadarContext(granule);
	const selectedNumber = granules.indexOf(granule) + 1;
	ui.selectedIndex.textContent = `${String(selectedNumber).padStart(2, "0")} / ${String(granules.length).padStart(2, "0")}`;
	ui.selectedDateCopy.textContent = formatDate(granule.timeStart);
	ui.latestPassDate.textContent = formatDate(granules[0].timeStart, { month: "short", day: "numeric", year: "numeric" });
	ui.latestPassHint.textContent = "Latest catalog acquisition in this map view";
	ui.compare.disabled = !comparePair(granule);
	ui.compareCount.textContent = granules.length > 1 ? `${granules.length - 1} earlier` : "1 pass";
	ui.compare.classList.toggle("comparison-active", compareMode);
	const pair = comparePair(granule);
	const pairKey = pair ? `${pair.before.id}:${pair.after.id}:${selectedChannel}` : null;
	const channelSelection = pair?.channel ? selectedChannel : "quicklook";
	if (compareInsightKey && compareInsightKey !== pairKey) clearCompareInsight();
	ui.compareAI.hidden = !compareMode;
	ui.compareAI.disabled = !pair
		|| !sceneStamp(pair.before, channelSelection).imageUrl
		|| !sceneStamp(pair.after, channelSelection).imageUrl
		|| ui.compareAI.classList.contains("busy");
	ui.explain.disabled = !pair
		|| !sceneStamp(pair.before, channelSelection).imageUrl
		|| !sceneStamp(pair.after, channelSelection).imageUrl
		|| ui.explain.classList.contains("busy");
	if (explainKey && explainKey !== pairKey) hideExplanation();
	if (granule.downloadUrl) {
		ui.download.href = granule.downloadUrl;
		ui.download.classList.remove("disabled");
	} else {
		ui.download.removeAttribute("href");
		ui.download.classList.add("disabled");
	}
	renderPreview(granule);
}

function downloadText(text, name, type) {
	const blob = new Blob([text], { type });
	const link = document.createElement("a");
	const url = URL.createObjectURL(blob);
	link.href = url;
	link.download = name;
	document.body.append(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

function exportCurrentSceneCsv() {
	if (!granules.length) return;
	downloadText(SurfaceAnalysis.toCsv(granules, activeStudyArea().name), `surface-signals-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8;");
}

function exportCurrentSceneGeoJson() {
	if (!granules.length) return;
	downloadText(JSON.stringify(SurfaceAnalysis.toGeoJson(granules), null, 1), `surface-signals-${new Date().toISOString().slice(0, 10)}.geojson`, "application/geo+json");
}

function renderAnalysis() {
	const panel = document.getElementById("analysis-panel");
	if (!panel) return;
	const r = SurfaceAnalysis.analyze(granules);
	if (!r.count) { panel.replaceChildren(); return; }
	const stat = (label, value) => `<div class="metric-card"><span>${label}</span><strong>${value}</strong></div>`;
	const max = Math.max(1, ...Object.values(r.monthly));
	const bars = Object.entries(r.monthly).sort().map(([month, n]) =>
		`<div title="${month}: ${n} pass(es)" style="flex:1;min-width:6px;display:flex;flex-direction:column;justify-content:flex-end"><i style="display:block;height:${Math.round((n / max) * 40)}px;background:#d3f074;opacity:.8"></i></div>`).join("");
	const groups = r.groups.slice(0, 6).map((g) =>
		`<li>${g.key} — ${g.count} pass${g.count === 1 ? "" : "es"}${g.medianRevisitDays !== null ? `, median repeat ${g.medianRevisitDays} d` : ""}</li>`).join("");
	panel.innerHTML = `<div class="mission-brief-grid">
		${stat("COMPARABLE PAIRS", r.comparablePairs)}
		${stat("MEDIAN REPEAT", r.medianRevisitDays === null ? "—" : `${r.medianRevisitDays} d`)}
		${stat("LONGEST GAP", r.maxGapDays === null ? "—" : `${r.maxGapDays} d`)}
		${stat("MEDIAN FOOTPRINT", r.medianAreaKm2 === null ? "—" : `${r.medianAreaKm2.toLocaleString()} km²`)}</div>
		<div style="display:flex;gap:2px;height:44px;align-items:flex-end;margin:10px 0" aria-label="Passes per month">${bars}</div>
		<ul>${groups}</ul>
		${r.warnings.map((w) => `<p class="mission-brief-question">⚠ ${w}</p>`).join("")}`;
}

function renderMissionBrief() {
	const count = granules.length;
	ui.missionSceneCount.textContent = String(count).padStart(2, "0");
	ui.exportGranules.disabled = count === 0;
	ui.exportGranules.style.opacity = count === 0 ? "0.5" : "1";
	const site = activeStudyArea();
	ui.missionQuestion.textContent = site.impactQuestion;
	if (count === 0) {
		ui.missionDateRange.textContent = "—";
		ui.missionWindow.textContent = "—";
		ui.missionInsight.textContent = catalogStatus === "error"
			? "NASA CMR could not be reached, so coverage is unknown. Retry the search when the catalog is available."
			: catalogStatus === "loading"
				? "Searching NASA CMR for NISAR GCOV scenes in this area and time window."
				: "No NISAR GCOV scenes are in this view for the selected time window. Try a wider date range or search area; no coverage is not evidence that change is absent.";
		return;
	}
	const sorted = [...granules].sort((left, right) => left.timeStart.localeCompare(right.timeStart));
	const oldest = sorted[0].timeStart.slice(0, 10);
	const newest = sorted[sorted.length - 1].timeStart.slice(0, 10);
	const days = Math.max(1, Math.round((new Date(sorted[sorted.length - 1].timeStart) - new Date(sorted[0].timeStart)) / 86400000));
	ui.missionDateRange.textContent = `${oldest} → ${newest}`;
	ui.missionWindow.textContent = `${days} d`;
	if (count === 1) {
		ui.missionInsight.textContent = `NASA CMR returned one NISAR GCOV scene for ${site.name}. One acquisition date cannot establish change; widen the time window or map extent before comparing. Validate candidate patterns with ${site.validationData}.`;
		return;
	}
	ui.missionInsight.textContent = `NASA CMR returned ${count} NISAR GCOV scenes across ${days} days. Compare repeat passes to identify patterns for follow-up with ${site.validationData}. Browse images are exploratory, not calibrated change measurements.`;
}

function renderResults() {
	renderAnalysis();
	ui.sceneCount.textContent = String(granules.length).padStart(2, "0");
	ui.panelSceneCount.textContent = String(granules.length).padStart(2, "0");
	renderMissionBrief();
	renderFootprints();
	renderSceneList();
	renderTimeline();
	renderSelection();
}

async function searchArea(boundsOverride) {
	stopTimelinePlayback();
	resetGeneratedInsights();
	hideExplanation();
	catalogStatus = "loading";
	const thisRequest = ++requestNumber;
	const studyArea = boundsOverride && customPlace ? customPlace : activeStudyArea();
	const bounds = boundsOverride ?? (studyArea === customPlace ? customPlace.bounds : currentBounds());
	const [west, south, east, north] = bounds;
	updateStory(studyArea);
	const query = new URLSearchParams({
		bbox: [west, south, east, north].map((value) => value.toFixed(5)).join(","),
	});
	const days = ui.dateWindow.value === "all" ? null : Number(ui.dateWindow.value);
	if (days !== null) {
		const endDate = new Date();
		const startDate = new Date(endDate);
		startDate.setUTCDate(startDate.getUTCDate() - days);
		query.set("from", startDate.toISOString().slice(0, 10));
		query.set("to", endDate.toISOString().slice(0, 10));
	}

	setMessage("Listening for a NISAR pass…");
	ui.sceneStatus.innerHTML = '<span class="status-dot"></span>QUERYING NASA CMR';
	try {
		const response = await fetch(`/api/nisar/granules?${query}`);
		let result;
		try {
			result = await response.json();
		} catch {
			throw new Error("The catalog response could not be read.");
		}
		if (!response.ok) throw new Error(result.error || `Catalog request failed (${response.status}).`);
		if (thisRequest !== requestNumber) return;
		catalogStatus = "ready";
		granules = result.granules;
		selectedId = granules.some((item) => item.id === pendingSelectId) ? pendingSelectId : (granules[0]?.id ?? null);
		pendingSelectId = null;
		selectedChannel = "quicklook";
		compareMode = false;
		hideExplanation();
		renderResults();
		setMessage("No NISAR scenes found in this map view.", "hidden");
		ui.sceneStatus.innerHTML = `<span class="status-dot"></span>${granules.length} SCENE${granules.length === 1 ? "" : "S"} · ${({ HIT: "CACHED", D1: "STORED COPY" })[response.headers.get("X-Cache")] ?? "NASA CMR"}`;
	} catch (error) {
		if (thisRequest !== requestNumber) return;
		catalogStatus = "error";
		granules = [];
		selectedId = null;
		renderResults();
		const detail = error instanceof Error ? error.message : "The catalog request failed.";
		setMessage(detail, "error");
		ui.sceneStatus.innerHTML = '<span class="status-dot" style="background:#e58b58"></span>CATALOG UNAVAILABLE';
	}
}

function timeAgo(ms) {
	const minutes = Math.max(0, Math.round((Date.now() - ms) / 60000));
	if (minutes < 1) return "JUST NOW";
	if (minutes < 60) return `${minutes} MIN AGO`;
	const hours = Math.round(minutes / 60);
	if (hours < 48) return `${hours} H AGO`;
	return `${Math.round(hours / 24)} D AGO`;
}

function renderFeed(passes) {
	ui.feedList.replaceChildren();
	if (passes.length === 0) {
		const empty = document.createElement("div");
		empty.className = "timeline-empty";
		empty.textContent = "No passes stored yet. The hourly check will fill this in.";
		ui.feedList.append(empty);
		return;
	}
	for (const pass of passes) {
		const site = sites[pass.site];
		if (!site) continue;
		const button = document.createElement("button");
		button.type = "button";
		button.className = "feed-row";
		button.setAttribute("aria-label", `Open ${site.name} pass from ${formatDate(pass.timeStart)}`);
		const place = document.createElement("span");
		place.className = "feed-place";
		place.textContent = site.name;
		const date = document.createElement("span");
		date.className = "feed-date";
		date.textContent = formatDate(pass.timeStart, { month: "short", day: "numeric" });
		const orbit = document.createElement("span");
		orbit.className = "scene-orbit";
		orbit.textContent = pass.title.replace(/^NISAR_L2_PR_GCOV_/, "Orbit ");
		button.append(place, date, orbit);
		if (pass.isNew) {
			const badge = document.createElement("span");
			badge.className = "feed-new";
			badge.textContent = "NEW";
			button.append(badge);
		}
		button.addEventListener("click", () => {
			pendingSelectId = pass.id;
			chooseSite(pass.site);
		});
		ui.feedList.append(button);
	}
}

async function loadFeed() {
	try {
		const response = await fetch("/api/nisar/feed?limit=8");
		const result = await response.json();
		if (!response.ok) throw new Error(result.error || "feed unavailable");
		renderFeed(result.passes);
		ui.feedStatus.textContent = result.lastChecked ? `CHECKED ${timeAgo(result.lastChecked)}` : "NOT CHECKED YET";
	} catch {
		ui.feedList.replaceChildren();
		ui.feedStatus.textContent = "FEED UNAVAILABLE";
	}
}

function chooseSite(siteId) {
	if (siteId === "map") {
		searchCurrentMapArea();
		return;
	}
	const site = sites[siteId];
	if (!site) return;
	customPlace = null;
	updateStory(site);
	ui.site.value = siteId;
	document.querySelectorAll(".place-button").forEach((button) => {
		button.classList.toggle("selected", button.dataset.site === siteId);
	});
	map.setView(site.center, site.zoom);
	siteMarker.setLatLng(site.center);
	updateMapCenter();
	searchArea();
}

function updateStory(site) {
	ui.siteRegion.textContent = site.region;
	ui.siteName.textContent = site.name;
	ui.missionQuestion.textContent = site.impactQuestion;
	ui.missionInsight.textContent = "Searching NASA CMR for NISAR GCOV scenes in this area and time window.";
	ui.storyEyebrow.textContent = site.eyebrow;
	ui.storyFirst.textContent = site.headline[0];
	ui.storyEmphasis.textContent = site.headline[1];
	ui.storyLast.textContent = site.headline[2];
	ui.storyCopy.textContent = site.story;
	ui.fieldNoteCopy.textContent = site.fieldNote;
}

function searchCurrentMapArea() {
	customPlace = null;
	ui.site.value = "map";
	document.querySelectorAll(".place-button").forEach((button) => button.classList.remove("selected"));
	updateStory(activeStudyArea());
	searchArea(currentBounds());
}

function makeNamedPlace(place) {
	return {
		...mapAreaStory,
		...place,
		theme: `surface change across ${place.name}`,
		region: place.region.toUpperCase(),
		headline: ["A PLACE", "IN", "MOTION"],
		eyebrow: `CUSTOM STUDY / ${place.region.toUpperCase()}`,
		story: `Explore NISAR coverage across ${place.name}.`,
		fieldNote: "This place search sets a geographic extent, not a NISAR observation footprint. Potential change drivers need to be tested against calibrated repeat data and local context.",
		radarContext: {
			...mapAreaStory.radarContext,
			summary: `Across ${place.name}, L-band radar returns respond to moisture, roughness, surface structure, and viewing geometry. Explore repeat observations as evidence to investigate, not as a standalone change measurement.`,
		},
		hypotheses: [
			`Possible natural and human drivers around ${place.name} depend on local land cover, weather, water levels, and activity; browse images alone cannot distinguish them.`,
			"Compare calibrated repeat-pass NISAR data with local elevation, land-cover, and event records before drawing conclusions.",
		],
	};
}

async function searchNamedPlaces(event) {
	event.preventDefault();
	if (ui.placeSearchSubmit.disabled) return;
	const query = ui.placeQuery.value.trim().replace(/\s+/g, " ");
	if (query.length < 2 || query.length > 120) {
		ui.placeSearchStatus.textContent = "Enter a place name between 2 and 120 characters.";
		ui.placeSearchResults.hidden = true;
		return;
	}
	const waitMs = 1000 - (Date.now() - lastPlaceSearchAt);
	if (waitMs > 0) {
		ui.placeSearchStatus.textContent = "Please wait a second before searching again.";
		return;
	}

	lastPlaceSearchAt = Date.now();
	ui.placeSearchSubmit.disabled = true;
	ui.placeSearchStatus.textContent = "Searching OpenStreetMap…";
	ui.placeSearchResults.replaceChildren();
	ui.placeSearchResults.hidden = true;
	try {
		const params = new URLSearchParams({ q: query });
		const response = await fetch(`/api/nisar/geocode?${params}`);
		let result;
		try {
			result = await response.json();
		} catch {
			throw new Error("The place search response could not be read.");
		}
		if (!response.ok) throw new Error(result.error || `Place search failed (${response.status}).`);
		if (!Array.isArray(result.places)) throw new Error("The place search returned unexpected results.");
		if (result.places.length === 0) {
			ui.placeSearchStatus.textContent = "No matching places found. Try a more specific name.";
			return;
		}
		for (const place of result.places) {
			if (!place || typeof place.name !== "string" || typeof place.displayName !== "string") continue;
			const button = document.createElement("button");
			button.type = "button";
			button.className = "place-result";
			button.setAttribute("aria-label", `Use ${place.displayName}`);
			const name = document.createElement("strong");
			name.textContent = place.name;
			const detail = document.createElement("span");
			detail.textContent = place.displayName;
			button.append(name, detail);
			button.addEventListener("click", () => selectNamedPlace(place));
			ui.placeSearchResults.append(button);
		}
		if (!ui.placeSearchResults.childElementCount) {
			ui.placeSearchStatus.textContent = "The place search returned no usable locations.";
			return;
		}
		ui.placeSearchResults.hidden = false;
		ui.placeSearchStatus.textContent = `${ui.placeSearchResults.childElementCount} result${ui.placeSearchResults.childElementCount === 1 ? "" : "s"} found. Choose the correct location.`;
	} catch (error) {
		ui.placeSearchStatus.textContent = error instanceof Error ? error.message : "The place search failed.";
	} finally {
		ui.placeSearchSubmit.disabled = false;
	}
}

function selectNamedPlace(place) {
	if (
		!Array.isArray(place.center)
		|| place.center.length !== 2
		|| !Array.isArray(place.bounds)
		|| place.bounds.length !== 4
		|| ![...place.center, ...place.bounds].every(Number.isFinite)
	) {
		ui.placeSearchStatus.textContent = "This result does not have a usable map location.";
		return;
	}
	customPlace = makeNamedPlace(place);
	ui.site.value = "custom";
	document.querySelectorAll(".place-button").forEach((button) => button.classList.remove("selected"));
	siteMarker.setLatLng(place.center);
	updateStory(customPlace);
	ui.placeSearchResults.hidden = true;
	ui.placeSearchStatus.textContent = `Selected ${place.displayName}. Searching its NISAR coverage…`;
	const [west, south, east, north] = place.bounds;
	map.fitBounds([[south, west], [north, east]], { padding: [55, 55], maxZoom: 9 });
	searchArea(place.bounds);
}

function stopTimelinePlayback() {
	if (timelineTimer !== null) {
		window.clearInterval(timelineTimer);
		timelineTimer = null;
	}
	ui.timelinePlay.classList.remove("is-playing");
	ui.timelinePlay.setAttribute("aria-label", "Play observation timeline");
	ui.timelinePlay.title = "Play observation timeline";
	ui.timelinePlay.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 12 7-12 7z" /></svg>';
}

document.querySelectorAll(".place-button").forEach((button) => {
	button.addEventListener("click", () => chooseSite(button.dataset.site));
});
ui.site.addEventListener("change", () => chooseSite(ui.site.value));
ui.dateWindow.addEventListener("change", searchArea);
document.getElementById("search-area").addEventListener("click", searchCurrentMapArea);
ui.placeSearchForm.addEventListener("submit", searchNamedPlaces);
ui.storyOpen.addEventListener("click", openStoryMode);
ui.storyClose.addEventListener("click", () => ui.storyDialog.close());
ui.storyPrevious.addEventListener("click", () => {
	if (storyStepIndex === 0) return;
	storyStepIndex--;
	renderStoryStep();
});
ui.storyNext.addEventListener("click", () => {
	if (storyStepIndex === storySteps.length - 1) {
		ui.storyDialog.close();
		return;
	}
	storyStepIndex++;
	renderStoryStep();
});
ui.storyDialog.addEventListener("close", () => {
	storyAiNumber++;
});
ui.fieldNoteAi.addEventListener("click", generateGeminiFieldNote);
ui.mapLayer.addEventListener("change", () => {
	const selectedLayer = mapLayers[ui.mapLayer.value];
	if (!selectedLayer) return;
	map.removeLayer(activeMapLayer);
	activeMapLayer = selectedLayer.layer.addTo(map);
	ui.mapAttribution.textContent = selectedLayer.attribution;
});
ui.channel.addEventListener("change", () => {
	selectedChannel = ui.channel.value;
	compareMode = false;
	resetGeneratedInsights();
	renderSelection();
});
ui.explain.addEventListener("click", explainSelectedChange);
ui.compareAI.addEventListener("click", generateGeminiComparison);
ui.compare.addEventListener("click", () => {
	if (granules.length < 2) return;
	compareMode = !compareMode;
	renderSelection();
	if (!compareMode) {
		clearCompareInsight();
	}
});
ui.timelinePlay.addEventListener("click", () => {
	if (timelineTimer !== null) {
		stopTimelinePlayback();
		return;
	}
	if (granules.length < 2) return;
	selectGranule(granules[granules.length - 1].id);
	ui.timelinePlay.classList.add("is-playing");
	ui.timelinePlay.setAttribute("aria-label", "Pause observation timeline");
	ui.timelinePlay.title = "Pause observation timeline";
	ui.timelinePlay.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7z M15 5h4v14h-4z" /></svg>';
	timelineTimer = window.setInterval(() => {
		const selectedIndex = granules.findIndex((granule) => granule.id === selectedId);
		const nextIndex = selectedIndex <= 0 ? granules.length - 1 : selectedIndex - 1;
		selectGranule(granules[nextIndex].id);
	}, 1400);
});
map.on("moveend", updateMapCenter);
map.on("moveend", () => {
	const center = activeStudyArea().center;
	if (!center || !map.getBounds().contains(center)) {
		siteMarker.setStyle({ opacity: 0.35, fillOpacity: 0.3 });
	} else {
		siteMarker.setStyle({ opacity: 1, fillOpacity: 0.95 });
	}
});
ui.exportGranules.addEventListener("click", exportCurrentSceneCsv);
document.getElementById("export-geojson")?.addEventListener("click", exportCurrentSceneGeoJson);

updateMapCenter();
updateStory(sites[ui.site.value]);
searchArea();
loadFeed();
