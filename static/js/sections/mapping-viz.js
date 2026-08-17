/* ─── Mapping & Visualization ─────────────────────────────── */
async function render_mapping_viz(el) {
    el.innerHTML = '<div class="loading">Loading mapping layers…</div>';
    try {
        const res = await fetch('/api/modules/mapping');
        const d = await res.json();
        if (!d || !d.layers) throw new Error('Invalid mapping data');

        const layers = d.layers || [];
        const basemaps = d.basemaps || [];
        const tools = d.tools || [];
        const activeLayers = d.active_layers || layers.filter(l => l.status === 'active').length;
        const totalDataPoints = layers.reduce((sum, l) => sum + (l.data_points || 0), 0);

        el.innerHTML = `
        <div class="sec-hdr">
            <h2>🗺 Mapping & Visualization</h2>
            <p>Geospatial layers, basemaps, and analysis tools for climate data visualization across Pakistan</p>
            <div class="hdr-meta">
                <span>📐 ${activeLayers} active layers</span>
                <span>🗺 ${basemaps.length} basemaps</span>
                <span>🛠 ${tools.length} tools</span>
                <span>📍 ${totalDataPoints} data points</span>
            </div>
        </div>

        <div class="card-grid g4">
            <div class="stat-card s-blue">
                <div class="stat-icon">📐</div>
                <div class="stat-value" style="color:${C.info}">${activeLayers}</div>
                <div class="stat-label">Active Layers</div>
                <div class="stat-sub">of ${layers.length} total</div>
            </div>
            <div class="stat-card s-purple">
                <div class="stat-icon">🗺</div>
                <div class="stat-value" style="color:${C.purple}">${basemaps.length}</div>
                <div class="stat-label">Basemaps</div>
                <div class="stat-sub">Map tile styles</div>
            </div>
            <div class="stat-card s-orange">
                <div class="stat-icon">🛠</div>
                <div class="stat-value" style="color:${C.orange}">${tools.length}</div>
                <div class="stat-label">Analysis Tools</div>
                <div class="stat-sub">${tools.filter(t => t.status === 'active').length} active</div>
            </div>
            <div class="stat-card s-cyan">
                <div class="stat-icon">📍</div>
                <div class="stat-value" style="color:${C.cyan}">${fmtK(totalDataPoints)}</div>
                <div class="stat-label">Data Points</div>
                <div class="stat-sub">Across all layers</div>
            </div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header">
                    <h3>📐 Map Layers</h3>
                    <span class="badge b-success">${activeLayers} Active</span>
                </div>
                <div style="display:grid;gap:10px;padding:2px 0">
                ${layers.map(l => {
                    const statusClass = l.status === 'active' ? 'b-success' : 'b-warning';
                    const statusIcon = l.status === 'active' ? '🟢' : '🟡';
                    const statusLabel = l.status === 'active' ? 'Active' : 'Simulated';
                    return `
                    <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)">
                        <div style="font-size:24px;width:40px;text-align:center">${l.icon}</div>
                        <div style="flex:1">
                            <div style="font-weight:600;font-size:13px">${l.name}</div>
                            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Scale: ${l.color_scale} · ${l.data_points} pts</div>
                        </div>
                        <div style="width:80px;text-align:center">
                            <span class="badge ${statusClass}" style="font-size:10px">${statusIcon} ${statusLabel}</span>
                        </div>
                    </div>`;
                }).join('')}
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>🗺 Basemap Selector</h3>
                    <span class="badge b-info">${basemaps.length} Available</span>
                </div>
                <div id="basemap-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
                ${basemaps.map((b,i) => {
                    const selected = b.selected;
                    const style = selected
                        ? 'background:rgba(59,130,246,0.12);border-color:var(--accent);color:var(--accent-light)'
                        : '';
                    return `
                    <div class="basemap-option" data-tile="${b.id}" data-idx="${i}" onclick="switchMapBasemap(this)" style="padding:12px 14px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border);cursor:pointer;transition:all .15s;${style}">
                        <div style="font-weight:600;font-size:12px;display:flex;align-items:center;gap:6px">
                            ${selected ? '✅' : '🗺'} ${b.name}
                        </div>
                        <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${b.id}</div>
                    </div>`;
                }).join('')}
                </div>
            </div>
        </div>

        <div class="card mt-3">
            <div class="card-header">
                <h3>🗺 Map Preview</h3>
                <span class="badge b-purple">Pakistan Overview</span>
            </div>
            <div id="map-viz-map" class="map-container" style="height:400px"></div>
            <div style="padding:8px 12px;font-size:11px;color:var(--text-muted);display:flex;justify-content:space-between">
                <span>Basemap: Dark Theme · ${activeLayers} layers loaded</span>
                <span>Center: 30.38°N, 69.35°E · Zoom: 6</span>
            </div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header">
                    <h3>🛠 Analysis Tools</h3>
                </div>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
                ${tools.map(t => {
                    const isActive = t.status === 'active';
                    return `
                    <div style="display:flex;align-items:center;gap:10px;padding:14px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid ${isActive ? 'var(--border-accent)' : 'var(--border)'}">
                        <div style="font-size:22px;width:36px;text-align:center">${t.icon}</div>
                        <div style="flex:1">
                            <div style="font-weight:600;font-size:12px">${t.name}</div>
                            <div style="font-size:10px;color:var(--text-muted);margin-top:1px">${isActive ? '🟢 Active' : '🔵 Planned'}</div>
                        </div>
                    </div>`;
                }).join('')}
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>📊 Layer Data Points</h3>
                </div>
                <div style="height:220px"><canvas id="map-pts-chart"></canvas></div>
            </div>
        </div>`;

        setTimeout(() => {
            // Initialize Leaflet map preview
            try {
                const map = initMap('map-viz-map', { zoom: 6, style: 'terrain' });
                window._vizMap = map;

                // Add layer markers for active layers
                const layerColors = {
                    'temperature': '#ef4444',
                    'aqi': '#f97316',
                    'precipitation': '#3b82f6',
                    'wind': '#6366f1',
                    'flood-risk': '#eab308',
                    'vegetation': '#22c55e',
                    'glacial': '#06b6d4',
                    'agriculture': '#a855f7'
                };

                // Sample Pakistan district coordinates for layer visualization
                const samplePoints = [
                    { name: 'Islamabad', lat: 33.6941, lng: 73.0479 },
                    { name: 'Lahore', lat: 31.5204, lng: 74.3587 },
                    { name: 'Karachi', lat: 24.8607, lng: 67.0011 },
                    { name: 'Peshawar', lat: 34.0151, lng: 71.5249 },
                    { name: 'Quetta', lat: 30.1798, lng: 66.9750 },
                    { name: 'Multan', lat: 30.1575, lng: 71.5249 },
                    { name: 'Faisalabad', lat: 31.4504, lng: 73.1350 },
                    { name: 'Gilgit', lat: 35.8817, lng: 74.4643 }
                ];

                const activeLayerData = layers.filter(l => l.status === 'active');
                const markerLayer = L.layerGroup();

                samplePoints.forEach(pt => {
                    // Outer glow
                    const glow = L.circleMarker([pt.lat, pt.lng], {
                        radius: 14, fillColor: C.accent,
                        color: 'transparent', weight: 0, fillOpacity: 0.1,
                        interactive: false
                    });
                    markerLayer.addLayer(glow);

                    // Inner marker
                    const marker = L.circleMarker([pt.lat, pt.lng], {
                        radius: 6, fillColor: C.accent,
                        color: 'rgba(255,255,255,0.8)', weight: 1.5,
                        fillOpacity: 0.85
                    });

                    const layerList = activeLayerData.map(l =>
                        `<div style="margin:2px 0"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${layerColors[l.id] || C.info};margin-right:6px"></span>${l.icon} ${l.name}</div>`
                    ).join('');

                    marker.bindPopup(
                        `<div style="min-width:160px">
                            <b style="font-size:14px">${pt.name}</b>
                            <hr style="margin:6px 0;border-color:rgba(255,255,255,0.1)">
                            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Available Layers:</div>
                            ${layerList}
                        </div>`,
                        { className: 'dark-popup', maxWidth: 250 }
                    );
                    markerLayer.addLayer(marker);
                });

                markerLayer.addTo(map);
            } catch (e) {
                console.warn('Map preview init failed:', e);
            }

            // Bar chart of data points per layer
            const pc = document.getElementById('map-pts-chart');
            if (pc) {
                const chartColors = layers.map(l =>
                    layerColors[l.id] || [C.success, C.info, C.warning, C.purple, C.orange, C.cyan, C.danger, C.yellow][layers.indexOf(l) % 8]
                );
                makeBar(
                    pc.getContext('2d'),
                    layers.map(l => l.name.split(' ').slice(0, 2).join(' ')),
                    layers.map(l => l.data_points || 0),
                    chartColors,
                    { barThickness: 20 }
                );
            }
        }, 150);
    } catch (e) {
        el.innerHTML = `<div class="loading">Error loading mapping data: ${e.message}</div>`;
    }
}

// ═══ Basemap Switching ═══════════════════════════════════════
const TILE_URLS = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    positron: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    darkLabels: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
};

window._vizMap = null;
window._vizBaseLayer = null;

function switchMapBasemap(el) {
    const tileId = el.getAttribute('data-tile');
    if (!tileId || !window._vizMap) return;

    // Remove ALL existing tile layers
    const toRemove = [];
    window._vizMap.eachLayer(layer => {
        if (layer._url || layer instanceof L.TileLayer) toRemove.push(layer);
    });
    toRemove.forEach(l => window._vizMap.removeLayer(l));

    // Add new tile layer
    const url = TILE_URLS[tileId] || TILE_URLS.dark;
    window._vizBaseLayer = L.tileLayer(url, { maxZoom: 18, subdomains: 'abcd' }).addTo(window._vizMap);

    // Update UI selection state
    document.querySelectorAll('.basemap-option').forEach(opt => {
        opt.style.background = 'var(--bg-secondary)';
        opt.style.borderColor = 'var(--border)';
        opt.style.color = '';
        const icon = opt.querySelector('div > div');
        if (icon) icon.innerHTML = icon.innerHTML.replace('✅', '🗺');
    });
    el.style.background = 'rgba(59,130,246,0.12)';
    el.style.borderColor = 'var(--accent)';
    el.style.color = 'var(--accent-light)';
    const iconEl = el.querySelector('div > div');
    if (iconEl) iconEl.innerHTML = iconEl.innerHTML.replace('🗺', '✅');

    // Update footer label
    const footer = el.closest('.card')?.nextElementSibling;
    // no-op — footer is outside this scope
}

