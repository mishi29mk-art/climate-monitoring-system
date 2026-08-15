/* ─── Wind Patterns Section ────────────────────────────────── */
function render_wind(el) {
    const w = weatherData || {};
    const entries = Object.entries(w);

    const windData = entries.map(([n, d]) => ({
        name: n, province: d.province, wind: d.stats?.wind_max_7d || 0,
        gusts: d.stats?.gusts_max_7d || 0, stats: d.stats
    })).sort((a, b) => b.wind - a.wind);

    const maxWind = windData.length ? windData[0].wind : 0;
    const avgWind = windData.length ? windData.reduce((a, b) => a + b.wind, 0) / windData.length : 0;
    const maxGust = windData.length ? Math.max(...windData.map(d => d.gusts)) : 0;
    const windyDistricts = windData.filter(d => d.wind >= 40).length;
    const stormDistricts = windData.filter(d => d.gusts >= 60).length;

    const provMap = {};
    windData.forEach(d => {
        if (!provMap[d.province]) provMap[d.province] = [];
        provMap[d.province].push(d);
    });
    const provWind = Object.entries(provMap).map(([p, ds]) => ({
        name: p, avg: ds.reduce((a, d) => a + d.wind, 0) / ds.length,
        max: Math.max(...ds.map(d => d.wind)), count: ds.length
    })).sort((a, b) => b.avg - a.avg);

    const windAlerts = (alertsData || []).filter(a => a.type === 'wind');

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>🌬 Wind Patterns</h2>
        <p>7-day wind speed, gust analysis, and storm risk across Pakistan</p>
        <div class="hdr-meta">
            <span>📊 ${entries.length} districts monitored</span>
            <span>💨 ${windyDistricts} high-wind districts</span>
            <span>🌪 ${stormDistricts} storm-gust districts</span>
        </div>
    </div>
    <div class="card-grid g4">
        <div class="stat-card s-orange"><div class="stat-icon">💨</div>
            <div class="stat-value" style="color:${windColor(maxWind)}">${fmt(maxWind, 0)} km/h</div>
            <div class="stat-label">Max Wind Speed</div>
            <div class="stat-sub">${windData[0]?.name || '-'}</div></div>
        <div class="stat-card s-red"><div class="stat-icon">🌪</div>
            <div class="stat-value" style="color:${windColor(maxGust)}">${fmt(maxGust, 0)} km/h</div>
            <div class="stat-label">Max Gust Speed</div><div class="stat-sub">Peak gust</div></div>
        <div class="stat-card s-blue"><div class="stat-icon">📊</div>
            <div class="stat-value">${fmt(avgWind, 0)} km/h</div>
            <div class="stat-label">Average Wind</div><div class="stat-sub">All districts</div></div>
        <div class="stat-card s-yellow"><div class="stat-icon">⚠</div>
            <div class="stat-value" style="color:${C.danger}">${stormDistricts}</div>
            <div class="stat-label">Storm Risk</div><div class="stat-sub">Gusts ≥ 60 km/h</div></div>
    </div>
    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">🗺 Wind Speed Distribution Map</h3>
            <div class="tabs" id="wind-map-tabs">
                <button class="tab active" data-v="wind">Wind Speed</button>
                <button class="tab" data-v="gust">Gust Speed</button>
            </div>
            <div id="wind-map" class="map-container"></div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">📊 Province Wind Comparison</h3>
            <div class="chart-wrap"><canvas id="wind-prov-bar"></canvas></div>
            <h3 style="margin:14px 0 8px">💨 Wind vs Gust Scatter</h3>
            <div class="chart-wrap" style="height:180px"><canvas id="wind-scatter"></canvas></div>
        </div>
    </div>
    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">📈 Top 10 Windiest — 7-Day Trend</h3>
            <div class="chart-wrap"><canvas id="wind-top10-line"></canvas></div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">🌀 Wind Direction Distribution</h3>
            <div class="chart-wrap"><canvas id="wind-rose"></canvas></div>
        </div>
    </div>
    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">🚨 Wind Alerts (${windAlerts.length})</h3>
            <div class="tbl-scroll" style="max-height:300px">
                <table class="tbl"><thead><tr><th></th><th>District</th><th>Severity</th><th>Gust (km/h)</th></tr></thead>
                <tbody>${windAlerts.length ? windAlerts.map(a => `<tr>
                    <td>${a.icon||'💨'}</td><td><b>${a.district}</b></td>
                    <td>${severityBadge(a.severity)}</td>
                    <td style="color:${windColor(a.value)}">${fmt(a.value, 0)}</td>
                </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No wind alerts ✅</td></tr>'}</tbody></table>
            </div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">📋 District Wind Data (Top 20)</h3>
            <div class="tbl-scroll" style="max-height:300px">
                <table class="tbl"><thead><tr><th>District</th><th>Province</th><th>Wind</th><th>Gusts</th><th>Direction</th><th>Status</th></tr></thead>
                <tbody>${windData.slice(0, 20).map(d => {
                    const daily = w[d.name]?.forecast?.daily || {};
                    const dirs = daily?.wind_direction_10m_dominant;
                    const dir = dirs && dirs.length ? directionName(dirs[0]) : '-';
                    return `<tr><td><b>${d.name}</b></td><td>${d.province}</td>
                        <td style="color:${windColor(d.wind)}">${fmt(d.wind, 0)} km/h</td>
                        <td style="color:${windColor(d.gusts)}">${fmt(d.gusts, 0)} km/h</td>
                        <td>${dir}</td>
                        <td>${d.wind >= 60 ? '<span class="badge b-danger">Storm</span>' : d.wind >= 40 ? '<span class="badge b-warning">Strong</span>' : '<span class="badge b-success">Normal</span>'}</td>
                    </tr>`;
                }).join('')}</tbody></table>
            </div>
        </div>
    </div>`;

    setTimeout(() => {
        const map = initFloodReplayMap('wind-map', { zoom: 6 });
        let curLayer = null;
        function showWindLayer(mode) {
            if (curLayer) map.removeLayer(curLayer);
            const cf = mode === 'gust' ? (_, d) => windColor(d.stats?.gusts_max_7d) : (_, d) => windColor(d.stats?.wind_max_7d);
            const pf = mode === 'gust'
                ? (n, d) => `<b>${n}</b><br>Gusts: ${fmt(d.stats?.gusts_max_7d, 0)} km/h<br>Wind: ${fmt(d.stats?.wind_max_7d, 0)} km/h`
                : (n, d) => `<b>${n}</b><br>Wind: ${fmt(d.stats?.wind_max_7d, 0)} km/h<br>Gusts: ${fmt(d.stats?.gusts_max_7d, 0)} km/h`;
            curLayer = addDistrictMarkers(map, w, cf, pf);
        }
        showWindLayer('wind');
        $$('#wind-map-tabs .tab').forEach(t => t.addEventListener('click', () => {
            $$('#wind-map-tabs .tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active'); showWindLayer(t.dataset.v);
        }));

        const pb = document.getElementById('wind-prov-bar');
        if (pb) makeBar(pb.getContext('2d'), provWind.map(p => p.name), provWind.map(p => p.avg),
            provWind.map(p => windColor(p.avg)), { barThickness: 20 });

        const sc = document.getElementById('wind-scatter');
        if (sc) makeScatter(sc.getContext('2d'), windData.filter(d => d.wind > 0).map(d => ({ x: d.wind, y: d.gusts })));

        const top10 = windData.slice(0, 10);
        const tc = document.getElementById('wind-top10-line');
        const dayLabels = w[top10[0]?.name]?.forecast?.daily?.time || [];
        if (tc && dayLabels.length) {
            const cols = [C.danger, C.orange, C.warning, C.yellow, C.success, C.info, C.accent, C.purple, C.cyan, '#f0883e'];
            makeLine(tc.getContext('2d'), dayLabels.map(d => d.slice(5)),
                top10.map((d, i) => ({ label: d.name.substring(0, 10), data: w[d.name]?.forecast?.daily?.wind_speed_10m_max || [], borderColor: cols[i] })));
        }

        const wr = document.getElementById('wind-rose');
        if (wr) {
            const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            const dirCounts = new Array(8).fill(0);
            entries.forEach(([, d]) => {
                const dd = d.forecast?.daily?.wind_direction_10m_dominant;
                if (dd && dd.length) dirCounts[Math.round(dd[0] / 45) % 8]++;
            });
            makeRadar(wr.getContext('2d'), dirs, [{ label: 'Frequency', data: dirCounts, borderColor: C.cyan, backgroundColor: 'rgba(57,210,192,.15)' }]);
        }
    }, 150);
}
