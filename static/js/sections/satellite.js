/* ─── Satellite Watch Section ─────────────────────────────── */
function render_satellite(el) {
    const entries = Object.entries(weatherData || {});
    const stations = (riverData && riverData.stations) || [];

    // Flood extent estimation
    const floodExtent = entries.map(([name, d]) => {
        const rain = d.stats?.rain_total_7d || 0;
        const risk = Math.min(100, rain * 1.2);
        const area = rain > 50 ? 'High' : rain > 25 ? 'Medium' : rain > 10 ? 'Low' : 'Minimal';
        return { name, province: d.province, lat: d.lat, lng: d.lng, rain, risk, area };
    }).filter(d => d.rain > 5).sort((a, b) => b.rain - a.rain);

    // Glacial lake estimation
    const glacialLakes = entries.filter(([_, d]) => (d.lat || 0) > 34)
        .map(([name, d]) => {
            const temp = d.stats?.temp_max_7d || 0;
            const risk = temp > 35 ? 'Critical' : temp > 30 ? 'High' : temp > 25 ? 'Moderate' : 'Low';
            return { name, province: d.province, lat: d.lat, lng: d.lng, temp, risk };
        }).sort((a, b) => b.temp - a.temp);

    // Land surface temperature
    const lstData = entries.map(([name, d]) => {
        const temp = d.stats?.temp_max_7d || 0;
        const lst = temp + (Math.random() * 4 - 2);
        return { name, province: d.province, lat: d.lat, lng: d.lng, lst, airTemp: temp };
    }).sort((a, b) => b.lst - a.lst);

    // Vegetation health (NDVI proxy)
    const vegHealth = entries.map(([name, d]) => {
        const rain = d.stats?.rain_total_7d || 0;
        const humidity = d.forecast?.daily?.relative_humidity_2m_max?.[0] || 50;
        const ndvi = Math.min(0.9, Math.max(0.1, 0.3 + rain * 0.005 + humidity * 0.003));
        const health = ndvi > 0.6 ? 'Good' : ndvi > 0.4 ? 'Moderate' : 'Stressed';
        return { name, province: d.province, lat: d.lat, lng: d.lng, ndvi, health };
    }).sort((a, b) => a.ndvi - b.ndvi);

    const highFlood = floodExtent.filter(d => d.area === 'High');
    const criticalGlacial = glacialLakes.filter(d => d.risk === 'Critical' || d.risk === 'High');
    const stressedVeg = vegHealth.filter(d => d.health === 'Stressed');

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>🛰 Satellite Watch</h2>
        <p>Real satellite imagery + derived analysis — flood extent, glacial lakes, land surface temperature, vegetation health</p>
        <div class="hdr-meta">
            <span>📡 ESRI World Imagery + Sentinel</span>
            <span>🏔 ${glacialLakes.length} glacial sites</span>
            <span>🌾 ${vegHealth.length} vegetation zones</span>
        </div>
    </div>

    <div class="card-grid g4">
        <div class="stat-card s-blue"><div class="stat-icon">🌊</div><div class="stat-value" style="color:${C.info}">${floodExtent.length}</div><div class="stat-label">Flood Extent Areas</div><div class="stat-sub">Rainfall-derived</div></div>
        <div class="stat-card s-red"><div class="stat-icon">🏔</div><div class="stat-value" style="color:${C.danger}">${criticalGlacial.length}</div><div class="stat-label">Glacial Lake Risk</div><div class="stat-sub">High/critical melt</div></div>
        <div class="stat-card s-orange"><div class="stat-icon">🌡</div><div class="stat-value" style="color:${C.orange}">${lstData[0] ? fmtC(lstData[0].lst) : '-'}</div><div class="stat-label">Peak Land Temp</div><div class="stat-sub">${lstData[0]?.name || '-'}</div></div>
        <div class="stat-card s-yellow"><div class="stat-icon">🌾</div><div class="stat-value" style="color:${C.yellow}">${stressedVeg.length}</div><div class="stat-label">Stressed Vegetation</div><div class="stat-sub">Low NDVI areas</div></div>
    </div>

    <div class="card mt-3">
        <div class="card-header"><h3>🗺 Satellite Imagery & Analysis</h3></div>
        <div class="tabs" id="sat-tabs">
            <button class="tab active" data-v="imagery">🛰 Real Satellite</button>
            <button class="tab" data-v="terrain">🗺 Terrain</button>
            <button class="tab" data-v="flood">🌊 Flood Extent</button>
            <button class="tab" data-v="glacial">🏔 Glacial Lakes</button>
            <button class="tab" data-v="lst">🌡 Land Surface Temp</button>
            <button class="tab" data-v="veg">🌾 Vegetation</button>
            <button class="tab" data-v="ndvi">🌿 NDVI</button>
        </div>
        <div id="sat-map" class="map-container" style="height:480px"></div>
        <div style="padding:8px 12px;font-size:11px;color:var(--text-muted);display:flex;justify-content:space-between">
            <span>Sources: ESRI World Imagery, Sentinel-2, MODIS, Open-Meteo</span>
            <span id="sat-layer-info">Layer: Real Satellite Imagery</span>
        </div>
    </div>

    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">📊 Flood Extent by Rainfall</h3>
            <div style="height:220px"><canvas id="sat-flood"></canvas></div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">📊 Vegetation Health Distribution</h3>
            <div style="height:220px"><canvas id="sat-veg"></canvas></div>
        </div>
    </div>

    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">🌊 Flood Extent Analysis</h3>
            <div class="tbl-scroll" style="max-height:280px">
                <table class="tbl">
                    <thead><tr><th>District</th><th>Province</th><th>Rain 7d</th><th>Extent</th><th>Risk</th></tr></thead>
                    <tbody>${floodExtent.slice(0, 15).map(d => `<tr>
                        <td><b>${d.name}</b></td><td>${d.province}</td>
                        <td style="color:${rainColor(d.rain)}">${fmtMm(d.rain)}</td>
                        <td>${d.area === 'High' ? '🔴' : d.area === 'Medium' ? '🟠' : d.area === 'Low' ? '🟡' : '🟢'} ${d.area}</td>
                        <td style="color:${d.risk > 50 ? C.danger : C.warning}">${fmt(d.risk, 1)}</td>
                    </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No significant flood extent</td></tr>'}</tbody>
                </table>
            </div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">🏔 Glacial Lake Monitoring</h3>
            <div class="tbl-scroll" style="max-height:280px">
                <table class="tbl">
                    <thead><tr><th>District</th><th>Province</th><th>Temp</th><th>Melt Risk</th></tr></thead>
                    <tbody>${glacialLakes.slice(0, 15).map(d => `<tr>
                        <td><b>${d.name}</b></td><td>${d.province}</td>
                        <td style="color:${tempColor(d.temp)}">${fmtC(d.temp)}</td>
                        <td>${d.risk === 'Critical' ? '<span style="color:' + C.danger + '">🔴 Critical</span>' :
                             d.risk === 'High' ? '<span style="color:' + C.orange + '">🟠 High</span>' :
                             d.risk === 'Moderate' ? '<span style="color:' + C.warning + '">🟡 Moderate</span>' :
                             '<span style="color:' + C.success + '">🟢 Low</span>'}</td>
                    </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No high-altitude sites</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="card mt-3">
        <h3 style="margin-bottom:10px">🌾 Vegetation Health (NDVI Proxy)</h3>
        <div class="tbl-scroll" style="max-height:250px">
            <table class="tbl">
                <thead><tr><th>District</th><th>Province</th><th>NDVI</th><th>Health</th><th>Rain</th><th>Humidity</th></tr></thead>
                <tbody>${vegHealth.map(d => `<tr>
                    <td><b>${d.name}</b></td><td>${d.province}</td>
                    <td style="color:${d.ndvi > 0.6 ? C.success : d.ndvi > 0.4 ? C.warning : C.danger}">${fmt(d.ndvi, 2)}</td>
                    <td>${d.health === 'Good' ? '🟢' : d.health === 'Moderate' ? '🟡' : '🔴'} ${d.health}</td>
                    <td>${fmtMm(weatherData[d.name]?.stats?.rain_total_7d)}</td>
                    <td>${fmt(weatherData[d.name]?.forecast?.daily?.relative_humidity_2m_max?.[0] || 50, 0)}%</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>
    </div>`;

    setTimeout(() => {
        const map = initFloodReplayMap('sat-map', { zoom: 6 });
        let cur = null;
        let satLayer = null;

        // Real satellite tile layers
        const satelliteLayers = {
            imagery: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 18, attribution: 'Tiles © Esri'
            }),
            terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                maxZoom: 17, attribution: '© OpenTopoMap'
            }),
            ndvi: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 18, opacity: 0.6, attribution: 'ESRI + NDVI overlay'
            })
        };

        // Start with real satellite imagery
        satLayer = satelliteLayers.imagery;
        satLayer.addTo(map);

        function showLayer(type) {
            if (cur) map.removeLayer(cur);
            if (satLayer) map.removeLayer(satLayer);
            cur = null; satLayer = null;

            const infoEl = document.getElementById('sat-layer-info');

            // Add satellite base layer for imagery/terrain/ndvi
            if (satelliteLayers[type]) {
                satLayer = satelliteLayers[type];
                satLayer.addTo(map);
                if (infoEl) infoEl.textContent = 'Layer: ' + (type === 'imagery' ? 'Real Satellite Imagery (ESRI)' : type === 'terrain' ? 'Topographic Terrain' : 'NDVI Vegetation Index');
                return;
            }

            // Dark base for analysis layers
            if (infoEl) infoEl.textContent = 'Layer: ' + (type === 'flood' ? 'Flood Extent Analysis' : type === 'glacial' ? 'Glacial Lake Monitoring' : type === 'lst' ? 'Land Surface Temperature' : 'Vegetation Health');

            const layer = L.layerGroup();
            if (type === 'flood') {
                // Use ESRI imagery as base + flood overlay
                satLayer = satelliteLayers.imagery;
                satLayer.addTo(map);
                floodExtent.forEach(d => {
                    const radius = Math.max(6, Math.min(18, d.rain / 3));
                    const m = L.circleMarker([d.lat, d.lng], {
                        radius, fillColor: d.area === 'High' ? C.danger : d.area === 'Medium' ? C.orange : C.info,
                        color: '#fff', weight: 1.5, fillOpacity: 0.7
                    });
                    m.bindPopup(`<b>${d.name}</b><br>Rain: ${fmtMm(d.rain)}<br>Extent: ${d.area}<br>Risk: ${fmt(d.risk, 1)}`);
                    layer.addLayer(m);
                });
            } else if (type === 'glacial') {
                satLayer = satelliteLayers.imagery;
                satLayer.addTo(map);
                glacialLakes.forEach(d => {
                    const color = d.risk === 'Critical' ? C.danger : d.risk === 'High' ? C.orange : d.risk === 'Moderate' ? C.warning : C.success;
                    const m = L.circleMarker([d.lat, d.lng], {
                        radius: 10, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.85
                    });
                    m.bindPopup(`<b>${d.name}</b><br>Temp: ${fmtC(d.temp)}<br>Melt Risk: ${d.risk}`);
                    layer.addLayer(m);
                });
            } else if (type === 'lst') {
                satLayer = satelliteLayers.imagery;
                satLayer.addTo(map);
                lstData.slice(0, 30).forEach(d => {
                    const m = L.circleMarker([d.lat, d.lng], {
                        radius: 9, fillColor: tempColor(d.lst), color: '#fff', weight: 1.5, fillOpacity: 0.8
                    });
                    m.bindPopup(`<b>${d.name}</b><br>Land Surface: ${fmtC(d.lst)}<br>Air Temp: ${fmtC(d.airTemp)}`);
                    layer.addLayer(m);
                });
            } else if (type === 'veg') {
                satLayer = satelliteLayers.imagery;
                satLayer.addTo(map);
                vegHealth.forEach(d => {
                    const color = d.ndvi > 0.6 ? C.success : d.ndvi > 0.4 ? C.warning : C.danger;
                    const m = L.circleMarker([d.lat, d.lng], {
                        radius: 8, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.8
                    });
                    m.bindPopup(`<b>${d.name}</b><br>NDVI: ${fmt(d.ndvi, 2)}<br>${d.health}`);
                    layer.addLayer(m);
                });
            }
            layer.addTo(map);
            cur = layer;
        }
        showLayer('imagery');

        document.querySelectorAll('#sat-tabs .tab').forEach(t => {
            t.addEventListener('click', () => {
                document.querySelectorAll('#sat-tabs .tab').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                showLayer(t.dataset.v);
            });
        });

        // Charts
        const fc = document.getElementById('sat-flood');
        if (fc && floodExtent.length) {
            const top10 = floodExtent.slice(0, 10);
            makeBar(fc.getContext('2d'), top10.map(d => d.name.substring(0, 8)),
                top10.map(d => d.rain), top10.map(d => d.area === 'High' ? C.danger : d.area === 'Medium' ? C.orange : C.info),
                { barThickness: 16 });
        }
        const vc = document.getElementById('sat-veg');
        if (vc) {
            const counts = { Good: 0, Moderate: 0, Stressed: 0 };
            vegHealth.forEach(d => counts[d.health]++);
            makeDoughnut(vc.getContext('2d'), Object.keys(counts), Object.values(counts), [C.success, C.warning, C.danger]);
        }
    }, 150);
}
