const sites = {
	amazon: {
		name: "Amazon floodplain",
		center: [-3.1, -60.0],
		zoom: 7,
		bounds: [-61, -4, -59, -2],
	},
	louisiana: {
		name: "Mississippi Delta",
		center: [29.5, -90.0],
		zoom: 7,
		bounds: [-91, 28, -89, 31],
	},
	iceland: {
		name: "South Iceland",
		center: [64.0, -19.0],
		zoom: 7,
		bounds: [-20, 63, -18, 65],
	},
	jakarta: {
		name: "Jakarta basin",
		center: [-6.2, 106.8],
		zoom: 8,
		bounds: [106, -7, 108, -5],
	},
};

const map = L.map("map", { zoomControl: true, attributionControl: false }).setView(
	sites.amazon.center,
	sites.amazon.zoom,
);
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
	subdomains: "abcd",
	maxZoom: 19,
}).addTo(map);
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png", {
	subdomains: "abcd",
	maxZoom: 19,
	opacity: 0.75,
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
	selectedTitle: document.getElementById("selected-title"),
	selectedMeta: document.getElementById("selected-meta"),
	previewLabel: document.getElementById("preview-channel-label"),
	preview: document.getElementById("preview-content"),
	channel: document.getElementById("channel-select"),
	compare: document.getElementById("compare-button"),
	compareCount: document.getElementById("compare-count"),
	download: document.getElementById("download-link"),
};

let granules = [];
let selectedId = null;
let selectedChannel = "quicklook";
let compareMode = false;
let requestNumber = 0;
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

	const ordered = [...granules].reverse();
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
		if (index >= 19) return;
	});
}

function renderPreview(granule) {
	ui.preview.replaceChildren();
	if (!granule) {
		ui.previewLabel.textContent = "RADAR QUICKLOOK";
		ui.preview.innerHTML = `<div class="preview-placeholder"><div class="placeholder-orbit"><span></span><i></i></div><strong>NO SCENE SELECTED</strong><small>Choose a place to look for NISAR passes</small></div>`;
		return;
	}

	if (compareMode) {
		const previous = granules[granules.indexOf(granule) + 1];
		if (previous && granule.browseUrl && previous.browseUrl) {
			ui.previewLabel.textContent = "PASS-TO-PASS QUICKLOOK";
			const comparison = document.createElement("div");
			comparison.className = "compare-preview";
			for (const [scene, label] of [[previous, "PREVIOUS"], [granule, "SELECTED"]]) {
				const figure = document.createElement("figure");
				const image = document.createElement("img");
				image.src = scene.browseUrl;
				image.alt = `NISAR radar quicklook from ${formatDate(scene.timeStart)}`;
				image.loading = "lazy";
				const caption = document.createElement("figcaption");
				caption.textContent = `${label} · ${formatDate(scene.timeStart, { month: "short", day: "numeric", year: "2-digit" })}`;
				image.addEventListener("error", () => figure.classList.add("image-unavailable"), { once: true });
				figure.append(image, caption);
				comparison.append(figure);
			}
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
	image.src = imageUrl;
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
	ui.channel.disabled = !granule || !granule.browseUrl;
	if (selectedChannel !== "quicklook" && !granule?.browseChannels.some(
		(channel) => `${channel.frequency}-${channel.polarization}` === selectedChannel,
	)) {
		selectedChannel = "quicklook";
	}
	ui.channel.value = selectedChannel;
}

function renderSelection() {
	const granule = getSelectedGranule();
	if (!granule) {
		ui.selectedIndex.textContent = "—";
		ui.selectedTitle.textContent = "No NISAR passes in this view";
		ui.selectedMeta.textContent = "Try another area or a wider date range.";
		ui.compare.disabled = true;
		ui.compareCount.textContent = "0 passes";
		ui.download.classList.add("disabled");
		ui.download.removeAttribute("href");
		renderChannelOptions(null);
		renderPreview(null);
		return;
	}

	const selectedNumber = granules.indexOf(granule) + 1;
	ui.selectedIndex.textContent = `${String(selectedNumber).padStart(2, "0")} / ${String(granules.length).padStart(2, "0")}`;
	ui.selectedTitle.textContent = formatDate(granule.timeStart);
	ui.selectedMeta.textContent = `${granule.title} · Provisional L2 GCOV`;
	ui.compare.disabled = granules.length < 2;
	ui.compareCount.textContent = granules.length > 1 ? `${granules.length - 1} earlier` : "1 pass";
	ui.compare.classList.toggle("comparison-active", compareMode);
	if (granule.downloadUrl) {
		ui.download.href = granule.downloadUrl;
		ui.download.classList.remove("disabled");
	} else {
		ui.download.removeAttribute("href");
		ui.download.classList.add("disabled");
	}
	renderChannelOptions(granule);
	renderPreview(granule);
}

function renderResults() {
	ui.sceneCount.textContent = String(granules.length).padStart(2, "0");
	renderFootprints();
	renderSceneList();
	renderTimeline();
	renderSelection();
}

async function searchArea() {
	const thisRequest = ++requestNumber;
	const [west, south, east, north] = currentBounds();
	const days = Number(ui.dateWindow.value);
	const endDate = new Date();
	const startDate = new Date(endDate);
	startDate.setUTCDate(startDate.getUTCDate() - days);
	const query = new URLSearchParams({
		bbox: [west, south, east, north].map((value) => value.toFixed(5)).join(","),
		from: startDate.toISOString().slice(0, 10),
		to: endDate.toISOString().slice(0, 10),
	});

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
		selectedId = granules[0]?.id ?? null;
		selectedChannel = "quicklook";
		compareMode = false;
		renderResults();
		setMessage("No NISAR scenes found in this map view.", "hidden");
		ui.sceneStatus.innerHTML = `<span class="status-dot"></span>${granules.length} SCENE${granules.length === 1 ? "" : "S"} · NASA CMR`;
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

function chooseSite(siteId) {
	const site = sites[siteId];
	if (!site) return;
	ui.site.value = siteId;
	document.querySelectorAll(".place-button").forEach((button) => {
		button.classList.toggle("selected", button.dataset.site === siteId);
	});
	map.setView(site.center, site.zoom);
	siteMarker.setLatLng(site.center);
	updateMapCenter();
	searchArea();
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
ui.compare.addEventListener("click", () => {
	if (granules.length < 2) return;
	compareMode = !compareMode;
	renderSelection();
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
searchArea();
