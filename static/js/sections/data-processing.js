/* ─── Data Processing Pipelines ───────────────────────────── */
async function render_data_processing(el) {
    el.innerHTML = '<div class="loading">Loading processing pipelines…</div>';
    try {
        const res = await fetch('/api/modules/processing');
        const d = await res.json();
        if (!d || !d.pipelines) throw new Error('Invalid processing data');

        const m = d.metrics || {};
        const pipelines = d.pipelines || [];

        el.innerHTML = `
        <div class="sec-hdr">
            <h2>⚙️ Data Processing Pipelines</h2>
            <p>ETL pipelines — transforming raw data into validated, quality-checked climate datasets</p>
            <div class="hdr-meta">
                <span>🔄 ${m.active || 0} completed pipelines</span>
                <span>📈 ${fmt(m.avg_quality, 1)}% avg quality</span>
                <span>🕐 Updated: ${d.last_updated}</span>
            </div>
        </div>

        <div class="card-grid g4">
            <div class="stat-card s-green">
                <div class="stat-icon">✅</div>
                <div class="stat-value" style="color:${C.success}">${m.active || 0}</div>
                <div class="stat-label">Active Pipelines</div>
                <div class="stat-sub">Completed successfully</div>
            </div>
            <div class="stat-card s-blue">
                <div class="stat-icon">📊</div>
                <div class="stat-value" style="color:${C.info}">${fmt(m.avg_quality, 1)}%</div>
                <div class="stat-label">Avg Data Quality</div>
                <div class="stat-sub">Across all pipelines</div>
            </div>
            <div class="stat-card s-orange">
                <div class="stat-icon">📥</div>
                <div class="stat-value" style="color:${C.orange}">${fmtK(m.total_input || 0)}</div>
                <div class="stat-label">Input Records</div>
                <div class="stat-sub">Raw data ingested</div>
            </div>
            <div class="stat-card s-cyan">
                <div class="stat-icon">📤</div>
                <div class="stat-value" style="color:${C.cyan}">${fmtK(m.total_output || 0)}</div>
                <div class="stat-label">Output Records</div>
                <div class="stat-sub">Clean data produced</div>
            </div>
        </div>

        <div class="card mt-3">
            <div class="card-header">
                <h3>🔄 Processing Pipelines</h3>
                <span class="badge b-info">${pipelines.length} Total</span>
            </div>
            <div class="tbl-scroll" style="max-height:500px">
                <table class="tbl">
                    <thead>
                        <tr>
                            <th>Pipeline Name</th>
                            <th>Status</th>
                            <th style="text-align:right">Input</th>
                            <th style="text-align:right">Output</th>
                            <th style="min-width:140px">Quality</th>
                            <th style="text-align:right">Duration</th>
                            <th>Last Run</th>
                        </tr>
                    </thead>
                    <tbody>
                    ${pipelines.map(p => {
                        const statusClass = p.status === 'completed' ? 'b-success' : p.status === 'running' ? 'b-info' : 'b-warning';
                        const statusIcon = p.status === 'completed' ? '✅' : p.status === 'running' ? '🔄' : '⏸';
                        const statusLabel = p.status.charAt(0).toUpperCase() + p.status.slice(1);
                        const qualityColor = p.quality >= 99 ? C.success : p.quality >= 95 ? C.info : p.quality >= 80 ? C.warning : C.danger;
                        const qualityPct = Math.min(100, Math.max(0, p.quality));
                        const durationSec = p.duration_ms > 0 ? (p.duration_ms / 1000).toFixed(1) + 's' : '-';
                        return `<tr>
                            <td><b>${p.name}</b></td>
                            <td><span class="badge ${statusClass}" style="font-size:10px">${statusIcon} ${statusLabel}</span></td>
                            <td style="text-align:right;font-weight:500">${fmtK(p.input)}</td>
                            <td style="text-align:right;font-weight:500">${fmtK(p.output)}</td>
                            <td>
                                ${p.quality > 0 ? `
                                <div style="display:flex;align-items:center;gap:8px">
                                    <div class="progress" style="flex:1;height:6px">
                                        <div class="fill" style="width:${qualityPct}%;background:${qualityColor}"></div>
                                    </div>
                                    <span style="font-size:11px;font-weight:600;color:${qualityColor};min-width:36px;text-align:right">${fmt(p.quality, 1)}%</span>
                                </div>` : '<span style="color:var(--text-muted);font-size:11px">—</span>'}
                            </td>
                            <td style="text-align:right;font-size:12px;color:var(--text-secondary)">${durationSec}</td>
                            <td style="font-size:12px;color:var(--text-muted)">${p.last_run}</td>
                        </tr>`;
                    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header">
                    <h3>🍩 Pipeline Status Distribution</h3>
                </div>
                <div style="height:220px"><canvas id="proc-status-chart"></canvas></div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3>⏱ Pipeline Duration (ms)</h3>
                </div>
                <div style="height:220px"><canvas id="proc-dur-chart"></canvas></div>
            </div>
        </div>`;

        setTimeout(() => {
            // Doughnut chart of pipeline statuses
            const sc = document.getElementById('proc-status-chart');
            if (sc) {
                const statusCounts = {};
                pipelines.forEach(p => {
                    const label = p.status.charAt(0).toUpperCase() + p.status.slice(1);
                    statusCounts[label] = (statusCounts[label] || 0) + 1;
                });
                const statusColors = Object.keys(statusCounts).map(k => {
                    if (k === 'Completed') return C.success;
                    if (k === 'Running') return C.info;
                    if (k === 'Standby') return C.warning;
                    return C.muted;
                });
                makeDoughnut(sc.getContext('2d'), Object.keys(statusCounts), Object.values(statusCounts), statusColors);
            }

            // Bar chart of durations
            const dc = document.getElementById('proc-dur-chart');
            if (dc) {
                const activePipelines = pipelines.filter(p => p.duration_ms > 0);
                const durColors = activePipelines.map(p =>
                    p.duration_ms > 1000 ? C.danger : p.duration_ms > 500 ? C.warning : C.success
                );
                makeBar(
                    dc.getContext('2d'),
                    activePipelines.map(p => p.name.split(' ').slice(0, 2).join(' ')),
                    activePipelines.map(p => p.duration_ms),
                    durColors,
                    { barThickness: 24 }
                );
            }
        }, 100);
    } catch (e) {
        el.innerHTML = `<div class="loading">Error loading processing data: ${e.message}</div>`;
    }
}
