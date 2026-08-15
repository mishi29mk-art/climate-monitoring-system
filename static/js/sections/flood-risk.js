/* ─── Flood Risk Assessment Section ───────────────────────── */
function render_flood_risk(el) {
    const stations = (riverData && riverData.stations) || [];
    const alerts = alertsData || [];
    const floodAlerts = alerts.filter(a => a.type && (a.type.includes('flood') || a.type.includes('river') || a.type.includes('rain')));
    const extremeStations = stations.filter(s => s.category === 'Extreme' || s.category === 'Very High');

    // Compute composite flood risk score per district using rainfall + river discharge
    const riskScores = {};
    Object.entries(weatherData).forEach(([name, d]) => {
        const rain7d = d.stats?.rain_total_7d || d.forecast?.daily?.precipitation_sum?.reduce((a, b) => a + (b || 0), 0) || 0;
        const maxTemp = d.stats?.temp_max_7d || 0;

        // Find nearest river stations (within ~0.5 degree)
        const nearbyStations = stations.filter(s =>
            Math.abs(s.lat - (d.lat || 0)) < 0.5 && Math.abs(s.lng - (d.lng || 0)) < 0.5
        );
        const maxDischarge = nearbyStations.length ? Math.max(...nearbyStations.map(s => s.discharge || 0)) : 0;
        const catOrder = { 'Extreme': 100, 'Very High': 75, 'High': 50, 'Moderate': 25, 'Low': 10, 'Normal': 5 };
        const maxCatScore = nearbyStations.length ? Math.max(...nearbyStations.map(s => catOrder[s.category] || 5)) : 0;

        // Composite risk score (0-100)
        const rainScore = Math.min(100, (rain7d / 100) * 50);
        const riverScore = Math.min(50, (maxCatScore / 100) * 50);
        const risk = Math.min(100, rainScore + riverScore);

        if (risk > 10 || nearbyStations.length > 0) {
            riskScores[name] = {
                province: d.province,
                lat: d.lat, lng: d.lng,
                rain7d, maxDischarge, risk,
                nearbyStations: nearbyStations.length,
                riskLevel: risk >= 70 ? 'Extreme' : risk >= 50 ? 'Very High' : risk >= 30 ? 'High' : risk >= 15 ? 'Moderate' : 'Low',
                pop: d.population || 0
            };
        }
    });

    const sortedRisk = Object.entries(riskScores).sort((a, b) => b[1].risk - a[1].risk);
    const highRisk = sortedRisk.filter(([, r]) => r.risk >= 50);
    const moderateRisk = sortedRisk.filter(([, r]) => r.risk >= 20 && r.risk < 50);

    // Risk by province
    const provRisk = {};
    Object.entries(riskScores).forEach(([name, r]) => {
        const p = r.province || 'Unknown';
        if (!provRisk[p]) provRisk[p] = { total: 0, count: 0, maxRisk: 0 };
        provRisk[p].total += r.risk;
        provRisk[p].count++;
        if (r.risk > provRisk[p].maxRisk) provRisk[p].maxRisk = r.risk;
    });
    const provRiskArr = Object.entries(provRisk).map(([p, d]) => ({
        province: p, avgRisk: d.total / d.count, maxRisk: d.maxRisk, districts: d.count
    })).sort((a, b) => b.avgRisk - a.avgRisk);

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>⚠ Flood Risk Assessment</h2>
        <p>Composite flood risk scoring based on rainfall intensity, river discharge levels, and proximity to waterways</p>
        <div class="hdr-meta">
            <span>🌧 Rainfall analysis: 7-day totals</span>
            <span>🌊 River discharge: ${stations.length} gauge stations</span>
            <span>⚠ ${floodAlerts.length} active flood-related alerts</span>
        </div>
    </div>

    <div class="card-grid g4">
        <div class="stat-card s-red">
            <div class="stat-icon">🔴</div>
            <div class="stat-value" style="color:${C.danger}">${highRisk.length}</div>
            <div class="stat-label">High Risk Districts</div>
            <div class="stat-sub">Score ≥ 50</div>
        </div>
        <div class="stat-card s-orange">
            <div class="stat-icon">🟠</div>
            <div class="stat-value" style="color:${C.orange}">${moderateRisk.length}</div>
            <div class="stat-label">Moderate Risk</div>
            <div class="stat-sub">Score 20-49</div>
        </div>
        <div class="stat-card s-red">
            <div class="stat-icon">⚠</div>
            <div class="stat-value" style="color:${C.danger}">${extremeStations.length}</div>
            <div class="stat-label">Extreme River Levels</div>
            <div class="stat-sub">Critical gauge readings</div>
        </div>
        <div class="stat-card s-cyan">
            <div class="stat-icon">🚨</div>
            <div class="stat-value" style="color:${C.info}">${floodAlerts.length}</div>
            <div class="stat-label">Flood Alerts Active</div>
            <div class="stat-sub">Including rain + river</div>
        </div>
    </div>

    <div class="card mt-3">
        <div class="card-header"><h3>🗺 Flood Risk Map</h3></div>
        <div class="tabs" id="flood-tabs">
            <button class="tab active" data-v="risk">Risk Score</button>
            <button class="tab" data-v="rain">Rainfall</button>
            <button class="tab" data-v="river">River Levels</button>
            <button class="tab" data-v="alerts">Alerts</button>
        </div>
        <div id="flood-map" class="map-container" style="height:440px"></div>
    </div>

    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">📊 Risk Score Distribution</h3>
            <div style="height:220px"><canvas id="fr-dist"></canvas></div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">📊 Average Risk by Province</h3>
            <div style="height:220px"><canvas id="fr-province"></canvas></div>
        </div>
    </div>

    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">🔴 Highest Risk Districts</h3>
            <div class="tbl-scroll" style="max-height:300px">
                <table class="tbl">
                    <thead><tr><th>District</th><th>Province</th><th>Risk Score</th><th>Rain 7d</th><th>River (m³/s)</th><th>Risk Level</th></tr></thead>
                    <tbody>
                    ${sortedRisk.slice(0, 20).map(([name, r]) => `<tr>
                        <td><b>${name}</b></td>
                        <td>${r.province}</td>
                        <td>
                            <div style="display:flex;align-items:center;gap:8px">
                                <div style="width:60px;height:8px;background:#1c2128;border-radius:4px;overflow:hidden">
                                    <div style="width:${r.risk}%;height:100%;background:${r.risk >= 70 ? C.danger : r.risk >= 50 ? C.orange : r.risk >= 30 ? C.warning : C.info};border-radius:4px"></div>
                                </div>
                                <span style="color:${r.risk >= 70 ? C.danger : r.risk >= 50 ? C.orange : r.risk >= 30 ? C.warning : C.info}">${fmt(r.risk, 1)}</span>
                            </div>
                        </td>
                        <td style="color:${rainColor(r.rain7d)}">${fmtMm(r.rain7d)}</td>
                        <td style="color:${C.cyan}">${r.maxDischarge ? fmt(r.maxDischarge, 0) : '-'}</td>
                        <td>${categoryBadge(r.riskLevel)}</td>
                    </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">📋 Province Risk Summary</h3>
            <div class="tbl-scroll" style="max-height:300px">
                <table class="tbl">
                    <thead><tr><th>Province</th><th>Districts</th><th>Avg Risk</th><th>Max Risk</th><th>Status</th></tr></thead>
                    <tbody>
                    ${provRiskArr.map(p => `<tr>
                        <td><b>${p.province}</b></td>
                        <td>${p.districts}</td>
                        <td style="color:${p.avgRisk >= 50 ? C.danger : p.avgRisk >= 30 ? C.warning : C.info}">${fmt(p.avgRisk, 1)}</td>
                        <td style="color:${p.maxRisk >= 70 ? C.danger : p.maxRisk >= 50 ? C.orange : C.info}">${fmt(p.maxRisk, 1)}</td>
                        <td>${categoryBadge(p.avgRisk >= 50 ? 'High' : p.avgRisk >= 30 ? 'Moderate' : 'Low')}</td>
                    </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    ${floodAlerts.length ? `
    <div class="card mt-3">
        <h3 style="margin-bottom:10px">🚨 Active Flood-Related Alerts</h3>
        <div class="tbl-scroll" style="max-height:250px">
            <table class="tbl">
                <thead><tr><th></th><th>Type</th><th>District</th><th>Severity</th><th>Value</th><th>Message</th></tr></thead>
                <tbody>
                ${floodAlerts.map(a => `<tr>
                    <td>${a.icon || '⚠'}</td>
                    <td>${a.type.replace(/_/g, ' ')}</td>
                    <td><b>${a.district}</b></td>
                    <td>${severityBadge(a.severity)}</td>
                    <td>${fmt(a.value, 0)}</td>
                    <td style="color:var(--text-muted)">${a.message || '-'}</td>
                </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>` : ''}`;

    setTimeout(() => {
        // Risk map
        const map = initFloodReplayMap('flood-map', { zoom: 6 });
        let currentLayer = null;

        function riskColor(name, d) {
            return d.risk >= 70 ? C.danger : d.risk >= 50 ? C.orange : d.risk >= 30 ? C.warning : d.risk >= 15 ? C.info : C.success;
        }
        function riskPopup(name, d) {
            return `<b>${name}</b><br>${d.province}<br>Risk: ${fmt(d.risk, 1)}<br>Rain 7d: ${fmtMm(d.rain7d)}<br>River: ${d.maxDischarge ? fmt(d.maxDischarge, 0) + ' m³/s' : 'N/A'}`;
        }

        function showLayer(type) {
            if (currentLayer) map.removeLayer(currentLayer);
            if (type === 'risk') {
                currentLayer = addDistrictMarkers(map, riskScores, riskColor, riskPopup);
            } else if (type === 'rain') {
                currentLayer = addDistrictMarkers(map, weatherData, (_, d) => rainColor(d.stats?.rain_total_7d),
                    (n, d) => `<b>${n}</b><br>Rain 7d: ${fmtMm(d.stats?.rain_total_7d)}`);
            } else if (type === 'river') {
                currentLayer = addGaugeMarkers(map, stations);
            } else if (type === 'alerts') {
                const layer = L.layerGroup();
                floodAlerts.forEach(a => {
                    if (a.lat && a.lng) {
                        const m = L.circleMarker([a.lat, a.lng], {
                            radius: 10, fillColor: severityBadge === 'extreme' ? C.danger : C.warning,
                            color: '#fff', weight: 1, fillOpacity: 0.8
                        });
                        m.bindPopup(`<b>${a.district}</b><br>${a.type}<br>${severityBadge(a.severity)}`);
                        layer.addLayer(m);
                    }
                });
                layer.addTo(map);
                currentLayer = layer;
            }
        }
        showLayer('risk');

        document.querySelectorAll('#flood-tabs .tab').forEach(t => {
            t.addEventListener('click', () => {
                document.querySelectorAll('#flood-tabs .tab').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                showLayer(t.dataset.v);
            });
        });

        // Risk distribution chart
        const distCanvas = document.getElementById('fr-dist');
        if (distCanvas) {
            const ranges = ['0-20', '20-40', '40-60', '60-80', '80-100'];
            const counts = [0, 0, 0, 0, 0];
            Object.values(riskScores).forEach(r => {
                const idx = Math.min(4, Math.floor(r.risk / 20));
                counts[idx]++;
            });
            makeBar(distCanvas.getContext('2d'), ranges, counts,
                [C.success, C.info, C.warning, C.orange, C.danger], { barThickness: 30 });
        }

        // Province risk chart
        const provCanvas = document.getElementById('fr-province');
        if (provCanvas) {
            makeHBar(provCanvas.getContext('2d'),
                provRiskArr.map(p => p.province),
                provRiskArr.map(p => p.avgRisk),
                provRiskArr.map(p => p.avgRisk >= 50 ? C.danger : p.avgRisk >= 30 ? C.warning : C.info)
            );
        }
    }, 150);
}
