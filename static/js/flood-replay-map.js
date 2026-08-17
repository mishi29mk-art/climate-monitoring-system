/* ─── Flood Replay Map Helper ────────────────────────────────── */
// Consistent map style with light/dark mode support

const FLOOD_TILE_URLS = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
};

const FLOOD_TILE_NAMES = {
    dark: '🌙 Dark',
    light: '☀ Light',
    satellite: '🛰 Satellite',
    terrain: '🗺 Terrain'
};

function initFloodReplayMap(containerId, options = {}) {
    const {
        center = [30.0, 70.0],
        zoom = 5,
        style = null // null = auto-detect from theme
    } = options;

    const map = L.map(containerId, {
        center: center,
        zoom: zoom,
        zoomControl: true
    });

    // Auto-detect theme if not specified
    const tileStyle = style || 'terrain';

    // Add tile layer
    let currentTile = L.tileLayer(FLOOD_TILE_URLS[tileStyle], {
        maxZoom: 18,
        subdomains: tileStyle === 'satellite' ? [] : (tileStyle === 'terrain' ? 'abc' : 'abcd'),
        attribution: tileStyle === 'satellite' ? '© Esri' : (tileStyle === 'terrain' ? '© OpenTopoMap' : '© CartoDB')
    }).addTo(map);

    // Store references for theme switching
    map._floodTileLayer = currentTile;
    map._floodTileStyle = tileStyle;

    // Add basemap switcher control
    const basemapBtn = L.control({ position: 'topright' });
    basemapBtn.onAdd = function() {
        const btn = L.DomUtil.create('div', 'basemap-switcher');
        btn.innerHTML = '<button class="basemap-btn" onclick="cycleFloodMapBasemap(this)" title="Switch basemap">' +
            FLOOD_TILE_NAMES[tileStyle] + '</button>';
        L.DomEvent.disableClickPropagation(btn);
        return btn;
    };
    basemapBtn.addTo(map);

    return map;
}

function cycleFloodMapBasemap(btn) {
    const map = btn.closest('.leaflet-container') || btn.parentElement?.parentElement;
    if (!map || !map._leaflet_id) return;

    // Find the actual Leaflet map instance
    let leafletMap = null;
    document.querySelectorAll('.leaflet-container').forEach(el => {
        if (el._leaflet_id && el._floodTileLayer) {
            leafletMap = el;
        }
    });

    if (!leafletMap) return;

    const currentStyle = leafletMap._floodTileStyle;
    const styles = ['terrain', 'satellite', 'light', 'dark'];
    const nextIdx = (styles.indexOf(currentStyle) + 1) % styles.length;
    const nextStyle = styles[nextIdx];

    // Remove current tiles
    leafletMap.removeLayer(leafletMap._floodTileLayer);

    // Add new tiles
    const subdomains = nextStyle === 'satellite' ? [] : (nextStyle === 'terrain' ? 'abc' : 'abcd');
    const attribution = nextStyle === 'satellite' ? '© Esri' : (nextStyle === 'terrain' ? '© OpenTopoMap' : '© CartoDB');

    leafletMap._floodTileLayer = L.tileLayer(FLOOD_TILE_URLS[nextStyle], {
        maxZoom: 18,
        subdomains: subdomains,
        attribution: attribution
    }).addTo(leafletMap);

    leafletMap._floodTileStyle = nextStyle;
    btn.textContent = FLOOD_TILE_NAMES[nextStyle];
}

function addStationNode(map, lat, lng, name, color, size, discharge, basin) {
    const group = L.layerGroup();
    
    // Outer glow ring
    L.circleMarker([lat, lng], {
        radius: size + 8,
        fillColor: color,
        color: 'transparent',
        fillOpacity: 0.15
    }).addTo(group);

    // Main marker — filled circle
    const m = L.circleMarker([lat, lng], {
        radius: size,
        fillColor: color,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9,
        className: 'river-glow-marker'
    });
    m.bindPopup(`<b>${name}</b><br>Basin: ${basin}<br>Discharge: ${(discharge/1000).toFixed(0)}k cusecs`, { className: 'dark-popup' });
    group.addLayer(m);

    // Station label — always visible
    const labelColor = document.documentElement.classList.contains('light') ? '#1e293b' : '#e2e8f0';
    const labelShadow = document.documentElement.classList.contains('light')
        ? '0 0 8px rgba(255,255,255,0.9),0 0 16px rgba(255,255,255,0.7)'
        : '0 0 8px rgba(0,0,0,0.9),0 0 16px rgba(0,0,0,0.7)';
    const labelIcon = L.divIcon({
        className: 'river-station-label',
        html: `<div style="color:${labelColor};font-size:11px;font-weight:600;white-space:nowrap;text-shadow:${labelShadow};pointer-events:none">${name}</div>`,
        iconAnchor: [-size - 4, -4]
    });
    L.marker([lat, lng], { icon: labelIcon, interactive: false }).addTo(group);

    return group;
}

function addRiverPath(map, pathCoords, color = '#3b82f6', weight = 4) {
    // Draw the river path — solid line
    L.polyline(pathCoords, {
        color: color,
        weight: weight,
        opacity: 0.8
    }).addTo(map);

    // Add small connecting nodes with gradient
    for (let i = 0; i < pathCoords.length - 1; i++) {
        const lat1 = pathCoords[i][0], lng1 = pathCoords[i][1];
        const lat2 = pathCoords[i+1][0], lng2 = pathCoords[i+1][1];
        for (let j = 1; j <= 3; j++) {
            const t = j / 4;
            const lat = lat1 + (lat2 - lat1) * t;
            const lng = lng1 + (lng2 - lng1) * t;
            const progress = (i + t) / (pathCoords.length - 1);
            // Green → Yellow → Orange → Red gradient
            const r = Math.round(34 + progress * 205);
            const g = Math.round(197 - progress * 129);
            const b = Math.round(94 - progress * 60);
            L.circleMarker([lat, lng], {
                radius: 2 + progress * 3,
                fillColor: `rgb(${r},${g},${b})`,
                color: 'rgba(255,255,255,0.3)',
                weight: 1,
                fillOpacity: 0.7
            }).addTo(map);
        }
    }
}

// Common Indus River path
const INDUS_RIVER_PATH = [
    [35.5, 73.5],   // Source (Himalayas)
    [34.5, 73.0],   // Upper Indus
    [34.05, 72.68], // Tarbela
    [34.0, 71.5],   // Nowshera
    [32.9, 71.48],  // Kalabagh
    [31.42, 71.12], // Chashma
    [30.72, 70.04], // Taunsa
    [29.5, 69.5],   // Middle
    [28.44, 68.42], // Guddu
    [27.69, 68.42], // Sukkur
    [26.5, 68.35],  // Near Kotri
    [25.39, 68.32], // Kotri
    [24.85, 67.0],  // Arabian Sea
];

// Common station nodes for Indus Basin
const INDUS_STATIONS = [
    { name: 'Nowshera', lat: 34.0, lng: 71.5, discharge: 54000, color: '#22c55e', size: 8, basin: 'Kabul' },
    { name: 'Tarbela Dam', lat: 34.05, lng: 72.68, discharge: 165000, color: '#7c3aed', size: 10, basin: 'Indus' },
    { name: 'Kalabagh', lat: 32.9, lng: 71.48, discharge: 135000, color: '#eab308', size: 12, basin: 'Indus' },
    { name: 'Chashma Barrage', lat: 31.42, lng: 71.12, discharge: 135000, color: '#16a34a', size: 14, basin: 'Indus' },
    { name: 'Taunsa Barrage', lat: 30.72, lng: 70.04, discharge: 120000, color: '#ec4899', size: 16, basin: 'Indus' },
    { name: 'Guddu Barrage', lat: 28.44, lng: 68.42, discharge: 105000, color: '#a855f7', size: 18, basin: 'Indus' },
    { name: 'Sukkur Barrage', lat: 27.69, lng: 68.42, discharge: 105000, color: '#f97316', size: 20, basin: 'Indus' },
    { name: 'Kotri Barrage', lat: 25.39, lng: 68.32, discharge: 90000, color: '#06b6d4', size: 22, basin: 'Indus' },
];
