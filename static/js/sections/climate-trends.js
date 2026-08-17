/* ─── Climate Trends Section ──────────────────────────────── */
function render_climate_trends(el) {
    const entries = Object.entries(weatherData || {});
    // Pakistan normals (approximate seasonal averages for July-Aug)
    const NORMALS = {
        tempMax: 38, tempMin: 26, rainMonth: 60, humidity: 55
    };

    // Compute anomalies per district
    const trends = entries.map(([name, d]) => {
        const stats = d.stats || {};
        const tempMax = stats.temp_max_7d || 0;
        const tempMin = stats.temp_min_7d || 0;
        const rain = stats.rain_total_7d || 0;
        const wind = stats.wind_max_7d || 0;
        const uv = stats.uv_max_7d || 0;
        const humid = d.daily?.relative_humidity_2m_max?.[0] || stats.humidity_avg || 50;
        const tempAnomaly = tempMax - NORMALS.tempMax;
        const rainAnomaly = rain - NORMALS.rainMonth;
        return {
            name, province: d.province, lat: d.lat, lng: d.lng,
            tempMax, tempMin, rain, wind, uv, humidity: humid,
            tempAnomaly, rainAnomaly,
            isAboveNormal: tempAnomaly > 2,
            isDrought: rainAnomaly < -20,
            isFlooding: rainAnomaly > 30
        };
    }).sort((a, b) => b.tempAnomaly - a.tempAnomaly);

    const aboveNormal = trends.filter(t => t.isAboveNormal);
    const droughtRisk = trends.filter(t => t.isDrought);
    const floodRisk = trends.filter(t => t.isFlooding);

    // Province averages
    const provMap = {};
    trends.forEach(t => {
        const p = t.province || 'Unknown';
        if (!provMap[p]) provMap[p] = { temps: [], rains: [], items: [] };
        provMap[p].temps.push(t.tempMax);
        provMap[p].rains.push(t.rain);
        provMap[p].items.push(t);
    });
    const provAvgs = Object.entries(provMap).map(([p, d]) => ({
        province: p,
        avgTemp: d.temps.reduce((a, b) => a + b, 0) / d.temps.length,
        avgRain: d.rains.reduce((a, b) => a + b, 0) / d.rains.length,
        count: d.count
    })).sort((a, b) => b.avgTemp - a.avgTemp);

    // Top hottest & coldest
    const topHot = trends.slice(0, 10);
    const topCold = [...trends].sort((a, b) => a.tempMax - b.tempMax).slice(0, 10);
    const topRain = [...trends].sort((a, b) => b.rain - a.rain).slice(0, 10);
    const topDry = [...trends].filter(t => t.rain < 5).sort((a, b) => a.rain - b.rain).slice(0, 10);

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>📈 Climate Trends Analysis</h2>
        <p>Temperature and rainfall anomalies compared to seasonal normals — identifying hotspots, droughts, and flood-prone areas</p>
        <div class="hdr-meta">
            <span>📊 ${trends.length} districts analyzed</span>
            <span>🌡 Normal max: ${NORMALS.tempMax}°C</span>
            <span>🌧 Normal monthly rain: ${NORMALS.rainMonth}mm</span>
        </div>
    </div>

    <div class="card-grid g4">
        <div class="stat-card s-red"><div class="stat-icon">🔥</div><div class="stat-value" style="color:${C.danger}">${aboveNormal.length}</div><div class="stat-label">Above Normal Temp</div><div class="stat-sub">&gt;${NORMALS.tempMax + 2}°C avg</div></div>
        <div class="stat-card s-orange"><div class="stat-icon">🏜</div><div class="stat-value" style="color:${C.orange}">${droughtRisk.length}</div><div class="stat-label">Drought Risk</div><div class="stat-sub">Rain well below normal</div></div>
        <div class="stat-card s-blue"><div class="stat-icon">🌊</div><div class="stat-value" style="color:${C.info}">${floodRisk.length}</div><div class="stat-label">Excess Rainfall</div><div class="stat-sub">Well above normal</div></div>
        <div class="stat-card s-green"><div class="stat-icon">✅</div><div class="stat-value" style="color:${C.success}">${trends.length - aboveNormal.length - droughtRisk.length}</div><div class="stat-label">Within Normal</div><div class="stat-sub">Balanced conditions</div></div>
    </div>

    <div class="card mt-3">
        <div class="card-header"><h3>🗺 Temperature Anomaly Map</h3></div>
        <div class="tabs" id="ct-tabs">
            <button class="tab active" data-v="temp">🌡 Temp Anomaly</button>
            <button class="tab" data-v="rain">🌧 Rain Anomaly</button>
            <button class="tab" data-v="drought">🏜 Drought</button>
            <button class="tab" data-v="heat">🔥 Heat Stress</button>
        </div>
        <div id="ct-map" class="map-container" style="height:420px"></div>
    </div>

    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">📊 Temperature Anomaly by District</h3>
            <div style="height:220px"><canvas id="ct-temp-bar"></canvas></div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">📊 Rainfall vs Normal by District</h3>
            <div style="height:220px"><canvas id="ct-rain-bar"></canvas></div>
        </div>
    </div>

    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">🔥 Hottest Districts (vs Normal)</h3>
            <div class="tbl-scroll" style="max-height:280px">
                <table class="tbl">
                    <thead><tr><th>District</th><th>Province</th><th>Max Temp</th><th>Anomaly</th><th>Status</th></tr></thead>
                    <tbody>${topHot.map(t => `<tr>
                        <td><b>${t.name}</b></td><td>${t.province}</td>
                        <td style="color:${tempColor(t.tempMax)}">${fmtC(t.tempMax)}</td>
                        <td style="color:${t.tempAnomaly > 0 ? C.danger : C.info}">${t.tempAnomaly > 0 ? '+' : ''}${fmt(t.tempAnomaly, 1)}°C</td>
                        <td>${t.isAboveNormal ? '<span style="color:' + C.danger + '">🔥 Above Normal</span>' : '<span style="color:' + C.success + '">✅ Normal</span>'}</td>
                    </tr>`).join('')}</tbody>
                </table>
            </div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">🌧 Driest Districts (Rain Deficit)</h3>
            <div class="tbl-scroll" style="max-height:280px">
                <table class="tbl">
                    <thead><tr><th>District</th><th>Province</th><th>Rain 7d</th><th>vs Normal</th><th>Status</th></tr></thead>
                    <tbody>${topDry.map(t => `<tr>
                        <td><b>${t.name}</b></td><td>${t.province}</td>
                        <td style="color:${rainColor(t.rain)}">${fmtMm(t.rain)}</td>
                        <td style="color:${t.rainAnomaly < 0 ? C.orange : C.info}">${t.rainAnomaly > 0 ? '+' : ''}${fmt(t.rainAnomaly, 1)}mm</td>
                        <td>${t.isDrought ? '<span style="color:' + C.orange + '">🏜 Drought Risk</span>' : '<span style="color:' + C.success + '">✅ OK</span>'}</td>
                    </tr>`).join('')}</tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="card mt-3">
        <h3 style="margin-bottom:10px">📊 Province-Level Trends</h3>
        <div style="height:240px"><canvas id="ct-province"></canvas></div>
    </div>`;

    setTimeout(() => {
        // Map
        const map = initFloodReplayMap('ct-map', { zoom: 6 });
        let cur = null;
        const trendMap = {};
        trends.forEach(t => { trendMap[t.name] = t; });

        function showLayer(type) {
            if (cur) map.removeLayer(cur);
            if (type === 'temp') {
                cur = addDistrictMarkers(map, trendMap, (_, t) =>
                    t.tempAnomaly > 5 ? C.danger : t.tempAnomaly > 2 ? C.orange : t.tempAnomaly > 0 ? C.warning : C.info,
                    (n, t) => `<b>${n}</b><br>${t.province}<br>Temp: ${fmtC(t.tempMax)}<br>Anomaly: ${fmt(t.tempAnomaly, 1)}°C`);
            } else if (type === 'rain') {
                cur = addDistrictMarkers(map, trendMap, (_, t) =>
                    t.rainAnomaly > 30 ? C.info : t.rainAnomaly > 10 ? C.success : t.rainAnomaly > -10 ? C.warning : C.orange,
                    (n, t) => `<b>${n}</b><br>Rain: ${fmtMm(t.rain)}<br>Anomaly: ${fmt(t.rainAnomaly, 1)}mm`);
            } else if (type === 'drought') {
                const droughtMap = {};
                trends.filter(t => t.isDrought).forEach(t => { droughtMap[t.name] = t; });
                cur = addDistrictMarkers(map, droughtMap.length ? droughtMap : trendMap, (_, t) =>
                    t.isDrought ? C.orange : C.success + '44',
                    (n, t) => `<b>${n}</b><br>Rain: ${fmtMm(t.rain)}<br>${t.isDrought ? '⚠ Drought Risk' : '✅ Normal'}`);
            } else if (type === 'heat') {
                cur = addDistrictMarkers(map, trendMap, (_, t) => tempColor(t.tempMax),
                    (n, t) => `<b>${n}</b><br>Max: ${fmtC(t.tempMax)}<br>Min: ${fmtC(t.tempMin)}<br>UV: ${fmt(t.uv, 1)}`);
            }
        }
        showLayer('temp');
        document.querySelectorAll('#ct-tabs .tab').forEach(t => {
            t.addEventListener('click', () => {
                document.querySelectorAll('#ct-tabs .tab').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                showLayer(t.dataset.v);
            });
        });

        // Temp anomaly bar chart
        const tc = document.getElementById('ct-temp-bar');
        if (tc) {
            const top12 = trends.slice(0, 12);
            makeBar(tc.getContext('2d'),
                top12.map(t => t.name.substring(0, 8)),
                top12.map(t => t.tempAnomaly),
                top12.map(t => t.tempAnomaly > 5 ? C.danger : t.tempAnomaly > 2 ? C.orange : C.info),
                { barThickness: 16 });
        }

        // Rain anomaly chart
        const rc = document.getElementById('ct-rain-bar');
        if (rc) {
            const rainTop = [...trends].sort((a, b) => Math.abs(b.rainAnomaly) - Math.abs(a.rainAnomaly)).slice(0, 12);
            makeBar(rc.getContext('2d'),
                rainTop.map(t => t.name.substring(0, 8)),
                rainTop.map(t => t.rainAnomaly),
                rainTop.map(t => t.rainAnomaly > 0 ? C.info : C.orange),
                { barThickness: 16 });
        }

        // Province group chart
        const pc = document.getElementById('ct-province');
        if (pc && provAvgs.length) {
            makeBar(pc.getContext('2d'),
                provAvgs.map(p => p.province),
                provAvgs.map(p => p.avgTemp),
                provAvgs.map(p => p.avgTemp > 40 ? C.danger : p.avgTemp > 35 ? C.orange : p.avgTemp > 30 ? C.warning : C.info),
                { barThickness: 30 });
        }
    }, 150);
}
