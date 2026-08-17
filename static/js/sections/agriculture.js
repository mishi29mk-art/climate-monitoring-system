/* ─── Agriculture Section ─────────────────────────────────── */
function render_agriculture(el) {
    const entries = Object.entries(weatherData || {});
    // Pakistan major crops and their GDD requirements
    const CROPS = {
        wheat:      { base: 0,  max: 30, gddReq: 2100, seasons: 'Oct-Apr', waterNeed: 450 },
        rice:       { base: 20, max: 38, gddReq: 2500, seasons: 'Jun-Oct', waterNeed: 1200 },
        cotton:     { base: 15, max: 42, gddReq: 2000, seasons: 'Apr-Oct', waterNeed: 700 },
        sugarcane:  { base: 15, max: 38, gddReq: 6000, seasons: 'Feb-Dec', waterNeed: 1500 },
        maize:      { base: 10, max: 35, gddReq: 2200, seasons: 'Mar-Aug', waterNeed: 500 },
        groundnut:  { base: 10, max: 38, gddReq: 2500, seasons: 'Apr-Sep', waterNeed: 500 }
    };

    // Compute GDD and crop stress per district
    const agriData = entries.map(([name, d]) => {
        const stats = d.stats || {};
        const maxT = stats.temp_max_7d || 35;
        const minT = stats.temp_min_7d || 22;
        const rain = stats.rain_total_7d || 0;
        const humidity = d.daily?.relative_humidity_2m_max?.[0] || 50;
        const wind = stats.wind_max_7d || 10;

        // Growing Degree Days (daily avg over 7 days)
        const avgTemp = (maxT + minT) / 2;
        const gdd7d = Math.max(0, avgTemp - 10) * 7; // simplified: base 10°C

        // Crop-specific GDD progress
        const cropStatus = {};
        Object.entries(CROPS).forEach(([crop, cfg]) => {
            const gdd = Math.max(0, avgTemp - cfg.base) * 7;
            const progress = Math.min(100, (gdd / cfg.gddReq) * 100);
            // Stress: too hot or too cold for this crop
            let stress = 0;
            if (maxT > cfg.max) stress = ((maxT - cfg.max) / cfg.max) * 100;
            if (minT < cfg.base - 5) stress += ((cfg.base - 5 - minT) / cfg.base) * 50;
            // Humidity stress
            if (humidity > 85) stress += 15; // fungal risk
            if (humidity < 30) stress += 10; // drought stress
            cropStatus[crop] = {
                gdd: Math.round(gdd),
                progress: Math.round(progress),
                stress: Math.round(Math.min(100, stress)),
                stressLevel: stress > 50 ? 'Severe' : stress > 25 ? 'Moderate' : stress > 10 ? 'Mild' : 'None'
            };
        });

        // Overall agricultural stress index
        const avgStress = Object.values(cropStatus).reduce((s, c) => s + c.stress, 0) / Object.keys(cropStatus).length;
        // Heat stress for crops
        const heatStress = maxT > 40 ? (maxT - 40) * 5 : 0;
        // Water stress (too little or too much rain)
        const waterStress = rain < 5 ? 30 : rain > 80 ? 20 : 0;

        return {
            name, province: d.province, lat: d.lat, lng: d.lng,
            avgTemp, maxT, minT, rain, humidity, wind,
            gdd7d, cropStatus, avgStress, heatStress, waterStress,
            totalStress: Math.min(100, avgStress + heatStress + waterStress),
            soilMoisture: Math.max(10, Math.min(100, 30 + rain * 1.5 + humidity * 0.3))
        };
    }).sort((a, b) => b.totalStress - a.totalStress);

    const stressedAreas = agriData.filter(d => d.totalStress > 30);
    const optimalAreas = agriData.filter(d => d.totalStress < 15);
    const totalGDD = agriData.reduce((s, d) => s + d.gdd7d, 0);

    // Province averages
    const provMap = {};
    agriData.forEach(d => {
        const p = d.province || 'Unknown';
        if (!provMap[p]) provMap[p] = { stress: [], gdd: [], items: [] };
        provMap[p].stress.push(d.totalStress);
        provMap[p].gdd.push(d.gdd7d);
        provMap[p].items.push(d);
    });
    const provAvgs = Object.entries(provMap).map(([p, d]) => ({
        province: p,
        avgStress: d.stress.reduce((a, b) => a + b, 0) / d.stress.length,
        totalGDD: d.gdd.reduce((a, b) => a + b, 0),
        count: d.items.length
    })).sort((a, b) => b.avgStress - a.avgStress);

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>🌾 Agriculture Monitor</h2>
        <p>Growing degree days, crop stress analysis, soil moisture estimation — optimized for Pakistan's major crops</p>
        <div class="hdr-meta">
            <span>🌾 ${Object.keys(CROPS).length} crop types modeled</span>
            <span>📊 ${agriData.length} agricultural districts</span>
            <span>🌡 Base temp: 10°C (GDD)</span>
        </div>
    </div>

    <div class="card-grid g4">
        <div class="stat-card s-red"><div class="stat-icon">🔥</div><div class="stat-value" style="color:${C.danger}">${stressedAreas.length}</div><div class="stat-label">Stressed Areas</div><div class="stat-sub">High crop stress</div></div>
        <div class="stat-card s-green"><div class="stat-icon">✅</div><div class="stat-value" style="color:${C.success}">${optimalAreas.length}</div><div class="stat-label">Optimal Growing</div><div class="stat-sub">Low stress conditions</div></div>
        <div class="stat-card s-cyan"><div class="stat-icon">🌡</div><div class="stat-value" style="color:${C.cyan}">${fmtK(Math.round(totalGDD))}</div><div class="stat-label">Total GDD (7d)</div><div class="stat-sub">Accumulated degree days</div></div>
        <div class="stat-card s-yellow"><div class="stat-icon">💧</div><div class="stat-value" style="color:${C.yellow}">${agriData.length ? fmt(agriData.reduce((s, d) => s + d.soilMoisture, 0) / agriData.length, 0) : '-'}</div><div class="stat-label">Avg Soil Moisture</div><div class="stat-sub">Estimated %</div></div>
    </div>

    <div class="card mt-3">
        <div class="card-header"><h3>🗺 Agricultural Stress Map</h3></div>
        <div class="tabs" id="ag-tabs">
            <button class="tab active" data-v="stress">🔥 Crop Stress</button>
            <button class="tab" data-v="gdd">🌡 GDD Accumulation</button>
            <button class="tab" data-v="moisture">💧 Soil Moisture</button>
            <button class="tab" data-v="heat">🌡 Heat Stress</button>
        </div>
        <div id="ag-map" class="map-container" style="height:420px"></div>
    </div>

    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">📊 Crop Stress by Province</h3>
            <div style="height:220px"><canvas id="ag-stress-bar"></canvas></div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">📊 GDD Accumulation by Province</h3>
            <div style="height:220px"><canvas id="ag-gdd-bar"></canvas></div>
        </div>
    </div>

    <div class="card mt-3">
        <h3 style="margin-bottom:10px">🌾 Crop Growth Requirements</h3>
        <div class="tbl-scroll" style="max-height:200px">
            <table class="tbl">
                <thead><tr><th>Crop</th><th>Base °C</th><th>Max °C</th><th>GDD Required</th><th>Season</th><th>Water Need (mm)</th></tr></thead>
                <tbody>${Object.entries(CROPS).map(([c, cfg]) => `<tr>
                    <td><b>${c.charAt(0).toUpperCase() + c.slice(1)}</b></td>
                    <td>${cfg.base}°C</td><td>${cfg.max}°C</td>
                    <td>${fmtK(cfg.gddReq)}</td><td>${cfg.seasons}</td><td>${fmtK(cfg.waterNeed)}</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>
    </div>

    <div class="card mt-3">
        <h3 style="margin-bottom:10px">📋 District Agricultural Analysis</h3>
        <div class="tbl-scroll" style="max-height:350px">
            <table class="tbl">
                <thead><tr><th>District</th><th>Province</th><th>GDD (7d)</th><th>Soil Moisture</th><th>Total Stress</th><th>Status</th></tr></thead>
                <tbody>${agriData.map(d => `<tr>
                    <td><b>${d.name}</b></td><td>${d.province}</td>
                    <td style="color:${C.cyan}">${fmt(d.gdd7d, 0)}</td>
                    <td style="color:${d.soilMoisture < 30 ? C.danger : d.soilMoisture > 70 ? C.info : C.success}">${fmt(d.soilMoisture, 0)}%</td>
                    <td>
                        <div style="display:flex;align-items:center;gap:8px">
                            <div style="width:60px;height:8px;background:#1c2128;border-radius:4px;overflow:hidden">
                                <div style="width:${d.totalStress}%;height:100%;background:${d.totalStress > 50 ? C.danger : d.totalStress > 25 ? C.warning : C.success};border-radius:4px"></div>
                            </div>
                            <span style="color:${d.totalStress > 50 ? C.danger : d.totalStress > 25 ? C.warning : C.success}">${fmt(d.totalStress, 0)}%</span>
                        </div>
                    </td>
                    <td>${d.totalStress > 50 ? '🔴' : d.totalStress > 25 ? '🟡' : '🟢'} ${d.totalStress > 50 ? 'Severe' : d.totalStress > 25 ? 'Moderate' : 'Good'}</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>
    </div>`;

    setTimeout(() => {
        // Map
        const map = initFloodReplayMap('ag-map', { zoom: 6 });
        let cur = null;
        const agMap = {};
        agriData.forEach(d => { agMap[d.name] = d; });

        function showLayer(type) {
            if (cur) map.removeLayer(cur);
            if (type === 'stress') {
                cur = addDistrictMarkers(map, agMap, (_, d) =>
                    d.totalStress > 50 ? C.danger : d.totalStress > 25 ? C.warning : C.success,
                    (n, d) => `<b>${n}</b><br>Stress: ${fmt(d.totalStress, 0)}%<br>GDD: ${fmt(d.gdd7d, 0)}<br>Soil: ${fmt(d.soilMoisture, 0)}%`);
            } else if (type === 'gdd') {
                cur = addDistrictMarkers(map, agMap, (_, d) =>
                    d.gdd7d > 80 ? C.danger : d.gdd7d > 50 ? C.warning : C.info,
                    (n, d) => `<b>${n}</b><br>GDD (7d): ${fmt(d.gdd7d, 0)}`);
            } else if (type === 'moisture') {
                cur = addDistrictMarkers(map, agMap, (_, d) =>
                    d.soilMoisture < 25 ? C.danger : d.soilMoisture > 75 ? C.info : C.success,
                    (n, d) => `<b>${n}</b><br>Moisture: ${fmt(d.soilMoisture, 0)}%`);
            } else if (type === 'heat') {
                cur = addDistrictMarkers(map, agMap, (_, d) => tempColor(d.maxT),
                    (n, d) => `<b>${n}</b><br>Max: ${fmtC(d.maxT)}<br>Heat stress: ${fmt(d.heatStress, 0)}%`);
            }
        }
        showLayer('stress');
        document.querySelectorAll('#ag-tabs .tab').forEach(t => {
            t.addEventListener('click', () => {
                document.querySelectorAll('#ag-tabs .tab').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                showLayer(t.dataset.v);
            });
        });

        // Stress by province
        const sc = document.getElementById('ag-stress-bar');
        if (sc && provAvgs.length) {
            makeBar(sc.getContext('2d'),
                provAvgs.map(p => p.province),
                provAvgs.map(p => p.avgStress),
                provAvgs.map(p => p.avgStress > 40 ? C.danger : p.avgStress > 20 ? C.warning : C.success),
                { barThickness: 28 });
        }

        // GDD by province
        const gc = document.getElementById('ag-gdd-bar');
        if (gc && provAvgs.length) {
            makeBar(gc.getContext('2d'),
                provAvgs.map(p => p.province),
                provAvgs.map(p => p.totalGDD),
                provAvgs.map(p => p.totalGDD > 500 ? C.danger : p.totalGDD > 300 ? C.warning : C.info),
                { barThickness: 28 });
        }
    }, 150);
}
