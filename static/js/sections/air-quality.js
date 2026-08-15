/* ─── Air Quality (AQI) Section ────────────────────────────── */
function render_air_quality(el) {
    const a = aqiData || {};
    const entries = Object.entries(a);

    // Compute national stats
    const aqiVals = entries.map(([,d]) => d.stats?.aqi_max).filter(v => v != null);
    const pm25Vals = entries.map(([,d]) => d.stats?.pm25_max).filter(v => v != null);
    const pm10Vals = entries.map(([,d]) => d.stats?.pm10_max).filter(v => v != null);
    const o3Vals = entries.map(([,d]) => d.stats?.o3_max).filter(v => v != null);
    const no2Vals = entries.map(([,d]) => d.stats?.no2_max).filter(v => v != null);

    const worstAqi = aqiVals.length ? Math.max(...aqiVals) : 0;
    const avgAqi = aqiVals.length ? aqiVals.reduce((a,b)=>a+b,0)/aqiVals.length : 0;
    const goodCount = aqiVals.filter(v => v < 50).length;
    const moderateCount = aqiVals.filter(v => v >= 50 && v < 100).length;
    const poorCount = aqiVals.filter(v => v >= 100 && v < 150).length;
    const severeCount = aqiVals.filter(v => v >= 200).length;

    // Province AQI averages
    const provinces = {};
    entries.forEach(([n,d]) => {
        const p = d.province || 'Unknown';
        if (!provinces[p]) provinces[p] = { aqis: [], names: [], count: 0 };
        if (d.stats?.aqi_max != null) {
            provinces[p].aqis.push(d.stats.aqi_max);
        }
        provinces[p].names.push(n);
        provinces[p].count++;
    });
    const provAqi = Object.entries(provinces).map(([p, v]) => ({
        name: p,
        avg: v.aqis.length ? v.aqis.reduce((a,b)=>a+b,0)/v.aqis.length : 0,
        max: v.aqis.length ? Math.max(...v.aqis) : 0,
        count: v.count
    })).sort((a,b) => b.avg - a.avg);

    // Sorted entries
    const sorted = entries.filter(([,d]) => d.stats?.aqi_max != null).sort((a,b) => (b[1].stats?.aqi_max||0) - (a[1].stats?.aqi_max||0));

    // AQI alerts
    const aqiAlerts = (alertsData||[]).filter(a => a.type === 'aqi');

    // Pollutant breakdown
    const avgPm25 = pm25Vals.length ? pm25Vals.reduce((a,b)=>a+b,0)/pm25Vals.length : 0;
    const avgPm10 = pm10Vals.length ? pm10Vals.reduce((a,b)=>a+b,0)/pm10Vals.length : 0;
    const avgO3 = o3Vals.length ? o3Vals.reduce((a,b)=>a+b,0)/o3Vals.length : 0;
    const avgNo2 = no2Vals.length ? no2Vals.reduce((a,b)=>a+b,0)/no2Vals.length : 0;

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>💨 Air Quality Index (AQI)</h2>
        <p>Real-time air pollution monitoring — PM2.5, PM10, O₃, NO₂ across Pakistan</p>
        <div class="hdr-meta">
            <span>📊 ${entries.length} monitoring stations</span>
            <span>🫁 ${poorCount + severeCount} districts with poor/severe air quality</span>
            <span>⚠ ${aqiAlerts.length} active AQI alerts</span>
        </div>
    </div>

    <!-- Key Metrics -->
    <div class="card-grid g4">
        <div class="stat-card s-orange"><div class="stat-icon">💨</div>
            <div class="stat-value" style="color:${aqiColor(worstAqi)}">${Math.round(worstAqi)}</div>
            <div class="stat-label">Worst AQI</div>
            <div class="stat-sub">${aqiLabel(worstAqi)}</div>
        </div>
        <div class="stat-card s-blue"><div class="stat-icon">📊</div>
            <div class="stat-value">${Math.round(avgAqi)}</div>
            <div class="stat-label">Average AQI</div>
            <div class="stat-sub">${aqiLabel(avgAqi)}</div>
        </div>
        <div class="stat-card s-red"><div class="stat-icon">🫁</div>
            <div class="stat-value">${pm25Vals.length ? fmt(avgPm25, 0) : '-'}</div>
            <div class="stat-label">Avg PM2.5 (µg/m³)</div>
            <div class="stat-sub">Fine particulate matter</div>
        </div>
        <div class="stat-card s-yellow"><div class="stat-icon">⚠</div>
            <div class="stat-value" style="color:${C.danger}">${severeCount}</div>
            <div class="stat-label">Severe Districts</div>
            <div class="stat-sub">AQI ≥ 200</div>
        </div>
    </div>

    <!-- AQI Distribution + Pollutant Averages -->
    <div class="card-grid g2 mt-3">
        <div class="card" style="overflow:hidden">
            <div class="card-header" style="padding:14px 18px;border-bottom:1px solid var(--border)">
                <h3>🗺 AQI Distribution Map</h3>
                <div style="display:flex;gap:8px;align-items:center">
                    <select id="aqi-map-style" style="background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);padding:4px 8px;border-radius:6px;font-size:11px;cursor:pointer">
                        <option value="dark">🌙 Dark</option>
                        <option value="satellite">🛰 Satellite</option>
                        <option value="terrain">🗺 Terrain</option>
                        <option value="voyager">🎨 Voyager</option>
                        <option value="positron">⬜ Light</option>
                    </select>
                </div>
            </div>
            <div class="tabs" id="aqi-map-tabs" style="padding:10px 18px 0">
                <button class="tab active" data-v="aqi">💨 AQI Level</button>
                <button class="tab" data-v="pm25">🔬 PM2.5</button>
                <button class="tab" data-v="pm10">🌫 PM10</button>
            </div>
            <div id="aqi-map" class="map-container" style="height:400px;border-radius:0;border:none;margin-top:10px"></div>
            <div style="padding:8px 18px;font-size:10px;color:var(--text-muted);display:flex;justify-content:space-between;border-top:1px solid var(--border)">
                <span>🟢 Good (0-50) · 🟡 Moderate (51-100) · 🟠 Poor (101-150) · 🔴 Severe (200+)</span>
                <span>Open-Meteo AQI</span>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h3>📊 AQI Category Breakdown</h3></div>
            <div class="chart-wrap"><canvas id="aqi-cat-doughnut"></canvas></div>
            <div style="margin-top:14px">
                <h3 style="margin-bottom:8px">📊 Province Average AQI</h3>
                <div class="chart-wrap" style="height:180px"><canvas id="aqi-prov-bar"></canvas></div>
            </div>
        </div>
    </div>

    <!-- Pollutant Charts -->
    <div class="card-grid g2 mt-3">
        <div class="card">
            <div class="card-header"><h3>🫁 Top 10 Polluted Districts — PM2.5</h3></div>
            <div class="chart-wrap"><canvas id="aqi-pm25-bar"></canvas></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>🌬 Pollutant Comparison (National Averages)</h3></div>
            <div class="chart-wrap"><canvas id="aqi-pollutant-radar"></canvas></div>
        </div>
    </div>

    <!-- Alerts + Table -->
    <div class="card-grid g2 mt-3">
        <div class="card">
            <div class="card-header"><h3>🚨 AQI Alerts (${aqiAlerts.length})</h3></div>
            <div class="tbl-scroll" style="max-height:360px">
                <table class="tbl">
                    <thead><tr><th></th><th>District</th><th>Province</th><th>Severity</th><th>AQI</th></tr></thead>
                    <tbody>
                    ${aqiAlerts.length ? aqiAlerts.map(a => `<tr>
                        <td>${a.icon||'💨'}</td>
                        <td><b>${a.district}</b></td>
                        <td>${a.province||''}</td>
                        <td>${severityBadge(a.severity)}</td>
                        <td style="color:${aqiColor(a.value)}"><b>${Math.round(a.value)}</b></td>
                    </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No active AQI alerts ✅</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h3>📋 All District AQI Data (${sorted.length})</h3></div>
            <div class="tbl-scroll" style="max-height:360px">
                <table class="tbl">
                    <thead><tr><th>District</th><th>Province</th><th>AQI</th><th>Status</th><th>PM2.5</th><th>PM10</th></tr></thead>
                    <tbody>
                    ${sorted.map(([n,d]) => {
                        const aqi = d.stats?.aqi_max || 0;
                        return `<tr>
                            <td><b>${n}</b></td>
                            <td>${d.province||''}</td>
                            <td style="color:${aqiColor(aqi)}"><b>${Math.round(aqi)}</b></td>
                            <td><span class="badge ${aqi >= 200 ? 'b-danger' : aqi >= 150 ? 'b-orange' : aqi >= 100 ? 'b-yellow' : aqi >= 50 ? 'b-info' : 'b-success'}">${aqiLabel(aqi)}</span></td>
                            <td>${d.stats?.pm25_max != null ? fmt(d.stats.pm25_max, 0) + ' µg' : '-'}</td>
                            <td>${d.stats?.pm10_max != null ? fmt(d.stats.pm10_max, 0) + ' µg' : '-'}</td>
                        </tr>`;
                    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- AQI Hourly Trend for Worst District -->
    ${sorted.length ? `
    <div class="card mt-3">
        <div class="card-header"><h3>📈 AQI Hourly Trend — Most Polluted: ${sorted[0][0]}</h3></div>
        <div class="chart-wrap" style="height:220px"><canvas id="aqi-hourly-line"></canvas></div>
    </div>` : ''}`;

    // Initialize charts and map
    setTimeout(() => {
        // ─── AQI Map ───
        const map = initFloodReplayMap('aqi-map', { zoom: 6 });
        let curLayer = null;
        function showAqiLayer(mode) {
            if (curLayer) map.removeLayer(curLayer);
            const colorFn = mode === 'pm25'
                ? (_, d) => d.stats?.pm25_max >= 100 ? '#ef4444' : d.stats?.pm25_max >= 50 ? '#eab308' : d.stats?.pm25_max >= 25 ? '#84cc16' : '#22c55e'
                : mode === 'pm10'
                ? (_, d) => d.stats?.pm10_max >= 150 ? '#ef4444' : d.stats?.pm10_max >= 100 ? '#eab308' : d.stats?.pm10_max >= 50 ? '#84cc16' : '#22c55e'
                : (_, d) => aqiColor(d.stats?.aqi_max);
            const popupFn = mode === 'pm25'
                ? (n, d) => `<div style="min-width:140px"><b style="font-size:14px">${n}</b><br><span style="color:#94a3b8">${d.province||''}</span><hr style="margin:6px 0;border-color:#333"><div style="display:flex;justify-content:space-between"><span>PM2.5:</span><b style="color:${colorFn(n,d)}">${d.stats?.pm25_max != null ? fmt(d.stats.pm25_max,0) + ' µg/m³' : '-'}</b></div></div>`
                : mode === 'pm10'
                ? (n, d) => `<div style="min-width:140px"><b style="font-size:14px">${n}</b><br><span style="color:#94a3b8">${d.province||''}</span><hr style="margin:6px 0;border-color:#333"><div style="display:flex;justify-content:space-between"><span>PM10:</span><b style="color:${colorFn(n,d)}">${d.stats?.pm10_max != null ? fmt(d.stats.pm10_max,0) + ' µg/m³' : '-'}</b></div></div>`
                : (n, d) => `<div style="min-width:140px"><b style="font-size:14px">${n}</b><br><span style="color:#94a3b8">${d.province||''}</span><hr style="margin:6px 0;border-color:#333"><div style="display:flex;justify-content:space-between"><span>💨 AQI:</span><b style="color:${colorFn(n,d)};font-size:16px">${Math.round(d.stats?.aqi_max||0)}</b></div><div style="display:flex;justify-content:space-between"><span>PM2.5:</span><b>${fmt(d.stats?.pm25_max,0)} µg</b></div></div>`;
            curLayer = addDistrictMarkers(map, a, colorFn, popupFn);
        }
        showAqiLayer('aqi');
        $$('#aqi-map-tabs .tab').forEach(t => t.addEventListener('click', () => {
            $$('#aqi-map-tabs .tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            showAqiLayer(t.dataset.v);
        }));

        // Map style switcher
        const styleSelect = document.getElementById('aqi-map-style');
        if (styleSelect) {
            styleSelect.addEventListener('change', () => switchMapStyle(map, styleSelect.value));
        }

        // ─── AQI Category Doughnut ───
        const catCanvas = document.getElementById('aqi-cat-doughnut');
        if (catCanvas) {
            makeDoughnut(catCanvas.getContext('2d'),
                ['Good', 'Moderate', 'Poor', 'Very Poor', 'Severe'],
                [goodCount, moderateCount, poorCount, aqiVals.filter(v => v >= 150 && v < 200).length, severeCount],
                [C.success, C.yellow, C.warning, C.orange, C.danger]
            );
        }

        // ─── Province AQI Bar ───
        const provCanvas = document.getElementById('aqi-prov-bar');
        if (provCanvas) {
            makeBar(provCanvas.getContext('2d'),
                provAqi.map(p => p.name),
                provAqi.map(p => p.avg),
                provAqi.map(p => aqiColor(p.avg)),
                { barThickness: 20 }
            );
        }

        // ─── PM2.5 Bar Chart ───
        const pm25Top = sorted.filter(([,d]) => d.stats?.pm25_max != null).slice(0, 10);
        const pm25Canvas = document.getElementById('aqi-pm25-bar');
        if (pm25Canvas && pm25Top.length) {
            makeBar(pm25Canvas.getContext('2d'),
                pm25Top.map(([n]) => n.substring(0, 8)),
                pm25Top.map(([,d]) => d.stats.pm25_max || 0),
                pm25Top.map(([,d]) => d.stats.pm25_max >= 100 ? C.danger : d.stats.pm25_max >= 50 ? C.warning : C.yellow),
                { barThickness: 16 }
            );
        }

        // ─── Pollutant Radar ───
        const radarCanvas = document.getElementById('aqi-pollutant-radar');
        if (radarCanvas) {
            const maxPm25 = Math.max(...pm25Vals, 1);
            const maxPm10 = Math.max(...pm10Vals, 1);
            const maxO3 = Math.max(...o3Vals, 1);
            const maxNo2 = Math.max(...no2Vals, 1);
            makeRadar(radarCanvas.getContext('2d'),
                ['PM2.5', 'PM10', 'O₃', 'NO₂'],
                [{
                    label: 'Average',
                    data: [avgPm25, avgPm10, avgO3, avgNo2],
                    borderColor: C.accent,
                    backgroundColor: 'rgba(88,166,255,.15)'
                }, {
                    label: 'Maximum',
                    data: [
                        pm25Vals.length ? Math.max(...pm25Vals) : 0,
                        pm10Vals.length ? Math.max(...pm10Vals) : 0,
                        o3Vals.length ? Math.max(...o3Vals) : 0,
                        no2Vals.length ? Math.max(...no2Vals) : 0
                    ],
                    borderColor: C.danger,
                    backgroundColor: 'rgba(248,81,73,.1)'
                }]
            );
        }

        // ─── Hourly AQI Trend for worst district ───
        const hourlyCanvas = document.getElementById('aqi-hourly-line');
        if (hourlyCanvas && sorted.length) {
            const worst = sorted[0];
            const hourly = worst[1].forecast?.hourly || worst[1].hourly || {};
            const hourlyTimes = hourly.time || [];
            const aqiHourly = hourly.european_aqi || hourly.aqi || [];
            if (hourlyTimes.length && aqiHourly.length) {
                const timeLabels = hourlyTimes.map(t => t.slice(11, 16)); // HH:MM
                makeLine(hourlyCanvas.getContext('2d'),
                    timeLabels,
                    [{
                        label: 'AQI',
                        data: aqiHourly,
                        borderColor: aqiColor(Math.max(...aqiHourly.filter(v => v != null))),
                        backgroundColor: 'rgba(248,81,73,.1)',
                        fill: true
                    }]
                );
            }
        }
    }, 150);
}
