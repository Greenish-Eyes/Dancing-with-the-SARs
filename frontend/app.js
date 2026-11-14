const sites = {
	amazon: {
		name: "Amazon floodplain",
		theme: "seasonal flooding and forest structure along a large river floodplain",
		region: "AMAZONAS, BRAZIL",
		headline: ["THE", "RHYTHM", "OF WATER"],
		eyebrow: "LIVE STUDY / WETLAND DYNAMICS",
		story: "Following seasonal inundation through the forest canopy.",
		fieldNote: "Seasonal river levels may shape wetland extent. Compare calibrated backscatter before treating a visual difference as change.",
		radarContext: {
			summary: "The long L-band wavelength can interact with woody trunks beneath canopy; flooded forest may produce a trunk–water double-bounce. Seasonal inundation is a hypothesis to test, not a flood measurement from this browse image.",
			HHHH: "HH co-polarization can emphasize trunk–water geometry, but vegetation structure and viewing geometry also affect the return.",
			HVHV: "HV cross-polarization is more sensitive to depolarizing canopy-volume scattering; compare it with HH and calibrated data when testing for inundation.",
		},
		center: [-3.1, -60.0],
		zoom: 7,
		bounds: [-61, -4, -59, -2],
	},
	louisiana: {
		name: "Mississippi Delta",
		theme: "coastal wetlands, marsh loss, and river delta flooding",
		region: "LOUISIANA, USA",
		headline: ["WHERE", "LAND", "MEETS TIDE"],
		eyebrow: "LIVE STUDY / COASTAL WETLANDS",
		story: "Following the shifting edge between tidal marsh and open water.",
		fieldNote: "Wetland boundaries respond to tides, storms, and sediment supply. Use repeat calibrated observations to investigate possible change.",
		radarContext: {
			summary: "Marsh stems, open water, soil moisture, and tides all shape L-band returns. River discharge, storms, subsidence, levees, and wetland restoration are possible drivers to investigate with repeat observations.",
			HHHH: "HH co-polarization can emphasize water–stem or building–ground double-bounce; that pattern does not uniquely identify marsh loss or flooding.",
			HVHV: "HV cross-polarization is more sensitive to depolarizing vegetation-volume scattering; a difference may reflect marsh structure or moisture, not necessarily lost wetland.",
		},
		center: [29.5, -90.0],
		zoom: 7,
		bounds: [-91, 28, -89, 31],
	},
	iceland: {
		name: "South Iceland",
		theme: "glaciers, snow and ice, and volcanic terrain",
		region: "SOUTHERN REGION, ICELAND",
		headline: ["ICE", "ON THE", "MOVE"],
		eyebrow: "LIVE STUDY / GLACIER DYNAMICS",
		story: "Exploring radar observations over ice, meltwater, and volcanic terrain.",
		fieldNote: "Radar returns over ice vary with melt, roughness, and snow conditions. A browse image alone cannot identify glacier motion.",
		radarContext: {
			summary: "Snow and ice returns vary with surface roughness, liquid water, and internal structure. Seasonal melt or changing ice-surface texture are hypotheses; compare repeat passes from similar seasons.",
			HHHH: "HH co-polarization emphasizes surface and geometry contributions; wet snow can strongly alter the return.",
			HVHV: "HV cross-polarization is more sensitive to depolarizing volume and rough-surface scattering; it is not a direct measure of glacier motion.",
		},
		center: [64.0, -19.0],
		zoom: 7,
		bounds: [-20, 63, -18, 65],
	},
	jakarta: {
		name: "Jakarta basin",
		theme: "dense urban area with land subsidence and coastal flooding",
		region: "JAKARTA, INDONESIA",
		headline: ["A CITY", "AT THE", "WATER'S EDGE"],
		eyebrow: "LIVE STUDY / URBAN CHANGE",
		story: "Exploring radar observations across a growing coastal megacity.",
		fieldNote: "Urban radar returns depend on buildings, surface moisture, and viewing geometry. Measuring subsidence requires calibrated interferometric data.",
		radarContext: {
			summary: "Dense buildings, wet ground, and coastal water create different scattering paths. Groundwater extraction, land reclamation, drainage, and coastal flooding are possible drivers; subsidence requires repeat-pass InSAR, not browse-image contrast.",
			HHHH: "HH co-polarization can emphasize building–ground double-bounce; the return also depends on building orientation and look geometry.",
			HVHV: "HV cross-polarization is more sensitive to depolarizing and volume scattering from urban structure; it does not measure subsidence by itself.",
		},
		center: [-6.2, 106.8],
		zoom: 8,
		bounds: [106, -7, 108, -5],
	},
};

const map = L.map("map", { zoomControl: true, attributionControl: false }).setView(
	sites.amazon.center,
	sites.amazon.zoom,
);
L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
	attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
	maxZoom: 19,
}).addTo(map);

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
	compareCount: document.getElementById("compare-count"),
	download: document.getElementById("download-link"),
	explain: document.getElementById("explain-button"),
	explainPanel: document.getElementById("explain-panel"),
	feedList: document.getElementById("feed-list"),
	feedStatus: document.getElementById("feed-status"),
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
	panelSceneCount: document.getElementById("panel-scene-count"),
	latestPassDate: document.getElementById("latest-pass-date"),
	latestPassHint: document.getElementById("latest-pass-hint"),
	selectedDateCopy: document.getElementById("selected-date-copy"),
	timelinePlay: document.getElementById("timeline-play"),
};

let granules = [];
let selectedId = null;
let selectedChannel = "quicklook";
let compareMode = false;
let requestNumber = 0;
let explainNumber = 0;
let pendingSelectId = null;
let explainKey = null;
let timelineTimer = null;
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
	const previous = granules[granules.indexOf(granule) + 1];
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
	const site = siteAtMapCenter();
	if (site) return { place: site.name, theme: site.theme };
	const center = map.getCenter();
	return {
		place: `the area near ${formatCoordinate(center.lat, "N", "S")}, ${formatCoordinate(center.lng, "E", "W")}`,
		theme: undefined,
	};
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
	const site = siteAtMapCenter();
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

function hideExplanation() {
	explainNumber++;
	explainKey = null;
	ui.explainPanel.classList.add("hidden");
	ui.explainPanel.replaceChildren();
	ui.explain.classList.remove("busy");
	ui.explain.textContent = "";
	ui.explain.append(Object.assign(document.createElement("span"), { className: "explain-icon", textContent: "✦" }), " Explain this change");
}

function showExplanation(kicker, paragraphs, footnote, state = "ready") {
	ui.explainPanel.replaceChildren();
	ui.explainPanel.classList.remove("hidden", "error");
	if (state === "error") ui.explainPanel.classList.add("error");
	const head = document.createElement("div");
	head.className = "explain-kicker";
	head.textContent = kicker;
	ui.explainPanel.append(head);
	for (const text of paragraphs) {
		const p = document.createElement("p");
		p.textContent = text;
		ui.explainPanel.append(p);
	}
	if (footnote) {
		const foot = document.createElement("div");
		foot.className = "explain-foot";
		foot.textContent = footnote;
		ui.explainPanel.append(foot);
	}
}

async function explainSelectedChange() {
	const pair = comparePair(getSelectedGranule());
	if (!pair?.before.browseUrl || !pair.after.browseUrl) return;
	const key = `${pair.before.id}:${pair.after.id}`;
	const thisRequest = ++explainNumber;
	explainKey = key;
	compareMode = true;
	renderSelection();
	ui.explain.disabled = true;
	ui.explain.classList.add("busy");
	showExplanation("AI READING", ["Comparing the two passes…"], null);
	const { place, theme } = describePlace();
	const stamp = (scene) => ({ id: scene.id, date: scene.timeStart.slice(0, 10), imageUrl: scene.browseUrl });
	try {
		const response = await fetch("/api/nisar/explain", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				place,
				theme,
				layer: "Geographic quicklook",
				before: stamp(pair.before),
				after: stamp(pair.after),
			}),
		});
		let result;
		try {
			result = await response.json();
		} catch {
			throw new Error("The AI response could not be read.");
		}
		if (!response.ok) throw new Error(result.error || `AI request failed (${response.status}).`);
		if (thisRequest !== explainNumber || explainKey !== key) return;
		const paragraphs = result.text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
		showExplanation(
			"AI READING · HYPOTHESES, NOT MEASUREMENTS",
			paragraphs,
			`${result.cached ? "CACHED · " : ""}WORKERS AI · LLAMA 4 SCOUT`,
		);
	} catch (error) {
		if (thisRequest !== explainNumber) return;
		const detail = error instanceof Error ? error.message : "The AI request failed.";
		showExplanation("AI READING UNAVAILABLE", [detail], null, "error");
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
		ui.explain.disabled = true;
		ui.compareCount.textContent = "0 passes";
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
	ui.explain.disabled = !pair?.before.browseUrl || !pair.after.browseUrl || ui.explain.classList.contains("busy");
	if (explainKey && (!pair || explainKey !== `${pair.before.id}:${pair.after.id}`)) hideExplanation();
	if (granule.downloadUrl) {
		ui.download.href = granule.downloadUrl;
		ui.download.classList.remove("disabled");
	} else {
		ui.download.removeAttribute("href");
		ui.download.classList.add("disabled");
	}
	renderPreview(granule);
}

function renderResults() {
	ui.sceneCount.textContent = String(granules.length).padStart(2, "0");
	ui.panelSceneCount.textContent = String(granules.length).padStart(2, "0");
	renderFootprints();
	renderSceneList();
	renderTimeline();
	renderSelection();
}

async function searchArea() {
	stopTimelinePlayback();
	const thisRequest = ++requestNumber;
	const [west, south, east, north] = currentBounds();
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
	const site = sites[siteId];
	if (!site) return;
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
	ui.storyEyebrow.textContent = site.eyebrow;
	ui.storyFirst.textContent = site.headline[0];
	ui.storyEmphasis.textContent = site.headline[1];
	ui.storyLast.textContent = site.headline[2];
	ui.storyCopy.textContent = site.story;
	ui.fieldNoteCopy.textContent = site.fieldNote;
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
document.getElementById("search-area").addEventListener("click", searchArea);
ui.channel.addEventListener("change", () => {
	selectedChannel = ui.channel.value;
	compareMode = false;
	renderSelection();
});
ui.explain.addEventListener("click", explainSelectedChange);
ui.compare.addEventListener("click", () => {
	if (granules.length < 2) return;
	compareMode = !compareMode;
	renderSelection();
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
	const site = sites[ui.site.value];
	if (!site || !map.getBounds().contains(site.center)) {
		siteMarker.setStyle({ opacity: 0.35, fillOpacity: 0.3 });
	} else {
		siteMarker.setStyle({ opacity: 1, fillOpacity: 0.95 });
	}
});

updateMapCenter();
updateStory(sites[ui.site.value]);
searchArea();
loadFeed();
