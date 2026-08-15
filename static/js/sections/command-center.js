/* ─── Command Center ──────────────────────────────────────── */
function render_command_center(el) {
    const s = summaryData; const alerts = alertsData || [];
    const hotCount = Object.values(weatherData).filter(d => (d.stats?.temp_max_7d||0) >= 40).length;
    const coolCount = Object.values(weatherData).filter(d => (d.stats?.temp_max_7d||0) < 25).length;
    const rainCount = Object.values(weatherData).filter(d => (d.stats?.rain_total_7d||0) > 25).length;

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>🛰 National Command Center</h2>
        <p>Real-time situation awareness — all climate parameters at a glance</p>
        <div class="hdr-meta">
            <span>📅 ${new Date().toLocaleDateString('en-PK',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
            <span>🕐 Live PKT</span>
            <span>🟢 System Online</span>
        </div>
    </div>

    <!-- Top Stats Row -->
    <div class="card-grid g4">
        <div class="stat-card s-red" style="border-left:3px solid #ef4444">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div><div class="stat-icon">🌡</div><div class="stat-label">Peak Temperature</div></div>
                <div style="font-size:28px;opacity:0.15">🌡</div>
            </div>
            <div class="stat-value" style="color:#ef4444;font-size:32px;margin:4px 0">${fmtC(s.hottest?.temp)}</div>
            <div class="stat-sub">${s.hottest?.district||'-'} ${s.hottest?.province||''}</div>
            <div class="progress mt-2"><div class="fill" style="width:${Math.min(100,(s.hottest?.temp||0)/50*100)}%;background:linear-gradient(90deg,#22c55e,#eab308,#ef4444)"></div></div>
        </div>
        <div class="stat-card s-blue" style="border-left:3px solid #3b82f6">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div><div class="stat-icon">🌧</div><div class="stat-label">Most Rainfall (7d)</div></div>
                <div style="font-size:28px;opacity:0.15">🌧</div>
            </div>
            <div class="stat-value" style="color:#3b82f6;font-size:32px;margin:4px 0">${fmtMm(s.wettest?.rain)}</div>
            <div class="stat-sub">${s.wettest?.district||'-'} ${s.wettest?.province||''}</div>
            <div class="progress mt-2"><div class="fill" style="width:${Math.min(100,(s.wettest?.rain||0)/100*100)}%;background:linear-gradient(90deg,#06b6d4,#3b82f6)"></div></div>
        </div>
        <div class="stat-card s-orange" style="border-left:3px solid #f97316">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div><div class="stat-icon">💨</div><div class="stat-label">Worst Air Quality</div></div>
                <div style="font-size:28px;opacity:0.15">💨</div>
            </div>
            <div class="stat-value" style="color:#f97316;font-size:32px;margin:4px 0">${s.worst_aqi?.aqi?Math.round(s.worst_aqi.aqi):'-'}</div>
            <div class="stat-sub">${s.worst_aqi?.district||'-'} · AQI</div>
            <div class="progress mt-2"><div class="fill" style="width:${Math.min(100,(s.worst_aqi?.aqi||0)/300*100)}%;background:linear-gradient(90deg,#22c55e,#eab308,#f97316,#ef4444)"></div></div>
        </div>
        <div class="stat-card s-cyan" style="border-left:3px solid #06b6d4">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div><div class="stat-icon">🌊</div><div class="stat-label">Peak River Flow</div></div>
                <div style="font-size:28px;opacity:0.15">🌊</div>
            </div>
            <div class="stat-value" style="color:#06b6d4;font-size:32px;margin:4px 0">${s.highest_river?.discharge?fmtCusecs(s.highest_river.discharge):'-'}</div>
            <div class="stat-sub">${s.highest_river?.station||'-'}</div>
            <div class="progress mt-2"><div class="fill" style="width:${Math.min(100,(s.highest_river?.discharge||0)/500000*100)}%;background:linear-gradient(90deg,#06b6d4,#3b82f6)"></div></div>
        </div>
    </div>

    <!-- Secondary Stats -->
    <div class="card-grid g4 mt-3">
        <div class="stat-card s-green" style="text-align:center;padding:12px">
            <div class="stat-value" style="color:#22c55e;font-size:28px">${s.districts_monitored||0}</div>
            <div class="stat-label">Districts Monitored</div>
            <div class="stat-sub">5 provinces live</div>
        </div>
        <div class="stat-card s-red" style="text-align:center;padding:12px">
            <div class="stat-value" style="color:${alerts.length?'#ef4444':'#22c55e'};font-size:28px">${alerts.length}</div>
            <div class="stat-label">Active Alerts</div>
            <div class="stat-sub">${alerts.filter(a=>a.severity==='extreme').length} extreme</div>
        </div>
        <div class="stat-card s-yellow" style="text-align:center;padding:12px">
            <div class="stat-value" style="color:#eab308;font-size:28px">${hotCount}</div>
            <div class="stat-label">Hot Districts (≥40°C)</div>
            <div class="stat-sub">Heatwave risk</div>
        </div>
        <div class="stat-card s-blue" style="text-align:center;padding:12px">
            <div class="stat-value" style="color:#22c55e;font-size:28px">${coolCount}</div>
            <div class="stat-label">Cool Districts (&lt;25°C)</div>
            <div class="stat-sub">Pleasant weather</div>
        </div>
    </div>

    <!-- Map Section -->
    <div class="card mt-3" style="overflow:hidden">
        <div class="card-header" style="padding:16px 20px;border-bottom:1px solid var(--border)">
            <h3 style="font-size:15px">🗺 National Climate Map</h3>
            <div style="display:flex;gap:12px;align-items:center;font-size:11px;color:var(--text-muted)">
                <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block"></span> Hot (≥40°C)</span>
                <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:50%;background:#eab308;display:inline-block"></span> Warm (30-40°C)</span>
                <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:50%;background:#22c55e;display:inline-block"></span> Pleasant (&lt;30°C)</span>
            </div>
        </div>
        <div class="tabs" id="cmd-tabs" style="padding:12px 20px 0">
            <button class="tab active" data-l="temperature">🌡 Temperature</button>
            <button class="tab" data-l="rain">🌧 Rainfall</button>
            <button class="tab" data-l="aqi">💨 Air Quality</button>
            <button class="tab" data-l="wind">💨 Wind</button>
            <button class="tab" data-l="uv">☀ UV Index</button>
            <button class="tab" data-l="humidity">💧 Humidity</button>
        </div>
        <div id="cmd-map" class="map-container" style="height:500px;border-radius:0;border:none;margin-top:12px"></div>
        <div style="padding:10px 20px;font-size:11px;color:var(--text-muted);display:flex;justify-content:space-between;border-top:1px solid var(--border)">
            <span>📡 Open-Meteo Live Data · 56 Districts</span>
            <span id="cmd-map-status">Layer: Temperature</span>
        </div>
    </div>

    <!-- Bottom Tables -->
    <div class="card-grid g2 mt-3">
        <div class="card">
            <div class="card-header">
                <h3>🚨 Priority Alerts (${alerts.length})</h3>
                <span class="badge ${alerts.length?'b-danger':'b-success'}">${alerts.length?'ACTIVE':'CLEAR'}</span>
            </div>
            <div class="tbl-scroll" style="max-height:320px">
                <table class="tbl">
                    <thead><tr><th></th><th>Type</th><th>District</th><th>Severity</th><th>Value</th></tr></thead>
                    <tbody>
                    ${alerts.slice(0,20).map(a=>`<tr>
                        <td>${a.icon||''}</td>
                        <td style="text-transform:capitalize">${a.type.replace(/_/g,' ')}</td>
                        <td><b>${a.district}</b></td>
                        <td>${severityBadge(a.severity)}</td>
                        <td style="font-weight:600">${fmt(a.value,0)}</td>
                    </tr>`).join('')||'<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px">✅ No active alerts</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="card">
            <div class="card-header">
                <h3>🌡 Temperature Overview</h3>
                <span class="badge b-orange">${hotCount} hot · ${coolCount} cool</span>
            </div>
            <div style="height:200px;margin-bottom:12px"><canvas id="cmd-temp-chart"></canvas></div>
            <div class="tbl-scroll" style="max-height:180px">
                <table class="tbl">
                    <thead><tr><th>District</th><th>Province</th><th>Max</th><th>Min</th><th>Range</th></tr></thead>
                    <tbody>
                    ${Object.entries(weatherData).sort((a,b)=>(b[1].stats?.temp_max_7d||0)-(a[1].stats?.temp_max_7d||0)).slice(0,15).map(([n,d])=>{
                        const max=d.stats?.temp_max_7d||0, min=d.stats?.temp_min_7d||0;
                        return `<tr>
                            <td><b>${n}</b></td>
                            <td>${d.province}</td>
                            <td style="color:${tempColor(max)};font-weight:600">${fmtC(max)}</td>
                            <td style="color:${tempColor(min)}">${fmtC(min)}</td>
                            <td><div class="progress" style="width:80px"><div class="fill" style="width:${Math.min(100,((max-min)/20)*100)}%;background:${tempColor(max)}"></div></div></td>
                        </tr>`;
                    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;

    setTimeout(()=>{
        const map = initFloodReplayMap('cmd-map', { zoom: 6 });
        let cur = null;

        function showLayer(layer) {
            if(cur) map.removeLayer(cur);
            const statusEl = document.getElementById('cmd-map-status');

            const cfg = {
                temperature: {
                    data: weatherData,
                    color: (_,d) => tempColor(d.stats?.temp_max_7d),
                    popup: (n,d) => `<div style="min-width:140px"><b style="font-size:14px">${n}</b><br><span style="color:#94a3b8">${d.province}</span><hr style="margin:6px 0;border-color:#333"><div style="display:flex;justify-content:space-between"><span>🌡 Max:</span><b style="color:${tempColor(d.stats?.temp_max_7d)}">${fmtC(d.stats?.temp_max_7d)}</b></div><div style="display:flex;justify-content:space-between"><span>❄ Min:</span><b style="color:${tempColor(d.stats?.temp_min_7d)}">${fmtC(d.stats?.temp_min_7d)}</b></div></div>`,
                    radius: (n,d) => Math.max(6, Math.min(14, (d.stats?.temp_max_7d||30)/3)),
                    status: 'Temperature'
                },
                rain: {
                    data: weatherData,
                    color: (_,d) => rainColor(d.stats?.rain_total_7d),
                    popup: (n,d) => `<div style="min-width:140px"><b style="font-size:14px">${n}</b><br><span style="color:#94a3b8">${d.province}</span><hr style="margin:6px 0;border-color:#333"><div style="display:flex;justify-content:space-between"><span>🌧 7-Day:</span><b style="color:${rainColor(d.stats?.rain_total_7d)}">${fmtMm(d.stats?.rain_total_7d)}</b></div><div style="display:flex;justify-content:space-between"><span>📊 Peak:</span><b>${fmtMm(d.stats?.rain_max_daily)}</b></div></div>`,
                    radius: (n,d) => Math.max(5, Math.min(14, (d.stats?.rain_total_7d||0)/6)),
                    status: 'Rainfall (7-day)'
                },
                aqi: {
                    data: aqiData,
                    color: (_,d) => aqiColor(d.stats?.aqi_max),
                    popup: (n,d) => `<div style="min-width:140px"><b style="font-size:14px">${n}</b><br><span style="color:#94a3b8">${d.province||''}</span><hr style="margin:6px 0;border-color:#333"><div style="display:flex;justify-content:space-between"><span>💨 AQI:</span><b style="color:${aqiColor(d.stats?.aqi_max)}">${d.stats?.aqi_max?Math.round(d.stats.aqi_max):'-'}</b></div><div style="display:flex;justify-content:space-between"><span>PM2.5:</span><b>${fmt(d.stats?.pm25_max,0)}</b></div></div>`,
                    radius: (n,d) => Math.max(5, Math.min(14, (d.stats?.aqi_max||0)/15)),
                    status: 'Air Quality Index'
                },
                wind: {
                    data: weatherData,
                    color: (_,d) => windColor(d.stats?.wind_max_7d),
                    popup: (n,d) => `<div style="min-width:140px"><b style="font-size:14px">${n}</b><br><span style="color:#94a3b8">${d.province}</span><hr style="margin:6px 0;border-color:#333"><div style="display:flex;justify-content:space-between"><span>💨 Wind:</span><b style="color:${windColor(d.stats?.wind_max_7d)}">${fmt(d.stats?.wind_max_7d,0)} km/h</b></div><div style="display:flex;justify-content:space-between"><span>🌪 Gusts:</span><b>${fmt(d.stats?.gusts_max_7d,0)} km/h</b></div></div>`,
                    radius: (n,d) => Math.max(5, Math.min(12, (d.stats?.wind_max_7d||0)/5)),
                    status: 'Wind Speed'
                },
                uv: {
                    data: weatherData,
                    color: (_,d) => uvColor(d.stats?.uv_max_7d),
                    popup: (n,d) => `<div style="min-width:140px"><b style="font-size:14px">${n}</b><br><span style="color:#94a3b8">${d.province}</span><hr style="margin:6px 0;border-color:#333"><div style="display:flex;justify-content:space-between"><span>☀ UV Index:</span><b style="color:${uvColor(d.stats?.uv_max_7d)}">${fmt(d.stats?.uv_max_7d,1)}</b></div></div>`,
                    radius: (n,d) => Math.max(5, Math.min(12, (d.stats?.uv_max_7d||0)*1.2)),
                    status: 'UV Index'
                },
                humidity: {
                    data: weatherData,
                    color: (_,d) => { const h=d.forecast?.hourly?.relative_humidity_2m||[]; const now=new Date().getHours(); const rh=h[now]||h[0]||50; return rh>80?'#3b82f6':rh>60?'#22c55e':rh>40?'#eab308':'#f97316'; },
                    popup: (n,d) => { const h=d.forecast?.hourly?.relative_humidity_2m||[]; const now=new Date().getHours(); const rh=h[now]||h[0]||'-'; return `<div style="min-width:140px"><b style="font-size:14px">${n}</b><br><span style="color:#94a3b8">${d.province}</span><hr style="margin:6px 0;border-color:#333"><div style="display:flex;justify-content:space-between"><span>💧 Humidity:</span><b>${rh}%</b></div></div>`; },
                    radius: () => 7,
                    status: 'Humidity'
                }
            };

            const c = cfg[layer];
            if(!c) return;
            if(statusEl) statusEl.textContent = 'Layer: ' + c.status;

            cur = L.layerGroup();
            Object.entries(c.data).forEach(([name, d]) => {
                if(!d.lat || !d.lng) return;
                const radius = c.radius ? c.radius(name, d) : 7;
                const color = c.color(name, d);
                const m = L.circleMarker([d.lat, d.lng], {
                    radius: radius,
                    fillColor: color,
                    color: 'rgba(255,255,255,0.8)',
                    weight: 1.5,
                    fillOpacity: 0.8,
                    className: 'climate-marker'
                });
                m.bindPopup(c.popup(name, d), { className: 'dark-popup', maxWidth: 250 });
                cur.addLayer(m);
            });
            cur.addTo(map);
        }

        showLayer('temperature');
        $$('#cmd-tabs .tab').forEach(t => t.addEventListener('click', () => {
            $$('#cmd-tabs .tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            showLayer(t.dataset.l);
        }));

        // Temperature distribution chart
        const tc = document.getElementById('cmd-temp-chart');
        if(tc) {
            const ranges = {'<20°C':0, '20-25°C':0, '25-30°C':0, '30-35°C':0, '35-40°C':0, '≥40°C':0};
            Object.values(weatherData).forEach(d => {
                const t = d.stats?.temp_max_7d || 0;
                if(t>=40) ranges['≥40°C']++;
                else if(t>=35) ranges['35-40°C']++;
                else if(t>=30) ranges['30-35°C']++;
                else if(t>=25) ranges['25-30°C']++;
                else if(t>=20) ranges['20-25°C']++;
                else ranges['<20°C']++;
            });
            makeBar(tc.getContext('2d'), Object.keys(ranges), Object.values(ranges),
                ['#3b82f6','#22c55e','#84cc16','#eab308','#f97316','#ef4444'], { barThickness: 20 });
        }
    }, 150);
}
