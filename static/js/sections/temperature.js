/* ─── Temperature & Heatwaves Section ──────────────────────── */
function render_temperature(el) {
    const w = weatherData || {};
    const entries = Object.entries(w);

    // Compute national stats
    const temps = entries.map(([,d]) => d.stats?.temp_max_7d).filter(v => v != null);
    const mins = entries.map(([,d]) => d.stats?.temp_min_7d).filter(v => v != null);
    const natMax = temps.length ? Math.max(...temps) : 0;
    const natMin = mins.length ? Math.min(...mins) : 0;
    const natAvg = temps.length ? temps.reduce((a,b)=>a+b,0)/temps.length : 0;
    const heatwaveCount = temps.filter(t => t >= 40).length;
    const extremeHeatCount = temps.filter(t => t >= 48).length;
    const avgHigh = temps.length ? temps.reduce((a,b)=>a+b,0)/temps.length : 0;
    const avgLow = mins.length ? mins.reduce((a,b)=>a+b,0)/mins.length : 0;

    // Province stats
    const provinces = {};
    entries.forEach(([n,d]) => {
        const p = d.province || 'Unknown';
        if (!provinces[p]) provinces[p] = { temps: [], names: [], count: 0 };
        provinces[p].temps.push(d.stats?.temp_max_7d || 0);
        provinces[p].names.push(n);
        provinces[p].count++;
    });
    const provAvgs = Object.entries(provinces).map(([p, v]) => ({
        name: p,
        avg: v.temps.reduce((a,b)=>a+b,0)/v.temps.length,
        max: Math.max(...v.temps),
        count: v.count
    })).sort((a,b) => b.avg - a.avg);

    // Heat alerts
    const heatAlerts = (alertsData||[]).filter(a => a.type === 'heatwave' || a.type === 'extreme_heat');

    // Sorted by temp desc for table
    const sorted = entries.sort((a,b) => (b[1].stats?.temp_max_7d||0) - (a[1].stats?.temp_max_7d||0));

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>🌡 Temperature & Heatwaves</h2>
        <p>7-day temperature analysis — extremes, heatwaves, and spatial patterns across Pakistan</p>
        <div class="hdr-meta">
            <span>📊 ${entries.length} districts monitored</span>
            <span>🔥 ${heatwaveCount} districts above 40°C</span>
            <span>⚠ ${extremeHeatCount} extreme heat districts</span>
        </div>
    </div>

    <!-- Key Metrics -->
    <div class="card-grid g4">
        <div class="stat-card s-red"><div class="stat-icon">🌡</div>
            <div class="stat-value" style="color:${tempColor(natMax)}">${fmtC(natMax)}</div>
            <div class="stat-label">National Maximum</div>
            <div class="stat-sub">${sorted[0]?sorted[0][0]:'-'}</div>
        </div>
        <div class="stat-card s-blue"><div class="stat-icon">❄</div>
            <div class="stat-value" style="color:${tempColor(natMin)}">${fmtC(natMin)}</div>
            <div class="stat-label">National Minimum</div>
            <div class="stat-sub">Coldest recorded</div>
        </div>
        <div class="stat-card s-orange"><div class="stat-icon">📈</div>
            <div class="stat-value">${fmtC(natAvg)}</div>
            <div class="stat-label">Average High</div>
            <div class="stat-sub">Across all districts</div>
        </div>
        <div class="stat-card s-yellow"><div class="stat-icon">🔥</div>
            <div class="stat-value" style="color:${C.danger}">${heatwaveCount}</div>
            <div class="stat-label">Heatwave Districts</div>
            <div class="stat-sub">Above 40°C threshold</div>
        </div>
    </div>

    <!-- Map + Province Chart -->
    <div class="card-grid g2 mt-3">
        <div class="card">
            <div class="card-header"><h3>🗺 Temperature Distribution Map</h3></div>
            <div class="tabs" id="temp-map-tabs">
                <button class="tab active" data-v="max">Max Temperature</button>
                <button class="tab" data-v="min">Min Temperature</button>
                <button class="tab" data-v="range">Temperature Range</button>
            </div>
            <div id="temp-map" class="map-container"></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>📊 Province Average Temperatures</h3></div>
            <div class="chart-wrap"><canvas id="temp-province-bar"></canvas></div>
            <div style="margin-top:14px">
                <h3 style="margin-bottom:8px">🌡 Heat Index Distribution</h3>
                <div class="chart-wrap" style="height:200px"><canvas id="temp-dist-doughnut"></canvas></div>
            </div>
        </div>
    </div>

    <!-- 7-Day Temperature Trend + Hottest Districts -->
    <div class="card-grid g2 mt-3">
        <div class="card">
            <div class="card-header"><h3>📈 Top 10 Hottest — 7-Day Trend</h3></div>
            <div class="chart-wrap"><canvas id="temp-top10-line"></canvas></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>📊 Temperature Spread by Province</h3></div>
            <div class="chart-wrap"><canvas id="temp-province-radar"></canvas></div>
        </div>
    </div>

    <!-- Heat Alerts + Data Table -->
    <div class="card-grid g2 mt-3">
        <div class="card">
            <div class="card-header"><h3>⚠ Active Heat Alerts (${heatAlerts.length})</h3></div>
            <div class="tbl-scroll" style="max-height:360px">
                <table class="tbl">
                    <thead><tr><th></th><th>District</th><th>Province</th><th>Severity</th><th>Value</th></tr></thead>
                    <tbody>
                    ${heatAlerts.length ? heatAlerts.map(a => `<tr>
                        <td>${a.icon||'🔥'}</td>
                        <td><b>${a.district}</b></td>
                        <td>${a.province||''}</td>
                        <td>${severityBadge(a.severity)}</td>
                        <td style="color:${tempColor(a.value)}">${fmtC(a.value)}</td>
                    </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No active heat alerts ✅</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h3>🌡 Top 20 Hottest Districts</h3></div>
            <div class="tbl-scroll" style="max-height:360px">
                <table class="tbl">
                    <thead><tr><th>#</th><th>District</th><th>Province</th><th>Max</th><th>Min</th><th>Range</th></tr></thead>
                    <tbody>
                    ${sorted.slice(0,20).map(([n,d],i) => {
                        const mx = d.stats?.temp_max_7d||0;
                        const mn = d.stats?.temp_min_7d||0;
                        return `<tr>
                            <td>${i+1}</td>
                            <td><b>${n}</b></td>
                            <td>${d.province||''}</td>
                            <td style="color:${tempColor(mx)}">${fmtC(mx)}</td>
                            <td style="color:${tempColor(mn)}">${fmtC(mn)}</td>
                            <td>${fmt(mx-mn,1)}°C</td>
                        </tr>`;
                    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Detailed Temperature Data -->
    <div class="card mt-3">
        <div class="card-header"><h3>📋 Full District Temperature Data (${entries.length} districts)</h3></div>
        <div class="tbl-scroll" style="max-height:500px">
            <table class="tbl">
                <thead><tr><th>District</th><th>Province</th><th>Max 7d</th><th>Min 7d</th><th>Avg High</th><th>Heatwave?</th><th>Heat Index</th></tr></thead>
                <tbody>
                ${sorted.map(([n,d]) => {
                    const mx = d.stats?.temp_max_7d||0;
                    const mn = d.stats?.temp_min_7d||0;
                    const hi = d.stats?.temp_max_7d && d.stats?.temp_max_7d > 30 ? heatIndex(mx, 40) : null;
                    const isHeatwave = mx >= 40;
                    return `<tr>
                        <td><b>${n}</b></td>
                        <td>${d.province||''}</td>
                        <td style="color:${tempColor(mx)}">${fmtC(mx)}</td>
                        <td style="color:${tempColor(mn)}">${fmtC(mn)}</td>
                        <td>${fmtC((mx+mn)/2)}</td>
                        <td>${isHeatwave ? '<span class="badge b-danger">HEATWAVE</span>' : '<span class="badge b-success">Normal</span>'}</td>
                        <td>${hi ? fmtC(hi) : '-'}</td>
                    </tr>`;
                }).join('')}
                </tbody>
            </table>
        </div>
    </div>`;

    // Initialize charts and map after DOM update
    setTimeout(() => {
        // ─── Map ───
        const map = initFloodReplayMap('temp-map', { zoom: 6 });
        let curLayer = null;
        function showTempLayer(mode) {
            if (curLayer) map.removeLayer(curLayer);
            const colorFn = mode === 'min'
                ? (_, d) => tempColor(d.stats?.temp_min_7d)
                : mode === 'range'
                ? (_, d) => tempColor((d.stats?.temp_max_7d||0) - (d.stats?.temp_min_7d||0))
                : (_, d) => tempColor(d.stats?.temp_max_7d);
            const popupFn = mode === 'min'
                ? (n, d) => `<b>${n}</b><br>${d.province}<br>Min: ${fmtC(d.stats?.temp_min_7d)}<br>Max: ${fmtC(d.stats?.temp_max_7d)}`
                : mode === 'range'
                ? (n, d) => `<b>${n}</b><br>${d.province}<br>Range: ${fmt((d.stats?.temp_max_7d||0)-(d.stats?.temp_min_7d||0),1)}°C<br>Max: ${fmtC(d.stats?.temp_max_7d)}`
                : (n, d) => `<b>${n}</b><br>${d.province}<br>${fmtC(d.stats?.temp_max_7d)}<br>Min: ${fmtC(d.stats?.temp_min_7d)}`;
            curLayer = addDistrictMarkers(map, w, colorFn, popupFn);
        }
        showTempLayer('max');
        $$('#temp-map-tabs .tab').forEach(t => t.addEventListener('click', () => {
            $$('#temp-map-tabs .tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            showTempLayer(t.dataset.v);
        }));

        // ─── Province bar chart ───
        const provCanvas = document.getElementById('temp-province-bar');
        if (provCanvas) {
            makeBar(provCanvas.getContext('2d'),
                provAvgs.map(p => p.name),
                provAvgs.map(p => p.avg),
                provAvgs.map(p => tempColor(p.avg)),
                { barThickness: 24 }
            );
        }

        // ─── Heat distribution doughnut ───
        const heatDist = { 'Extreme (≥48°C)': 0, 'Severe (44-48°C)': 0, 'High (40-44°C)': 0, 'Moderate (35-40°C)': 0, 'Normal (<35°C)': 0 };
        temps.forEach(t => {
            if (t >= 48) heatDist['Extreme (≥48°C)']++;
            else if (t >= 44) heatDist['Severe (44-48°C)']++;
            else if (t >= 40) heatDist['High (40-44°C)']++;
            else if (t >= 35) heatDist['Moderate (35-40°C)']++;
            else heatDist['Normal (<35°C)']++;
        });
        const doughnutCanvas = document.getElementById('temp-dist-doughnut');
        if (doughnutCanvas) {
            makeDoughnut(doughnutCanvas.getContext('2d'),
                Object.keys(heatDist),
                Object.values(heatDist),
                [C.danger, C.orange, C.warning, C.yellow, C.success]
            );
        }

        // ─── Top 10 trend line ───
        const top10 = sorted.slice(0, 10);
        const daily = top10[0]?.[1]?.daily;
        const dayLabels = daily?.time || [];
        const trendCanvas = document.getElementById('temp-top10-line');
        if (trendCanvas && dayLabels.length) {
            const colors = [C.danger, C.orange, C.warning, C.yellow, C.success, C.info, C.accent, C.purple, C.cyan, '#f0883e'];
            makeLine(trendCanvas.getContext('2d'),
                dayLabels.map(d => d.slice(5)),
                top10.map(([n, d], i) => ({
                    label: n.substring(0, 10),
                    data: d.daily?.temperature_2m_max || [],
                    borderColor: colors[i % colors.length]
                }))
            );
        }

        // ─── Radar chart (province comparison) ───
        const radarCanvas = document.getElementById('temp-province-radar');
        if (radarCanvas) {
            const maxVals = provAvgs.map(p => p.max);
            const maxOfMax = Math.max(...maxVals, 1);
            makeRadar(radarCanvas.getContext('2d'),
                provAvgs.map(p => p.name),
                [{
                    label: 'Max Temperature',
                    data: provAvgs.map(p => p.max),
                    borderColor: C.danger,
                    backgroundColor: 'rgba(248,81,73,.15)'
                }, {
                    label: 'Average Temperature',
                    data: provAvgs.map(p => p.avg),
                    borderColor: C.warning,
                    backgroundColor: 'rgba(210,153,34,.15)'
                }]
            );
        }
    }, 150);
}
