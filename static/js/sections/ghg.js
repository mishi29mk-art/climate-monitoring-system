/* ─── Greenhouse Gases Section ──────────────────────────────── */
async function render_ghg(el) {
    el.innerHTML = '<div class="loading">Loading greenhouse gas data…</div>';
    try {
        const res = await fetch('/api/modules/ghg');
        const d = await res.json();
        const a = d.averages || {};
        const worst = d.worst_co || [];

        el.innerHTML = `
        <div class="sec-hdr"><h2>🏭 Greenhouse Gas Emissions</h2><p>Real-time CO, NO₂, SO₂, O₃ monitoring across 20 major districts — Open-Meteo Air Quality API</p>
        <div class="hdr-meta"><span>📊 ${d.count} districts monitored</span><span>🕐 Last fetch: ${d.last_fetch}</span></div></div>

        <div class="card-grid g4">
            <div class="stat-card s-orange"><div class="stat-icon">💨</div><div class="stat-value" style="color:${C.orange}">${fmt(a.co,0)}</div><div class="stat-label">Avg CO (µg/m³)</div><div class="stat-sub">Carbon Monoxide</div></div>
            <div class="stat-card s-yellow"><div class="stat-icon">🌫</div><div class="stat-value" style="color:${C.warning}">${fmt(a.no2,1)}</div><div class="stat-label">Avg NO₂ (µg/m³)</div><div class="stat-sub">Nitrogen Dioxide</div></div>
            <div class="stat-card s-purple"><div class="stat-icon">⚗</div><div class="stat-value" style="color:${C.purple}">${fmt(a.so2,1)}</div><div class="stat-label">Avg SO₂ (µg/m³)</div><div class="stat-sub">Sulphur Dioxide</div></div>
            <div class="stat-card s-blue"><div class="stat-icon">☀</div><div class="stat-value" style="color:${C.info}">${fmt(a.o3,0)}</div><div class="stat-label">Avg O₃ (µg/m³)</div><div class="stat-sub">Ozone</div></div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header"><h3>📊 Emission Levels by District</h3></div>
                <div id="ghg-map" style="height:380px;border-radius:var(--r-md);overflow:hidden"></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>📊 Gas Distribution</h3></div>
                <div style="height:340px"><canvas id="ghg-doughnut"></canvas></div>
            </div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header"><h3>🏭 Top CO Emitters</h3></div>
                <div class="tbl-scroll" style="max-height:300px"><table class="tbl"><thead><tr><th>District</th><th>Province</th><th>CO</th><th>NO₂</th><th>SO₂</th><th>O₃</th></tr></thead><tbody>
                ${worst.map(d => `<tr><td><b>${d.district}</b></td><td>${d.province}</td><td style="color:${C.orange};font-weight:600">${fmt(d.co,0)}</td><td>${fmt(d.no2,1)}</td><td>${fmt(d.so2,1)}</td><td>${fmt(d.o3,0)}</td></tr>`).join('')}
                </tbody></table></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>📊 NO₂ Comparison</h3></div>
                <div style="height:280px"><canvas id="ghg-no2-bar"></canvas></div>
            </div>
        </div>

        <div class="card mt-3">
            <div class="card-header"><h3>📋 Full District GHG Data (${d.count})</h3></div>
            <div class="tbl-scroll" style="max-height:300px"><table class="tbl"><thead><tr><th>District</th><th>Province</th><th>CO</th><th>NO₂</th><th>SO₂</th><th>O₃</th><th>PM2.5</th><th>PM10</th><th>AQI</th></tr></thead><tbody>
            ${d.districts.map(g => `<tr><td><b>${g.district}</b></td><td>${g.province}</td><td style="color:${g.co>1000?C.danger:g.co>500?C.orange:C.success}">${fmt(g.co,0)}</td><td>${fmt(g.no2,1)}</td><td>${fmt(g.so2,1)}</td><td>${fmt(g.o3,0)}</td><td>${fmt(g.pm25,0)}</td><td>${fmt(g.pm10,0)}</td><td>${fmt(g.aqi,0)}</td></tr>`).join('')}
            </tbody></table></div>
        </div>

        <div class="card mt-3">
            <div class="card-header"><h3>📚 Data Sources & References</h3></div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:8px 0">
            ${d.sources.map(s => `<div style="padding:14px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--r-md)">
                <div style="font-weight:600;margin-bottom:4px">${s.name}</div>
                <div style="font-size:12px;color:var(--text-secondary)">Gases: ${s.gases.join(', ')}</div>
                <span class="badge ${s.status==='active'?'b-success':'b-info'}" style="margin-top:6px">${s.status}</span>
            </div>`).join('')}
            </div>
        </div>`;

        setTimeout(() => {
            // Map with GHG markers
            const map = initMap('ghg-map', { zoom: 5, style: 'terrain' });
            const layer = L.layerGroup();
            d.districts.forEach(g => {
                const color = g.co > 1000 ? '#ef4444' : g.co > 500 ? '#f97316' : g.co > 200 ? '#eab308' : '#22c55e';
                const m = L.circleMarker([g.lat, g.lng], { radius: 8, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.8 });
                m.bindPopup(`<b>${g.district}</b><br>CO: ${fmt(g.co,0)} µg/m³<br>NO₂: ${fmt(g.no2,1)} µg/m³<br>O₃: ${fmt(g.o3,0)} µg/m³`, { className: 'dark-popup' });
                layer.addLayer(m);
            });
            layer.addTo(map);

            // Doughnut chart
            const dc = document.getElementById('ghg-doughnut');
            if (dc) {
                const totals = { 'CO': 0, 'NO₂': 0, 'SO₂': 0, 'O₃': 0 };
                d.districts.forEach(g => { totals['CO'] += g.co; totals['NO₂'] += g.no2; totals['SO₂'] += g.so2; totals['O₃'] += g.o3; });
                makeDoughnut(dc.getContext('2d'), Object.keys(totals), Object.values(totals), [C.orange, C.warning, C.purple, C.info]);
            }

            // NO2 bar chart
            const nc = document.getElementById('ghg-no2-bar');
            if (nc) {
                const top = worst.slice(0, 10);
                makeHBar(nc.getContext('2d'), top.map(d => d.district.substring(0, 8)), top.map(d => d.no2), top.map(d => d.no2 > 20 ? C.danger : d.no2 > 10 ? C.warning : C.success));
            }
        }, 100);
    } catch(e) { el.innerHTML = '<div class="loading">Error: '+e.message+'</div>'; }
}
