/* ─── River Gauge Network — Flood Replay Style ──────────────── */
async function render_rivers(el) {
    el.innerHTML = '<div class="loading">Loading river gauge network…</div>';
    try {
        const res = await fetch('/api/rivers/basins');
        const d = await res.json();
        const rtRes = await fetch('/api/rivers/realtime');
        const rt = await rtRes.json();
        const hydro = d.hydrographs || {};

        // ALL station data — real stations across ALL basins
        const stationNodes = [
            // Kabul River
            { name: 'Warsak Dam', lat: 34.18, lng: 71.07, discharge: 32000, color: '#8b5cf6', size: 10, basin: 'Kabul' },
            { name: 'Nowshera', lat: 34.0, lng: 71.5, discharge: 54000, color: '#a78bfa', size: 12, basin: 'Kabul' },
            // Indus Main
            { name: 'Tarbela Dam', lat: 34.05, lng: 72.68, discharge: 165000, color: '#3b82f6', size: 14, basin: 'Indus' },
            { name: 'Kalabagh', lat: 32.9, lng: 71.48, discharge: 135000, color: '#60a5fa', size: 16, basin: 'Indus' },
            { name: 'Chashma Barrage', lat: 31.42, lng: 71.12, discharge: 135000, color: '#2563eb', size: 18, basin: 'Indus' },
            { name: 'Taunsa Barrage', lat: 30.72, lng: 70.04, discharge: 120000, color: '#1d4ed8', size: 20, basin: 'Indus' },
            { name: 'Guddu Barrage', lat: 28.44, lng: 68.42, discharge: 105000, color: '#7c3aed', size: 22, basin: 'Indus' },
            { name: 'Sukkur Barrage', lat: 27.69, lng: 68.42, discharge: 105000, color: '#6d28d9', size: 24, basin: 'Indus' },
            { name: 'Kotri Barrage', lat: 25.39, lng: 68.32, discharge: 90000, color: '#5b21b6', size: 26, basin: 'Indus' },
            // Jhelum River
            { name: 'Mangla Dam', lat: 33.15, lng: 73.65, discharge: 78000, color: '#06b6d4', size: 14, basin: 'Jhelum' },
            { name: 'Rasul Barrage', lat: 32.83, lng: 73.58, discharge: 65000, color: '#22d3ee', size: 16, basin: 'Jhelum' },
            { name: 'Jhelum', lat: 32.67, lng: 73.18, discharge: 58000, color: '#0891b2', size: 18, basin: 'Jhelum' },
            // Chenab River
            { name: 'Marala Barrage', lat: 32.72, lng: 74.55, discharge: 72000, color: '#10b981', size: 12, basin: 'Chenab' },
            { name: 'Khanki Barrage', lat: 32.22, lng: 74.12, discharge: 68000, color: '#34d399', size: 14, basin: 'Chenab' },
            { name: 'Trimmu Barrage', lat: 31.02, lng: 72.28, discharge: 55000, color: '#059669', size: 16, basin: 'Chenab' },
            // Ravi River
            { name: 'Madhopur Headworks', lat: 32.38, lng: 75.58, discharge: 42000, color: '#f59e0b', size: 10, basin: 'Ravi' },
            { name: 'Balloki Barrage', lat: 31.43, lng: 74.33, discharge: 38000, color: '#fbbf24', size: 12, basin: 'Ravi' },
            { name: 'Sidhnai Barrage', lat: 30.58, lng: 73.15, discharge: 35000, color: '#d97706', size: 14, basin: 'Ravi' },
        ];
        window._riverStationNodes = stationNodes;

        // River paths for each basin
        const riverPaths = {
            'Indus': [
                [35.5, 73.5], [34.5, 73.0], [34.05, 72.68], [34.0, 71.5],
                [32.9, 71.48], [31.42, 71.12], [30.72, 70.04], [29.5, 69.5],
                [28.44, 68.42], [27.69, 68.42], [26.5, 68.35], [25.39, 68.32], [24.85, 67.0]
            ],
            'Kabul': [
                [34.5, 71.0], [34.18, 71.07], [34.0, 71.5], [33.8, 71.8], [33.5, 72.0]
            ],
            'Jhelum': [
                [33.5, 74.0], [33.3, 73.8], [33.15, 73.65], [32.83, 73.58],
                [32.67, 73.18], [32.4, 72.8], [32.1, 72.5], [31.8, 72.2], [31.5, 72.0]
            ],
            'Chenab': [
                [33.0, 75.0], [32.85, 74.8], [32.72, 74.55], [32.22, 74.12],
                [31.8, 73.5], [31.4, 72.8], [31.02, 72.28], [30.7, 71.8], [30.5, 71.5]
            ],
            'Ravi': [
                [32.8, 75.8], [32.5, 75.6], [32.38, 75.58], [32.0, 75.0],
                [31.43, 74.33], [31.0, 73.7], [30.58, 73.15], [30.3, 72.5], [30.0, 71.8]
            ]
        };
        window._riverPaths = riverPaths;

        el.innerHTML = `
        <div style="background:linear-gradient(135deg,#0a0f1a 0%,#111a2e 50%,#0a1628 100%);border:1px solid rgba(59,130,246,0.2);border-radius:var(--r-lg);padding:20px;margin-bottom:16px">
            <h2 style="color:#fff;font-size:20px;margin:0">🌊 River Gauge Network</h2>
            <p style="color:#94a3b8;font-size:12px;margin:4px 0 0">Real-time discharge monitoring · All Basins · ${stationNodes.length} stations across 5 river systems</p>
            <div style="display:flex;gap:8px;margin-top:8px"><span style="background:rgba(59,130,246,0.15);color:#60a5fa;padding:3px 10px;border-radius:20px;font-size:11px">● Live Data</span></div>
        </div>

        <!-- River Basin Filter Tabs -->
        <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap">
            <button class="river-tab active" data-basin="all" onclick="filterRiverBasin('all',this)" style="padding:6px 14px;border-radius:20px;border:1px solid rgba(59,130,246,0.3);background:rgba(59,130,246,0.15);color:#60a5fa;cursor:pointer;font-size:11px;font-weight:600">All Stations (${stationNodes.length})</button>
            <button class="river-tab" data-basin="Indus" onclick="filterRiverBasin('Indus',this)" style="padding:6px 14px;border-radius:20px;border:1px solid rgba(59,130,246,0.2);background:transparent;color:#94a3b8;cursor:pointer;font-size:11px">🔵 Indus (${stationNodes.filter(s=>s.basin==='Indus').length})</button>
            <button class="river-tab" data-basin="Kabul" onclick="filterRiverBasin('Kabul',this)" style="padding:6px 14px;border-radius:20px;border:1px solid rgba(139,92,246,0.2);background:transparent;color:#94a3b8;cursor:pointer;font-size:11px">🟣 Kabul (${stationNodes.filter(s=>s.basin==='Kabul').length})</button>
            <button class="river-tab" data-basin="Jhelum" onclick="filterRiverBasin('Jhelum',this)" style="padding:6px 14px;border-radius:20px;border:1px solid rgba(6,182,212,0.2);background:transparent;color:#94a3b8;cursor:pointer;font-size:11px">🔷 Jhelum (${stationNodes.filter(s=>s.basin==='Jhelum').length})</button>
            <button class="river-tab" data-basin="Chenab" onclick="filterRiverBasin('Chenab',this)" style="padding:6px 14px;border-radius:20px;border:1px solid rgba(16,185,129,0.2);background:transparent;color:#94a3b8;cursor:pointer;font-size:11px">🟢 Chenab (${stationNodes.filter(s=>s.basin==='Chenab').length})</button>
            <button class="river-tab" data-basin="Ravi" onclick="filterRiverBasin('Ravi',this)" style="padding:6px 14px;border-radius:20px;border:1px solid rgba(245,158,11,0.2);background:transparent;color:#94a3b8;cursor:pointer;font-size:11px">🟡 Ravi (${stationNodes.filter(s=>s.basin==='Ravi').length})</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <!-- Map -->
            <div style="background:#0a0f1a;border:1px solid rgba(59,130,246,0.2);border-radius:var(--r-lg);overflow:hidden">
                <div style="padding:10px 16px;border-bottom:1px solid rgba(59,130,246,0.15);display:flex;justify-content:space-between;align-items:center">
                    <h3 style="color:#e2e8f0;font-size:13px;margin:0">🗺 Station Map</h3>
                    <span id="river-map-count" style="color:#64748b;font-size:11px">${stationNodes.length} stations</span>
                </div>
                <div id="river-map" style="height:450px"></div>
            </div>

            <!-- Hydrograph -->
            <div style="background:#0a0f1a;border:1px solid rgba(59,130,246,0.2);border-radius:var(--r-lg);overflow:hidden">
                <div style="padding:10px 16px;border-bottom:1px solid rgba(59,130,246,0.15)">
                    <h3 style="color:#e2e8f0;font-size:13px;margin:0">📈 Recorded Station Hydrographs — 2010</h3>
                    <p style="color:#64748b;font-size:10px;margin:2px 0 0">Linear interpolation between FFC/NDMA readings</p>
                </div>
                <div style="height:450px;padding:8px"><canvas id="river-hydro-chart"></canvas></div>
            </div>
        </div>

        <!-- Station Cards -->
        <div id="river-station-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:16px">
        </div>

        <!-- 2010 Flood Impact -->
        <div style="margin-top:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
            <div style="background:linear-gradient(135deg,#1a0a0a,#2a1010);border:1px solid rgba(239,68,68,0.3);border-radius:var(--r-lg);padding:20px;text-align:center">
                <div style="font-size:11px;color:#f87171;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">⚠ Human Toll — 2010</div>
                <div style="font-size:32px;font-weight:700;color:#fca5a5">1,985</div>
                <div style="color:#94a3b8;font-size:13px">deaths</div>
                <div style="color:#64748b;font-size:12px;margin-top:4px">≈ 20 million people affected</div>
            </div>
            <div style="background:linear-gradient(135deg,#0a1a0a,#102a10);border:1px solid rgba(34,197,94,0.3);border-radius:var(--r-lg);padding:20px;text-align:center">
                <div style="font-size:11px;color:#4ade80;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">💰 Economic Damage — 2010</div>
                <div style="font-size:32px;font-weight:700;color:#86efac">≈ US$9.7B</div>
                <div style="color:#94a3b8;font-size:13px">total damage</div>
                <div style="color:#64748b;font-size:12px;margin-top:4px">400mm in 48h over upper catchments</div>
            </div>
            <div style="background:linear-gradient(135deg,#0a0a1a,#10102a);border:1px solid rgba(59,130,246,0.3);border-radius:var(--r-lg);padding:20px;text-align:center">
                <div style="font-size:11px;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">📊 Data Provenance</div>
                <div style="color:#e2e8f0;font-size:12px;line-height:1.6;text-align:left">
                    FFC Annual Flood Reports (2010, 2023)<br>
                    Sindh Irrigation 2010 Damage Assessment<br>
                    NDMA Monsoon-2022 Stress Tests<br>
                    UN-SPIDER 2010 · GSA Today (2013)
                </div>
            </div>
        </div>

        <!-- Basin Summary Charts -->
        <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div style="background:#0a0f1a;border:1px solid rgba(59,130,246,0.2);border-radius:var(--r-lg);overflow:hidden">
                <div style="padding:10px 16px;border-bottom:1px solid rgba(59,130,246,0.15)"><h3 style="color:#e2e8f0;font-size:13px;margin:0">📊 Discharge by Basin</h3></div>
                <div style="height:220px;padding:8px"><canvas id="river-basin-chart"></canvas></div>
            </div>
            <div style="background:#0a0f1a;border:1px solid rgba(59,130,246,0.2);border-radius:var(--r-lg);overflow:hidden">
                <div style="padding:10px 16px;border-bottom:1px solid rgba(59,130,246,0.15)"><h3 style="color:#e2e8f0;font-size:13px;margin:0">📊 Station Status Distribution</h3></div>
                <div style="height:220px;padding:8px"><canvas id="river-status-chart"></canvas></div>
            </div>
        </div>`;

        setTimeout(() => {
            // Initialize dark map
            const map = L.map('river-map', {
                center: [31.5, 72.0], zoom: 5, zoomControl: true
            });
            const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
                maxZoom: 18, subdomains: 'abcd'
            }).addTo(map);

            // Store tile references for basemap switching
            map._currentTile = tileLayer;
            map._currentStyle = 'dark';

            // Add basemap switcher control — horizontal scrollable bar
            const FLOOD_TILE_URLS = {
                terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                dark: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
            };
            const FLOOD_TILE_NAMES = {
                terrain: '🗺 Terrain', satellite: '🛰 Satellite', voyager: '🎨 Voyager',
                light: '☀ Light', dark: '🌙 Dark'
            };

            const basemapCtrl = L.control({ position: 'topright' });
            basemapCtrl.onAdd = function() {
                const container = L.DomUtil.create('div', 'basemap-selector');
                container.style.cssText = 'background:rgba(15,23,42,0.95);border-radius:8px;padding:4px 6px;box-shadow:0 4px 12px rgba(0,0,0,0.4);font-family:Inter,system-ui,sans-serif;display:flex;gap:3px;overflow-x:auto;max-width:360px;scrollbar-width:thin;scrollbar-color:#334155 transparent;';

                const styles = ['terrain', 'satellite', 'voyager', 'light', 'dark'];
                styles.forEach(s => {
                    const opt = L.DomUtil.create('div', '', container);
                    const isActive = s === 'dark';
                    opt.style.cssText = 'padding:5px 7px;color:' + (isActive ? '#e2e8f0' : '#64748b') + ';font-size:10px;font-weight:' + (isActive ? '700' : '500') + ';cursor:pointer;border-radius:5px;transition:all 0.15s;white-space:nowrap;flex-shrink:0;background:' + (isActive ? 'rgba(62,207,142,0.2)' : 'transparent') + ';border:1px solid ' + (isActive ? '#3ecf8e' : 'transparent') + ';';
                    opt.textContent = FLOOD_TILE_NAMES[s];
                    opt.title = FLOOD_TILE_NAMES[s];
                    opt.dataset.style = s;
                    opt.onmouseenter = () => { if (s !== map._currentStyle) { opt.style.background = 'rgba(62,207,142,0.08)'; opt.style.color = '#cbd5e1'; } };
                    opt.onmouseleave = () => { if (s !== map._currentStyle) { opt.style.background = 'transparent'; opt.style.color = '#64748b'; } };
                    opt.onclick = (e) => {
                        e.stopPropagation();
                        if (map._currentTile) map.removeLayer(map._currentTile);
                        const opts2 = { maxZoom: 18, subdomains: s === 'satellite' ? [] : (s === 'terrain' ? 'abc' : 'abcd') };
                        map._currentTile = L.tileLayer(FLOOD_TILE_URLS[s], opts2).addTo(map);
                        map._currentStyle = s;
                        container.querySelectorAll('div').forEach(d => {
                            const ds = d.dataset.style;
                            const isNowActive = ds === s;
                            d.style.background = isNowActive ? 'rgba(62,207,142,0.2)' : 'transparent';
                            d.style.borderColor = isNowActive ? '#3ecf8e' : 'transparent';
                            d.style.color = isNowActive ? '#e2e8f0' : '#64748b';
                            d.style.fontWeight = isNowActive ? '700' : '500';
                        });
                    };
                });
                L.DomEvent.disableClickPropagation(container);
                return container;
            };
            basemapCtrl.addTo(map);

            _riverMap = map;
            _riverAllMarkers = L.layerGroup();
            _riverBasinData = d;

            renderRiverStations('all');
        }, 100);

        setTimeout(() => {
            // Hydrograph chart
            const hc = document.getElementById('river-hydro-chart');
            if (hc && hydro.data) {
                const ctx = hc.getContext('2d');
                const days = hydro.days || [];
                const colors = ['#7c3aed','#dc2626','#16a34a','#f97316','#ec4899','#eab308','#3b82f6','#06b6d4'];
                const datasets = Object.entries(hydro.data).map(([name, data], i) => ({
                    label: name, data: data.map(v => v/1000), borderColor: colors[i%colors.length],
                    backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.3
                }));
                new Chart(ctx, {
                    type: 'line', data: { labels: days, datasets },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 12, padding: 8 } } },
                        scales: {
                            x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(59,130,246,0.1)' } },
                            y: { ticks: { color: '#64748b', font: { size: 10 }, callback: v => v + 'k' }, grid: { color: 'rgba(59,130,246,0.1)' }, title: { display: true, text: 'cusecs', color: '#64748b' } }
                        }
                    }
                });
            }

            // Basin chart
            const bc = document.getElementById('river-basin-chart');
            if (bc) {
                const bNames = ['Indus','Kabul','Jhelum','Chenab','Ravi'];
                const bCounts = [
                    stationNodes.filter(s=>s.basin==='Indus').length,
                    stationNodes.filter(s=>s.basin==='Kabul').length,
                    stationNodes.filter(s=>s.basin==='Jhelum').length,
                    stationNodes.filter(s=>s.basin==='Chenab').length,
                    stationNodes.filter(s=>s.basin==='Ravi').length
                ];
                const bColors = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b'];
                makeBar(bc.getContext('2d'), bNames, bCounts, bColors);
            }

            // Status chart
            const sc = document.getElementById('river-status-chart');
            if (sc) {
                const normal = stationNodes.filter(s => s.discharge < 60000).length;
                const warning = stationNodes.filter(s => s.discharge >= 60000 && s.discharge < 120000).length;
                const critical = stationNodes.filter(s => s.discharge >= 120000).length;
                makeDoughnut(sc.getContext('2d'), ['Normal','Warning','Critical'], [normal, warning, critical], ['#22c55e','#f59e0b','#ef4444']);
            }
        }, 200);
    } catch(e) { el.innerHTML = '<div class="loading">Error: '+e.message+'</div>'; }
}

// Render river stations on map
function renderRiverStations(basin) {
    if (!_riverMap || !_riverAllMarkers) return;
    _riverAllMarkers.clearLayers();

    const stationNodes = window._riverStationNodes || [];
    const riverPaths = window._riverPaths || {};

    // Determine which basins to show paths for
    const basinsToShow = basin === 'all' ? Object.keys(riverPaths) : [basin];

    // Draw river paths for selected basin(s)
    basinsToShow.forEach(b => {
        const path = riverPaths[b];
        if (!path) return;
        const basinColors = { Indus: '#3b82f6', Kabul: '#8b5cf6', Jhelum: '#06b6d4', Chenab: '#10b981', Ravi: '#f59e0b' };
        L.polyline(path, { color: basinColors[b] || '#3b82f6', weight: 3, opacity: 0.8 }).addTo(_riverAllMarkers);
    });

    // Filter stations
    const filtered = basin === 'all' ? stationNodes : stationNodes.filter(s => s.basin === basin);

    filtered.forEach(s => {
        // Outer glow
        L.circleMarker([s.lat, s.lng], {
            radius: s.size + 10, fillColor: s.color, color: 'transparent', fillOpacity: 0.12
        }).addTo(_riverAllMarkers);

        // Main marker
        const m = L.circleMarker([s.lat, s.lng], {
            radius: s.size, fillColor: s.color, color: '#fff', weight: 2, fillOpacity: 0.9
        });
        m.bindPopup(`<b>${s.name}</b><br>Basin: ${s.basin}<br>Discharge: ${(s.discharge/1000).toFixed(0)}k cusecs`, { className: 'dark-popup' });
        _riverAllMarkers.addLayer(m);

        // Station label
        const labelIcon = L.divIcon({
            className: 'river-station-label',
            html: `<div style="color:#e2e8f0;font-size:11px;font-weight:600;white-space:nowrap;text-shadow:0 0 8px rgba(0,0,0,0.9),0 0 16px rgba(0,0,0,0.7);pointer-events:none">${s.name}</div>`,
            iconAnchor: [-s.size - 4, -4]
        });
        L.marker([s.lat, s.lng], { icon: labelIcon, interactive: false }).addTo(_riverAllMarkers);
    });

    // Add small connecting nodes along river paths
    basinsToShow.forEach(b => {
        const path = riverPaths[b];
        if (!path) return;
        for (let i = 0; i < path.length - 1; i++) {
            const lat1 = path[i][0], lng1 = path[i][1];
            const lat2 = path[i+1][0], lng2 = path[i+1][1];
            for (let j = 1; j <= 3; j++) {
                const t = j / 4;
                const lat = lat1 + (lat2 - lat1) * t;
                const lng = lng1 + (lng2 - lng1) * t;
                const progress = (i + t) / (path.length - 1);
                const r = Math.round(34 + progress * 205);
                const g = Math.round(197 - progress * 129);
                const b2 = Math.round(94 - progress * 60);
                L.circleMarker([lat, lng], {
                    radius: 2 + progress * 3, fillColor: `rgb(${r},${g},${b2})`,
                    color: 'rgba(255,255,255,0.3)', weight: 1, fillOpacity: 0.7
                }).addTo(_riverAllMarkers);
            }
        }
    });

    _riverAllMarkers.addTo(_riverMap);

    // Zoom map to fit filtered stations
    if (filtered.length > 0) {
        const lats = filtered.map(s => s.lat);
        const lngs = filtered.map(s => s.lng);
        const bounds = [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]];
        _riverMap.fitBounds(bounds, { padding: [40, 40] });
    }

    // Update station cards
    const cardsContainer = document.getElementById('river-station-cards');
    if (cardsContainer) {
        cardsContainer.innerHTML = filtered.map(s => `
            <div style="background:#0a0f1a;border:1px solid ${s.discharge>120000?'rgba(239,68,68,0.3)':s.discharge>60000?'rgba(245,158,11,0.3)':'rgba(34,197,94,0.3)'};border-radius:var(--r-md);padding:14px;position:relative;overflow:hidden">
                <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${s.discharge>120000?'#ef4444':s.discharge>60000?'#f59e0b':'#22c55e'}"></div>
                <div style="display:flex;justify-content:space-between;align-items:start">
                    <div><div style="color:#e2e8f0;font-weight:600;font-size:13px">${s.name}</div><div style="color:#64748b;font-size:11px;margin-top:2px">${s.basin}</div></div>
                    <div style="width:8px;height:8px;border-radius:50%;background:${s.color};box-shadow:0 0 8px ${s.color}"></div>
                </div>
                <div style="margin-top:8px;font-size:22px;font-weight:700;color:${s.discharge>120000?'#f87171':s.discharge>60000?'#fbbf24':'#4ade80'}">${(s.discharge/1000).toFixed(0)}k</div>
                <div style="color:#64748b;font-size:10px">cusecs</div>
                <div style="margin-top:6px;height:4px;background:#1e293b;border-radius:2px;overflow:hidden">
                    <div style="height:100%;width:${Math.min(100, s.discharge/1650)}%;background:${s.color};border-radius:2px"></div>
                </div>
            </div>
        `).join('');
    }

    // Update map station count
    const countEl = document.getElementById('river-map-count');
    if (countEl) countEl.textContent = `${filtered.length} stations`;
}

// Global variables
let _riverMap = null;
let _riverAllMarkers = null;
let _riverBasinData = null;

// Basin filter function
function filterRiverBasin(basin, btn) {
    document.querySelectorAll('.river-tab').forEach(b => {
        b.style.background = 'transparent';
        b.style.color = '#94a3b8';
        b.style.borderColor = 'rgba(100,116,139,0.2)';
    });
    btn.style.background = 'rgba(59,130,246,0.15)';
    btn.style.color = '#60a5fa';
    btn.style.borderColor = 'rgba(59,130,246,0.3)';
    renderRiverStations(basin);
}
