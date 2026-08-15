/* ─── Resilience Center — Impact Assessment ─────────────────── */
function render_resilience(el) {
    const alerts = alertsData || [];
    const cities = Object.entries(weatherData);
    const provinces = [...new Set(cities.map(([, d]) => d.province).filter(Boolean))].sort();

    // Calculate population at risk
    const extremeAlerts = alerts.filter(a => a.severity === 'extreme' || a.severity === 'severe');
    const districtsAtRisk = [...new Set(extremeAlerts.map(a => a.district))];
    const popAtRisk = districtsAtRisk.reduce((sum, dist) => sum + (weatherData[dist]?.population || 0), 0);
    const totalPop = cities.reduce((sum, [, d]) => sum + (d.population || 0), 0);
    const popPercent = totalPop ? ((popAtRisk / totalPop) * 100).toFixed(1) : 0;

    // Calculate heat vulnerability
    const heatCities = cities.filter(([, d]) => (d.stats?.temp_max_7d || 0) >= 40);
    const heatPop = heatCities.reduce((sum, [, d]) => sum + (d.population || 0), 0);

    // Calculate flood risk
    const floodAlerts = alerts.filter(a => a.type.includes('flood') || a.type.includes('river'));
    const droughtAlerts = alerts.filter(a => a.type.includes('drought'));
    const aqiAlerts = alerts.filter(a => a.type.includes('aqi') || a.type.includes('air'));
    const rainAlerts = alerts.filter(a => a.type.includes('rain') || a.type.includes('precip'));

    // Province-level impact
    const provImpact = {};
    provinces.forEach(p => {
        const provCities = cities.filter(([, d]) => d.province === p);
        const provAlerts = alerts.filter(a => provCities.some(([n]) => n === a.district));
        const provPop = provCities.reduce((s, [, d]) => s + (d.population || 0), 0);
        const avgTemp = provCities.reduce((s, [, d]) => s + (d.stats?.temp_max_7d || 0), 0) / (provCities.length || 1);
        const avgRain = provCities.reduce((s, [, d]) => s + (d.stats?.rain_total_7d || 0), 0) / (provCities.length || 1);
        const maxAqi = Math.max(...provCities.map(([n]) => aqiData[n]?.stats?.aqi_max || 0));
        const heatPopProv = provCities.filter(([, d]) => (d.stats?.temp_max_7d || 0) >= 40).reduce((s, [, d]) => s + (d.population || 0), 0);
        provImpact[p] = {
            cities: provCities.length, pop: provPop, alerts: provAlerts.length,
            extremeAlerts: provAlerts.filter(a => a.severity === 'extreme').length,
            avgTemp, avgRain, maxAqi, heatPop: heatPopProv,
            riskScore: Math.min(100, Math.round(
                (provAlerts.length * 8) + (avgTemp > 42 ? 20 : avgTemp > 38 ? 12 : 0) +
                (maxAqi > 150 ? 15 : maxAqi > 100 ? 8 : 0) + (avgRain > 60 ? 12 : avgRain > 30 ? 6 : 0)
            ))
        };
    });

    // Infrastructure metrics (simulated based on real climate data)
    const infraMetrics = {
        roads: { atRisk: Math.round(popAtRisk * 0.003), total: 24500, unit: 'km', label: 'Road Network' },
        bridges: { atRisk: Math.round(popAtRisk * 0.00005), total: 850, unit: 'bridges', label: 'Bridges' },
        powerGrid: { atRisk: Math.round(popAtRisk * 0.0001), total: 5200, unit: 'MW', label: 'Power Generation' },
        waterSupply: { atRisk: Math.round(popAtRisk * 0.0002), total: 18000, unit: 'km', label: 'Water Pipelines' }
    };

    // Agriculture impact
    const agriImpact = {
        cropsAtRisk: Math.round(heatPop * 0.015),
        irrigatedArea: 18200,
        droughtAffected: droughtAlerts.length > 0 ? Math.round(totalPop * 0.02) : 0,
        floodAffected: floodAlerts.length > 0 ? Math.round(totalPop * 0.008) : 0
    };

    // Health metrics
    const healthMetrics = {
        heatstrokeRisk: heatPop > 1000000 ? 'High' : heatPop > 500000 ? 'Moderate' : 'Low',
        airPollutionRisk: aqiAlerts.length > 3 ? 'High' : aqiAlerts.length > 1 ? 'Moderate' : 'Low',
        waterborneRisk: rainAlerts.length > 2 ? 'High' : rainAlerts.length > 0 ? 'Moderate' : 'Low',
        vulnerablePop: Math.round(totalPop * 0.15), // elderly + children estimate
        healthFacilities: 4200,
        ambulances: 1800
    };

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>🛡 Resilience Center</h2>
        <p>Climate impact assessment — population at risk, infrastructure, agriculture, and health</p>
    </div>
    <div class="card-grid g4 mb-3">
        <div class="stat-card s-red"><div class="stat-icon">👥</div><div class="stat-value">${fmtK(popAtRisk)}</div><div class="stat-label">Population at Risk</div><div class="stat-sub">${popPercent}% of total</div></div>
        <div class="stat-card s-orange"><div class="stat-icon">🌡</div><div class="stat-value" style="color:${heatPop > 1000000 ? C.danger : C.orange}">${fmtK(heatPop)}</div><div class="stat-label">Heat-Exposed Pop</div><div class="stat-sub">${heatCities.length} districts ≥40°C</div></div>
        <div class="stat-card s-blue"><div class="stat-icon">🌊</div><div class="stat-value" style="color:${floodAlerts.length ? C.danger : C.success}">${floodAlerts.length}</div><div class="stat-label">Flood Alerts</div><div class="stat-sub">${rainAlerts.length} rain warnings</div></div>
        <div class="stat-card s-green"><div class="stat-icon">🏜</div><div class="stat-value" style="color:${droughtAlerts.length ? C.warning : C.success}">${droughtAlerts.length}</div><div class="stat-label">Drought Alerts</div><div class="stat-sub">${aqiAlerts.length} AQI warnings</div></div>
    </div>
    <div class="card-grid g3 mb-3">
        <div class="card">
            <div class="card-header"><h3>🎯 Risk Score by Province</h3></div>
            <div style="height:260px"><canvas id="res-risk-chart"></canvas></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>🏗 Infrastructure at Risk</h3></div>
            <div style="height:260px"><canvas id="res-infra-chart"></canvas></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>🌾 Agriculture Impact</h3></div>
            <div style="height:260px"><canvas id="res-agri-chart"></canvas></div>
        </div>
    </div>
    <div class="card-grid g2 mb-3">
        <div class="card">
            <div class="card-header"><h3>🗺 Impact Heatmap</h3></div>
            <div id="res-map" class="map-container" style="height:420px"></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>👥 Population Exposure</h3></div>
            <div style="padding:12px">
                <div class="card-grid g2" style="margin-bottom:12px">
                    <div class="card" style="padding:12px;text-align:center">
                        <div style="font-size:11px;color:var(--text-muted)">Total Monitored</div>
                        <div style="font-size:20px;font-weight:700;color:${C.info}">${fmtK(totalPop)}</div>
                    </div>
                    <div class="card" style="padding:12px;text-align:center">
                        <div style="font-size:11px;color:var(--text-muted)">At Risk</div>
                        <div style="font-size:20px;font-weight:700;color:${C.danger}">${fmtK(popAtRisk)}</div>
                    </div>
                </div>
                <div style="margin-bottom:12px">
                    <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
                        <span>Risk Exposure</span>
                        <span style="color:${popPercent > 30 ? C.danger : popPercent > 15 ? C.warning : C.success}">${popPercent}%</span>
                    </div>
                    <div style="height:8px;background:#161b22;border-radius:4px;overflow:hidden">
                        <div style="width:${Math.min(popPercent, 100)}%;height:100%;background:${popPercent > 30 ? C.danger : popPercent > 15 ? C.warning : C.success};border-radius:4px"></div>
                    </div>
                </div>
                <h4 style="font-size:13px;margin-bottom:8px">Districts at Risk (${districtsAtRisk.length})</h4>
                <div class="tbl-scroll" style="max-height:200px">
                    <table class="tbl">
                        <thead><tr><th>District</th><th>Province</th><th>Population</th><th>Alert</th></tr></thead>
                        <tbody>
                        ${districtsAtRisk.slice(0, 20).map(d => {
                            const prov = weatherData[d]?.province || 'Unknown';
                            const pop = weatherData[d]?.population || 0;
                            const alert = extremeAlerts.find(a => a.district === d);
                            return `<tr><td><b>${d}</b></td><td>${prov}</td><td>${fmtK(pop)}</td><td>${alert ? severityBadge(alert.severity) : '-'}</td></tr>`;
                        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <div class="card-grid g2 mb-3">
        <div class="card">
            <div class="card-header"><h3>🏗 Infrastructure Impact</h3></div>
            <table class="tbl"><thead><tr><th>Asset</th><th>Total</th><th>At Risk</th><th>% Exposed</th></tr></thead><tbody>
            ${Object.values(infraMetrics).map(m => {
                const pct = m.total ? ((m.atRisk / m.total) * 100).toFixed(1) : 0;
                return `<tr>
                    <td><b>${m.label}</b></td>
                    <td>${fmtK(m.total)} ${m.unit}</td>
                    <td style="color:${C.danger}">${fmtK(m.atRisk)} ${m.unit}</td>
                    <td>
                        <div style="display:flex;align-items:center;gap:6px">
                            <div style="width:60px;height:6px;background:#161b22;border-radius:3px;overflow:hidden">
                                <div style="width:${Math.min(pct, 100)}%;height:100%;background:${pct > 10 ? C.danger : pct > 5 ? C.warning : C.success};border-radius:3px"></div>
                            </div>
                            <span style="font-size:11px;color:${pct > 10 ? C.danger : pct > 5 ? C.warning : C.success}">${pct}%</span>
                        </div>
                    </td>
                </tr>`;
            }).join('')}
            </tbody></table>
        </div>
        <div class="card">
            <div class="card-header"><h3>🏥 Health Impact Assessment</h3></div>
            <table class="tbl"><tbody>
                <tr><td>Heatstroke Risk</td><td><span class="badge ${healthMetrics.heatstrokeRisk === 'High' ? 'b-danger' : healthMetrics.heatstrokeRisk === 'Moderate' ? 'b-warning' : 'b-success'}">${healthMetrics.heatstrokeRisk}</span></td></tr>
                <tr><td>Air Pollution Risk</td><td><span class="badge ${healthMetrics.airPollutionRisk === 'High' ? 'b-danger' : healthMetrics.airPollutionRisk === 'Moderate' ? 'b-warning' : 'b-success'}">${healthMetrics.airPollutionRisk}</span></td></tr>
                <tr><td>Waterborne Disease Risk</td><td><span class="badge ${healthMetrics.waterborneRisk === 'High' ? 'b-danger' : healthMetrics.waterborneRisk === 'Moderate' ? 'b-warning' : 'b-success'}">${healthMetrics.waterborneRisk}</span></td></tr>
                <tr><td>Vulnerable Population</td><td><b>${fmtK(healthMetrics.vulnerablePop)}</b></td></tr>
                <tr><td>Health Facilities</td><td>${fmtK(healthMetrics.healthFacilities)}</td></tr>
                <tr><td>Ambulances</td><td>${fmtK(healthMetrics.ambulances)}</td></tr>
                <tr><td>Heat-Exposed Districts</td><td style="color:${C.danger}">${heatCities.length}</td></tr>
                <tr><td>Affected Population (Heat)</td><td style="color:${C.danger}">${fmtK(heatPop)}</td></tr>
            </tbody></table>
        </div>
    </div>
    <div class="card mb-3">
        <div class="card-header"><h3>🌾 Agricultural Impact</h3></div>
        <div class="card-grid g4">
            <div class="card" style="padding:14px;text-align:center">
                <div style="font-size:28px;margin-bottom:6px">🌾</div>
                <div style="font-size:18px;font-weight:700;color:${C.orange}">${fmtK(agriImpact.cropsAtRisk)}</div>
                <div style="font-size:11px;color:var(--text-muted)">Hectares Crops at Risk</div>
            </div>
            <div class="card" style="padding:14px;text-align:center">
                <div style="font-size:28px;margin-bottom:6px">💧</div>
                <div style="font-size:18px;font-weight:700;color:${C.info}">${fmtK(agriImpact.irrigatedArea)}</div>
                <div style="font-size:11px;color:var(--text-muted)">Irrigated Hectares</div>
            </div>
            <div class="card" style="padding:14px;text-align:center">
                <div style="font-size:28px;margin-bottom:6px">🏜</div>
                <div style="font-size:18px;font-weight:700;color:${C.warning}">${fmtK(agriImpact.droughtAffected)}</div>
                <div style="font-size:11px;color:var(--text-muted)">Drought-Affected Pop</div>
            </div>
            <div class="card" style="padding:14px;text-align:center">
                <div style="font-size:28px;margin-bottom:6px">🌊</div>
                <div style="font-size:18px;font-weight:700;color:${C.danger}">${fmtK(agriImpact.floodAffected)}</div>
                <div style="font-size:11px;color:var(--text-muted)">Flood-Affected Pop</div>
            </div>
        </div>
    </div>
    <div class="card">
        <div class="card-header"><h3>📊 Province Risk Overview</h3></div>
        <div class="tbl-scroll">
            <table class="tbl">
                <thead><tr><th>Province</th><th>Districts</th><th>Population</th><th>Avg Temp</th><th>Avg Rain</th><th>Max AQI</th><th>Alerts</th><th>Extreme</th><th>Risk Score</th></tr></thead>
                <tbody>
                ${provinces.map(p => {
                    const imp = provImpact[p];
                    if (!imp) return '';
                    return `<tr>
                        <td><b>${p}</b></td>
                        <td>${imp.cities}</td>
                        <td>${fmtK(imp.pop)}</td>
                        <td style="color:${tempColor(imp.avgTemp)}">${fmtC(imp.avgTemp)}</td>
                        <td style="color:${rainColor(imp.avgRain)}">${fmtMm(imp.avgRain)}</td>
                        <td style="color:${aqiColor(imp.maxAqi)}">${imp.maxAqi ? Math.round(imp.maxAqi) : '-'}</td>
                        <td>${imp.alerts}</td>
                        <td style="color:${imp.extremeAlerts ? C.danger : C.success}">${imp.extremeAlerts}</td>
                        <td>
                            <div style="display:flex;align-items:center;gap:6px">
                                <div style="width:60px;height:6px;background:#161b22;border-radius:3px;overflow:hidden">
                                    <div style="width:${imp.riskScore}%;height:100%;background:${imp.riskScore > 60 ? C.danger : imp.riskScore > 30 ? C.orange : C.success};border-radius:3px"></div>
                                </div>
                                <span style="font-size:11px;color:${imp.riskScore > 60 ? C.danger : imp.riskScore > 30 ? C.orange : C.success}">${imp.riskScore}</span>
                            </div>
                        </td>
                    </tr>`;
                }).join('')}
                </tbody>
            </table>
        </div>
    </div>`;

    setTimeout(() => {
        // Risk score chart
        const riskLabels = provinces.filter(p => provImpact[p]);
        const riskScores = riskLabels.map(p => provImpact[p].riskScore);
        const riskColors = riskScores.map(s => s > 60 ? C.danger : s > 30 ? C.orange : C.success);
        const rc = document.getElementById('res-risk-chart');
        if (rc) makeBar(rc.getContext('2d'), riskLabels.map(p => p.substring(0, 6)), riskScores, riskColors, { barThickness: 28 });

        // Infrastructure chart
        const infraLabels = Object.values(infraMetrics).map(m => m.label.substring(0, 8));
        const infraPcts = Object.values(infraMetrics).map(m => m.total ? ((m.atRisk / m.total) * 100).toFixed(1) : 0);
        const ic = document.getElementById('res-infra-chart');
        if (ic) makeHBar(ic.getContext('2d'), infraLabels, infraPcts.map(Number),
            infraPcts.map(p => p > 10 ? C.danger : p > 5 ? C.orange : C.success)
        );

        // Agriculture doughnut
        const agriData = [agriImpact.cropsAtRisk, agriImpact.droughtAffected, agriImpact.floodAffected, agriImpact.irrigatedArea - agriImpact.cropsAtRisk];
        const agriLabels = ['Crops at Risk', 'Drought-Affected', 'Flood-Affected', 'Safe Irrigated'];
        const ac = document.getElementById('res-agri-chart');
        if (ac) makeDoughnut(ac.getContext('2d'), agriLabels, agriData, [C.orange, C.warning, C.danger, C.success]);

        // Impact map
        const map = initFloodReplayMap('res-map', { zoom: 6 });
        const impactLayer = L.layerGroup();
        cities.forEach(([name, d]) => {
            const s = d.stats || {};
            const isExtreme = extremeAlerts.some(a => a.district === name);
            const temp = s.temp_max_7d || 0;
            const aqiVal = aqiData[name]?.stats?.aqi_max || 0;
            // Calculate composite risk
            const risk = (temp > 45 ? 30 : temp > 40 ? 20 : temp > 35 ? 10 : 0) +
                         (aqiVal > 200 ? 25 : aqiVal > 150 ? 15 : aqiVal > 100 ? 8 : 0) +
                         (s.rain_total_7d > 80 ? 20 : s.rain_total_7d > 50 ? 10 : 0) +
                         (isExtreme ? 25 : 0);
            const color = risk > 60 ? C.danger : risk > 40 ? C.orange : risk > 20 ? C.warning : C.success;
            const radius = 5 + (risk / 10);
            const marker = L.circleMarker([d.lat, d.lng], {
                radius: Math.min(radius, 18), fillColor: color, color: '#fff',
                weight: isExtreme ? 3 : 1, opacity: 0.8, fillOpacity: 0.7
            });
            marker.bindPopup(`<div style="min-width:170px">
                <b>${name}</b><br>${d.province}<br>
                <hr style="border-color:#30363d;margin:4px 0">
                <span style="color:${C.danger}">Risk Score: ${risk}/100</span><br>
                🌡 ${fmtC(temp)} · 💨 AQI ${Math.round(aqiVal)}<br>
                🌧 ${fmtMm(s.rain_total_7d)}<br>
                👥 Pop: ${fmtK(d.population)}
                ${isExtreme ? '<br><b style="color:' + C.danger + '">⚠ EXTREME ALERT ACTIVE</b>' : ''}
            </div>`);
            impactLayer.addLayer(marker);
        });
        impactLayer.addTo(map);
    }, 150);
}
