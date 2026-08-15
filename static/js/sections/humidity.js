/* ─── Humidity Section ─────────────────────────────────────── */
function render_humidity(el) {
    const w = weatherData || {};
    const entries = Object.entries(w);

    const humidityData = entries.map(([n, d]) => {
        const hourly = d.forecast?.hourly || {};
        const rhVals = (hourly.relative_humidity_2m || []).filter(v => v != null);
        const avg = rhVals.length ? rhVals.reduce((a, b) => a + b, 0) / rhVals.length : 0;
        const max = rhVals.length ? Math.max(...rhVals) : 0;
        const min = rhVals.length ? Math.min(...rhVals) : 0;
        const temp = d.stats?.temp_max_7d || 0;
        const hi = temp > 27 ? heatIndex(temp, avg) : null;
        return { name: n, province: d.province, avg, max, min, temp, heatIndex: hi };
    }).sort((a, b) => b.avg - a.avg);

    const avgNat = humidityData.length ? humidityData.reduce((a, d) => a + d.avg, 0) / humidityData.length : 0;
    const maxNat = humidityData.length ? Math.max(...humidityData.map(d => d.max)) : 0;
    const humidDistricts = humidityData.filter(d => d.avg >= 70).length;
    const dryDistricts = humidityData.filter(d => d.avg < 30).length;
    const dangerousHI = humidityData.filter(d => d.heatIndex != null && d.heatIndex >= 45).length;
    const fogRisk = humidityData.filter(d => d.avg > 85 && d.temp < 20).length;

    const provMap = {};
    humidityData.forEach(d => {
        if (!provMap[d.province]) provMap[d.province] = [];
        provMap[d.province].push(d.avg);
    });
    const provHum = Object.entries(provMap).map(([p, vals]) => ({
        name: p, avg: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length
    })).sort((a, b) => b.avg - a.avg);

    const provHi = {};
    humidityData.forEach(d => {
        if (d.heatIndex != null) {
            if (!provHi[d.province]) provHi[d.province] = [];
            provHi[d.province].push(d.heatIndex);
        }
    });
    const provHiAvg = Object.entries(provHi).map(([p, vals]) => ({
        name: p, avg: vals.reduce((a, b) => a + b, 0) / vals.length
    })).sort((a, b) => b.avg - a.avg);

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>💧 Humidity Monitor</h2>
        <p>Relative humidity analysis, heat index computation, and comfort zones</p>
        <div class="hdr-meta">
            <span>📊 ${entries.length} districts analyzed</span>
            <span>💧 ${humidDistricts} high-humidity districts (≥70%)</span>
            <span>🌫 ${fogRisk} fog risk districts</span>
        </div>
    </div>
    <div class="card-grid g4">
        <div class="stat-card s-blue"><div class="stat-icon">💧</div>
            <div class="stat-value">${fmt(avgNat, 0)}%</div>
            <div class="stat-label">National Average RH</div><div class="stat-sub">Relative humidity</div></div>
        <div class="stat-card s-cyan"><div class="stat-icon">📈</div>
            <div class="stat-value">${fmt(maxNat, 0)}%</div>
            <div class="stat-label">Max Humidity</div>
            <div class="stat-sub">${humidityData[0]?.name || '-'}</div></div>
        <div class="stat-card s-orange"><div class="stat-icon">🌡</div>
            <div class="stat-value" style="color:${C.orange}">${dangerousHI ? fmtC(Math.max(...humidityData.filter(d => d.heatIndex != null).map(d => d.heatIndex))) : '-'}</div>
            <div class="stat-label">Max Heat Index</div><div class="stat-sub">Temp + Humidity</div></div>
        <div class="stat-card s-yellow"><div class="stat-icon">⚠</div>
            <div class="stat-value" style="color:${C.danger}">${dangerousHI}</div>
            <div class="stat-label">Dangerous HI</div><div class="stat-sub">Heat Index ≥ 45°C</div></div>
    </div>
    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">🗺 Humidity Distribution Map</h3>
            <div class="tabs" id="hum-map-tabs">
                <button class="tab active" data-v="rh">Avg Humidity</button>
                <button class="tab" data-v="hi">Heat Index</button>
            </div>
            <div id="hum-map" class="map-container"></div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">📊 Province Humidity Comparison</h3>
            <div class="chart-wrap"><canvas id="hum-prov-bar"></canvas></div>
            <h3 style="margin:14px 0 8px">📊 Humidity Category Distribution</h3>
            <div class="chart-wrap" style="height:180px"><canvas id="hum-doughnut"></canvas></div>
        </div>
    </div>
    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">📈 Humidity 7-Day Trend (Top 10)</h3>
            <div class="chart-wrap"><canvas id="hum-top10-line"></canvas></div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">🌡 Heat Index by Province</h3>
            <div class="chart-wrap"><canvas id="hum-hi-bar"></canvas></div>
        </div>
    </div>
    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">📋 Humidity & Heat Index (Top 20)</h3>
            <div class="tbl-scroll" style="max-height:360px">
                <table class="tbl"><thead><tr><th>#</th><th>District</th><th>Province</th><th>Avg RH</th><th>Max RH</th><th>Temp</th><th>Heat Index</th></tr></thead>
                <tbody>${humidityData.slice(0, 20).map((d, i) => `<tr>
                    <td>${i + 1}</td><td><b>${d.name}</b></td><td>${d.province}</td>
                    <td>${fmt(d.avg, 0)}%</td><td>${fmt(d.max, 0)}%</td>
                    <td style="color:${tempColor(d.temp)}">${fmtC(d.temp)}</td>
                    <td style="color:${d.heatIndex != null && d.heatIndex >= 45 ? C.danger : d.heatIndex >= 40 ? C.warning : C.success}">${d.heatIndex != null ? fmtC(d.heatIndex) : '-'}</td>
                </tr>`).join('')}</tbody></table>
            </div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">📋 Full District Humidity Data</h3>
            <div class="tbl-scroll" style="max-height:360px">
                <table class="tbl"><thead><tr><th>District</th><th>Province</th><th>Avg RH</th><th>Min</th><th>Max</th><th>Comfort</th></tr></thead>
                <tbody>${humidityData.map(d => `<tr>
                    <td><b>${d.name}</b></td><td>${d.province}</td>
                    <td>${fmt(d.avg, 0)}%</td><td>${fmt(d.min, 0)}%</td><td>${fmt(d.max, 0)}%</td>
                    <td>${d.avg >= 70 ? '<span class="badge b-info">Humid</span>' : d.avg >= 40 ? '<span class="badge b-success">Comfortable</span>' : '<span class="badge b-warning">Dry</span>'}</td>
                </tr>`).join('')}</tbody></table>
            </div>
        </div>
    </div>`;

    setTimeout(() => {
        const map = initFloodReplayMap('hum-map', { zoom: 6 });
        let curLayer = null;
        function showHumLayer(mode) {
            if (curLayer) map.removeLayer(curLayer);
            const cf = mode === 'hi'
                ? (_, d) => {
                    const hi = d.stats?.temp_max_7d != null && d.stats.temp_max_7d > 27 ? heatIndex(d.stats.temp_max_7d, 50) : null;
                    return hi != null ? (hi >= 45 ? C.danger : hi >= 40 ? C.warning : C.success) : C.muted;
                }
                : (_, d) => {
                    const hourly = d.forecast?.hourly || {};
                    const rh = (hourly.relative_humidity_2m || []);
                    const avg = rh.length ? rh.reduce((a, b) => a + b, 0) / rh.length : 0;
                    return avg >= 70 ? C.info : avg >= 50 ? C.success : avg >= 30 ? C.yellow : C.warning;
                };
            const pf = mode === 'hi'
                ? (n, d) => {
                    const hi = d.stats?.temp_max_7d != null ? heatIndex(d.stats.temp_max_7d, 50) : null;
                    return `<b>${n}</b><br>Heat Index: ${hi ? fmtC(hi) : '-'}<br>Temp: ${fmtC(d.stats?.temp_max_7d)}`;
                }
                : (n, d) => {
                    const hourly = d.forecast?.hourly || {};
                    const rh = (hourly.relative_humidity_2m || []);
                    const avg = rh.length ? rh.reduce((a, b) => a + b, 0) / rh.length : 0;
                    return `<b>${n}</b><br>Avg RH: ${fmt(avg, 0)}%<br>Temp: ${fmtC(d.stats?.temp_max_7d)}`;
                };
            curLayer = addDistrictMarkers(map, w, cf, pf);
        }
        showHumLayer('rh');
        $$('#hum-map-tabs .tab').forEach(t => t.addEventListener('click', () => {
            $$('#hum-map-tabs .tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active'); showHumLayer(t.dataset.v);
        }));

        const pb = document.getElementById('hum-prov-bar');
        if (pb) makeBar(pb.getContext('2d'), provHum.map(p => p.name), provHum.map(p => p.avg),
            provHum.map(p => p.avg >= 70 ? C.info : p.avg >= 50 ? C.success : C.warning), { barThickness: 20 });

        const dc = document.getElementById('hum-doughnut');
        if (dc) {
            const vH = humidityData.filter(d => d.avg >= 80).length;
            const h = humidityData.filter(d => d.avg >= 60 && d.avg < 80).length;
            const c = humidityData.filter(d => d.avg >= 40 && d.avg < 60).length;
            const dry = humidityData.filter(d => d.avg >= 20 && d.avg < 40).length;
            const arid = humidityData.filter(d => d.avg < 20).length;
            makeDoughnut(dc.getContext('2d'), ['Very Humid', 'Humid', 'Comfortable', 'Dry', 'Arid'],
                [vH, h, c, dry, arid], [C.info, C.accent, C.success, C.yellow, C.warning]);
        }

        const top10 = humidityData.slice(0, 10);
        const tc = document.getElementById('hum-top10-line');
        const dayLabels = w[top10[0]?.name]?.forecast?.daily?.time || [];
        if (tc && dayLabels.length) {
            const cols = [C.info, C.accent, C.cyan, C.danger, C.orange, C.warning, C.success, C.purple, '#f0883e', '#e3b341'];
            makeLine(tc.getContext('2d'), dayLabels.map(d => d.slice(5)),
                top10.map((d, i) => {
                    const hourly = w[d.name]?.forecast?.hourly || {};
                    const rh = hourly.relative_humidity_2m || [];
                    const dailyAvg = [];
                    for (let day = 0; day < 7; day++) {
                        const slice = rh.slice(day * 24, (day + 1) * 24);
                        dailyAvg.push(slice.length ? Math.round(slice.reduce((a, b) => a + b, 0) / slice.length) : 0);
                    }
                    return { label: d.name.substring(0, 10), data: dailyAvg, borderColor: cols[i] };
                })
            );
        }

        const hb = document.getElementById('hum-hi-bar');
        if (hb && provHiAvg.length) {
            makeBar(hb.getContext('2d'), provHiAvg.map(p => p.name), provHiAvg.map(p => p.avg),
                provHiAvg.map(p => p.avg >= 45 ? C.danger : p.avg >= 40 ? C.warning : C.success), { barThickness: 20 });
        }
    }, 150);
}
