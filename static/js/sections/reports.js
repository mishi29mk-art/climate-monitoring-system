/* ─── Reports ─────────────────────────────────────────────── */
async function render_reports(el) {
    el.innerHTML = '<div class="loading">Loading reports…</div>';
    try {
        const res = await fetch('/api/modules/reports');
        const d = await res.json();

        const templates = d.templates || [];
        const recent = d.recent_reports || [];
        const scheduled = templates.filter(t => t.frequency && t.frequency !== 'manual');
        const totalSize = [...recent, ...templates].reduce((s, r) => s + (r.size_kb || 0), 0);
        const typeCounts = {};
        templates.forEach(t => { typeCounts[t.type || 'general'] = (typeCounts[t.type || 'general'] || 0) + 1; });

        const typeColors = {pdf:C.danger,excel:C.success,html:C.info,csv:C.warning,api:C.purple};

        el.innerHTML = `
        <div class="sec-hdr">
            <h2>📄 Reports & Analytics</h2>
            <p>Report templates, generated outputs, scheduled reports, and export management</p>
            <div class="hdr-meta">
                <span>📋 ${templates.length} templates</span>
                <span>📄 ${recent.length} generated</span>
                <span>⏰ ${scheduled.length} scheduled</span>
                <span>💾 ${(totalSize / 1024).toFixed(1)} MB total</span>
            </div>
        </div>

        <!-- Stat Cards -->
        <div class="card-grid g4">
            <div class="stat-card s-blue" style="border-left:3px solid ${C.info}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">📋</div><div class="stat-label">Templates</div></div>
                    <div style="font-size:28px;opacity:0.15">📋</div>
                </div>
                <div class="stat-value" style="color:${C.info};font-size:32px;margin:4px 0">${templates.length}</div>
                <div class="stat-sub">${Object.keys(typeCounts).length} types</div>
                <div class="progress mt-2"><div class="fill" style="width:${Math.min(100,templates.length/10*100)}%;background:linear-gradient(90deg,#06b6d4,#3b82f6)"></div></div>
            </div>
            <div class="stat-card s-green" style="border-left:3px solid ${C.success}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">📄</div><div class="stat-label">Generated</div></div>
                    <div style="font-size:28px;opacity:0.15">📄</div>
                </div>
                <div class="stat-value" style="color:${C.success};font-size:32px;margin:4px 0">${recent.length}</div>
                <div class="stat-sub">Recent reports</div>
                <div class="progress mt-2"><div class="fill" style="width:${Math.min(100,recent.length/20*100)}%;background:${C.success}"></div></div>
            </div>
            <div class="stat-card s-orange" style="border-left:3px solid ${C.orange}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">⏰</div><div class="stat-label">Scheduled</div></div>
                    <div style="font-size:28px;opacity:0.15">⏰</div>
                </div>
                <div class="stat-value" style="color:${C.orange};font-size:32px;margin:4px 0">${scheduled.length}</div>
                <div class="stat-sub">Auto-generated</div>
            </div>
            <div class="stat-card s-cyan" style="border-left:3px solid ${C.cyan}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">💾</div><div class="stat-label">Total Size</div></div>
                    <div style="font-size:28px;opacity:0.15">💾</div>
                </div>
                <div class="stat-value" style="color:${C.cyan};font-size:32px;margin:4px 0">${(totalSize/1024).toFixed(1)}<span style="font-size:16px">MB</span></div>
                <div class="stat-sub">${fmtK(totalSize)} KB total</div>
            </div>
        </div>

        <!-- Report Templates Grid -->
        <div class="card mt-3">
            <div class="card-header">
                <h3>📋 Report Templates</h3>
                <span class="badge b-info">${templates.length} templates</span>
            </div>
            <div class="card-grid g3" style="padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
                ${templates.map(t => `
                    <div class="card" style="padding:16px;border:1px solid var(--border);border-radius:var(--r-md)">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                            <div style="font-size:28px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:var(--bg-secondary);border-radius:var(--r-sm)">${t.icon || '📄'}</div>
                            <div>
                                <div style="font-weight:600;font-size:13px">${t.name}</div>
                                <div style="font-size:11px;color:var(--text-muted)">${t.type || 'general'}</div>
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;color:var(--text-muted)">
                            <div>Frequency: <b style="color:var(--text)">${t.frequency || 'manual'}</b></div>
                            <div>Size: <b style="color:var(--text)">${t.size_kb ? (t.size_kb/1024).toFixed(1)+'MB' : '-'}</b></div>
                            <div style="grid-column:span 2">Last Generated: <b style="color:${t.last_generated?C.success:C.muted}">${t.last_generated ? timeAgo(t.last_generated) : 'Never'}</b></div>
                        </div>
                        <div style="margin-top:10px;display:flex;gap:6px">
                            <span class="badge ${typeColors[t.type]?'b-success':'b-info'}" style="font-size:10px;text-transform:uppercase">${t.type || 'general'}</span>
                            ${t.frequency && t.frequency !== 'manual' ? '<span class="badge b-success" style="font-size:10px">⏰ Scheduled</span>' : '<span class="badge b-info" style="font-size:10px">📌 Manual</span>'}
                        </div>
                    </div>
                `).join('') || '<div style="text-align:center;color:var(--text-muted);padding:30px;grid-column:span 3">No templates configured</div>'}
            </div>
        </div>

        <!-- Recent Reports Table & Type Distribution -->
        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header">
                    <h3>📄 Recent Reports</h3>
                    <span class="badge b-success">${recent.length} reports</span>
                </div>
                <div class="tbl-scroll" style="max-height:400px">
                    <table class="tbl">
                        <thead>
                            <tr><th>Name</th><th>Date</th><th>Type</th><th>Size</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                        ${recent.map(r => `
                            <tr>
                                <td style="font-weight:600">${r.name || '-'}</td>
                                <td style="font-size:12px;color:var(--text-muted)">${r.date ? new Date(r.date).toLocaleDateString() : '-'}</td>
                                <td><span class="badge ${typeColors[r.type]||'b-info'}" style="font-size:10px;text-transform:uppercase">${r.type || '-'}</span></td>
                                <td style="font-size:12px">${r.size_kb ? (r.size_kb >= 1024 ? (r.size_kb/1024).toFixed(1)+'MB' : r.size_kb+'KB') : '-'}</td>
                                <td><span style="color:${r.status==='completed'?C.success:r.status==='failed'?C.danger:r.status==='generating'?C.warning:C.info}">
                                    ${r.status==='completed'?'● Complete':r.status==='failed'?'● Failed':r.status==='generating'?'⏳ Generating':r.status || '-'}
                                </span></td>
                            </tr>
                        `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px">No reports generated yet</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3>📊 Template Type Distribution</h3>
                </div>
                <div style="height:280px;padding:8px"><canvas id="rpt-type-chart"></canvas></div>
                <div style="padding:0 16px 16px">
                    ${Object.entries(typeCounts).sort((a,b)=>b[1]-a[1]).map(([type,cnt],i)=>{
                        const colors = [C.danger, C.success, C.info, C.warning, C.purple];
                        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px">
                            <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${colors[i%colors.length]};margin-right:6px"></span>${type}</span>
                            <span style="font-weight:600">${cnt}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>`;

        setTimeout(() => {
            const tc = document.getElementById('rpt-type-chart');
            if (tc) {
                const colors = [C.danger, C.success, C.info, C.warning, C.purple];
                makeDoughnut(tc.getContext('2d'), Object.keys(typeCounts).map(t => t.charAt(0).toUpperCase() + t.slice(1)),
                    Object.values(typeCounts), Object.keys(typeCounts).map((_, i) => colors[i % colors.length]));
            }
        }, 100);
    } catch(e) { el.innerHTML = '<div class="loading">Error loading reports: ' + e.message + '</div>'; }
}
