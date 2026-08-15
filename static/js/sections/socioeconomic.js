/* ─── Socio-Economic Data Section ──────────────────────────── */
async function render_socioeconomic(el) {
    el.innerHTML = '<div class="loading">Loading socio-economic data…</div>';
    try {
        const res = await fetch('/api/modules/socioeconomic');
        const d = await res.json();
        const sm = d.summary;

        el.innerHTML = `
        <div class="sec-hdr"><h2>👥 Socio-Economic Data</h2><p>Population density, agricultural zones, infrastructure, and impact analysis data for Pakistan</p>
        <div class="hdr-meta"><span>👥 ${(sm.total_population/1e6).toFixed(1)}M population</span><span>🌾 ${d.agriculture.length} agricultural zones</span><span>🏥 ${d.infrastructure.find(i=>i.type==='Major Hospitals')?.count} hospitals</span></div></div>

        <div class="card-grid g4">
            <div class="stat-card s-blue"><div class="stat-icon">👥</div><div class="stat-value" style="color:${C.info}">${(sm.total_population/1e6).toFixed(1)}M</div><div class="stat-label">Total Population</div><div class="stat-sub">56 districts</div></div>
            <div class="stat-card s-green"><div class="stat-icon">🏙</div><div class="stat-value" style="color:${C.success}">${sm.urban_ratio}%</div><div class="stat-label">Urban Population</div><div class="stat-sub">${(sm.urban_population/1e6).toFixed(1)}M in cities</div></div>
            <div class="stat-card s-orange"><div class="stat-icon">🌾</div><div class="stat-value" style="color:${C.orange}">${sm.gdp_agriculture_pct}%</div><div class="stat-label">GDP from Agriculture</div><div class="stat-sub">Largest sector</div></div>
            <div class="stat-card s-red"><div class="stat-icon">⚠</div><div class="stat-value" style="color:${C.danger}">${(sm.climate_vulnerable_population/1e6).toFixed(1)}M</div><div class="stat-label">Climate Vulnerable</div><div class="stat-sub">60% of population</div></div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header"><h3>👥 Top Population Districts</h3></div>
                <div class="tbl-scroll" style="max-height:320px"><table class="tbl"><thead><tr><th>District</th><th>Province</th><th>Population</th><th>Density</th></tr></thead><tbody>
                ${d.population.slice(0,20).map(p => `<tr><td><b>${p.district}</b></td><td>${p.province}</td><td style="font-weight:600;color:${C.info}">${p.population > 5e6 ? (p.population/1e6).toFixed(1)+'M' : (p.population/1e3).toFixed(0)+'K'}</td><td>${p.density > 0 ? p.density+'/km²' : '-'}</td></tr>`).join('')}
                </tbody></table></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>🌾 Agricultural Zones</h3></div>
                <div style="display:grid;gap:10px;padding:8px 0">
                ${d.agriculture.map(a => `
                    <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)">
                        <div style="font-size:22px">${a.icon}</div>
                        <div style="flex:1">
                            <div style="font-weight:600">${a.zone}</div>
                            <div style="font-size:11px;color:var(--text-muted)">Crops: ${a.crops}</div>
                        </div>
                        <div style="text-align:right">
                            <div style="font-size:12px;font-weight:600;color:${C.success}">${a.area}</div>
                            <div style="font-size:10px;color:var(--text-muted)">${a.province}</div>
                        </div>
                    </div>
                `).join('')}
                </div>
            </div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header"><h3>🏗 Infrastructure</h3></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:8px 0">
                ${d.infrastructure.map(i => `
                    <div style="padding:12px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border);text-align:center">
                        <div style="font-size:20px;margin-bottom:4px">${i.icon}</div>
                        <div style="font-size:18px;font-weight:700;color:${C.info}">${i.count}</div>
                        <div style="font-size:11px;color:var(--text-muted)">${i.type}</div>
                    </div>
                `).join('')}
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>📊 Economic Indicators</h3></div>
                <div style="padding:12px 0">
                    <div style="margin-bottom:12px">
                        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>Agriculture</span><span style="font-weight:600">${sm.gdp_agriculture_pct}%</span></div>
                        <div class="progress"><div class="fill" style="width:${sm.gdp_agriculture_pct}%;background:${C.success}"></div></div>
                    </div>
                    <div style="margin-bottom:12px">
                        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>Industry</span><span style="font-weight:600">${sm.gdp_industry_pct}%</span></div>
                        <div class="progress"><div class="fill" style="width:${sm.gdp_industry_pct}%;background:${C.warning}"></div></div>
                    </div>
                    <div style="margin-bottom:12px">
                        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>Services</span><span style="font-weight:600">${sm.gdp_services_pct}%</span></div>
                        <div class="progress"><div class="fill" style="width:${sm.gdp_services_pct}%;background:${C.info}"></div></div>
                    </div>
                    <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
                        <div style="padding:10px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border);text-align:center"><div style="font-size:16px;font-weight:700;color:${C.warning}">${sm.literacy_rate}%</div><div style="font-size:10px;color:var(--text-muted)">Literacy Rate</div></div>
                        <div style="padding:10px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border);text-align:center"><div style="font-size:16px;font-weight:700;color:${C.danger}">${sm.poverty_rate}%</div><div style="font-size:10px;color:var(--text-muted)">Poverty Rate</div></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card"><h3 style="margin-bottom:10px">📊 GDP Sector Distribution</h3><div style="height:200px"><canvas id="socio-gdp-chart"></canvas></div></div>
            <div class="card"><h3 style="margin-bottom:10px">📊 Urban vs Rural</h3><div style="height:200px"><canvas id="socio-pop-chart"></canvas></div></div>
        </div>`;

        setTimeout(() => {
            const gc = document.getElementById('socio-gdp-chart');
            if (gc) makeDoughnut(gc.getContext('2d'), ['Agriculture','Industry','Services'], [sm.gdp_agriculture_pct, sm.gdp_industry_pct, sm.gdp_services_pct], [C.success, C.warning, C.info]);
            const pc = document.getElementById('socio-pop-chart');
            if (pc) makeDoughnut(pc.getContext('2d'), ['Urban','Rural'], [sm.urban_ratio, 100-sm.urban_ratio], [C.info, C.success]);
        }, 100);
    } catch(e) { el.innerHTML = '<div class="loading">Error: '+e.message+'</div>'; }
}
