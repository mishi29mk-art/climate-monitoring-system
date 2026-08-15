/* ─── Alert & Notification Manager ───────────────────────── */
async function render_alert_notif(el) {
    el.innerHTML = '<div class="loading">Loading alert rules…</div>';
    try {
        const res = await fetch('/api/modules/alert-rules');
        const d = await res.json();

        const rules = d.rules || [];
        const channels = d.channels || [];
        const activeRules = rules.filter(r => r.enabled);
        const activeChannels = channels.filter(c => c.status === 'active');
        const severityCounts = {};
        rules.forEach(r => { severityCounts[r.severity || 'info'] = (severityCounts[r.severity || 'info'] || 0) + 1; });

        const sevColors = { critical: C.danger, high: C.orange, medium: C.warning, low: C.info, info: C.success };
        const sevBadge = { critical: 'b-danger', high: 'b-orange', medium: 'b-yellow', low: 'b-info', info: 'b-success' };

        el.innerHTML = `
        <div class="sec-hdr">
            <h2>🔔 Alert & Notification Center</h2>
            <p>Configure alert rules, manage notification channels, and monitor severity distribution</p>
            <div class="hdr-meta">
                <span>📋 ${rules.length} rules defined</span>
                <span>📡 ${channels.length} channels</span>
                <span>🕐 Updated: ${d.last_updated || new Date().toLocaleString()}</span>
            </div>
        </div>

        <!-- Stat Cards -->
        <div class="card-grid g4">
            <div class="stat-card s-blue" style="border-left:3px solid ${C.info}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">📋</div><div class="stat-label">Total Rules</div></div>
                    <div style="font-size:28px;opacity:0.15">📋</div>
                </div>
                <div class="stat-value" style="color:${C.info};font-size:32px;margin:4px 0">${rules.length}</div>
                <div class="stat-sub">${activeRules.length} enabled</div>
                <div class="progress mt-2"><div class="fill" style="width:${rules.length?Math.min(100,activeRules.length/rules.length*100):0}%;background:${C.info}"></div></div>
            </div>
            <div class="stat-card s-green" style="border-left:3px solid ${C.success}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">✅</div><div class="stat-label">Active Rules</div></div>
                    <div style="font-size:28px;opacity:0.15">✅</div>
                </div>
                <div class="stat-value" style="color:${C.success};font-size:32px;margin:4px 0">${activeRules.length}</div>
                <div class="stat-sub">Monitoring live</div>
                <div class="progress mt-2"><div class="fill" style="width:${rules.length?Math.min(100,activeRules.length/rules.length*100):0}%;background:${C.success}"></div></div>
            </div>
            <div class="stat-card s-orange" style="border-left:3px solid ${C.orange}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">📡</div><div class="stat-label">Active Channels</div></div>
                    <div style="font-size:28px;opacity:0.15">📡</div>
                </div>
                <div class="stat-value" style="color:${C.orange};font-size:32px;margin:4px 0">${activeChannels.length}</div>
                <div class="stat-sub">of ${channels.length} total</div>
                <div class="progress mt-2"><div class="fill" style="width:${channels.length?Math.min(100,activeChannels.length/channels.length*100):0}%;background:${C.orange}"></div></div>
            </div>
            <div class="stat-card s-red" style="border-left:3px solid ${C.danger}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">🚨</div><div class="stat-label">Critical Alerts</div></div>
                    <div style="font-size:28px;opacity:0.15">🚨</div>
                </div>
                <div class="stat-value" style="color:${C.danger};font-size:32px;margin:4px 0">${severityCounts.critical || 0}</div>
                <div class="stat-sub">${severityCounts.high || 0} high severity</div>
            </div>
        </div>

        <!-- Alert Rules Table -->
        <div class="card mt-3">
            <div class="card-header">
                <h3>📋 Alert Rules</h3>
                <span class="badge b-info">${rules.length} rules</span>
            </div>
            <div class="tbl-scroll" style="max-height:400px">
                <table class="tbl">
                    <thead>
                        <tr><th>Name</th><th>Parameter</th><th>Condition</th><th>Threshold</th><th>Severity</th><th>Enabled</th><th>Channels</th></tr>
                    </thead>
                    <tbody>
                    ${rules.map(r => `
                        <tr>
                            <td style="font-weight:600">${r.name || '-'}</td>
                            <td><span class="badge b-info" style="font-size:10px">${r.parameter || '-'}</span></td>
                            <td>${r.condition || '-'}</td>
                            <td style="font-weight:600">${r.threshold != null ? r.threshold : '-'}</td>
                            <td>${severityBadge(r.severity || 'info')}</td>
                            <td><span style="color:${r.enabled ? C.success : C.muted}">${r.enabled ? '● Enabled' : '○ Disabled'}</span></td>
                            <td>${(r.channels || []).map(c => `<span class="badge b-success" style="font-size:10px;margin:1px">${c}</span>`).join('') || '-'}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px">No alert rules configured</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Notification Channels & Severity Distribution -->
        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header">
                    <h3>📡 Notification Channels</h3>
                    <span class="badge b-success">${activeChannels.length} active</span>
                </div>
                <div style="display:grid;gap:12px;padding:16px">
                    ${channels.map(c => `
                        <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border)">
                            <div style="font-size:28px;width:48px;text-align:center">${c.icon || '📢'}</div>
                            <div style="flex:1">
                                <div style="font-weight:600;font-size:13px">${c.name}</div>
                                <div style="font-size:11px;color:var(--text-muted)">${c.type || 'Notification'}</div>
                            </div>
                            <div style="text-align:right;min-width:80px">
                                <div style="font-size:11px;color:var(--text-muted)">Delivery</div>
                                <div style="font-size:14px;font-weight:700;color:${(c.delivery_rate||0) >= 95 ? C.success : (c.delivery_rate||0) >= 80 ? C.warning : C.danger}">
                                    ${c.delivery_rate != null ? c.delivery_rate + '%' : '-'}
                                </div>
                            </div>
                            <div style="width:80px;text-align:center">
                                <span class="badge ${c.status==='active'?'b-success':c.status==='inactive'?'b-danger':'b-warning'}" style="font-size:10px">
                                    ${c.status==='active'?'🟢 Active':c.status==='inactive'?'🔴 Inactive':'🟡 Pending'}
                                </span>
                            </div>
                        </div>
                    `).join('') || '<div style="text-align:center;color:var(--text-muted);padding:30px">No channels configured</div>'}
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3>📊 Severity Distribution</h3>
                </div>
                <div style="height:280px;padding:8px"><canvas id="notif-sev-chart"></canvas></div>
                <div style="padding:0 16px 16px">
                    ${Object.entries(severityCounts).sort((a,b)=>b[1]-a[1]).map(([sev,cnt])=>`
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px">
                            <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${sevColors[sev]||C.info};margin-right:6px"></span>${sev}</span>
                            <span style="font-weight:600">${cnt}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>`;

        setTimeout(() => {
            const sc = document.getElementById('notif-sev-chart');
            if (sc) {
                const colors = Object.keys(severityCounts).map(s => sevColors[s] || C.info);
                makeDoughnut(sc.getContext('2d'), Object.keys(severityCounts).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
                    Object.values(severityCounts), colors);
            }
        }, 100);
    } catch(e) { el.innerHTML = '<div class="loading">Error loading alert rules: ' + e.message + '</div>'; }
}
