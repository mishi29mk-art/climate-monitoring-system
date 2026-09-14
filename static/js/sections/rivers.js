/* ─── River Gauge Network — Enhanced ───────────────────────── */
// ─── Global state ──────────────────────────────────────────
let _riverMap = null, _riverAllMarkers = null, _riverBasinData = null, _riverAllStationNodes = [], _riverAllPaths = {};
// Also expose on window for cross-scope access
window._riverMap = null; window._riverAllMarkers = null;

async function render_rivers(el) {
    el.innerHTML = '<div class="loading">Loading river gauge network…</div>';
    try {
        const [basinsRes, rtRes] = await Promise.all([
            fetch('/api/rivers/basins').then(r => r.json()),
            fetch('/api/rivers/realtime').then(r => r.json())
        ]);
        const d = basinsRes;
        const rt = rtRes;
        const hydro = d.hydrographs || {};
        const basins = d.basins || {};
        const floodPath = d.flood_path || [];
        const impact = d.impact_2010 || {};
        const rtStations = rt.stations || [];

        // ALL station data — real stations across ALL basins (including Sutlej)
        const stationNodes = [
            // Kabul River
            { name: 'Warsak Dam', lat: 34.18, lng: 71.07, discharge: 32000, color: '#8b5cf6', size: 10, basin: 'Kabul', capacity: 147000 },
            { name: 'Nowshera', lat: 34.0, lng: 71.5, discharge: 54000, color: '#a78bfa', size: 12, basin: 'Kabul', capacity: 200000 },
            // Indus Main
            { name: 'Tarbela Dam', lat: 34.05, lng: 72.68, discharge: 165000, color: '#3b82f6', size: 14, basin: 'Indus', capacity: 550000 },
            { name: 'Kalabagh', lat: 32.9, lng: 71.48, discharge: 135000, color: '#60a5fa', size: 16, basin: 'Indus', capacity: 500000 },
            { name: 'Chashma Barrage', lat: 31.42, lng: 71.12, discharge: 135000, color: '#2563eb', size: 18, basin: 'Indus', capacity: 450000 },
            { name: 'Taunsa Barrage', lat: 30.72, lng: 70.04, discharge: 120000, color: '#1d4ed8', size: 20, basin: 'Indus', capacity: 400000 },
            { name: 'Guddu Barrage', lat: 28.44, lng: 68.42, discharge: 105000, color: '#7c3aed', size: 22, basin: 'Indus', capacity: 350000 },
            { name: 'Sukkur Barrage', lat: 27.69, lng: 68.42, discharge: 105000, color: '#6d28d9', size: 24, basin: 'Indus', capacity: 300000 },
            { name: 'Kotri Barrage', lat: 25.39, lng: 68.32, discharge: 90000, color: '#5b21b6', size: 26, basin: 'Indus', capacity: 250000 },
            // Jhelum River
            { name: 'Mangla Dam', lat: 33.15, lng: 73.65, discharge: 78000, color: '#06b6d4', size: 14, basin: 'Jhelum', capacity: 240000 },
            { name: 'Rasul Barrage', lat: 32.83, lng: 73.58, discharge: 65000, color: '#22d3ee', size: 16, basin: 'Jhelum', capacity: 200000 },
            { name: 'Jhelum', lat: 32.67, lng: 73.18, discharge: 58000, color: '#0891b2', size: 18, basin: 'Jhelum', capacity: 180000 },
            // Chenab River
            { name: 'Marala Barrage', lat: 32.72, lng: 74.55, discharge: 72000, color: '#10b981', size: 12, basin: 'Chenab', capacity: 250000 },
            { name: 'Khanki Barrage', lat: 32.22, lng: 74.12, discharge: 68000, color: '#34d399', size: 14, basin: 'Chenab', capacity: 200000 },
            { name: 'Trimmu Barrage', lat: 31.02, lng: 72.28, discharge: 55000, color: '#059669', size: 16, basin: 'Chenab', capacity: 150000 },
            // Ravi River
            { name: 'Madhopur Headworks', lat: 32.38, lng: 75.58, discharge: 42000, color: '#f59e0b', size: 10, basin: 'Ravi', capacity: 120000 },
            { name: 'Balloki Barrage', lat: 31.43, lng: 74.33, discharge: 38000, color: '#fbbf24', size: 12, basin: 'Ravi', capacity: 100000 },
            { name: 'Sidhnai Barrage', lat: 30.58, lng: 73.15, discharge: 35000, color: '#d97706', size: 14, basin: 'Ravi', capacity: 90000 },
            // Sutlej River
            { name: 'Thein Dam', lat: 31.82, lng: 74.95, discharge: 45000, color: '#ef4444', size: 10, basin: 'Sutlej', capacity: 150000 },
            { name: 'Sulemanki Barrage', lat: 30.08, lng: 73.9, discharge: 30000, color: '#f87171', size: 12, basin: 'Sutlej', capacity: 100000 },
            { name: 'Islam Headworks', lat: 29.55, lng: 73.45, discharge: 25000, color: '#dc2626', size: 14, basin: 'Sutlej', capacity: 80000 },
        ];
        window._riverStationNodes = stationNodes;

        // Merge realtime data (trend/status) into stationNodes
        rtStations.forEach(rt => {
            const match = stationNodes.find(s => s.name === rt.name || s.name.includes(rt.name));
            if (match) {
                match.trend = rt.trend || 'stable';
                match.rtStatus = rt.status || 'normal';
                match.rtDischarge = rt.discharge || match.discharge;
            }
        });

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
            ],
            'Sutlej': [
                [33.0, 75.5], [32.5, 75.2], [31.82, 74.95], [31.2, 74.5],
                [30.5, 74.1], [30.08, 73.9], [29.55, 73.45], [29.0, 73.0], [28.5, 72.5]
            ]
        };
        window._riverPaths = riverPaths;

        // ─── Compute summary stats ────────────────────────────
        const totalDischarge = stationNodes.reduce((s, st) => s + st.discharge, 0);
        const criticalCount = stationNodes.filter(s => (s.rtStatus || '') === 'critical' || s.discharge > 150000).length;
        const risingCount = stationNodes.filter(s => s.trend === 'rising').length;
        const stableCount = stationNodes.filter(s => s.trend === 'stable' || !s.trend).length;
        const fallingCount = stationNodes.filter(s => s.trend === 'falling').length;
        const maxDischarge = Math.max(...stationNodes.map(s => s.discharge));
        const maxStation = stationNodes.find(s => s.discharge === maxDischarge);

        // Basin totals
        const basinTotals = {};
        Object.keys(basins).forEach(b => { basinTotals[b] = 0; });
        stationNodes.forEach(s => { if (basinTotals[s.basin] !== undefined) basinTotals[s.basin] += s.discharge; });

        // Station sort by discharge descending
        const sortedStations = [...stationNodes].sort((a, b) => b.discharge - a.discharge);

        el.innerHTML = `
        <div class="sec-hdr">
            <h2>🌊 River Gauge Network</h2>
            <p>Real-time discharge monitoring across ${Object.keys(basins).length} major river systems — ${stationNodes.length} gauge stations with live trend tracking</p>
            <div class="hdr-meta">
                <span>🌊 ${fmtCusecs(totalDischarge)} total national discharge</span>
                <span>🔴 ${criticalCount} critical stations</span>
                <span>📈 ${risingCount} rising · ➡️ ${stableCount} stable · 📉 ${fallingCount} falling</span>
                <span>⏰ Last update: ${rt.last_update || 'Live'}</span>
            </div>
        </div>

        <!-- ═══ Stat Cards ═══ -->
        <div class="card-grid g4">
            <div class="stat-card s-blue">
                <div class="stat-icon">🌊</div>
                <div class="stat-value" style="color:${C.info}">${(totalDischarge/1e6).toFixed(1)}M</div>
                <div class="stat-label">Total Discharge</div>
                <div class="stat-sub">Combined cusecs</div>
            </div>
            <div class="stat-card s-red">
                <div class="stat-icon">📍</div>
                <div class="stat-value" style="color:${C.danger}">${maxStation?.name || '-'}</div>
                <div class="stat-label">Peak Station: ${fmtCusecs(maxDischarge)}</div>
                <div class="stat-sub">${maxStation?.basin || ''} basin</div>
            </div>
            <div class="stat-card s-orange">
                <div class="stat-icon">🔴</div>
                <div class="stat-value" style="color:${C.orange}">${criticalCount}</div>
                <div class="stat-label">Critical Stations</div>
                <div class="stat-sub">Discharge > 150k cusecs</div>
            </div>
            <div class="stat-card s-cyan">
                <div class="stat-icon">📈</div>
                <div class="stat-value" style="color:${risingCount>C.danger?C.danger:C.warning}">${risingCount}</div>
                <div class="stat-label">Rising Stations</div>
                <div class="stat-sub">Water levels increasing</div>
            </div>
        </div>

        <!-- ═══ Basin Filter Tabs ═══ -->
        <div style="display:flex;gap:6px;margin:16px 0;flex-wrap:wrap" id="river-basin-tabs">
            <button class="river-tab active" data-basin="all" onclick="filterRiverBasin('all',this)" style="padding:6px 14px;border-radius:20px;border:1px solid rgba(59,130,246,0.3);background:rgba(59,130,246,0.15);color:#60a5fa;cursor:pointer;font-size:11px;font-weight:600">All (${stationNodes.length})</button>
            ${Object.entries(basins).map(([b, info]) => {
                const color = info.color || '#3b82f6';
                const count = stationNodes.filter(s => s.basin === b).length;
                return `<button class="river-tab" data-basin="${b}" onclick="filterRiverBasin('${b}',this)" style="padding:6px 14px;border-radius:20px;border:1px solid ${color}30;background:transparent;color:#94a3b8;cursor:pointer;font-size:11px">${b} (${count})</button>`;
            }).join('')}
        </div>

        <!-- ═══ Map + Basin Flow Comparison ═══ -->
        <div style="display:grid;grid-template-rows:1fr 1fr;grid-template-columns:1fr 1fr;gap:16px">
            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden">
                <div style="padding:10px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                    <h3 style="color:var(--text);font-size:13px;margin:0">🗺 Station Map</h3>
                    <span id="river-map-count" style="color:var(--text-muted);font-size:11px">${stationNodes.length} stations</span>
                </div>
                <div id="river-map" style="height:480px"></div>
            </div>

            <div style="display:flex;flex-direction:column;gap:16px">
                <!-- Basin Flow Comparison -->
                <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;flex:1">
                    <div style="padding:10px 16px;border-bottom:1px solid var(--border)"><h3 style="color:var(--text);font-size:13px;margin:0">📊 Basin Flow Comparison</h3></div>
                    <div style="height:200px;padding:8px"><canvas id="river-basin-compare"></canvas></div>
                </div>
                <!-- Station Status -->
                <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;flex:1">
                    <div style="padding:10px 16px;border-bottom:1px solid var(--border)"><h3 style="color:var(--text);font-size:13px;margin:0">📊 Station Status</h3></div>
                    <div style="height:200px;padding:8px"><canvas id="river-status-donut"></canvas></div>
                </div>
            </div>
        </div>

        <!-- ═══ Hydrograph ═══ -->
        ${hydro.days && hydro.data ? `
        <div class="card mt-3">
            <div class="card-header"><h3>📈 Discharge Hydrographs — Upstream Propagation</h3></div>
            <p style="color:var(--text-muted);font-size:11px;margin:0 0 8px 0">How flood pulses travel downstream from Nowshera → Tarbela → Kalabagh → Chashma → Taunsa → Guddu → Sukkur → Kotri</p>
            <div style="height:320px"><canvas id="river-hydro-chart"></canvas></div>
        </div>` : ''}

        <!-- ═══ Station Ranking Table ═══ -->
        <div class="card mt-3">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
                <h3>📋 Station Ranking — by Discharge</h3>
                <div style="display:flex;gap:6px">
                    <button onclick="sortStationTable('discharge')" class="badge b-info" style="cursor:pointer">Sort: Discharge</button>
                    <button onclick="sortStationTable('capacity')" class="badge b-info" style="cursor:pointer">Sort: Capacity %</button>
                </div>
            </div>
            <div class="tbl-scroll" style="max-height:400px">
                <table class="tbl" id="station-ranking-table">
                    <thead><tr>
                        <th>#</th><th>Station</th><th>River</th><th>Basin</th>
                        <th>Discharge (cusecs)</th><th>Capacity</th><th>Fill %</th>
                        <th>Trend</th><th>Status</th>
                    </tr></thead>
                    <tbody>
                    ${sortedStations.map((s, i) => {
                        const pct = Math.min(100, (s.discharge / s.capacity) * 100);
                        const pctColor = pct >= 80 ? C.danger : pct >= 50 ? C.warning : pct >= 25 ? C.info : C.success;
                        const trendIcon = s.trend === 'rising' ? '📈' : s.trend === 'falling' ? '📉' : '➡️';
                        const trendColor = s.trend === 'rising' ? C.danger : s.trend === 'falling' ? C.success : C.muted;
                        const stColor = (s.rtStatus||'') === 'critical' ? C.danger : (s.rtStatus||'') === 'warning' ? C.orange : C.success;
                        return `<tr>
                            <td style="color:var(--text-muted)">${i+1}</td>
                            <td><b>${s.name}</b></td>
                            <td style="color:${s.color}">${s.basin}</td>
                            <td>${s.basin}</td>
                            <td style="font-weight:600;color:${s.discharge>120000?C.danger:s.discharge>60000?C.orange:C.info}">${fmtCusecs(s.discharge)}</td>
                            <td style="color:var(--text-muted)">${fmtCusecs(s.capacity)}</td>
                            <td>
                                <div style="display:flex;align-items:center;gap:8px">
                                    <div style="width:60px;height:8px;background:var(--card);border-radius:4px;overflow:hidden">
                                        <div style="width:${pct}%;height:100%;background:${pctColor};border-radius:4px"></div>
                                    </div>
                                    <span style="color:${pctColor};font-size:11px">${fmt(pct,0)}%</span>
                                </div>
                            </td>
                            <td style="color:${trendColor}" title="${s.trend||'stable'}">${trendIcon}</td>
                            <td><span class="badge ${(s.rtStatus||'normal')==='critical'?'b-danger':(s.rtStatus||'normal')==='warning'?'b-orange':'b-success'}">${(s.rtStatus||'normal').toUpperCase()}</span></td>
                        </tr>`;
                    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ═══ Station Detail Cards — Enhanced ═══ -->
        <div class="card mt-3">
            <h3 style="margin-bottom:12px">🌊 Station Details</h3>
            <div id="river-station-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">
            </div>
        </div>

        <!-- ═══ Flood Propagation Timeline ═══ -->
        <div class="card mt-3">
            <div class="card-header"><h3>⏱ Flood Propagation Timeline</h3></div>
            <p style="color:var(--text-muted);font-size:11px;margin:0 0 12px 0">Indus River flood pulse travel time from source to sea — approximate hours after peak at Tarbela</p>
            <div style="display:flex;gap:0;overflow-x:auto;padding:12px 0">
                ${[
                    { name: 'Tarbela Dam', hours: 0, discharge: 165000, color: '#3b82f6' },
                    { name: 'Kalabagh', hours: 18, discharge: 135000, color: '#60a5fa' },
                    { name: 'Chashma', hours: 30, discharge: 135000, color: '#2563eb' },
                    { name: 'Taunsa', hours: 42, discharge: 120000, color: '#1d4ed8' },
                    { name: 'Guddu', hours: 60, discharge: 105000, color: '#7c3aed' },
                    { name: 'Sukkur', hours: 72, discharge: 105000, color: '#6d28d9' },
                    { name: 'Kotri', hours: 96, discharge: 90000, color: '#5b21b6' },
                    { name: 'Sea', hours: 120, discharge: 0, color: '#64748b' }
                ].map((p, i, arr) => `
                    <div style="flex:1;min-width:100px;text-align:center;position:relative">
                        <div style="position:absolute;top:14px;left:0;right:0;height:3px;background:linear-gradient(to right,${p.color},${arr[i+1]?.color||p.color})"></div>
                        <div style="position:relative;z-index:1;width:28px;height:28px;border-radius:50%;background:${p.color};color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto;border:3px solid var(--bg);box-shadow:0 0 10px ${p.color}40">
                            ${i+1}
                        </div>
                        <div style="margin-top:8px;font-size:11px;font-weight:600;color:var(--text)">${p.name}</div>
                        <div style="font-size:10px;color:var(--text-muted)">${p.hours}h after peak</div>
                        ${p.discharge ? `<div style="font-size:10px;color:${p.color}">${(p.discharge/1000).toFixed(0)}k cusecs</div>` : '<div style="font-size:10px;color:var(--text-muted)">Arabian Sea</div>'}
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- ═══ 2010 Flood Impact ═══ -->
        <div class="card-grid g3 mt-3">
            <div style="background:linear-gradient(135deg,#1a0a0a,#2a1010);border:1px solid rgba(239,68,68,0.3);border-radius:var(--r-lg);padding:20px;text-align:center">
                <div style="font-size:11px;color:#f87171;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">⚠ Human Toll — 2010</div>
                <div style="font-size:32px;font-weight:700;color:#fca5a5">${fmtK(impact.deaths||1985)}</div>
                <div style="color:var(--text-muted);font-size:13px">deaths</div>
                <div style="color:var(--text-muted);font-size:12px;margin-top:4px">≈ ${fmtK(impact.affected||20000000)} people affected</div>
            </div>
            <div style="background:linear-gradient(135deg,#0a1a0a,#102a10);border:1px solid rgba(34,197,94,0.3);border-radius:var(--r-lg);padding:20px;text-align:center">
                <div style="font-size:11px;color:#4ade80;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">💰 Economic Damage — 2010</div>
                <div style="font-size:32px;font-weight:700;color:#86efac">$${((impact.damage_usd||9700000000)/1e9).toFixed(1)}B</div>
                <div style="color:var(--text-muted);font-size:13px">total damage</div>
                <div style="color:var(--text-muted);font-size:12px;margin-top:4px">${impact.rainfall_48h||'400mm in 48h over upper catchments'}</div>
            </div>
            <div style="background:linear-gradient(135deg,#0a0a1a,#10102a);border:1px solid rgba(59,130,246,0.3);border-radius:var(--r-lg);padding:20px;text-align:center">
                <div style="font-size:11px;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">📊 Data Sources</div>
                <div style="color:var(--text);font-size:12px;line-height:1.8;text-align:left">
                    FFC Annual Flood Reports<br>
                    Sindh Irrigation Damage Assessment<br>
                    NDMA Monsoon-2022 Stress Tests<br>
                    UN-SPIDER 2010 · GSA Today (2013)
                </div>
            </div>
        </div>`;

        // ─── Initialize interactive elements ──────────────────
        const _initRiverMap = () => {
            const mapContainer = document.getElementById('river-map');
            if (!mapContainer || _riverMap) { return; }
            try {
                const map = L.map('river-map', { center: [31.5, 72.0], zoom: 5, zoomControl: true, attributionControl: false });
                map._currentTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
                    maxZoom: 18, subdomains: 'abcd'
                }).addTo(map);
                map._currentStyle = 'dark';

                // Basemap switcher
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
                    ['terrain','satellite','voyager','light','dark'].forEach(s => {
                        const opt = L.DomUtil.create('div', '', container);
                        const isActive = s === 'dark';
                        opt.style.cssText = 'padding:5px 7px;color:'+(isActive?'#e2e8f0':'#64748b')+';font-size:10px;font-weight:'+(isActive?'700':'500')+';cursor:pointer;border-radius:5px;transition:all 0.15s;white-space:nowrap;flex-shrink:0;background:'+(isActive?'rgba(62,207,142,0.2)':'transparent')+';border:1px solid '+(isActive?'#3ecf8e':'transparent')+';';
                        opt.textContent = FLOOD_TILE_NAMES[s];
                        opt.dataset.style = s;
                        opt.onclick = (e) => {
                            e.stopPropagation();
                            if (map._currentTile) map.removeLayer(map._currentTile);
                            map._currentTile = L.tileLayer(FLOOD_TILE_URLS[s], { maxZoom: 18, subdomains: s==='satellite'?[]:(s==='terrain'?'abc':'abcd') }).addTo(map);
                            map._currentStyle = s;
                            container.querySelectorAll('div').forEach(d => {
                                const ds = d.dataset.style;
                                const now = ds===s;
                                d.style.background = now?'rgba(62,207,142,0.2)':'transparent';
                                d.style.borderColor = now?'#3ecf8e':'transparent';
                                d.style.color = now?'#e2e8f0':'#64748b';
                                d.style.fontWeight = now?'700':'500';
                            });
                        };
                    });
                    L.DomEvent.disableClickPropagation(container);
                    return container;
                };
                basemapCtrl.addTo(map);

                map.invalidateSize();
                _riverMap = map;
                _riverAllMarkers = L.layerGroup();
                _riverBasinData = d;
                _riverAllStationNodes = stationNodes;
                _riverAllPaths = riverPaths;

                renderRiverStations('all');
            } catch(e) {
                console.error('River map init error:', e);
            }
        };
        requestAnimationFrame(() => requestAnimationFrame(_initRiverMap));

        // ─── Charts ────────────────────────────────────────────
        setTimeout(() => {
            // Basin flow comparison (horizontal bar)
            const bc = document.getElementById('river-basin-compare');
            if (bc) {
                const bNames = Object.keys(basinTotals);
                const bVals = Object.values(basinTotals);
                const bColors = Object.keys(basins).map(b => basins[b].color || '#3b82f6');
                makeHBar(bc.getContext('2d'), bNames, bVals, bColors);
            }

            // Status donut
            const sd = document.getElementById('river-status-donut');
            if (sd) {
                const critical = stationNodes.filter(s => (s.rtStatus||'')==='critical' || s.discharge>150000).length;
                const warning = stationNodes.filter(s => (s.rtStatus||'')==='warning' || (s.discharge>=60000 && s.discharge<=150000)).length;
                const normal = stationNodes.filter(s => (s.rtStatus||'normal')==='normal' && s.discharge<60000).length;
                makeDoughnut(sd.getContext('2d'), ['Critical','Warning','Normal'], [critical,warning,normal], [C.danger,C.orange,C.success]);
            }

            // Hydrograph
            const hc = document.getElementById('river-hydro-chart');
            if (hc && hydro.data) {
                const ctx = hc.getContext('2d');
                const days = hydro.days || [];
                const colors = ['#7c3aed','#dc2626','#16a34a','#f97316','#ec4899','#eab308','#3b82f6','#06b6d4'];
                const datasets = Object.entries(hydro.data).map(([name, data], i) => ({
                    label: name, data: data.map(v => v/1000), borderColor: colors[i%colors.length],
                    backgroundColor: colors[i%colors.length]+'10', fill: true, borderWidth: 2, pointRadius: 0, tension: 0.3
                }));
                new Chart(ctx, {
                    type: 'line', data: { labels: days, datasets },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 12, padding: 8 } } },
                        scales: {
                            x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(59,130,246,0.1)' } },
                            y: { ticks: { color: '#64748b', font: { size: 10 }, callback: v => v+'k' }, grid: { color: 'rgba(59,130,246,0.1)' }, title: { display: true, text: 'cusecs × 1000', color: '#64748b' } }
                        }
                    }
                });
            }
        }, 200);
    } catch(e) { el.innerHTML = '<div class="loading">Error: '+e.message+'</div>'; }
}

// ─── Render river stations on map ───────────────────────────
function renderRiverStations(basin) {
    if (!_riverMap || !_riverAllMarkers) return;
    _riverAllMarkers.clearLayers();

    const stationNodes = _riverAllStationNodes || [];
    const riverPaths = _riverAllPaths || {};
    const basins = (_riverBasinData?.basins) || {};
    const basinsToShow = basin === 'all' ? Object.keys(riverPaths) : [basin];

    // Draw river paths
    basinsToShow.forEach(b => {
        const path = riverPaths[b];
        if (!path) return;
        const bColor = basins[b]?.color || '#3b82f6';

        // Animated flow dots along the path
        L.polyline(path, { color: bColor, weight: 4, opacity: 0.7 }).addTo(_riverAllMarkers);

        // Gradient dots along path
        for (let i = 0; i < path.length - 1; i++) {
            for (let j = 1; j <= 3; j++) {
                const t = j / 4;
                const lat = path[i][0] + (path[i+1][0] - path[i][0]) * t;
                const lng = path[i][1] + (path[i+1][1] - path[i][1]) * t;
                const progress = (i + t) / (path.length - 1);
                L.circleMarker([lat, lng], {
                    radius: 2 + progress * 3, fillColor: bColor,
                    color: 'rgba(255,255,255,0.3)', weight: 1, fillOpacity: 0.6 + progress * 0.3
                }).addTo(_riverAllMarkers);
            }
        }
    });

    // Filter and render stations
    const filtered = basin === 'all' ? stationNodes : stationNodes.filter(s => s.basin === basin);

    filtered.forEach(s => {
        const stColor = (s.rtStatus||'') === 'critical' ? C.danger : (s.rtStatus||'') === 'warning' ? C.orange : s.color;

        // Outer glow — pulsing for critical
        L.circleMarker([s.lat, s.lng], {
            radius: s.size + 10, fillColor: stColor, color: 'transparent', fillOpacity: (s.rtStatus||'')==='critical'?0.2:0.12,
            className: (s.rtStatus||'')==='critical' ? 'pulse-ring' : ''
        }).addTo(_riverAllMarkers);

        // Main marker
        const m = L.circleMarker([s.lat, s.lng], {
            radius: s.size, fillColor: stColor, color: '#fff', weight: 2, fillOpacity: 0.9
        });

        const pct = Math.min(100, (s.discharge / s.capacity) * 100);
        const trendIcon = s.trend === 'rising' ? '📈' : s.trend === 'falling' ? '📉' : '➡️';
        const trendColor = s.trend === 'rising' ? '#f85149' : s.trend === 'falling' ? '#3fb950' : '#64748b';
        m.bindPopup(`<div style="min-width:180px;font-family:Inter,system-ui,sans-serif">
            <b style="font-size:14px">${s.name}</b><br>
            <span style="color:${s.color}">${s.basin} River</span>
            <hr style="margin:8px 0;border-color:#333">
            <div style="display:flex;justify-content:space-between;margin:4px 0"><span style="color:#94a3b8">Discharge:</span><b style="color:${s.discharge>120000?'#f85149':s.discharge>60000?'#f59e0b':'#60a5fa'}">${fmtCusecs(s.discharge)}</b></div>
            <div style="display:flex;justify-content:space-between;margin:4px 0"><span style="color:#94a3b8">Capacity:</span><b>${fmtCusecs(s.capacity)}</b></div>
            <div style="margin:8px 0;height:6px;background:#1e293b;border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${pct>=80?'#f85149':pct>=50?'#f59e0b':'#3fb950'};border-radius:3px"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:#94a3b8">Fill:</span><b style="color:${pct>=80?'#f85149':pct>=50?'#f59e0b':'#3fb950'}">${fmt(pct,0)}%</b></div>
            <div style="display:flex;justify-content:space-between;margin-top:4px"><span style="color:#94a3b8">Trend:</span><b style="color:${trendColor}">${trendIcon} ${(s.trend||'stable').toUpperCase()}</b></div>
        </div>`, { className: 'dark-popup', maxWidth: 280 });
        _riverAllMarkers.addLayer(m);

        // Station label
        const labelIcon = L.divIcon({
            className: 'river-station-label',
            html: `<div style="color:#e2e8f0;font-size:11px;font-weight:600;white-space:nowrap;text-shadow:0 0 8px rgba(0,0,0,0.9),0 0 16px rgba(0,0,0,0.7);pointer-events:none">${s.name}</div>`,
            iconAnchor: [-s.size - 4, -4]
        });
        L.marker([s.lat, s.lng], { icon: labelIcon, interactive: false }).addTo(_riverAllMarkers);
    });

    _riverAllMarkers.addTo(_riverMap);

    // Fit bounds
    if (filtered.length > 0) {
        const lats = filtered.map(s => s.lat), lngs = filtered.map(s => s.lng);
        _riverMap.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [40, 40] });
    }

    // Update station cards
    const cardsContainer = document.getElementById('river-station-cards');
    if (cardsContainer) {
        cardsContainer.innerHTML = filtered.map(s => {
            const pct = Math.min(100, (s.discharge / s.capacity) * 100);
            const pctColor = pct >= 80 ? C.danger : pct >= 50 ? C.warning : C.success;
            const stColor = (s.rtStatus||'') === 'critical' ? C.danger : (s.rtStatus||'') === 'warning' ? C.orange : C.success;
            const trendIcon = s.trend === 'rising' ? '📈' : s.trend === 'falling' ? '📉' : '➡️';
            return `<div style="background:var(--bg-card);border:1px solid ${stColor}30;border-radius:var(--r-md);padding:14px;position:relative;overflow:hidden;transition:all 0.2s" onmouseenter="this.style.borderColor='${stColor}60';this.style.transform='translateY(-2px)'" onmouseleave="this.style.borderColor='${stColor}30';this.style.transform='none'">
                <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${stColor}"></div>
                <div style="display:flex;justify-content:space-between;align-items:start">
                    <div>
                        <div style="color:var(--text);font-weight:600;font-size:13px">${s.name}</div>
                        <div style="color:${s.color};font-size:11px;margin-top:2px">${s.basin} River</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:4px">
                        <span style="font-size:12px">${trendIcon}</span>
                        <div style="width:8px;height:8px;border-radius:50%;background:${stColor};box-shadow:0 0 8px ${stColor}"></div>
                    </div>
                </div>
                <div style="margin-top:8px;font-size:22px;font-weight:700;color:${stColor}">${(s.discharge/1000).toFixed(0)}k</div>
                <div style="color:var(--text-muted);font-size:10px">cusecs</div>
                <div style="margin-top:8px;height:6px;background:#1e293b;border-radius:3px;overflow:hidden">
                    <div style="height:100%;width:${pct}%;background:${pctColor};border-radius:3px;transition:width 0.5s"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:4px">
                    <span style="color:var(--text-muted);font-size:10px">${fmt(pct,0)}% capacity</span>
                    <span style="color:${pctColor};font-size:10px">${fmtCusecs(s.capacity)}</span>
                </div>
            </div>`;
        }).join('');
    }

    // Update count
    const countEl = document.getElementById('river-map-count');
    if (countEl) countEl.textContent = `${filtered.length} stations`;
}

// ─── Sort station table ────────────────────────────────────
function sortStationTable(by) {
    const tbody = document.querySelector('#station-ranking-table tbody');
    if (!tbody) return;
    const rows = [...tbody.querySelectorAll('tr')];
    rows.sort((a, b) => {
        if (by === 'discharge') {
            const aVal = parseFloat(a.children[4]?.textContent?.replace(/[^0-9.]/g,'')) || 0;
            const bVal = parseFloat(b.children[4]?.textContent?.replace(/[^0-9.]/g,'')) || 0;
            return bVal - aVal;
        } else {
            const aVal = parseFloat(a.children[6]?.textContent?.replace(/[^0-9.]/g,'')) || 0;
            const bVal = parseFloat(b.children[6]?.textContent?.replace(/[^0-9.]/g,'')) || 0;
            return bVal - aVal;
        }
    });
    rows.forEach((r, i) => { r.children[0].textContent = i + 1; tbody.appendChild(r); });
}



// ─── Basin filter ──────────────────────────────────────────
function filterRiverBasin(basin, btn) {
    document.querySelectorAll('#river-basin-tabs .river-tab').forEach(b => {
        b.style.background = 'transparent';
        b.style.color = '#94a3b8';
        b.style.borderColor = 'rgba(100,116,139,0.2)';
    });
    btn.style.background = 'rgba(59,130,246,0.15)';
    btn.style.color = '#60a5fa';
    btn.style.borderColor = 'rgba(59,130,246,0.3)';
    renderRiverStations(basin);
}
