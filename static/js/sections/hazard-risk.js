/* ─── Hazard & Risk Data Section ──────────────────────────── */
async function render_hazard_risk(el) {
    el.innerHTML = '<div class="loading">Loading hazard data…</div>';
    try {
        const res = await fetch('/api/modules/hazard-risk');
        const d = await res.json();
        const s = d.stats;

        el.innerHTML = `
        <div class="sec-hdr"><h2>⚠ Hazard & Risk Data</h2><p>Flood risk zones, drought indices, wildfire risk, cyclone/storm tracking — multi-source hazard monitoring</p>
        <div class="hdr-meta"><span>🌊 ${s.high_flood_risk} high flood risk districts</span><span>🏜 ${s.drought_districts} drought-affected</span><span>🔥 ${s.wildfire_high} wildfire risk</span></div></div>

        <div class="card-grid g4">
            <div class="stat-card s-red"><div class="stat-icon">🌊</div><div class="stat-value" style="color:${C.danger}">${s.high_flood_risk}</div><div class="stat-label">High Flood Risk</div><div class="stat-sub">GLOFAS monitoring</div></div>
            <div class="stat-card s-orange"><div class="stat-icon">🏜</div><div class="stat-value" style="color:${C.orange}">${s.drought_districts}</div><div class="stat-label">Drought Affected</div><div class="stat-sub">SPI < -1.0</div></div>
            <div class="stat-card s-yellow"><div class="stat-icon">🔥</div><div class="stat-value" style="color:${C.warning}">${s.wildfire_high}</div><div class="stat-label">Wildfire Risk</div><div class="stat-sub">High temp zones</div></div>
            <div class="stat-card s-blue"><div class="stat-icon">🌀</div><div class="stat-value" style="color:${C.info}">${s.active_storms}</div><div class="stat-label">Active Storms</div><div class="stat-sub">Tracking systems</div></div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header"><h3>🌊 Flood Risk Assessment</h3><span class="badge b-danger">${s.high_flood_risk} High Risk</span></div>
                <div class="tbl-scroll" style="max-height:320px"><table class="tbl"><thead><tr><th>District</th><th>Province</th><th>Rain 7d</th><th>Risk Level</th></tr></thead><tbody>
                ${d.flood_risk.map(f => `<tr><td><b>${f.district}</b></td><td>${f.province}</td><td style="color:${rainColor(f.rain_7d)};font-weight:600">${fmtMm(f.rain_7d)}</td>
                    <td><span class="badge ${f.risk==='High'?'b-danger':f.risk==='Moderate'?'b-warning':'b-success'}">${f.risk}</span></td></tr>`).join('')}
                </tbody></table></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>🏜 Drought Index (SPI)</h3><span class="badge b-warning">${s.drought_districts} affected</span></div>
                <div class="tbl-scroll" style="max-height:320px"><table class="tbl"><thead><tr><th>District</th><th>Province</th><th>SPI</th><th>Severity</th></tr></thead><tbody>
                ${d.drought.map(dr => `<tr><td><b>${dr.district}</b></td><td>${dr.province}</td><td style="color:${dr.spi < -1.5 ? C.danger : dr.spi < -1 ? C.warning : dr.spi < 0 ? C.orange : C.success};font-weight:600">${dr.spi}</td>
                    <td><span class="badge ${dr.severity.includes('Extreme')?'b-danger':dr.severity.includes('Severe')?'b-warning':dr.severity.includes('Moderate')?'b-orange':'b-success'}">${dr.severity}</span></td></tr>`).join('')}
                </tbody></table></div>
            </div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header"><h3>🌀 Storm / Cyclone Tracking</h3></div>
                <div style="display:grid;gap:10px;padding:8px 0">
                ${d.storms.map(st => `
                    <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)">
                        <div style="font-size:24px">${st.icon}</div>
                        <div style="flex:1"><div style="font-weight:600">${st.name}</div><div style="font-size:11px;color:var(--text-muted)">${st.type} · ${st.source}</div></div>
                        <span class="badge ${st.status==='active'?'b-success':st.status==='monitoring'?'b-info':'b-warning'}" style="font-size:10px">${st.status}</span>
                    </div>
                `).join('')}
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>🔥 Wildfire Risk (High Temp)</h3></div>
                <div class="tbl-scroll" style="max-height:320px"><table class="tbl"><thead><tr><th>District</th><th>Province</th><th>Max Temp</th><th>Risk</th></tr></thead><tbody>
                ${d.wildfire.map(w => `<tr><td><b>${w.district}</b></td><td>${w.province}</td><td style="color:${tempColor(w.temp)};font-weight:600">${fmtC(w.temp)}</td>
                    <td><span class="badge ${w.risk==='High'?'b-danger':w.risk==='Moderate'?'b-warning':'b-success'}">${w.risk}</span></td></tr>`).join('')}
                </tbody></table></div>
            </div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card"><h3 style="margin-bottom:10px">📊 Flood Risk Distribution</h3><div style="height:200px"><canvas id="hazard-flood-chart"></canvas></div></div>
            <div class="card"><h3 style="margin-bottom:10px">📊 Drought Severity</h3><div style="height:200px"><canvas id="hazard-drought-chart"></canvas></div></div>
        </div>`;

        setTimeout(() => {
            const fc = document.getElementById('hazard-flood-chart');
            if (fc) {
                const counts = {'High':0,'Moderate':0,'Low':0};
                d.flood_risk.forEach(f => counts[f.risk]=(counts[f.risk]||0)+1);
                makeDoughnut(fc.getContext('2d'), Object.keys(counts), Object.values(counts), [C.danger, C.warning, C.success]);
            }
            const dc = document.getElementById('hazard-drought-chart');
            if (dc) {
                const counts = {};
                d.drought.forEach(dr => counts[dr.severity]=(counts[dr.severity]||0)+1);
                makeBar(dc.getContext('2d'), Object.keys(counts).map(k=>k.substring(0,10)), Object.values(counts), [C.danger, C.orange, C.warning, C.success, C.info]);
            }
        }, 100);
    } catch(e) { el.innerHTML = '<div class="loading">Error: '+e.message+'</div>'; }
}
