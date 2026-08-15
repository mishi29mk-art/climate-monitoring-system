/* ─── Interactive Map Viewer ────────────────────────────────── */
async function render_interactive_map(el) {
    el.innerHTML = '<div class="loading">Loading interactive map…</div>';
    try {
        const res = await fetch('/api/map/layers');
        const d = await res.json();
        const layers = d.layers;

        el.innerHTML = `
        <div class="sec-hdr"><h2>🗺 Interactive Map Viewer</h2><p>Explore climate data across Pakistan — toggle layers, query locations, view real-time conditions</p>
        <div class="hdr-meta"><span>📍 ${d.district_count} districts</span><span>🔄 Real-time data</span><span>🖱 Click to query</span></div></div>

        <div class="card-grid g4">
            <div class="stat-card s-blue"><div class="stat-icon">📍</div><div class="stat-value" style="color:${C.info}">${d.district_count}</div><div class="stat-label">Districts</div><div class="stat-sub">Data points</div></div>
            <div class="stat-card s-green"><div class="stat-icon">📊</div><div class="stat-value" style="color:${C.success}">${Object.keys(layers).length}</div><div class="stat-label">Data Layers</div><div class="stat-sub">Toggle on/off</div></div>
            <div class="stat-card s-orange"><div class="stat-icon">🌡</div><div class="stat-value" style="color:${C.orange}">${Object.values(layers.temperature?.data||{}).filter(d=>d.value>=40).length}</div><div class="stat-label">Hot Districts</div><div class="stat-sub">≥40°C</div></div>
            <div class="stat-card s-red"><div class="stat-icon">🌊</div><div class="stat-value" style="color:${C.danger}">${Object.values(layers.flood_risk?.data||{}).filter(d=>d.value>=3).length}</div><div class="stat-label">Flood Risk</div><div class="stat-sub">High risk zones</div></div>
        </div>

        <div class="card mt-3" style="padding:0;overflow:hidden">
            <div class="card-header" style="padding:12px 18px;border-bottom:1px solid var(--border)">
                <h3 style="font-size:14px">🗺 Climate Map</h3>
                <div style="display:flex;gap:8px;align-items:center">
                    <select id="map-layer-select" style="background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);padding:5px 10px;border-radius:6px;font-size:12px">
                        <option value="temperature">🌡 Temperature</option>
                        <option value="rainfall">🌧 Rainfall (7d)</option>
                        <option value="aqi">💨 Air Quality</option>
                        <option value="wind">🌬 Wind Speed</option>
                        <option value="uv">☀ UV Index</option>
                        <option value="flood_risk">🌊 Flood Risk</option>
                        <option value="drought">🏜 Drought (SPI)</option>
                    </select>
                    <select id="map-basemap-select" style="background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);padding:5px 10px;border-radius:6px;font-size:12px">
                        <option value="light">☀ Light</option>
                        <option value="dark">🌙 Dark</option>
                        <option value="satellite">🛰 Satellite</option>
                        <option value="terrain">🗺 Terrain</option>
                    </select>
                </div>
            </div>
            <div id="interactive-map" style="height:550px;border-radius:0"></div>
            <div style="padding:8px 18px;font-size:11px;color:var(--text-muted);display:flex;justify-content:space-between;border-top:1px solid var(--border)">
                <span>🖱 Click any marker to query district stats</span>
                <span id="map-layer-label">Layer: Temperature</span>
            </div>
        </div>

        <!-- Click Query Result -->
        <div id="query-result" class="card mt-3" style="display:none">
            <div class="card-header"><h3>📍 Location Query Result</h3><button onclick="document.getElementById('query-result').style.display='none'" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:16px">✕</button></div>
            <div id="query-content"></div>
        </div>

        <!-- Time Slider -->
        <div class="card mt-3">
            <div class="card-header"><h3>⏱ Time Control</h3></div>
            <div style="padding:12px 16px">
                <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:6px">
                    <span>7 days ago</span><span id="time-label">Now (Real-time)</span><span>Today</span>
                </div>
                <input type="range" id="time-slider" min="0" max="7" value="7" style="width:100%;accent-color:var(--accent)">
                <div style="display:flex;gap:8px;margin-top:8px">
                    <button class="tab active" data-t="realtime" onclick="document.querySelectorAll('[data-t]').forEach(b=>b.classList.remove('active'));this.classList.add('active');document.getElementById('time-label').textContent='Now (Real-time)'">🔄 Real-time</button>
                    <button class="tab" data-t="24h" onclick="document.querySelectorAll('[data-t]').forEach(b=>b.classList.remove('active'));this.classList.add('active');document.getElementById('time-label').textContent='24 hours ago'">📅 24h</button>
                    <button class="tab" data-t="7d" onclick="document.querySelectorAll('[data-t]').forEach(b=>b.classList.remove('active'));this.classList.add('active');document.getElementById('time-label').textContent='7 days ago'">📅 7 days</button>
                    <button class="tab" data-t="30d" onclick="document.querySelectorAll('[data-t]').forEach(b=>b.classList.remove('active'));this.classList.add('active');document.getElementById('time-label').textContent='30 days ago'">📅 30 days</button>
                </div>
            </div>
        </div>

        <!-- Layer Legend -->
        <div class="card mt-3">
            <div class="card-header"><h3>📊 Layer Statistics</h3></div>
            <div style="height:200px"><canvas id="map-layer-chart"></canvas></div>
        </div>`;

        setTimeout(() => {
            const map = initFloodReplayMap('interactive-map', { zoom: 6 });
            let curLayer = null;
            let districtMarkers = [];

            function showLayer(layerName) {
                if (curLayer) map.removeLayer(curLayer);
                curLayer = L.layerGroup();
                districtMarkers = [];
                const layerData = layers[layerName]?.data || {};
                const label = document.getElementById('map-layer-label');
                if (label) label.textContent = 'Layer: ' + (layers[layerName]?.name || layerName);

                Object.entries(layerData).forEach(([name, d]) => {
                    let color, radius;
                    if (layerName === 'temperature') {
                        color = d.value >= 45 ? '#dc2626' : d.value >= 40 ? '#ef4444' : d.value >= 35 ? '#f97316' : d.value >= 30 ? '#eab308' : d.value >= 25 ? '#84cc16' : '#22c55e';
                        radius = Math.max(5, Math.min(14, d.value / 3));
                    } else if (layerName === 'rainfall') {
                        color = d.value > 50 ? '#3b82f6' : d.value > 25 ? '#06b6d4' : d.value > 10 ? '#8b5cf6' : '#a3a3a3';
                        radius = Math.max(4, Math.min(12, d.value / 5));
                    } else if (layerName === 'aqi') {
                        color = d.value > 150 ? '#ef4444' : d.value > 100 ? '#f97316' : d.value > 50 ? '#eab308' : '#22c55e';
                        radius = Math.max(4, Math.min(12, d.value / 10));
                    } else if (layerName === 'flood_risk') {
                        color = d.value >= 3 ? '#ef4444' : d.value >= 2 ? '#f97316' : d.value >= 1 ? '#eab308' : '#22c55e';
                        radius = 7;
                    } else if (layerName === 'drought') {
                        color = d.value < -1.5 ? '#ef4444' : d.value < -1 ? '#f97316' : d.value < 0 ? '#eab308' : '#22c55e';
                        radius = 7;
                    } else {
                        color = '#3b82f6';
                        radius = 6;
                    }

                    const m = L.circleMarker([d.lat, d.lng], {
                        radius, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.8, className: 'climate-marker'
                    });
                    m.bindPopup(`<b>${name}</b><br>${d.province}<br>${layers[layerName]?.name || ''}: <b>${d.value}</b>`, { className: 'dark-popup' });
                    m.on('click', () => queryLocation(d.lat, d.lng));
                    curLayer.addLayer(m);
                    districtMarkers.push({ name, ...d });
                });
                curLayer.addTo(map);
            }

            async function queryLocation(lat, lng) {
                try {
                    const res = await fetch('/api/map/query', {
                        method: 'POST', headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({ lat, lng })
                    });
                    const data = await res.json();
                    if (data.error) return;
                    const qr = document.getElementById('query-result');
                    const qc = document.getElementById('query-content');
                    qr.style.display = 'block';
                    qc.innerHTML = `
                        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:4px 0">
                            <div style="text-align:center;padding:10px;background:var(--bg-secondary);border-radius:var(--r-md)"><div style="font-size:18px;font-weight:700;color:${data.temperature>=40?C.danger:C.orange}">${data.temperature}°C</div><div style="font-size:11px;color:var(--text-muted)">Temperature</div></div>
                            <div style="text-align:center;padding:10px;background:var(--bg-secondary);border-radius:var(--r-md)"><div style="font-size:18px;font-weight:700;color:${C.info}">${data.rainfall_7d}mm</div><div style="font-size:11px;color:var(--text-muted)">Rainfall 7d</div></div>
                            <div style="text-align:center;padding:10px;background:var(--bg-secondary);border-radius:var(--r-md)"><div style="font-size:18px;font-weight:700;color:${data.aqi>100?C.danger:C.success}">${data.aqi}</div><div style="font-size:11px;color:var(--text-muted)">AQI</div></div>
                            <div style="text-align:center;padding:10px;background:var(--bg-secondary);border-radius:var(--r-md)"><div style="font-size:18px;font-weight:700;color:${data.flood_risk==='High'?C.danger:C.warning}">${data.flood_risk}</div><div style="font-size:11px;color:var(--text-muted)">Flood Risk</div></div>
                            <div style="text-align:center;padding:10px;background:var(--bg-secondary);border-radius:var(--r-md)"><div style="font-size:18px;font-weight:700;color:${C.success}">${data.wind} km/h</div><div style="font-size:11px;color:var(--text-muted)">Wind</div></div>
                            <div style="text-align:center;padding:10px;background:var(--bg-secondary);border-radius:var(--r-md)"><div style="font-size:18px;font-weight:700;color:${C.purple}">${data.uv}</div><div style="font-size:11px;color:var(--text-muted)">UV Index</div></div>
                            <div style="text-align:center;padding:10px;background:var(--bg-secondary);border-radius:var(--r-md)"><div style="font-size:18px;font-weight:700;color:${C.info}">${data.humidity}%</div><div style="font-size:11px;color:var(--text-muted)">Humidity</div></div>
                            <div style="text-align:center;padding:10px;background:var(--bg-secondary);border-radius:var(--r-md)"><div style="font-size:18px;font-weight:700;color:${data.spi<-1?C.danger:C.success}">${data.spi}</div><div style="font-size:11px;color:var(--text-muted)">SPI</div></div>
                        </div>
                        <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">📍 ${data.district}, ${data.province} (${data.lat.toFixed(2)}°N, ${data.lng.toFixed(2)}°E)</div>`;
                } catch(e) { console.error('Query error:', e); }
            }

            showLayer('temperature');

            document.getElementById('map-layer-select')?.addEventListener('change', (e) => showLayer(e.target.value));
            document.getElementById('map-basemap-select')?.addEventListener('change', (e) => switchMapStyle(map, e.target.value));

            // Layer chart
            const lc = document.getElementById('map-layer-chart');
            if (lc) {
                const temps = Object.values(layers.temperature?.data||{}).map(d=>d.value);
                const ranges = {'<20°C':0,'20-25°C':0,'25-30°C':0,'30-35°C':0,'35-40°C':0,'≥40°C':0};
                temps.forEach(t => { if(t>=40)ranges['≥40°C']++;else if(t>=35)ranges['35-40°C']++;else if(t>=30)ranges['30-35°C']++;else if(t>=25)ranges['25-30°C']++;else if(t>=20)ranges['20-25°C']++;else ranges['<20°C']++; });
                makeBar(lc.getContext('2d'), Object.keys(ranges), Object.values(ranges), ['#3b82f6','#22c55e','#84cc16','#eab308','#f97316','#ef4444']);
            }
        }, 100);
    } catch(e) { el.innerHTML = '<div class="loading">Error: '+e.message+'</div>'; }
}
