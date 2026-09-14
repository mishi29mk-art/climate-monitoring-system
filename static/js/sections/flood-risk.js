/* ─── Flood Risk Assessment — Full Data Layers ─────────────────── */
async function render_flood_risk(el) {
    const stations = (riverData && riverData.stations) || [];
    const alerts = alertsData || [];
    const floodAlerts = alerts.filter(a => a.type && (a.type.includes('flood') || a.type.includes('river') || a.type.includes('rain')));
    const extremeStations = stations.filter(s => s.category === 'Extreme' || s.category === 'Very High');

    const [basinsData, realtimeData, floodPred] = await Promise.all([
        api('/api/rivers/basins').catch(() => null),
        api('/api/rivers/realtime').catch(() => null),
        api('/api/predict/flood').catch(() => null)
    ]);

    const basins = basinsData?.basins || {};
    const floodPath = basinsData?.flood_path || [];
    const hydroData = basinsData?.hydrographs || {};
    const impact2010 = basinsData?.impact_2010 || {};
    const predictions = floodPred?.predictions || [];

    // ─── Compute FRPI per district ──
    const frpi = {};
    Object.entries(weatherData).forEach(([name, d]) => {
        const rain7d = d.stats?.rain_total_7d || d.daily?.precipitation_sum?.reduce((a, b) => a + (b || 0), 0) || 0;
        const rainMaxDaily = d.stats?.rain_max_daily || 0;
        const nearby = stations.filter(s => Math.abs(s.lat - (d.lat || 0)) < 0.5 && Math.abs(s.lng - (d.lng || 0)) < 0.5);
        const maxDischarge = nearby.length ? Math.max(...nearby.map(s => s.discharge || 0)) : 0;
        const catOrder = { 'Extreme': 1.0, 'Very High': 0.8, 'High': 0.6, 'Moderate': 0.4, 'Low': 0.2, 'Normal': 0.1 };
        const maxCatScore = nearby.length ? Math.max(...nearby.map(s => catOrder[s.category] || 0.1)) : 0;
        const rainNorm = Math.min(1, rain7d / 150);
        const dischargeNorm = Math.min(1, maxDischarge / 200000);
        const rainNormMax = Math.min(1, rainMaxDaily / 100);
        const frpiScore = (rainNorm * 0.25) + (dischargeNorm * 0.35) + (maxCatScore * 0.30) + (rainNormMax * 0.10);
        const trend = nearby.find(s => s.trend === 'rising' || s.trend === 'falling')?.trend || 'stable';
        frpi[name] = {
            province: d.province || 'Unknown', lat: d.lat, lng: d.lng,
            score: Math.min(1, frpiScore), rain7d, rainMaxDaily, maxDischarge, trend,
            nearbyStations: nearby.length, pop: d.population || 0
        };
    });

    // Percentile-based risk levels
    const scores = Object.values(frpi).map(r => r.score).sort((a, b) => b - a);
    const p90 = scores[Math.floor(scores.length * 0.1)] || 0.3;
    const p70 = scores[Math.floor(scores.length * 0.3)] || 0.15;
    const p40 = scores[Math.floor(scores.length * 0.6)] || 0.08;
    const p15 = scores[Math.floor(scores.length * 0.85)] || 0.03;
    Object.values(frpi).forEach(r => {
        r.riskLevel = r.score >= p90 ? 'Very High' : r.score >= p70 ? 'High' : r.score >= p40 ? 'Moderate' : r.score >= p15 ? 'Low' : 'Very Low';
    });

    const sortedFRPI = Object.entries(frpi).sort((a, b) => b[1].score - a[1].score);
    const veryHigh = sortedFRPI.filter(([, r]) => r.riskLevel === 'Very High');
    const high = sortedFRPI.filter(([, r]) => r.riskLevel === 'High');
    const risingStations = stations.filter(s => s.trend === 'rising');
    const fallingStations = stations.filter(s => s.trend === 'falling');
    const totalPopAtRisk = [...veryHigh, ...high].reduce((s, [, r]) => s + (r.pop || 0), 0);

    const riskColorMap = {
        'Very High': '#dc2626', 'High': '#ea580c', 'Moderate': '#f59e0b',
        'Low': '#22c55e', 'Very Low': '#a3e635'
    };

    // ─── Render HTML ──────────────────────────────────────────
    el.innerHTML = `
    <div class="sec-hdr">
        <h2>⚠ Flood Risk Potential Index (FRPI)</h2>
        <p>Multi-layer flood risk analysis — rainfall, river discharge, inundation zones, alerts, and forecasts</p>
        <div class="hdr-meta">
            <span>🌧 ${Object.keys(weatherData).length} districts</span>
            <span>🌊 ${stations.length} gauge stations</span>
            <span>🔴 ${veryHigh.length} Very High</span>
            <span>🟠 ${high.length} High risk</span>
            <span>⚠ ${floodAlerts.length} alerts</span>
            <span>🔮 ${predictions.length} forecasts</span>
        </div>
    </div>

    <!-- ═══ Stat Cards ═══ -->
    <div class="card-grid g4">
        <div class="stat-card s-red">
            <div class="stat-icon">🔴</div>
            <div class="stat-value" style="color:${C.danger}">${veryHigh.length}</div>
            <div class="stat-label">Very High Risk</div>
            <div class="stat-sub">Top 10% most at risk</div>
        </div>
        <div class="stat-card s-orange">
            <div class="stat-icon">🟠</div>
            <div class="stat-value" style="color:${C.orange}">${high.length}</div>
            <div class="stat-label">High Risk</div>
            <div class="stat-sub">Top 30% risk</div>
        </div>
        <div class="stat-card s-cyan">
            <div class="stat-icon">📈</div>
            <div class="stat-value" style="color:${risingStations.length ? C.danger : C.success}">${risingStations.length}</div>
            <div class="stat-label">Rising Stations</div>
            <div class="stat-sub">${risingStations.length ? '⚠ Water levels increasing' : '✓ All stable / falling'}</div>
        </div>
        <div class="stat-card s-green">
            <div class="stat-icon">👥</div>
            <div class="stat-value" style="color:${C.purple}">${fmtK(totalPopAtRisk)}</div>
            <div class="stat-label">Pop. at High+ Risk</div>
            <div class="stat-sub">In very high & high risk districts</div>
        </div>
    </div>

    <!-- ═══ Dual-Panel: Map + FRPI Bar Chart ═══ -->
    <div class="card mt-3" style="padding:0;overflow:hidden">
        <div style="display:flex;gap:0;min-height:540px">
            <!-- Left: Map -->
            <div style="flex:1;min-width:0;position:relative">
                <!-- Layer Controls -->
                <div style="position:absolute;top:10px;left:10px;z-index:1000;display:flex;flex-direction:column;gap:6px">
                    <div style="background:rgba(15,23,42,0.95);border-radius:8px;padding:10px 14px;font-size:11px;color:#e2e8f0;min-width:200px">
                        <b style="font-size:12px;display:block;margin-bottom:6px">🗺 Data Layers</b>
                        <label style="display:flex;align-items:center;gap:6px;margin:3px 0;cursor:pointer">
                            <input type="checkbox" checked data-layer="risk" style="accent-color:#dc2626"> 
                            <span style="color:#dc2626">●</span> Risk Score
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;margin:3px 0;cursor:pointer">
                            <input type="checkbox" checked data-layer="rivers" style="accent-color:#3b82f6"> 
                            <span style="color:#3b82f6">●</span> River Flows
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;margin:3px 0;cursor:pointer">
                            <input type="checkbox" checked data-layer="floodzones" style="accent-color:#f59e0b"> 
                            <span style="color:#f59e0b">●</span> Flood Inundation Zones
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;margin:3px 0;cursor:pointer">
                            <input type="checkbox" checked data-layer="rainfall" style="accent-color:#06b6d4"> 
                            <span style="color:#06b6d4">●</span> Rainfall Intensity
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;margin:3px 0;cursor:pointer">
                            <input type="checkbox" checked data-layer="alerts" style="accent-color:#f97316"> 
                            <span style="color:#f97316">●</span> Active Alerts (${floodAlerts.length})
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;margin:3px 0;cursor:pointer">
                            <input type="checkbox" checked data-layer="forecast" style="accent-color:#a855f7"> 
                            <span style="color:#a855f7">●</span> Flood Forecast (${predictions.length})
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;margin:3px 0;cursor:pointer">
                            <input type="checkbox" checked data-layer="propagation" style="accent-color:#22d3ee"> 
                            <span style="color:#22d3ee">●</span> Flood Propagation Path
                        </label>
                    </div>
                    <!-- Legend -->
                    <div style="background:rgba(15,23,42,0.95);border-radius:8px;padding:8px 12px;font-size:10px;color:#e2e8f0">
                        <b style="font-size:11px">FRPI Scale</b><br>
                        <span style="color:#dc2626">■ Very High (≥${p90.toFixed(2)})</span><br>
                        <span style="color:#ea580c">■ High (≥${p70.toFixed(2)})</span><br>
                        <span style="color:#f59e0b">■ Moderate (≥${p40.toFixed(2)})</span><br>
                        <span style="color:#22c55e">■ Low (≥${p15.toFixed(2)})</span><br>
                        <span style="color:#a3e635">■ Very Low (&lt;${p15.toFixed(2)})</span>
                    </div>
                </div>
                <div id="frpi-map" style="height:540px;width:100%"></div>
            </div>
            <!-- Right: FRPI Bar Chart -->
            <div style="width:400px;border-left:1px solid var(--border);padding:14px;background:var(--bg-card);overflow-y:auto;max-height:540px">
                <h3 style="margin:0 0 4px 0;font-size:14px">📊 FRPI Ranking</h3>
                <p style="color:var(--text-muted);font-size:11px;margin:0 0 10px 0">Flood Risk Potential Index — sorted by risk</p>
                <div id="frpi-bar-chart"></div>
            </div>
        </div>
    </div>

    <!-- ═══ Live River Gauges (FloodGuard style) ═══ -->
    <div class="card mt-3">
        <div class="card-header"><h3>🌊 Live River Gauges — Official IRSA/FFD</h3></div>
        <div class="card-grid g4" style="gap:10px">
        ${Object.entries(basins).map(([basinName, b]) => {
            const topStation = b.stations?.sort((a, c) => (c.discharge||0) - (a.discharge||0))[0];
            if (!topStation) return '';
            const statusColor = topStation.status === 'high' ? C.danger : topStation.status === 'elevated' ? C.orange : C.success;
            const trendIcon = topStation.trend === 'rising' ? '📈' : topStation.trend === 'falling' ? '📉' : '→';
            return `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px;border-left:3px solid ${b.color}">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                    <span style="font-size:13px;font-weight:600">${topStation.name}</span>
                    <span class="badge ${topStation.status==='high'?'b-danger':topStation.status==='elevated'?'b-orange':'b-success'}" style="margin-left:auto">${topStation.status?.toUpperCase()}</span>
                </div>
                <div style="font-size:28px;font-weight:800;color:#e2e8f0;line-height:1.1">${fmtCusecs(topStation.discharge)}</div>
                <div style="display:flex;justify-content:space-between;color:var(--text-muted);font-size:11px;margin-top:4px">
                    <span>${basinName} Basin</span>
                    <span>${trendIcon} ${topStation.trend||'stable'}</span>
                </div>
            </div>`;
        }).join('')}
        </div>
    </div>

    <!-- ═══ Impact Statistics (FloodGuard style) ═══ -->
    ${impact2010.deaths ? `
    <div class="card-grid g4 mt-3">
        <div class="stat-card s-red" style="text-align:center">
            <div style="font-size:32px">💀</div>
            <div style="font-size:28px;font-weight:800;color:${C.danger}">${fmtK(impact2010.deaths)}</div>
            <div style="color:var(--text-muted);font-size:11px">Deaths — 2022 Super Flood</div>
        </div>
        <div class="stat-card s-orange" style="text-align:center">
            <div style="font-size:32px">👥</div>
            <div style="font-size:28px;font-weight:800;color:${C.orange}">${fmtK(impact2010.affected)}</div>
            <div style="color:var(--text-muted);font-size:11px">People Affected</div>
        </div>
        <div class="stat-card s-cyan" style="text-align:center">
            <div style="font-size:32px">💰</div>
            <div style="font-size:28px;font-weight:800;color:${C.warning}">$${(impact2010.damage_usd/1e9).toFixed(1)}B</div>
            <div style="color:var(--text-muted);font-size:11px">Economic Damage</div>
        </div>
        <div class="stat-card s-green" style="text-align:center">
            <div style="font-size:32px">⏱</div>
            <div style="font-size:28px;font-weight:800;color:${C.info}">36h</div>
            <div style="color:var(--text-muted);font-size:11px">Kalabagh→Kotri Travel Time</div>
        </div>
    </div>` : ''}

    <!-- ═══ Charts Row ═══ -->
    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">📊 FRPI Distribution</h3>
            <div style="height:220px"><canvas id="fr-dist"></canvas></div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">📊 FRPI by Province</h3>
            <div style="height:220px"><canvas id="fr-province"></canvas></div>
        </div>
    </div>

    <!-- ═══ Discharge Trends ═══ -->
    ${hydroData.days && hydroData.data ? `
    <div class="card mt-3">
        <div class="card-header"><h3>📈 Discharge Propagation — Barrage-to-Barrage</h3></div>
        <p style="color:var(--text-muted);font-size:12px;margin:0 0 10px 0">How flood pulses travel downstream: Nowshera → Tarbela → Kalabagh → Chashma → Taunsa → Guddu → Sukkur → Kotri</p>
        <div style="height:280px"><canvas id="fr-hydrograph"></canvas></div>
    </div>` : ''}

    <!-- ═══ Province + Alerts ═══ -->
    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">📋 Province Risk Summary</h3>
            <div class="tbl-scroll" style="max-height:340px">
                <table class="tbl">
                    <thead><tr><th>Province</th><th>Districts</th><th>Avg FRPI</th><th>Max FRPI</th><th>Pop. Exposed</th><th>Status</th></tr></thead>
                    <tbody>
                    ${(() => {
                        const prov = {};
                        sortedFRPI.forEach(([name, r]) => {
                            if (!prov[r.province]) prov[r.province] = { count: 0, total: 0, max: 0, pop: 0 };
                            prov[r.province].count++;
                            prov[r.province].total += r.score;
                            prov[r.province].pop += r.pop;
                            if (r.score > prov[r.province].max) prov[r.province].max = r.score;
                        });
                        return Object.entries(prov).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count)).map(([p, d]) => {
                            const avg = d.total / d.count;
                            return `<tr><td><b>${p}</b></td><td>${d.count}</td>
                                <td style="color:${avg>=0.15?C.danger:avg>=0.08?C.warning:C.info}">${avg.toFixed(3)}</td>
                                <td style="color:${d.max>=0.3?C.danger:d.max>=0.15?C.orange:C.info}">${d.max.toFixed(3)}</td>
                                <td>${d.pop?fmtK(d.pop):'-'}</td>
                                <td>${categoryBadge(avg>=0.15?'High':avg>=0.08?'Moderate':'Low')}</td></tr>`;
                        }).join('');
                    })()}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">🚨 Active Flood-Related Alerts (${floodAlerts.length})</h3>
            ${floodAlerts.length ? `<div class="tbl-scroll" style="max-height:300px">
                <table class="tbl">
                    <thead><tr><th></th><th>Type</th><th>District</th><th>Severity</th><th>Value</th><th>Message</th></tr></thead>
                    <tbody>
                    ${floodAlerts.map(a => `<tr>
                        <td>${a.icon||'⚠'}</td>
                        <td>${a.type.replace(/_/g,' ')}</td>
                        <td><b>${a.district}</b></td>
                        <td>${severityBadge(a.severity)}</td>
                        <td>${fmt(a.value,0)}</td>
                        <td style="color:var(--text-muted);font-size:12px">${a.message||'-'}</td>
                    </tr>`).join('')}
                    </tbody>
                </table>
            </div>` : '<p style="color:var(--text-muted);text-align:center;padding:30px">No active flood-related alerts</p>'}
        </div>
    </div>

    <!-- ═══ Flood Forecast ═══ -->
    ${predictions.length ? `
    <div class="card mt-3">
        <h3 style="margin-bottom:10px">🔮 Flood Risk Forecast (24-72h)</h3>
        <p style="color:var(--text-muted);font-size:12px;margin:0 0 10px 0">Model: ${floodPred.model || 'Rain-River Coupled'} — Top 10 predictions by risk</p>
        <div class="tbl-scroll" style="max-height:280px">
            <table class="tbl">
                <thead><tr><th>District</th><th>Province</th><th>FRPI</th><th>Rain 7d</th><th>Probability</th><th>Lead Time</th><th>Risk</th></tr></thead>
                <tbody>
                ${predictions.slice(0, 15).map(p => `<tr>
                    <td><b>${p.district}</b></td>
                    <td>${p.province}</td>
                    <td><div style="display:flex;align-items:center;gap:6px">
                        <div style="width:50px;height:6px;background:#1c2128;border-radius:3px;overflow:hidden">
                            <div style="width:${p.risk_score*100}%;height:100%;background:${p.risk_score>=0.75?C.danger:p.risk_score>=0.5?C.orange:C.warning};border-radius:3px"></div>
                        </div>
                        <span style="color:${p.risk_score>=0.75?C.danger:p.risk_score>=0.5?C.orange:C.warning};font-size:12px">${p.risk_score?.toFixed(2)}</span>
                    </div></td>
                    <td style="color:${rainColor(p.rain_7d)}">${fmtMm(p.rain_7d)}</td>
                    <td style="color:${p.probability>=70?C.danger:p.probability>=40?C.orange:C.warning}">${p.probability}%</td>
                    <td><span class="badge ${p.lead_time?.includes('24')?'b-danger':p.lead_time?.includes('48')?'b-orange':'b-info'}">${p.lead_time}</span></td>
                    <td>${categoryBadge(p.risk_level)}</td>
                </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>` : ''}`;

    // ─── Initialize Map + Layers + Charts ──────────────────
    requestAnimationFrame(() => requestAnimationFrame(() => {
        const mapContainer = document.getElementById('frpi-map');
        if (!mapContainer || mapContainer._leaflet_id) return;

        const map = L.map('frpi-map', {
            center: [30.5, 70.0], zoom: 5, zoomControl: true, attributionControl: false
        });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
            maxZoom: 18, subdomains: 'abcd'
        }).addTo(map);

        // ─── Layer groups ────────────────────────────────
        const layers = {
            risk: L.layerGroup(),
            rivers: L.layerGroup(),
            floodzones: L.layerGroup(),
            rainfall: L.layerGroup(),
            alerts: L.layerGroup(),
            forecast: L.layerGroup(),
            propagation: L.layerGroup()
        };

        // 1. RISK SCORE — District markers
        sortedFRPI.forEach(([name, r]) => {
            const color = riskColorMap[r.riskLevel] || '#64748b';
            const radius = Math.max(8, Math.min(22, 6 + r.score * 30));
            const marker = L.circleMarker([r.lat, r.lng], {
                radius, fillColor: color, color: '#0f172a', weight: 2, fillOpacity: 0.85
            });
            const trendIcon = r.trend === 'rising' ? '📈' : r.trend === 'falling' ? '📉' : '➡️';
            marker.bindPopup(`<div style="min-width:180px;font-family:Inter,system-ui,sans-serif">
                <b style="font-size:14px;color:${color}">${name}</b><br>
                <span style="color:#94a3b8;font-size:12px">${r.province}</span>
                <hr style="margin:6px 0;border-color:#333">
                <div style="display:flex;justify-content:space-between;margin:3px 0;font-size:12px"><span>FRPI:</span><b style="color:${color};font-size:14px">${r.score.toFixed(3)}</b></div>
                <div style="display:flex;justify-content:space-between;margin:3px 0;font-size:12px"><span>Level:</span><b style="color:${color}">${r.riskLevel}</b></div>
                <div style="display:flex;justify-content:space-between;margin:3px 0;font-size:12px"><span>Rain 7d:</span><b style="color:${rainColor(r.rain7d)}">${fmtMm(r.rain7d)}</b></div>
                <div style="display:flex;justify-content:space-between;margin:3px 0;font-size:12px"><span>Discharge:</span><b style="color:#39d2c0">${r.maxDischarge?fmtCusecs(r.maxDischarge):'N/A'}</b></div>
                <div style="display:flex;justify-content:space-between;margin:3px 0;font-size:12px"><span>Trend:</span><b>${trendIcon} ${r.trend}</b></div>
                <div style="display:flex;justify-content:space-between;margin:3px 0;font-size:12px"><span>Pop:</span><b>${r.pop?fmtK(r.pop):'-'}</b></div>
            </div>`, { className: 'dark-popup', maxWidth: 280 });
            layers.risk.addLayer(marker);
        });

        // 2. RIVER FLOWS — Colored basin paths
        Object.entries(basins).forEach(([basinName, b]) => {
            if (b.stations && b.stations.length > 1) {
                const coords = b.stations.map(s => [s.lat, s.lng]);
                // Main river line
                L.polyline(coords, {
                    color: b.color, weight: 4, opacity: 0.7, lineCap: 'round'
                }).addTo(layers.rivers);
                // Glow effect
                L.polyline(coords, {
                    color: b.color, weight: 8, opacity: 0.2, lineCap: 'round'
                }).addTo(layers.rivers);
                // Station dots on rivers
                b.stations.forEach(s => {
                    L.circleMarker([s.lat, s.lng], {
                        radius: 5, fillColor: b.color, color: '#fff', weight: 1, fillOpacity: 0.9
                    }).addTo(layers.rivers);
                });
            }
        });

        // 3. FLOOD INUNDATION ZONES — Buffered areas along rivers
        Object.entries(basins).forEach(([basinName, b]) => {
            if (b.stations && b.stations.length > 1) {
                for (let i = 0; i < b.stations.length - 1; i++) {
                    const s1 = b.stations[i], s2 = b.stations[i + 1];
                    const maxDis = Math.max(s1.discharge || 0, s2.discharge || 0);
                    const width = Math.max(0.02, Math.min(0.15, maxDis / 1200000));
                    const floodColor = maxDis > 150000 ? '#dc2626' : maxDis > 100000 ? '#ea580c' : maxDis > 50000 ? '#f59e0b' : '#22c55e';
                    const lat1 = s1.lat, lng1 = s1.lng, lat2 = s2.lat, lng2 = s2.lng;
                    const dlat = lat2 - lat1, dlng = lng2 - lng1;
                    const len = Math.sqrt(dlat * dlat + dlng * dlng);
                    if (len === 0) continue;
                    const nx = -dlat / len * width, ny = dlng / len * width;
                    L.polygon([
                        [lat1 + nx, lng1 + ny], [lat2 + nx, lng2 + ny],
                        [lat2 - nx, lng2 - ny], [lat1 - nx, lng1 - ny]
                    ], { color: floodColor, weight: 1, opacity: 0.4, fillColor: floodColor, fillOpacity: 0.18 }).addTo(layers.floodzones);
                }
            }
        });

        // 4. RAINFALL INTENSITY — District circles colored by rain
        Object.entries(frpi).forEach(([name, r]) => {
            const rain = r.rain7d;
            const color = rain > 100 ? '#dc2626' : rain > 60 ? '#ea580c' : rain > 30 ? '#f59e0b' : rain > 10 ? '#06b6d4' : '#22c55e';
            const radius = Math.max(5, Math.min(18, 4 + rain / 10));
            const m = L.circleMarker([r.lat, r.lng], {
                radius, fillColor: color, color: color, weight: 0, fillOpacity: 0.4
            });
            m.bindPopup(`<b>${name}</b><br>Rain 7d: <b style="color:${color}">${fmtMm(rain)}</b><br>Max daily: ${fmtMm(r.rainMaxDaily)}`);
            layers.rainfall.addLayer(m);
        });

        // 5. ACTIVE ALERTS — Pulsing alert markers
        floodAlerts.forEach(a => {
            if (a.lat && a.lng) {
                const aColor = a.severity === 'extreme' ? '#dc2626' : a.severity === 'severe' ? '#ea580c' : '#f59e0b';
                const m = L.circleMarker([a.lat, a.lng], {
                    radius: 12, fillColor: aColor, color: '#fff', weight: 2, fillOpacity: 0.85
                });
                m.bindPopup(`<b>${a.district}</b><br>${a.type.replace(/_/g,' ')}<br>${severityBadge(a.severity)}<br>${a.message||''}`, { className: 'dark-popup' });
                layers.alerts.addLayer(m);
            }
        });

        // 6. FLOOD FORECAST — Prediction markers
        predictions.forEach(p => {
            const d = weatherData[p.district];
            if (!d) return;
            const color = p.risk_score >= 0.75 ? '#dc2626' : p.risk_score >= 0.5 ? '#ea580c' : '#f59e0b';
            const m = L.circleMarker([d.lat, d.lng], {
                radius: 8 + (p.risk_score || 0) * 15, fillColor: color, color: '#a855f7', weight: 2, fillOpacity: 0.7
            });
            m.bindPopup(`<b>${p.district}</b><br>FRPI: ${p.risk_score?.toFixed(2)}<br>Prob: ${p.probability}%<br>Lead: ${p.lead_time}`, { className: 'dark-popup' });
            layers.forecast.addLayer(m);
        });

        // 7. FLOOD PROPAGATION PATH — Downstream flow arrows
        if (floodPath.length) {
            const pathCoords = floodPath.map(p => [p.lat, p.lng]);
            L.polyline(pathCoords, {
                color: '#22d3ee', weight: 4, opacity: 0.8, dashArray: '10,6'
            }).addTo(layers.propagation);
            // Add directional arrows along path
            floodPath.forEach((fp, i) => {
                const fpColor = fp.severity === 'extreme' ? '#dc2626' : fp.severity === 'high' ? '#ea580c' : '#f59e0b';
                L.circleMarker([fp.lat, fp.lng], {
                    radius: 7, fillColor: fpColor, color: '#22d3ee', weight: 2, fillOpacity: 0.85
                }).bindPopup(`<b>${fp.name}</b><br>Severity: ${severityBadge(fp.severity)}`).addTo(layers.propagation);
            });
        }

        // Also add all gauge stations as small markers
        stations.forEach(s => {
            const color = s.category === 'Extreme' ? '#dc2626' : s.category === 'Very High' ? '#ea580c' : s.category === 'High' ? '#f59e0b' : '#22c55e';
            const icon = L.divIcon({
                className: '',
                html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:1px solid #fff;box-shadow:0 0 6px ${color}80"></div>`,
                iconSize: [10, 10], iconAnchor: [5, 5]
            });
            const m = L.marker([s.lat, s.lng], { icon });
            m.bindPopup(`<b>${s.name}</b> (${s.river||''})<br>Flow: <b style="color:${color}">${fmtCusecs(s.discharge)}</b><br>Category: ${categoryBadge(s.category)}<br>Trend: ${s.trend==='rising'?'📈 Rising':s.trend==='falling'?'📉 Falling':'➡️ Stable'}`, { className: 'dark-popup' });
            layers.risk.addLayer(m);
        });

        // Add all layers to map initially
        Object.values(layers).forEach(l => l.addTo(map));

        // ─── Layer toggle controls ──────────────────────
        document.querySelectorAll('[data-layer]').forEach(cb => {
            cb.addEventListener('change', () => {
                const layerName = cb.dataset.layer;
                const layer = layers[layerName];
                if (!layer) return;
                if (cb.checked) {
                    map.addLayer(layer);
                } else {
                    map.removeLayer(layer);
                }
            });
        });

        // ─── FRPI Bar Chart ─────────────────────────────
        const barContainer = document.getElementById('frpi-bar-chart');
        if (barContainer) {
            const maxScore = sortedFRPI.length ? sortedFRPI[0][1].score : 1;
            barContainer.innerHTML = sortedFRPI.map(([name, r]) => {
                const color = riskColorMap[r.riskLevel] || '#64748b';
                const pct = (r.score / Math.max(maxScore, 0.01)) * 100;
                return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:11px">
                    <div style="width:90px;text-align:right;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${name}">${name}</div>
                    <div style="flex:1;height:14px;background:#1c2128;border-radius:3px;overflow:hidden">
                        <div style="width:${pct}%;height:100%;background:${color};border-radius:3px"></div>
                    </div>
                    <div style="width:34px;text-align:right;font-weight:600;color:${color}">${r.score.toFixed(2)}</div>
                </div>`;
            }).join('');
        }

        // ─── Canvas Charts ──────────────────────────────
        const distCanvas = document.getElementById('fr-dist');
        if (distCanvas) {
            const ranges = ['0.0–0.2', '0.2–0.4', '0.4–0.6', '0.6–0.8', '0.8–1.0'];
            const counts = [0, 0, 0, 0, 0];
            Object.values(frpi).forEach(r => { counts[Math.min(4, Math.floor(r.score / 0.2))]++; });
            makeBar(distCanvas.getContext('2d'), ranges, counts, ['#a3e635', '#22c55e', '#f59e0b', '#ea580c', '#dc2626'], { barThickness: 30 });
        }

        const provCanvas = document.getElementById('fr-province');
        if (provCanvas) {
            const prov = {};
            sortedFRPI.forEach(([name, r]) => {
                if (!prov[r.province]) prov[r.province] = { total: 0, count: 0 };
                prov[r.province].total += r.score;
                prov[r.province].count++;
            });
            const provArr = Object.entries(prov).map(([p, d]) => ({ province: p, avg: d.total / d.count })).sort((a, b) => b.avg - a.avg);
            makeHBar(provCanvas.getContext('2d'), provArr.map(p => p.province), provArr.map(p => p.avg),
                provArr.map(p => p.avg >= 0.15 ? '#dc2626' : p.avg >= 0.08 ? '#f59e0b' : '#22c55e'));
        }

        // Hydrograph
        const hydroCanvas = document.getElementById('fr-hydrograph');
        if (hydroCanvas && hydroData.days && hydroData.data) {
            const basinOrder = ['Nowshera', 'Tarbela Dam', 'Kalabagh', 'Chashma Barrage', 'Taunsa Barrage', 'Guddu Barrage', 'Sukkur Barrage', 'Kotri Barrage'];
            const hydroColors = ['#8b5cf6', '#3b82f6', '#eab308', '#16a34a', '#ec4899', '#a855f7', '#f97316', '#06b6d4'];
            const hydroDatasets = basinOrder.map((name, i) => {
                const data = hydroData.data[name] || [];
                return { label: name, data, borderColor: hydroColors[i], backgroundColor: hydroColors[i] + '15', borderWidth: 2, tension: 0.3, pointRadius: 0 };
            }).filter(d => d.data.length > 0);
            makeLine(hydroCanvas.getContext('2d'), hydroData.days, hydroDatasets);
        }
    }, 100));
}
