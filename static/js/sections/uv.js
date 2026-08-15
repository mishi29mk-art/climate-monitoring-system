/* ─── UV Index Section ─────────────────────────────────────── */
function render_uv(el) {
    const w = weatherData || {};
    const entries = Object.entries(w);

    // UV stats
    const uvData = entries.map(([n, d]) => ({
        name: n, province: d.province, uv: d.stats?.uv_max_7d || 0, stats: d.stats
    })).sort((a, b) => b.uv - a.uv);

    const maxUv = uvData.length ? uvData[0].uv : 0;
    const avgUv = uvData.length ? uvData.reduce((a, b) => a + b.uv, 0) / uvData.length : 0;
    const extremeUv = uvData.filter(d => d.uv >= 11).length;
    const veryHighUv = uvData.filter(d => d.uv >= 8 && d.uv < 11).length;
    const highUv = uvData.filter(d => d.uv >= 6 && d.uv < 8).length;
    const moderateUv = uvData.filter(d => d.uv >= 3 && d.uv < 6).length;
    const lowUv = uvData.filter(d => d.uv < 3).length;

    // Province UV averages
    const provMap = {};
    uvData.forEach(d => {
        if (!provMap[d.province]) provMap[d.province] = [];
        provMap[d.province].push(d.uv);
    });
    const provUv = Object.entries(provMap).map(([p, vals]) => ({
        name: p, avg: vals.reduce((a, b) => a + b, 0) / vals.length,
        max: Math.max(...vals), count: vals.length
    })).sort((a, b) => b.avg - a.avg);

    // UV alerts
    const uvAlerts = (alertsData || []).filter(a => a.type === 'uv');

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>☀ UV Index Monitor</h2>
        <p>7-day UV radiation analysis — exposure risk classification across Pakistan</p>
        <div class="hdr-meta">
            <span>📊 ${entries.length} districts analyzed</span>
            <span>🔴 ${extremeUv} extreme UV districts</span>
            <span>🟠 ${veryHighUv} very high UV districts</span>
        </div>
    </div>
    <div class="card-grid g4">
        <div class="stat-card s-red"><div class="stat-icon">☀</div>
            <div class="stat-value" style="color:${uvColor(maxUv)}">${fmt(maxUv, 1)}</div>
            <div class="stat-label">Max UV Index</div>
            <div class="stat-sub">${uvData[0]?.name || '-'}</div></div>
        <div class="stat-card s-orange"><div class="stat-icon">📊</div>
            <div class="stat-value">${fmt(avgUv, 1)}</div>
            <div class="stat-label">Average UV</div><div class="stat-sub">All districts</div></div>
        <div class="stat-card s-yellow"><div class="stat-icon">⚠</div>
            <div class="stat-value" style="color:${C.danger}">${extremeUv}</div>
            <div class="stat-label">Extreme UV (≥11)</div><div class="stat-sub">Avoid sun exposure</div></div>
        <div class="stat-card s-cyan"><div class="stat-icon">🧴</div>
            <div class="stat-value">${veryHighUv + extremeUv}</div>
            <div class="stat-label">Very High+ Districts</div><div class="stat-sub">UV ≥ 8</div></div>
    </div>
    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">🗺 UV Index Distribution Map</h3>
            <div id="uv-map" class="map-container"></div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">📊 UV Category Breakdown</h3>
            <div class="chart-wrap"><canvas id="uv-doughnut"></canvas></div>
            <h3 style="margin:14px 0 8px">📊 Province Average UV</h3>
            <div class="chart-wrap" style="height:180px"><canvas id="uv-prov-bar"></canvas></div>
        </div>
    </div>
    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">📈 Top 10 Highest UV — 7-Day Trend</h3>
            <div class="chart-wrap"><canvas id="uv-top10-line"></canvas></div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">☀ UV Risk Radar by Province</h3>
            <div class="chart-wrap"><canvas id="uv-radar"></canvas></div>
        </div>
    </div>
    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">🚨 UV Alerts (${uvAlerts.length})</h3>
            <div class="tbl-scroll" style="max-height:300px">
                <table class="tbl"><thead><tr><th></th><th>District</th><th>Province</th><th>Severity</th><th>UV Index</th></tr></thead>
                <tbody>${uvAlerts.length ? uvAlerts.map(a => `<tr>
                    <td>${a.icon||'☀'}</td><td><b>${a.district}</b></td><td>${a.province||''}</td>
                    <td>${severityBadge(a.severity)}</td>
                    <td style="color:${uvColor(a.value)}"><b>${fmt(a.value, 1)}</b></td>
                </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No UV alerts ✅</td></tr>'}</tbody></table>
            </div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">📋 UV Index Data (Top 20)</h3>
            <div class="tbl-scroll" style="max-height:300px">
                <table class="tbl"><thead><tr><th>#</th><th>District</th><th>Province</th><th>UV Max</th><th>Risk Level</th></tr></thead>
                <tbody>${uvData.slice(0, 20).map((d, i) => `<tr>
                    <td>${i + 1}</td><td><b>${d.name}</b></td><td>${d.province}</td>
                    <td style="color:${uvColor(d.uv)}"><b>${fmt(d.uv, 1)}</b></td>
                    <td>${d.uv >= 11 ? '<span class="badge b-danger">Extreme</span>' : d.uv >= 8 ? '<span class="badge b-orange">Very High</span>' : d.uv >= 6 ? '<span class="badge b-yellow">High</span>' : '<span class="badge b-success">Moderate</span>'}</td>
                </tr>`).join('')}</tbody></table>
            </div>
        </div>
    </div>`;

    setTimeout(() => {
        // Map
        const map = initFloodReplayMap('uv-map', { zoom: 6 });
        addDistrictMarkers(map, w, (_, d) => uvColor(d.stats?.uv_max_7d),
            (n, d) => `<b>${n}</b><br>${d.province}<br>UV: ${fmt(d.stats?.uv_max_7d, 1)}<br>Radiation: ${fmt(d.forecast?.daily?.shortwave_radiation_sum?.[0] || 0, 0)} MJ/m²`);
        // Doughnut
        const dc = document.getElementById('uv-doughnut');
        if (dc) makeDoughnut(dc.getContext('2d'),
            ['Extreme (≥11)', 'Very High (8-11)', 'High (6-8)', 'Moderate (3-6)', 'Low (<3)'],
            [extremeUv, veryHighUv, highUv, moderateUv, lowUv],
            [C.danger, C.orange, C.warning, C.yellow, C.success]
        );
        // Province bar
        const pb = document.getElementById('uv-prov-bar');
        if (pb) makeBar(pb.getContext('2d'), provUv.map(p => p.name), provUv.map(p => p.avg),
            provUv.map(p => uvColor(p.avg)), { barThickness: 20 });
        // Trend
        const top10 = uvData.slice(0, 10);
        const tc = document.getElementById('uv-top10-line');
        const dayLabels = w[top10[0]?.name]?.forecast?.daily?.time || [];
        if (tc && dayLabels.length) {
            const cols = [C.danger, C.orange, C.warning, C.yellow, C.success, C.info, C.accent, C.purple, C.cyan, '#f0883e'];
            makeLine(tc.getContext('2d'), dayLabels.map(d => d.slice(5)),
                top10.map((d, i) => ({ label: d.name.substring(0, 10), data: w[d.name]?.forecast?.daily?.uv_index_max || [], borderColor: cols[i] })));
        }
        // Radar
        const rd = document.getElementById('uv-radar');
        if (rd) makeRadar(rd.getContext('2d'), provUv.map(p => p.name),
            [{ label: 'Avg UV', data: provUv.map(p => p.avg), borderColor: C.orange, backgroundColor: 'rgba(240,136,62,.15)' },
             { label: 'Max UV', data: provUv.map(p => p.max), borderColor: C.danger, backgroundColor: 'rgba(248,81,73,.1)' }]);
    }, 150);
}
