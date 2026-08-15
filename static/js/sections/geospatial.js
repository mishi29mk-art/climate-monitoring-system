/* ─── Geospatial / GIS Data Section ─────────────────────────── */
async function render_geospatial(el) {
    el.innerHTML = '<div class="loading">Loading geospatial data…</div>';
    try {
        const res = await fetch('/api/modules/geospatial');
        const d = await res.json();
        const t = d.terrain_stats;

        el.innerHTML = `
        <div class="sec-hdr"><h2>🗺 Geospatial / GIS Data</h2><p>Administrative boundaries, elevation models, land use, watersheds, and satellite imagery for Pakistan</p>
        <div class="hdr-meta"><span>📊 ${d.total_sources} data sources</span><span>🏔 Elevation: 0m → 8,611m</span></div></div>

        <div class="card-grid g4">
            <div class="stat-card s-green"><div class="stat-icon">📍</div><div class="stat-value" style="color:${C.success}">${d.admin_boundaries.reduce((a,b)=>a+b.records,0)}</div><div class="stat-label">Admin Boundaries</div><div class="stat-sub">Country → District</div></div>
            <div class="stat-card s-blue"><div class="stat-icon">🏔</div><div class="stat-value" style="color:${C.info}">${d.dem.length}</div><div class="stat-label">DEM Sources</div><div class="stat-sub">30m–90m resolution</div></div>
            <div class="stat-card s-orange"><div class="stat-icon">🌿</div><div class="stat-value" style="color:${C.orange}">${d.lulc.length}</div><div class="stat-label">Land Cover Sources</div><div class="stat-sub">ESA, MODIS, Copernicus</div></div>
            <div class="stat-card s-cyan"><div class="stat-icon">🛰</div><div class="stat-value" style="color:${C.cyan}">${d.satellite.length}</div><div class="stat-label">Satellite Imagery</div><div class="stat-sub">Sentinel, Landsat, MODIS</div></div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header"><h3>📍 Administrative Boundaries</h3></div>
                <div style="display:grid;gap:10px;padding:8px 0">
                ${d.admin_boundaries.map(b => `
                    <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)">
                        <div style="font-size:20px">📍</div>
                        <div style="flex:1"><div style="font-weight:600">${b.name}</div><div style="font-size:11px;color:var(--text-muted)">${b.source} · ${b.type}</div></div>
                        <div style="text-align:right"><div style="font-size:18px;font-weight:700;color:${C.info}">${b.records}</div><div style="font-size:10px;color:var(--text-muted)">${b.level}</div></div>
                    </div>
                `).join('')}
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>🏔 Elevation / DEM</h3></div>
                <div style="display:grid;gap:10px;padding:8px 0">
                ${d.dem.map(s => `
                    <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)">
                        <div style="font-size:20px">${s.icon}</div>
                        <div style="flex:1"><div style="font-weight:600">${s.name}</div><div style="font-size:11px;color:var(--text-muted)">${s.source} · ${s.coverage}</div></div>
                        <span class="badge b-success" style="font-size:10px">${s.resolution}</span>
                    </div>
                `).join('')}
                </div>
            </div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header"><h3>🌿 Land Use / Land Cover</h3></div>
                <div style="display:grid;gap:10px;padding:8px 0">
                ${d.lulc.map(s => `
                    <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)">
                        <div style="font-size:20px">${s.icon}</div>
                        <div style="flex:1"><div style="font-weight:600">${s.name}</div><div style="font-size:11px;color:var(--text-muted)">${s.source} · ${s.coverage}</div></div>
                        <span class="badge b-info" style="font-size:10px">${s.resolution}</span>
                    </div>
                `).join('')}
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>🌊 Watersheds & River Networks</h3></div>
                <div style="display:grid;gap:10px;padding:8px 0">
                ${d.watersheds.map(s => `
                    <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)">
                        <div style="font-size:20px">${s.icon}</div>
                        <div style="flex:1"><div style="font-weight:600">${s.name}</div><div style="font-size:11px;color:var(--text-muted)">${s.source} · ${s.coverage}</div></div>
                        <span class="badge ${s.status==='active'?'b-success':'b-info'}" style="font-size:10px">${s.status}</span>
                    </div>
                `).join('')}
                </div>
            </div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header"><h3>🛰 Satellite Imagery</h3></div>
                <div style="display:grid;gap:10px;padding:8px 0">
                ${d.satellite.map(s => `
                    <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)">
                        <div style="font-size:20px">${s.icon}</div>
                        <div style="flex:1"><div style="font-weight:600">${s.name}</div><div style="font-size:11px;color:var(--text-muted)">${s.source} · ${s.coverage}</div></div>
                        <span class="badge ${s.status==='active'?'b-success':s.status==='simulated'?'b-warning':'b-info'}" style="font-size:10px">${s.status}</span>
                    </div>
                `).join('')}
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>🏔 Pakistan Terrain Profile</h3></div>
                <div style="padding:8px 0">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                        <div style="padding:12px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)"><div style="font-size:11px;color:var(--text-muted)">Highest Point</div><div style="font-weight:600;color:${C.danger}">${t.highest_point.name}</div><div style="font-size:12px;color:${C.warning}">${t.highest_point.elevation}</div></div>
                        <div style="padding:12px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)"><div style="font-size:11px;color:var(--text-muted)">Lowest Point</div><div style="font-weight:600;color:${C.success}">${t.lowest_point.name}</div><div style="font-size:12px;color:${C.info}">${t.lowest_point.elevation}</div></div>
                        <div style="padding:12px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)"><div style="font-size:11px;color:var(--text-muted)">Glaciers</div><div style="font-weight:600;color:${C.info}">${t.glaciers.toLocaleString()}</div><div style="font-size:12px;color:var(--text-muted)">2nd most outside poles</div></div>
                        <div style="padding:12px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)"><div style="font-size:11px;color:var(--text-muted)">Avg Elevation</div><div style="font-weight:600;color:${C.purple}">${t.avg_elevation}</div><div style="font-size:12px;color:var(--text-muted)">Across 56 districts</div></div>
                    </div>
                    <div style="margin-top:12px;padding:12px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)">
                        <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">Land Distribution</div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap">
                        ${t.land_types.map(lt => `<span style="padding:4px 10px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-pill);font-size:11px">${lt}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    } catch(e) { el.innerHTML = '<div class="loading">Error: '+e.message+'</div>'; }
}
