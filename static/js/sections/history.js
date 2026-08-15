/* ─── Historical Data Archive ───────────────────────────────── */
async function render_history(el) {
    el.innerHTML = '<div class="loading">Loading historical data…</div>';
    try {
        const res = await fetch('/api/history/daily');
        const d = await res.json();
        const history = d.history || [];

        el.innerHTML = `
        <div class="sec-hdr"><h2>📜 Historical Data Archive</h2><p>Daily snapshots of climate data — temperature trends, rainfall patterns, archival & analysis</p>
        <div class="hdr-meta"><span>📅 ${d.days} days archived</span><span>💾 Auto-saved daily</span><span>📊 Trend analysis</span></div></div>

        <div class="card-grid g4">
            <div class="stat-card s-blue"><div class="stat-icon">📅</div><div class="stat-value" style="color:${C.info}">${d.days}</div><div class="stat-label">Days Archived</div><div class="stat-sub">Daily snapshots</div></div>
            <div class="stat-card s-green"><div class="stat-icon">📊</div><div class="stat-value" style="color:${C.success}">${history.length > 0 ? history[history.length-1]?.districts || 0 : 0}</div><div class="stat-label">Latest Snapshot</div><div class="stat-sub">Districts captured</div></div>
            <div class="stat-card s-orange"><div class="stat-icon">🌡</div><div class="stat-value" style="color:${C.orange}">${history.length > 0 ? history[history.length-1]?.avg_temp || 0 : 0}°</div><div class="stat-label">Latest Avg Temp</div><div class="stat-sub">National average</div></div>
            <div class="stat-card s-red"><div class="stat-icon">💾</div><div class="stat-value" style="color:${C.danger}">Auto</div><div class="stat-label">Save Mode</div><div class="stat-sub">Daily at midnight</div></div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header"><h3>📊 Temperature Trend (Archived)</h3></div>
                <div style="height:250px"><canvas id="history-temp-chart"></canvas></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>📊 Archive Timeline</h3></div>
                <div style="height:250px"><canvas id="history-count-chart"></canvas></div>
            </div>
        </div>

        <div class="card mt-3">
            <div class="card-header"><h3>📋 Daily Snapshots</h3><button onclick="fetch('/api/history/save',{method:'POST'}).then(r=>r.json()).then(d=>alert('Saved: '+d.date+' ('+d.districts+' districts)'))" style="background:var(--accent);color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px">💾 Save Snapshot Now</button></div>
            ${history.length > 0 ? `
            <div class="tbl-scroll" style="max-height:300px"><table class="tbl"><thead><tr><th>Date</th><th>Districts</th><th>Avg Temp</th><th>Status</th></tr></thead><tbody>
            ${history.reverse().map(h => `
                <tr><td><b>${h.date}</b></td><td>${h.districts}</td><td style="color:${tempColor(h.avg_temp)};font-weight:600">${h.avg_temp}°C</td>
                <td><span class="badge b-success">✅ Captured</span></td></tr>
            `).join('')}
            </tbody></table></div>` : `
            <div style="padding:40px;text-align:center;color:var(--text-muted)">
                <div style="font-size:40px;margin-bottom:8px">📭</div>
                <div>No historical snapshots yet</div>
                <div style="font-size:12px;margin-top:4px">Click "Save Snapshot Now" to create the first archive entry</div>
                <div style="font-size:12px;margin-top:4px">Or enable auto-save in Settings</div>
            </div>`}
        </div>

        <div class="card mt-3">
            <div class="card-header"><h3>💾 Storage Info</h3></div>
            <div style="padding:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
                <div style="text-align:center;padding:12px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)">
                    <div style="font-size:18px;font-weight:700;color:${C.info}">${d.days * 56}</div>
                    <div style="font-size:11px;color:var(--text-muted)">Total Data Points</div>
                </div>
                <div style="text-align:center;padding:12px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)">
                    <div style="font-size:18px;font-weight:700;color:${C.success}">${(d.days * 0.05).toFixed(1)} MB</div>
                    <div style="font-size:11px;color:var(--text-muted)">Estimated Size</div>
                </div>
                <div style="text-align:center;padding:12px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)">
                    <div style="font-size:18px;font-weight:700;color:${C.orange}">Daily</div>
                    <div style="font-size:11px;color:var(--text-muted)">Save Frequency</div>
                </div>
            </div>
        </div>`;

        setTimeout(() => {
            const tc = document.getElementById('history-temp-chart');
            if (tc && history.length > 0) {
                const dates = history.map(h => h.date.substring(5));
                const temps = history.map(h => h.avg_temp);
                makeLine(tc.getContext('2d'), dates, temps, C.orange, 'Avg Temperature (°C)');
            }
            const cc = document.getElementById('history-count-chart');
            if (cc && history.length > 0) {
                const dates = history.map(h => h.date.substring(5));
                const counts = history.map(h => h.districts);
                makeBar(cc.getContext('2d'), dates, counts, C.info, { barThickness: 16 });
            }
        }, 100);
    } catch(e) { el.innerHTML = '<div class="loading">Error: '+e.message+'</div>'; }
}
