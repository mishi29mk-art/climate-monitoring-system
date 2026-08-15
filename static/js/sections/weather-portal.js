/* ─── Weather Portal — All Cities Table & Map ────────────────── */
function render_weather_portal(el) {
    let currentProvince = 'all';
    let sortKey = 'name';
    let sortDir = 1; // 1 asc, -1 desc
    let mapInstance = null;
    let markerLayer = null;

    const provinces = [...new Set(Object.values(weatherData).map(d => d.province).filter(Boolean))].sort();

    function getCities() {
        let entries = Object.entries(weatherData);
        if (currentProvince !== 'all') entries = entries.filter(([, d]) => d.province === currentProvince);
        entries.sort((a, b) => {
            let va, vb;
            if (sortKey === 'name') { va = a[0]; vb = b[0]; }
            else if (sortKey === 'temp') { va = a[1].stats?.temp_max_7d || 0; vb = b[1].stats?.temp_max_7d || 0; }
            else if (sortKey === 'rain') { va = a[1].stats?.rain_total_7d || 0; vb = b[1].stats?.rain_total_7d || 0; }
            else if (sortKey === 'aqi') {
                const aAqi = aqiData[a[0]]?.stats?.aqi_max || 0;
                const bAqi = aqiData[b[0]]?.stats?.aqi_max || 0;
                va = aAqi; vb = bAqi;
            }
            else if (sortKey === 'wind') { va = a[1].stats?.wind_max_7d || 0; vb = b[1].stats?.wind_max_7d || 0; }
            else if (sortKey === 'uv') { va = a[1].stats?.uv_max_7d || 0; vb = b[1].stats?.uv_max_7d || 0; }
            else { va = a[0]; vb = b[0]; }
            if (typeof va === 'string') return sortDir * va.localeCompare(vb);
            return sortDir * (va - vb);
        });
        return entries;
    }

    function renderTable() {
        const cities = getCities();
        const sortArrow = (key) => sortKey === key ? (sortDir === 1 ? ' ▲' : ' ▼') : '';
        const th = (key, label) => `<th class="sortable" data-key="${key}">${label}${sortArrow(key)}</th>`;
        return `
        <div class="tbl-scroll" style="max-height:420px">
            <table class="tbl" id="wp-table">
                <thead><tr>
                    ${th('name', 'District')}
                    ${th('temp', 'Temp Max')}
                    <th>Temp Min</th>
                    ${th('rain', 'Rain 7d')}
                    ${th('aqi', 'AQI')}
                    ${th('wind', 'Wind')}
                    ${th('uv', 'UV')}
                    <th>Province</th>
                </tr></thead>
                <tbody>
                ${cities.map(([n, d]) => {
                    const aqi = aqiData[n]?.stats;
                    const s = d.stats || {};
                    const alerts = (alertsData || []).filter(a => a.district === n);
                    return `<tr class="${alerts.length ? 'row-alert' : ''}">
                        <td><b>${n}</b>${alerts.length ? ` <span class="badge b-danger" style="font-size:10px">${alerts.length}</span>` : ''}</td>
                        <td style="color:${tempColor(s.temp_max_7d)}">${fmtC(s.temp_max_7d)}</td>
                        <td style="color:${tempColor(s.temp_min_7d)}">${fmtC(s.temp_min_7d)}</td>
                        <td style="color:${rainColor(s.rain_total_7d)}">${fmtMm(s.rain_total_7d)}</td>
                        <td style="color:${aqiColor(aqi?.aqi_max)}">${aqi?.aqi_max ? Math.round(aqi.aqi_max) : '-'} <span style="color:${aqiColor(aqi?.aqi_max)};font-size:10px">${aqiLabel(aqi?.aqi_max)}</span></td>
                        <td style="color:${windColor(s.wind_max_7d)}">${fmt(s.wind_max_7d, 0)} km/h</td>
                        <td style="color:${uvColor(s.uv_max_7d)}">${fmt(s.uv_max_7d, 1)}</td>
                        <td>${d.province || '-'}</td>
                    </tr>`;
                }).join('')}
                </tbody>
            </table>
        </div>`;
    }

    function updateMapMarkers() {
        if (!mapInstance || !markerLayer) return;
        mapInstance.removeLayer(markerLayer);
        markerLayer = addDistrictMarkers(mapInstance, weatherData,
            (name, d) => tempColor(d.stats?.temp_max_7d),
            (name, d) => {
                const s = d.stats || {};
                const aqi = aqiData[name]?.stats;
                return `<div style="min-width:160px">
                    <b>${name}</b><br>${d.province}<br><hr style="border-color:#30363d;margin:4px 0">
                    🌡 ${fmtC(s.temp_max_7d)} / ${fmtC(s.temp_min_7d)}<br>
                    🌧 ${fmtMm(s.rain_total_7d)}<br>
                    💨 AQI: ${aqi?.aqi_max ? Math.round(aqi.aqi_max) : '-'}<br>
                    🌬 ${fmt(s.wind_max_7d, 0)} km/h ${directionName(s.wind_dir_max || 0)}<br>
                    ☀ UV: ${fmt(s.uv_max_7d, 1)}<br>
                    💧 RH: ${fmt(s.humidity_avg, 0)}%
                </div>`;
            }
        );
        // Filter markers by province
        if (currentProvince !== 'all') {
            markerLayer.eachLayer(layer => {
                const popup = layer.getPopup()?.getContent() || '';
                const match = Object.entries(weatherData).find(([n, d]) =>
                    d.province === currentProvince && popup.includes(`<b>${n}</b>`)
                );
                if (!match) mapInstance.removeLayer(layer);
            });
        }
    }

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>🌦 Weather Portal — All Cities</h2>
        <p>Comprehensive weather data for all monitored districts across Pakistan</p>
    </div>
    <div class="card-grid g4 mb-3">
        <div class="stat-card s-cyan"><div class="stat-icon">🏙</div><div class="stat-value">${Object.keys(weatherData).length}</div><div class="stat-label">Districts</div></div>
        <div class="stat-card s-red"><div class="stat-icon">🌡</div><div class="stat-value" style="color:${tempColor(summaryData.hottest?.temp)}">${fmtC(summaryData.hottest?.temp)}</div><div class="stat-label">Peak Temp</div><div class="stat-sub">${summaryData.hottest?.district || ''}</div></div>
        <div class="stat-card s-blue"><div class="stat-icon">🌧</div><div class="stat-value" style="color:${rainColor(summaryData.wettest?.rain)}">${fmtMm(summaryData.wettest?.rain)}</div><div class="stat-label">Most Rain</div><div class="stat-sub">${summaryData.wettest?.district || ''}</div></div>
        <div class="stat-card s-green"><div class="stat-icon">💨</div><div class="stat-value" style="color:${aqiColor(summaryData.worst_aqi?.aqi)}">${summaryData.worst_aqi?.aqi ? Math.round(summaryData.worst_aqi.aqi) : '-'}</div><div class="stat-label">Worst AQI</div><div class="stat-sub">${summaryData.worst_aqi?.district || ''}</div></div>
    </div>
    <div class="card-grid g2">
        <div class="card">
            <div class="card-header">
                <h3>🗺 Climate Map</h3>
                <div class="tabs" id="wp-map-tabs">
                    <button class="tab active" data-layer="temp">🌡 Temp</button>
                    <button class="tab" data-layer="rain">🌧 Rain</button>
                    <button class="tab" data-layer="aqi">💨 AQI</button>
                    <button class="tab" data-layer="wind">🌬 Wind</button>
                </div>
            </div>
            <div id="wp-map" class="map-container" style="height:460px"></div>
        </div>
        <div class="card">
            <div class="card-header">
                <h3>📊 Province Summary</h3>
            </div>
            <div class="card-grid g2" style="padding:8px">
                ${provinces.map(p => {
                    const cities = Object.entries(weatherData).filter(([, d]) => d.province === p);
                    const avgTemp = cities.reduce((s, [, d]) => s + (d.stats?.temp_max_7d || 0), 0) / (cities.length || 1);
                    const totalPop = cities.reduce((s, [, d]) => s + (d.population || 0), 0);
                    const alertCount = (alertsData || []).filter(a => cities.some(([n]) => n === a.district)).length;
                    return `<div class="card" style="padding:12px;cursor:pointer" onclick="document.getElementById('wp-province').value='${p}';document.getElementById('wp-province').dispatchEvent(new Event('change'))">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                            <b style="font-size:13px">${p}</b>
                            <span style="color:${tempColor(avgTemp)};font-size:12px">${fmtC(avgTemp)}</span>
                        </div>
                        <div style="font-size:11px;color:var(--text-muted)">
                            ${cities.length} districts · Pop ${fmtK(totalPop)}
                            ${alertCount ? ` · <span style="color:${C.danger}">${alertCount} alerts</span>` : ''}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>
    </div>
    <div class="card mt-3">
        <div class="card-header">
            <h3>📋 All Cities Data</h3>
            <div style="display:flex;gap:10px;align-items:center">
                <label style="font-size:12px;color:var(--text-muted)">Province:</label>
                <select id="wp-province" style="background:#161b22;color:var(--text);border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-size:12px">
                    <option value="all">All Provinces</option>
                    ${provinces.map(p => `<option value="${p}">${p}</option>`).join('')}
                </select>
            </div>
        </div>
        ${renderTable()}
    </div>
    <div class="card mt-3">
        <div class="card-header">
            <h3>📈 Temperature Distribution</h3>
        </div>
        <div class="card-grid g3">
            <div style="height:200px"><canvas id="wp-temp-dist"></canvas></div>
            <div style="height:200px"><canvas id="wp-rain-dist"></canvas></div>
            <div style="height:200px"><canvas id="wp-aqi-dist"></canvas></div>
        </div>
    </div>`;

    setTimeout(() => {
        // Init map
        mapInstance = initFloodReplayMap('wp-map', { zoom: 5 });
        markerLayer = addDistrictMarkers(mapInstance, weatherData,
            (n, d) => tempColor(d.stats?.temp_max_7d),
            (n, d) => `<b>${n}</b><br>${d.province}<br>${fmtC(d.stats?.temp_max_7d)}`
        );

        // Map layer tabs
        $$('#wp-map-tabs .tab').forEach(t => t.addEventListener('click', () => {
            $$('#wp-map-tabs .tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            if (markerLayer) mapInstance.removeLayer(markerLayer);
            const layer = t.dataset.layer;
            const configs = {
                temp: { color: (_, d) => tempColor(d.stats?.temp_max_7d), popup: (n, d) => `<b>${n}</b><br>${fmtC(d.stats?.temp_max_7d)}` },
                rain: { color: (_, d) => rainColor(d.stats?.rain_total_7d), popup: (n, d) => `<b>${n}</b><br>${fmtMm(d.stats?.rain_total_7d)}` },
                aqi: { color: (n) => aqiColor(aqiData[n]?.stats?.aqi_max), popup: (n) => `<b>${n}</b><br>AQI: ${aqiData[n]?.stats?.aqi_max ? Math.round(aqiData[n].stats.aqi_max) : '-'}` },
                wind: { color: (_, d) => windColor(d.stats?.wind_max_7d), popup: (n, d) => `<b>${n}</b><br>${fmt(d.stats?.wind_max_7d, 0)} km/h` }
            };
            const cfg = configs[layer] || configs.temp;
            markerLayer = addDistrictMarkers(mapInstance, weatherData, cfg.color, cfg.popup);
        }));

        // Province filter
        const sel = document.getElementById('wp-province');
        if (sel) sel.addEventListener('change', () => {
            currentProvince = sel.value;
            const tableEl = el.querySelector('#wp-table')?.closest('.tbl-scroll');
            if (tableEl) tableEl.outerHTML = renderTable();
            // Re-bind sort events
            bindSortEvents();
            updateMapMarkers();
        });

        // Sort
        function bindSortEvents() {
            $$('#wp-table .sortable').forEach(th => {
                th.style.cursor = 'pointer';
                th.addEventListener('click', () => {
                    const key = th.dataset.key;
                    if (sortKey === key) sortDir *= -1;
                    else { sortKey = key; sortDir = 1; }
                    const tableEl = el.querySelector('#wp-table')?.closest('.tbl-scroll');
                    if (tableEl) tableEl.outerHTML = renderTable();
                    bindSortEvents();
                });
            });
        }
        bindSortEvents();

        // Distribution charts
        const entries = Object.entries(weatherData);
        // Temperature distribution
        const tempBuckets = [0, 0, 0, 0, 0, 0, 0]; // <20, 20-25, 25-30, 30-35, 35-40, 40-45, 45+
        const tempLabels = ['<20°C', '20-25°C', '25-30°C', '30-35°C', '35-40°C', '40-45°C', '45+°C'];
        entries.forEach(([, d]) => {
            const t = d.stats?.temp_max_7d || 0;
            if (t < 20) tempBuckets[0]++;
            else if (t < 25) tempBuckets[1]++;
            else if (t < 30) tempBuckets[2]++;
            else if (t < 35) tempBuckets[3]++;
            else if (t < 40) tempBuckets[4]++;
            else if (t < 45) tempBuckets[5]++;
            else tempBuckets[6]++;
        });
        const tc = document.getElementById('wp-temp-dist');
        if (tc) makeBar(tc.getContext('2d'), tempLabels, tempBuckets,
            [C.info, C.cyan, C.success, C.yellow, C.orange, C.danger, '#ff0040'], { barThickness: 18 });

        // Rain distribution
        const rainBuckets = [0, 0, 0, 0, 0, 0];
        const rainLabels = ['0-10mm', '10-25mm', '25-50mm', '50-80mm', '80-120mm', '120+mm'];
        entries.forEach(([, d]) => {
            const r = d.stats?.rain_total_7d || 0;
            if (r < 10) rainBuckets[0]++;
            else if (r < 25) rainBuckets[1]++;
            else if (r < 50) rainBuckets[2]++;
            else if (r < 80) rainBuckets[3]++;
            else if (r < 120) rainBuckets[4]++;
            else rainBuckets[5]++;
        });
        const rc = document.getElementById('wp-rain-dist');
        if (rc) makeBar(rc.getContext('2d'), rainLabels, rainBuckets,
            [C.success, C.yellow, C.orange, C.warning, C.danger, '#800020'], { barThickness: 18 });

        // AQI distribution
        const aqiBuckets = [0, 0, 0, 0, 0];
        const aqiLabels = ['Good\n<50', 'Moderate\n50-100', 'Poor\n100-150', 'Very Poor\n150-200', 'Severe\n200+'];
        Object.values(aqiData).forEach(d => {
            const a = d.stats?.aqi_max || 0;
            if (a < 50) aqiBuckets[0]++;
            else if (a < 100) aqiBuckets[1]++;
            else if (a < 150) aqiBuckets[2]++;
            else if (a < 200) aqiBuckets[3]++;
            else aqiBuckets[4]++;
        });
        const ac = document.getElementById('wp-aqi-dist');
        if (ac) makeBar(ac.getContext('2d'), aqiLabels, aqiBuckets,
            [C.success, C.yellow, C.warning, C.orange, C.danger], { barThickness: 18 });
    }, 150);
}
