/* ─── Leaflet Map Helpers — Enhanced ──────────────────────── */

// Pakistan bounds for fitting
const PAKISTAN_BOUNDS = [[23.5, 60.5], [37.5, 78.0]];
const PAKISTAN_CENTER = [30.3753, 69.3451];

// Modern tile layers
const MAP_STYLES = {
    dark: {
        name: '🌙 Dark',
        url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
        options: { maxZoom: 18, subdomains: 'abcd', attribution: '© CartoDB' }
    },
    light: {
        name: '☀ Light',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        options: { maxZoom: 18, subdomains: 'abcd' }
    },
    darkLabels: {
        name: '🌙 Dark Labels',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        options: { maxZoom: 18, subdomains: 'abcd' }
    },
    satellite: {
        name: '🛰 Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        options: { maxZoom: 18, attribution: '© Esri' }
    },
    terrain: {
        name: '🗺 Terrain',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        options: { maxZoom: 17 }
    },
    voyager: {
        name: '🎨 Voyager',
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        options: { maxZoom: 18, subdomains: 'abcd' }
    },
    positron: {
        name: '⬜ Light',
        url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
        options: { maxZoom: 18, subdomains: 'abcd' }
    }
};

function initMap(id, opts = {}) {
    const center = opts.center || PAKISTAN_CENTER;
    const zoom = opts.zoom || 6;

    const map = L.map(id, {
        center: center,
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
        minZoom: 3,
        maxZoom: 18,
        zoomSnap: 0.5,
        zoomDelta: 0.5
    });

    // Default tile layer (dark no labels — cleaner look)
    const style = opts.style || 'terrain';
    const tileConfig = MAP_STYLES[style] || MAP_STYLES.light;
    const tileLayer = L.tileLayer(tileConfig.url, tileConfig.options).addTo(map);

    // Zoom control
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Store reference for style switching
    map._currentTile = tileLayer;
    map._currentStyle = style;

    // Add basemap switcher control — popup with 5 options
    const basemapCtrl = L.control({ position: 'topright' });
    basemapCtrl.onAdd = function() {
        const container = L.DomUtil.create('div', 'basemap-selector');
        container.style.cssText = 'background:rgba(15,23,42,0.95);border-radius:8px;padding:4px;box-shadow:0 4px 12px rgba(0,0,0,0.4);font-family:Inter,system-ui,sans-serif;position:relative;';
        
        const activeBtn = L.DomUtil.create('div', '', container);
        activeBtn.style.cssText = 'padding:6px 10px;color:#e2e8f0;font-size:11px;font-weight:600;cursor:pointer;text-align:center;border-radius:6px;transition:background 0.15s;';
        activeBtn.textContent = MAP_STYLES[style]?.name || '🗺 Map';
        activeBtn.id = 'bm-map-' + id;
        
        const dropdown = L.DomUtil.create('div', '', container);
        dropdown.style.cssText = 'display:none;position:absolute;top:100%;right:0;margin-top:4px;background:rgba(15,23,42,0.95);border-radius:8px;padding:4px;min-width:120px;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,0.4);';
        
        const styles = ['terrain', 'satellite', 'voyager', 'light', 'dark'];
        styles.forEach(s => {
            const opt = L.DomUtil.create('div', '', dropdown);
            opt.style.cssText = 'padding:6px 10px;color:#94a3b8;font-size:11px;cursor:pointer;border-radius:4px;transition:all 0.15s;white-space:nowrap;';
            opt.textContent = MAP_STYLES[s]?.name || s;
            if (s === style) { opt.style.color = '#3b82f6'; opt.style.fontWeight = '700'; }
            opt.onmouseenter = () => { opt.style.background = 'rgba(59,130,246,0.15)'; opt.style.color = '#e2e8f0'; };
            opt.onmouseleave = () => { opt.style.background = 'transparent'; opt.style.color = s === style ? '#3b82f6' : '#94a3b8'; };
            opt.onclick = (e) => {
                e.stopPropagation();
                switchMapStyle(map, s);
                document.getElementById('bm-map-' + id).textContent = MAP_STYLES[s]?.name || s;
                dropdown.querySelectorAll('div').forEach(d => { d.style.color = '#94a3b8'; d.style.fontWeight = '400'; });
                opt.style.color = '#3b82f6';
                opt.style.fontWeight = '700';
                dropdown.style.display = 'none';
            };
        });
        
        activeBtn.onclick = (e) => { e.stopPropagation(); dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none'; };
        document.addEventListener('click', () => { dropdown.style.display = 'none'; });
        L.DomEvent.disableClickPropagation(container);
        return container;
    };
    basemapCtrl.addTo(map);

    return map;
}

// Switch map style
function switchMapStyle(map, styleName) {
    const tileConfig = MAP_STYLES[styleName];
    if (!tileConfig || !map) return;

    if (map._currentTile) map.removeLayer(map._currentTile);
    // Override subdomains for satellite (no subdomains needed)
    const opts = {...tileConfig.options};
    if (styleName === 'satellite') { opts.subdomains = []; }
    map._currentTile = L.tileLayer(tileConfig.url, opts).addTo(map);
    map._currentStyle = styleName;
}

// Add district markers with enhanced styling
function addDistrictMarkers(map, data, colorFn, popupFn) {
    const markers = L.layerGroup();
    Object.entries(data).forEach(([name, d]) => {
        if (!d.lat || !d.lng) return;
        const val = colorFn(name, d);
        const color = typeof val === 'string' && val.startsWith('#') ? val : '#58a6ff';

        // Outer glow ring
        const glow = L.circleMarker([d.lat, d.lng], {
            radius: 12,
            fillColor: color,
            color: 'transparent',
            weight: 0,
            fillOpacity: 0.15,
            interactive: false
        });
        markers.addLayer(glow);

        // Main marker
        const m = L.circleMarker([d.lat, d.lng], {
            radius: 7,
            fillColor: color,
            color: 'rgba(255,255,255,0.9)',
            weight: 2,
            fillOpacity: 0.85,
            className: 'climate-marker'
        });
        m.bindPopup(
            popupFn ? popupFn(name, d) : `<b>${name}</b><br>${d.province || ''}`,
            { className: 'dark-popup', maxWidth: 250 }
        );
        markers.addLayer(m);
    });
    markers.addTo(map);
    return markers;
}

// Add river gauge markers
function addGaugeMarkers(map, stations) {
    const layer = L.layerGroup();
    stations.forEach(s => {
        const color = s.category === 'Extreme' ? '#ef4444' : s.category === 'Very High' ? '#f97316' :
                      s.category === 'High' ? '#eab308' : s.category === 'Moderate' ? '#3b82f6' : '#22c55e';
        const icon = L.divIcon({
            className: '',
            html: `<div class="gauge" style="background:${color};box-shadow:0 0 8px ${color}"></div>`,
            iconSize: [14, 14]
        });
        const m = L.marker([s.lat, s.lng], { icon });
        m.bindPopup(
            `<div style="min-width:140px"><b style="font-size:14px">${s.name}</b><br><span style="color:#94a3b8">${s.river}</span><hr style="margin:6px 0;border-color:#333"><div style="display:flex;justify-content:space-between"><span>🌊 Flow:</span><b style="color:${color}">${fmtCusecs(s.discharge)}</b></div></div>`,
            { className: 'dark-popup', maxWidth: 250 }
        );
        layer.addLayer(m);
    });
    layer.addTo(map);
    return layer;
}

// Add heat markers (larger, glowing)
function addHeatMarkers(map, data, tempFn) {
    const layer = L.layerGroup();
    Object.entries(data).forEach(([name, d]) => {
        if (!d.lat || !d.lng) return;
        const t = tempFn(d);
        const color = tempColor(t);
        const radius = Math.max(6, Math.min(16, t / 3));
        const m = L.circleMarker([d.lat, d.lng], {
            radius: radius,
            fillColor: color,
            color: 'rgba(255,255,255,0.6)',
            weight: 1.5,
            fillOpacity: 0.75,
            className: 'climate-marker'
        });
        m.bindPopup(
            `<div style="min-width:140px"><b style="font-size:14px">${name}</b><br><span style="color:#94a3b8">${d.province || ''}</span><hr style="margin:6px 0;border-color:#333"><div style="display:flex;justify-content:space-between"><span>🌡 Temp:</span><b style="color:${color};font-size:16px">${fmtC(t)}</b></div></div>`,
            { className: 'dark-popup', maxWidth: 250 }
        );
        layer.addLayer(m);
    });
    layer.addTo(map);
    return layer;
}
