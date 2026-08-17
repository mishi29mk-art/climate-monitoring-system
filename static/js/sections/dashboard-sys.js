/* ─── Dashboard System — Widget Manager ──────────────────── */
async function render_dashboard_sys(el) {
    el.innerHTML = '<div class="loading">Loading widget data…</div>';
    try {
        const res = await fetch('/api/modules/widgets');
        const d = await res.json();

        const widgets = d.available || d.widgets || [];
        const layout = (d.layout || []).map(l => ({...l, widget_id: l.id || l.widget_id}));
        const categories = [...new Set(widgets.map(w => w.category))].filter(Boolean).sort();
        const sizes = [...new Set(widgets.map(w => w.size))].filter(Boolean).sort();

        const activeInLayout = new Set(layout.map(l => l.widget_id)).size;
        const sevCounts = {};
        widgets.forEach(w => { sevCounts[w.category] = (sevCounts[w.category] || 0) + 1; });

        el.innerHTML = `
        <div class="sec-hdr">
            <h2>🎛 Dashboard System</h2>
            <p>Widget configuration, layout management, and available component registry</p>
            <div class="hdr-meta">
                <span>📊 ${widgets.length} widgets available</span>
                <span>🟢 ${activeInLayout} active in layout</span>
                <span>🕐 Updated: ${d.last_updated || new Date().toLocaleString()}</span>
            </div>
        </div>

        <!-- Stat Cards -->
        <div class="card-grid g4">
            <div class="stat-card s-blue" style="border-left:3px solid ${C.info}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">🧩</div><div class="stat-label">Total Widgets</div></div>
                    <div style="font-size:28px;opacity:0.15">🧩</div>
                </div>
                <div class="stat-value" style="color:${C.info};font-size:32px;margin:4px 0">${widgets.length}</div>
                <div class="stat-sub">${categories.length} categories</div>
                <div class="progress mt-2"><div class="fill" style="width:${Math.min(100,widgets.length/20*100)}%;background:linear-gradient(90deg,#06b6d4,#3b82f6)"></div></div>
            </div>
            <div class="stat-card s-green" style="border-left:3px solid ${C.success}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">✅</div><div class="stat-label">Active in Layout</div></div>
                    <div style="font-size:28px;opacity:0.15">✅</div>
                </div>
                <div class="stat-value" style="color:${C.success};font-size:32px;margin:4px 0">${activeInLayout}</div>
                <div class="stat-sub">of ${widgets.length} available</div>
                <div class="progress mt-2"><div class="fill" style="width:${widgets.length?Math.min(100,activeInLayout/widgets.length*100):0}%;background:${C.success}"></div></div>
            </div>
            <div class="stat-card s-orange" style="border-left:3px solid ${C.orange}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">📂</div><div class="stat-label">Categories</div></div>
                    <div style="font-size:28px;opacity:0.15">📂</div>
                </div>
                <div class="stat-value" style="color:${C.orange};font-size:32px;margin:4px 0">${categories.length}</div>
                <div class="stat-sub">${categories.join(', ')}</div>
            </div>
            <div class="stat-card s-cyan" style="border-left:3px solid ${C.cyan}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div><div class="stat-icon">📐</div><div class="stat-label">Sizes Used</div></div>
                    <div style="font-size:28px;opacity:0.15">📐</div>
                </div>
                <div class="stat-value" style="color:${C.cyan};font-size:32px;margin:4px 0">${sizes.length}</div>
                <div class="stat-sub">${sizes.join(', ')}</div>
            </div>
        </div>

        <!-- Available Widgets Grid -->
        <div class="card mt-3">
            <div class="card-header">
                <h3>🧩 Available Widgets</h3>
                <span class="badge b-info">${widgets.length} registered</span>
            </div>
            <div class="card-grid g4" style="padding:16px">
                ${widgets.map(w => `
                    <div class="card" style="padding:16px;cursor:grab;border:1px solid var(--border);border-radius:var(--r-md);transition:all 0.2s"
                         onmouseenter="this.style.borderColor=${C.accent};this.style.transform='translateY(-2px)'"
                         onmouseleave="this.style.borderColor='var(--border)';this.style.transform='none'">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                            <div style="font-size:28px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:var(--bg-secondary);border-radius:var(--r-sm)">${w.icon || '📦'}</div>
                            <div>
                                <div style="font-weight:600;font-size:13px">${w.name}</div>
                                <div style="font-size:11px;color:var(--text-muted)">${w.category || 'General'}</div>
                            </div>
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center">
                            <span class="badge b-info" style="font-size:10px">${w.size || '1x1'}</span>
                            <span style="font-size:11px;color:${layout.some(l=>l.widget_id===w.id)?C.success:C.muted}">
                                ${layout.some(l=>l.widget_id===w.id)?'✅ Active':'○ Inactive'}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Layout Visualization & Categories -->
        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header">
                    <h3>📐 Current Layout</h3>
                    <span class="badge b-success">${layout.length} slots</span>
                </div>
                <div style="padding:16px">
                    ${layout.length ? `
                        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
                            ${layout.map(l => {
                                const w = widgets.find(x => x.id === l.widget_id || x.id === l.id) || {};
                                return `<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--r-sm);padding:12px;text-align:center;grid-column:span ${Math.min(4, parseInt(w.size)||1)}">
                                    <div style="font-size:20px;margin-bottom:4px">${w.icon || '📦'}</div>
                                    <div style="font-size:11px;font-weight:600">${w.name || l.widget_id || 'Widget'}</div>
                                    <div style="font-size:10px;color:var(--text-muted)">R${l.row != null ? l.row : '?'} C${l.col != null ? l.col : '?'} · ${w.size || '1x1'}</div>
                                </div>`;
                            }).join('')}
                        </div>
                    ` : '<div style="text-align:center;color:var(--text-muted);padding:30px">No layout configured</div>'}
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3>📊 Widget Categories Breakdown</h3>
                </div>
                <div style="height:240px;padding:8px"><canvas id="wsys-cat-chart"></canvas></div>
                <div style="padding:0 16px 16px">
                    ${Object.entries(sevCounts).sort((a,b)=>b[1]-a[1]).map(([cat,cnt],i)=>{
                        const colors = [C.info,C.success,C.orange,C.purple,C.cyan,C.warning];
                        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px">
                            <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${colors[i%colors.length]};margin-right:6px"></span>${cat}</span>
                            <span style="font-weight:600">${cnt}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>`;

        setTimeout(() => {
            const cc = document.getElementById('wsys-cat-chart');
            if (cc) {
                const colors = [C.info, C.success, C.orange, C.purple, C.cyan, C.warning];
                makeDoughnut(cc.getContext('2d'), Object.keys(sevCounts), Object.values(sevCounts),
                    Object.keys(sevCounts).map((_, i) => colors[i % colors.length]));
            }
        }, 100);
    } catch(e) { el.innerHTML = '<div class="loading">Error loading widget data: ' + e.message + '</div>'; }
}
