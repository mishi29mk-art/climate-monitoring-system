/* ─── Data Ingestion Layer ─────────────────────────────────── */
async function render_data_ingestion(el) {
    el.innerHTML = '<div class="loading">Loading data sources…</div>';
    try {
        const res = await fetch('/api/modules/ingestion');
        const d = await res.json();
        if (!d || !d.sources) throw new Error('Invalid ingestion data');

        const types = {};
        const cats = {};
        d.sources.forEach(s => {
            types[s.type] = (types[s.type] || 0) + 1;
            cats[s.category] = (cats[s.category] || 0) + 1;
        });

        el.innerHTML = `
        <div class="sec-hdr">
            <h2>📥 Data Ingestion Layer</h2>
            <p>Real-time data pipeline — pulling climate data from APIs, satellites, weather stations, and IoT sensors</p>
            <div class="hdr-meta">
                <span>📊 ${d.total} data sources</span>
                <span>🟢 ${d.active} active</span>
                <span>🕐 Updated: ${d.last_updated}</span>
            </div>
        </div>

        <div class="card-grid g4">
            <div class="stat-card s-green">
                <div class="stat-icon">📡</div>
                <div class="stat-value" style="color:${C.success}">${d.active}</div>
                <div class="stat-label">Active Sources</div>
                <div class="stat-sub">Real-time feeds</div>
            </div>
            <div class="stat-card s-blue">
                <div class="stat-icon">📦</div>
                <div class="stat-value">${d.total}</div>
                <div class="stat-label">Total Sources</div>
                <div class="stat-sub">${Object.keys(types).length} types</div>
            </div>
            <div class="stat-card s-orange">
                <div class="stat-icon">🛰</div>
                <div class="stat-value" style="color:${C.orange}">${types.Satellite || 0}</div>
                <div class="stat-label">Satellite Feeds</div>
                <div class="stat-sub">Simulated</div>
            </div>
            <div class="stat-card s-cyan">
                <div class="stat-icon">📡</div>
                <div class="stat-value" style="color:${C.cyan}">${types.IoT || 0}</div>
                <div class="stat-label">IoT Sensors</div>
                <div class="stat-sub">Planned</div>
            </div>
        </div>

        <div class="card mt-3">
            <div class="card-header">
                <h3>📡 Data Sources Registry</h3>
                <span class="badge b-success">${d.active} Active</span>
            </div>
            <div class="tbl-scroll" style="max-height:500px">
                <table class="tbl">
                    <thead>
                        <tr>
                            <th style="width:44px"></th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Last Sync</th>
                            <th style="text-align:right">Records</th>
                        </tr>
                    </thead>
                    <tbody>
                    ${d.sources.map(s => {
                        const statusClass = s.status === 'active' ? 'b-success' : s.status === 'simulated' ? 'b-warning' : 'b-info';
                        const statusIcon = s.status === 'active' ? '🟢' : s.status === 'simulated' ? '🟡' : '🔵';
                        const statusLabel = s.status === 'active' ? 'Active' : s.status === 'simulated' ? 'Simulated' : 'Planned';
                        const recColor = s.records > 0 ? C.success : C.muted;
                        return `<tr>
                            <td style="font-size:24px;text-align:center">${s.icon}</td>
                            <td><b>${s.name}</b><br><span style="font-size:11px;color:var(--text-muted)">${s.frequency}</span></td>
                            <td><span class="badge b-purple" style="font-size:10px">${s.type}</span></td>
                            <td style="color:var(--text-secondary)">${s.category}</td>
                            <td><span class="badge ${statusClass}" style="font-size:10px">${statusIcon} ${statusLabel}</span></td>
                            <td style="font-size:12px;color:var(--text-secondary)">${s.last_sync}</td>
                            <td style="text-align:right;font-weight:700;color:${recColor}">${fmtK(s.records)}</td>
                        </tr>`;
                    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header">
                    <h3>🍩 Sources by Type</h3>
                </div>
                <div style="height:220px"><canvas id="ing-type-chart"></canvas></div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3>📊 Sources by Category</h3>
                </div>
                <div style="height:220px"><canvas id="ing-cat-chart"></canvas></div>
            </div>
        </div>`;

        setTimeout(() => {
            // Doughnut chart for source types
            const tc = document.getElementById('ing-type-chart');
            if (tc) {
                makeDoughnut(
                    tc.getContext('2d'),
                    Object.keys(types),
                    Object.values(types),
                    [C.success, C.info, C.purple, C.orange]
                );
            }
            // Bar chart for categories
            const cc = document.getElementById('ing-cat-chart');
            if (cc) {
                const catKeys = Object.keys(cats);
                const catColors = catKeys.map((_, i) =>
                    [C.success, C.info, C.warning, C.purple, C.purple, C.cyan][i % 6]
                );
                makeBar(
                    cc.getContext('2d'),
                    catKeys,
                    Object.values(cats),
                    catColors,
                    { barThickness: 28 }
                );
            }
        }, 100);
    } catch (e) {
        el.innerHTML = `<div class="loading">Error loading data ingestion: ${e.message}</div>`;
    }
}
