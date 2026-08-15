/* ─── Precipitation Section ────────────────────────────────── */
function render_precipitation(el) {
    const w = weatherData || {};
    const entries = Object.entries(w);
    const rivers = riverData || {};

    // Compute national stats
    const rainTotals = entries.map(([,d]) => d.stats?.rain_total_7d || 0);
    const rainMaxDaily = entries.map(([,d]) => d.stats?.rain_max_daily || 0);
    const totalNational = rainTotals.reduce((a,b) => a+b, 0);
    const wettestDistrict = entries.length ? entries.reduce((a,b) => (b[1].stats?.rain_total_7d||0) > (a[1].stats?.rain_total_7d||0) ? b : a) : null;
    const wettestTotal = wettestDistrict ? wettestDistrict[1].stats?.rain_total_7d || 0 : 0;
    const avgRain = entries.length ? totalNational / entries.length : 0;
    const rainyDistricts = entries.filter(([,d]) => (d.stats?.rain_total_7d||0) > 10).length;
    const dryDistricts = entries.filter(([,d]) => (d.stats?.rain_total_7d||0) < 1).length;
    const maxDailyNational = rainMaxDaily.length ? Math.max(...rainMaxDaily) : 0;

    // Province rain stats
    const provinces = {};
    entries.forEach(([n,d]) => {
        const p = d.province || 'Unknown';
        if (!provinces[p]) provinces[p] = { rains: [], totals: [], count: 0 };
        provinces[p].totals.push(d.stats?.rain_total_7d || 0);
        provinces[p].rains.push(d.stats?.rain_max_daily || 0);
        provinces[p].count++;
    });
    const provRain = Object.entries(provinces).map(([p, v]) => ({
        name: p,
        total: v.totals.reduce((a,b)=>a+b,0),
        avg: v.totals.reduce((a,b)=>a+b,0)/v.totals.length,
        max: Math.max(...v.totals),
        count: v.count
    })).sort((a,b) => b.avg - a.avg);

    // Sorted entries
    const sorted = entries.sort((a,b) => (b[1].stats?.rain_total_7d||0) - (a[1].stats?.rain_total_7d||0));

    // Rain alerts
    const rainAlerts = (alertsData||[]).filter(a => a.type === 'heavy_rain');

    // River stations data
    const riverStations = rivers.stations || [];

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>🌧 Precipitation Monitor</h2>
        <p>7-day rainfall analysis — totals, daily max, spatial distribution across Pakistan</p>
        <div class="hdr-meta">
            <span>📊 ${entries.length} districts monitored</span>
            <span>🌧 ${rainyDistricts} districts with significant rainfall</span>
            <span>☀ ${dryDistricts} dry districts</span>
        </div>
    </div>

    <!-- Key Metrics -->
    <div class="card-grid g4">
        <div class="stat-card s-blue"><div class="stat-icon">🌧</div>
            <div class="stat-value" style="color:${rainColor(wettestTotal)}">${fmtMm(wettestTotal)}</div>
            <div class="stat-label">Wettest District</div>
            <div class="stat-sub">${wettestDistrict?wettestDistrict[0]:'-'}</div>
        </div>
        <div class="stat-card s-cyan"><div class="stat-icon">📊</div>
            <div class="stat-value">${fmtMm(avgRain)}</div>
            <div class="stat-label">National Average</div>
            <div class="stat-sub">7-day total per district</div>
        </div>
        <div class="stat-card s-orange"><div class="stat-icon">⚡</div>
            <div class="stat-value" style="color:${rainColor(maxDailyNational)}">${fmtMm(maxDailyNational)}</div>
            <div class="stat-label">Max Daily Rainfall</div>
            <div class="stat-sub">Heaviest single day</div>
        </div>
        <div class="stat-card s-green"><div class="stat-icon">☀</div>
            <div class="stat-value">${dryDistricts}</div>
            <div class="stat-label">Dry Districts</div>
            <div class="stat-sub">&lt; 1mm in 7 days</div>
        </div>
    </div>

    <!-- Map + Province Chart -->
    <div class="card-grid g2 mt-3">
        <div class="card">
            <div class="card-header"><h3>🗺 Rainfall Distribution Map</h3></div>
            <div class="tabs" id="rain-map-tabs">
                <button class="tab active" data-v="total">7-Day Total</button>
                <button class="tab" data-v="daily">Max Daily</button>
                <button class="tab" data-v="prob">Probability</button>
            </div>
            <div id="rain-map" class="map-container"></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>📊 Province Rainfall Comparison</h3></div>
            <div class="chart-wrap"><canvas id="rain-prov-bar"></canvas></div>
            <div style="margin-top:14px">
                <h3 style="margin-bottom:8px">🌧 Rainfall Distribution</h3>
                <div class="chart-wrap" style="height:180px"><canvas id="rain-dist-doughnut"></canvas></div>
            </div>
        </div>
    </div>

    <!-- Rainfall Trends + River Status -->
    <div class="card-grid g2 mt-3">
        <div class="card">
            <div class="card-header"><h3>📈 Top 10 Wettest — 7-Day Trend</h3></div>
            <div class="chart-wrap"><canvas id="rain-top10-line"></canvas></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>🌊 River Discharge Impact</h3></div>
            <div class="chart-wrap"><canvas id="rain-river-bar"></canvas></div>
            ${riverStations.length ? `
            <div style="margin-top:12px">
                <table class="tbl">
                    <thead><tr><th>Station</th><th>River</th><th>Discharge</th><th>Category</th></tr></thead>
                    <tbody>
                    ${riverStations.slice(0,8).map(s => `<tr>
                        <td><b>${s.name}</b></td>
                        <td>${s.river||''}</td>
                        <td>${fmtCusecs(s.discharge)}</td>
                        <td>${categoryBadge(s.category)}</td>
                    </tr>`).join('')}
                    </tbody>
                </table>
            </div>` : ''}
        </div>
    </div>

    <!-- Alerts + Table -->
    <div class="card-grid g2 mt-3">
        <div class="card">
            <div class="card-header"><h3>🚨 Rainfall Alerts (${rainAlerts.length})</h3></div>
            <div class="tbl-scroll" style="max-height:360px">
                <table class="tbl">
                    <thead><tr><th></th><th>District</th><th>Province</th><th>Severity</th><th>Rainfall</th></tr></thead>
                    <tbody>
                    ${rainAlerts.length ? rainAlerts.map(a => `<tr>
                        <td>${a.icon||'🌧'}</td>
                        <td><b>${a.district}</b></td>
                        <td>${a.province||''}</td>
                        <td>${severityBadge(a.severity)}</td>
                        <td style="color:${rainColor(a.value)}">${fmtMm(a.value)}</td>
                    </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No active rainfall alerts ✅</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h3>📋 District Rainfall Data (${entries.length})</h3></div>
            <div class="tbl-scroll" style="max-height:360px">
                <table class="tbl">
                    <thead><tr><th>District</th><th>Province</th><th>7d Total</th><th>Max Daily</th><th>Status</th></tr></thead>
                    <tbody>
                    ${sorted.slice(0,25).map(([n,d]) => {
                        const total = d.stats?.rain_total_7d || 0;
                        const daily = d.stats?.rain_max_daily || 0;
                        return `<tr>
                            <td><b>${n}</b></td>
                            <td>${d.province||''}</td>
                            <td style="color:${rainColor(total)}">${fmtMm(total)}</td>
                            <td>${fmtMm(daily)}</td>
                            <td>${total >= 50 ? '<span class="badge b-danger">Heavy</span>' : total >= 25 ? '<span class="badge b-warning">Moderate</span>' : total >= 10 ? '<span class="badge b-yellow">Light</span>' : '<span class="badge b-success">Dry</span>'}</td>
                        </tr>`;
                    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Full Data Table -->
    <div class="card mt-3">
        <div class="card-header"><h3>📋 Full Precipitation Data</h3></div>
        <div class="tbl-scroll" style="max-height:400px">
            <table class="tbl">
                <thead><tr><th>#</th><th>District</th><th>Province</th><th>7-Day Total</th><th>Max Daily</th><th>Prob. Max</th><th>Precip Hours</th></tr></thead>
                <tbody>
                ${sorted.map(([n,d], i) => {
                    const daily = d.forecast?.daily || {};
                    const probMax = daily?.precipitation_probability_max;
                    const precipHours = daily?.precipitation_hours;
                    return `<tr>
                        <td>${i+1}</td>
                        <td><b>${n}</b></td>
                        <td>${d.province||''}</td>
                        <td style="color:${rainColor(d.stats?.rain_total_7d)}">${fmtMm(d.stats?.rain_total_7d)}</td>
                        <td>${fmtMm(d.stats?.rain_max_daily)}</td>
                        <td>${probMax && probMax.length ? Math.max(...probMax) + '%' : '-'}</td>
                        <td>${precipHours && precipHours.length ? Math.round(precipHours.reduce((a,b)=>a+b,0)) + 'h' : '-'}</td>
                    </tr>`;
                }).join('')}
                </tbody>
            </table>
        </div>
    </div>`;

    // Initialize charts and map
    setTimeout(() => {
        // ─── Rain Map ───
        const map = initFloodReplayMap('rain-map', { zoom: 6 });
        let curLayer = null;
        function showRainLayer(mode) {
            if (curLayer) map.removeLayer(curLayer);
            const colorFn = mode === 'daily'
                ? (_, d) => rainColor(d.stats?.rain_max_daily)
                : mode === 'prob'
                ? (_, d) => {
                    const prob = d.forecast?.daily?.precipitation_probability_max;
                    if (!prob || !prob.length) return C.success;
                    const maxP = Math.max(...prob);
                    return maxP >= 80 ? C.danger : maxP >= 50 ? C.warning : maxP >= 25 ? C.yellow : C.success;
                }
                : (_, d) => rainColor(d.stats?.rain_total_7d);
            const popupFn = mode === 'daily'
                ? (n, d) => `<b>${n}</b><br>${d.province}<br>Max daily: ${fmtMm(d.stats?.rain_max_daily)}<br>7d total: ${fmtMm(d.stats?.rain_total_7d)}`
                : mode === 'prob'
                ? (n, d) => {
                    const prob = d.forecast?.daily?.precipitation_probability_max;
                    const maxP = prob && prob.length ? Math.max(...prob) : 0;
                    return `<b>${n}</b><br>Max probability: ${maxP}%<br>7d total: ${fmtMm(d.stats?.rain_total_7d)}`;
                }
                : (n, d) => `<b>${n}</b><br>${d.province}<br>7d: ${fmtMm(d.stats?.rain_total_7d)}<br>Daily max: ${fmtMm(d.stats?.rain_max_daily)}`;
            curLayer = addDistrictMarkers(map, w, colorFn, popupFn);
        }
        showRainLayer('total');
        $$('#rain-map-tabs .tab').forEach(t => t.addEventListener('click', () => {
            $$('#rain-map-tabs .tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            showRainLayer(t.dataset.v);
        }));

        // ─── Province Rain Bar ───
        const provCanvas = document.getElementById('rain-prov-bar');
        if (provCanvas) {
            makeBar(provCanvas.getContext('2d'),
                provRain.map(p => p.name),
                provRain.map(p => p.avg),
                provRain.map(p => rainColor(p.avg)),
                { barThickness: 20 }
            );
        }

        // ─── Rain Distribution Doughnut ───
        const distCanvas = document.getElementById('rain-dist-doughnut');
        if (distCanvas) {
            const dry = entries.filter(([,d]) => (d.stats?.rain_total_7d||0) < 1).length;
            const light = entries.filter(([,d]) => { const r = d.stats?.rain_total_7d||0; return r >= 1 && r < 10; }).length;
            const moderate = entries.filter(([,d]) => { const r = d.stats?.rain_total_7d||0; return r >= 10 && r < 25; }).length;
            const heavy = entries.filter(([,d]) => { const r = d.stats?.rain_total_7d||0; return r >= 25 && r < 50; }).length;
            const extreme = entries.filter(([,d]) => (d.stats?.rain_total_7d||0) >= 50).length;
            makeDoughnut(distCanvas.getContext('2d'),
                ['Dry (<1mm)', 'Light (1-10mm)', 'Moderate (10-25mm)', 'Heavy (25-50mm)', 'Extreme (>50mm)'],
                [dry, light, moderate, heavy, extreme],
                [C.success, C.yellow, C.info, C.warning, C.danger]
            );
        }

        // ─── Top 10 Rain Trend ───
        const top10 = sorted.filter(([,d]) => (d.stats?.rain_total_7d||0) > 0).slice(0, 10);
        const trendCanvas = document.getElementById('rain-top10-line');
        if (trendCanvas && top10.length) {
            const daily0 = top10[0]?.[1]?.forecast?.daily;
            const dayLabels = daily0?.time || [];
            if (dayLabels.length) {
                const colors = [C.info, C.accent, C.cyan, C.danger, C.orange, C.warning, C.success, C.purple, '#f0883e', '#e3b341'];
                makeLine(trendCanvas.getContext('2d'),
                    dayLabels.map(d => d.slice(5)),
                    top10.map(([n, d], i) => ({
                        label: n.substring(0, 10),
                        data: d.forecast?.daily?.precipitation_sum || [],
                        borderColor: colors[i % colors.length]
                    }))
                );
            }
        }

        // ─── River Bar Chart ───
        const riverCanvas = document.getElementById('rain-river-bar');
        if (riverCanvas && riverStations.length) {
            const topRivers = riverStations.sort((a,b) => (b.discharge||0) - (a.discharge||0)).slice(0, 10);
            makeHBar(riverCanvas.getContext('2d'),
                topRivers.map(s => s.name),
                topRivers.map(s => s.discharge/1000),
                topRivers.map(s => s.category === 'Extreme' ? C.danger : s.category === 'Very High' ? C.orange : s.category === 'High' ? C.warning : C.success)
            );
        }
    }, 150);
}
