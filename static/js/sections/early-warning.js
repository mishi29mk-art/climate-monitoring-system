/* ─── Early Warning — Alert Dashboard ───────────────────────── */
function render_early_warning(el) {
    let severityFilter = 'all';
    let typeFilter = 'all';
    let sortBy = 'severity';
    const alerts = alertsData || [];

    function getFilteredAlerts() {
        let filtered = [...alerts];
        if (severityFilter !== 'all') filtered = filtered.filter(a => a.severity === severityFilter);
        if (typeFilter !== 'all') filtered = filtered.filter(a => a.type === typeFilter);
        const sevOrder = { extreme: 0, severe: 1, moderate: 2, low: 3 };
        if (sortBy === 'severity') filtered.sort((a, b) => (sevOrder[a.severity] || 9) - (sevOrder[b.severity] || 9));
        else if (sortBy === 'district') filtered.sort((a, b) => a.district.localeCompare(b.district));
        else if (sortBy === 'type') filtered.sort((a, b) => a.type.localeCompare(b.type));
        return filtered;
    }

    const types = [...new Set(alerts.map(a => a.type))].sort();
    const severities = ['extreme', 'severe', 'moderate', 'low'];
    const counts = { extreme: alerts.filter(a => a.severity === 'extreme').length, severe: alerts.filter(a => a.severity === 'severe').length, moderate: alerts.filter(a => a.severity === 'moderate').length, low: alerts.filter(a => a.severity === 'low').length };
    const typeCounts = {};
    alerts.forEach(a => { typeCounts[a.type] = (typeCounts[a.type] || 0) + 1; });
    const provinceAlerts = {};
    alerts.forEach(a => {
        const prov = weatherData[a.district]?.province || 'Unknown';
        provinceAlerts[prov] = (provinceAlerts[prov] || 0) + 1;
    });

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>🚨 Early Warning System</h2>
        <p>Real-time climate hazard alerts across Pakistan · ${alerts.length} active alerts</p>
    </div>
    <div class="card-grid g4 mb-3">
        <div class="stat-card s-red"><div class="stat-icon">🔴</div><div class="stat-value">${counts.extreme}</div><div class="stat-label">Extreme</div><div class="stat-sub">Immediate action required</div></div>
        <div class="stat-card s-orange"><div class="stat-icon">🟠</div><div class="stat-value">${counts.severe}</div><div class="stat-label">Severe</div><div class="stat-sub">High priority</div></div>
        <div class="stat-card s-yellow"><div class="stat-icon">🟡</div><div class="stat-value">${counts.moderate}</div><div class="stat-label">Moderate</div><div class="stat-sub">Monitor closely</div></div>
        <div class="stat-card s-green"><div class="stat-icon">🟢</div><div class="stat-value">${counts.low}</div><div class="stat-label">Low</div><div class="stat-sub">Advisory only</div></div>
    </div>
    <div class="card-grid g3 mb-3">
        <div class="card">
            <div class="card-header"><h3>📊 Alerts by Type</h3></div>
            <div style="height:200px"><canvas id="ew-type-chart"></canvas></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>🗺 Alerts by Province</h3></div>
            <div style="height:200px"><canvas id="ew-province-chart"></canvas></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>📈 Severity Distribution</h3></div>
            <div style="height:200px"><canvas id="ew-severity-chart"></canvas></div>
        </div>
    </div>
    <div class="card-grid g2 mb-3">
        <div class="card">
            <div class="card-header">
                <h3>🗺 Alert Map</h3>
            </div>
            <div id="ew-map" class="map-container" style="height:400px"></div>
        </div>
        <div class="card">
            <div class="card-header">
                <h3>⏳ Alert Timeline</h3>
            </div>
            <div style="max-height:400px;overflow-y:auto;padding:10px">
                ${alerts.length ? alerts.slice(0, 30).map((a, i) => {
                    const prov = weatherData[a.district]?.province || 'Unknown';
                    const sevColors = { extreme: C.danger, severe: C.orange, moderate: C.warning, low: C.success };
                    const sevColor = sevColors[a.severity] || C.info;
                    return `<div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start">
                        <div style="min-width:6px;height:6px;border-radius:50%;background:${sevColor};margin-top:6px;flex-shrink:0"></div>
                        <div style="flex:1">
                            <div style="display:flex;justify-content:space-between;align-items:center">
                                <span style="font-size:13px;font-weight:600">${a.icon || ''} ${a.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                ${severityBadge(a.severity)}
                            </div>
                            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${a.district} · ${prov}</div>
                            <div style="font-size:12px;margin-top:4px;color:${sevColor}">${a.message || `Value: ${fmt(a.value, 0)}`}</div>
                            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">📅 ${a.timestamp ? new Date(a.timestamp).toLocaleString() : 'Just now'}</div>
                        </div>
                    </div>`;
                }).join('') : '<div style="text-align:center;padding:40px;color:var(--text-muted)">✅ No active alerts — all clear!</div>'}
            </div>
        </div>
    </div>
    <div class="card mb-3">
        <div class="card-header">
            <h3>📋 Alert Details</h3>
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                <select id="ew-severity" style="background:#161b22;color:var(--text);border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-size:12px">
                    <option value="all">All Severity</option>
                    ${severities.map(s => `<option value="${s}" ${severityFilter === s ? 'selected' : ''}>${s.toUpperCase()}</option>`).join('')}
                </select>
                <select id="ew-type" style="background:#161b22;color:var(--text);border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-size:12px">
                    <option value="all">All Types</option>
                    ${types.map(t => `<option value="${t}" ${typeFilter === t ? 'selected' : ''}>${t.replace(/_/g, ' ')}</option>`).join('')}
                </select>
                <select id="ew-sort" style="background:#161b22;color:var(--text);border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-size:12px">
                    <option value="severity" ${sortBy === 'severity' ? 'selected' : ''}>Sort by Severity</option>
                    <option value="district" ${sortBy === 'district' ? 'selected' : ''}>Sort by District</option>
                    <option value="type" ${sortBy === 'type' ? 'selected' : ''}>Sort by Type</option>
                </select>
            </div>
        </div>
        <div class="tbl-scroll" style="max-height:400px">
            <table class="tbl" id="ew-table">
                <thead><tr><th></th><th>Type</th><th>District</th><th>Province</th><th>Severity</th><th>Value</th><th>Message</th></tr></thead>
                <tbody>
                ${getFilteredAlerts().map(a => {
                    const prov = weatherData[a.district]?.province || 'Unknown';
                    return `<tr class="${a.severity === 'extreme' ? 'row-alert' : ''}">
                        <td>${a.icon || ''}</td>
                        <td style="text-transform:capitalize">${a.type.replace(/_/g, ' ')}</td>
                        <td><b>${a.district}</b></td>
                        <td>${prov}</td>
                        <td>${severityBadge(a.severity)}</td>
                        <td>${fmt(a.value, 0)}</td>
                        <td style="font-size:12px;color:var(--text-muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.message || '-'}</td>
                    </tr>`;
                }).join('')}
                </tbody>
            </table>
        </div>
    </div>
    <div class="card">
        <div class="card-header"><h3>📊 Province Alert Heatmap</h3></div>
        <div class="card-grid g2" style="padding:8px">
            ${Object.entries(provinceAlerts).sort((a, b) => b[1] - a[1]).map(([prov, count]) => {
                const maxCount = Math.max(...Object.values(provinceAlerts), 1);
                const width = (count / maxCount * 100).toFixed(0);
                const color = count > 10 ? C.danger : count > 5 ? C.orange : count > 2 ? C.warning : C.success;
                return `<div style="display:flex;align-items:center;gap:10px">
                    <span style="min-width:100px;font-size:12px;font-weight:600">${prov}</span>
                    <div style="flex:1;height:20px;background:#161b22;border-radius:4px;overflow:hidden">
                        <div style="width:${width}%;height:100%;background:${color};border-radius:4px;display:flex;align-items:center;padding-left:8px">
                            <span style="font-size:10px;color:#fff;font-weight:600">${count}</span>
                        </div>
                    </div>
                </div>`;
            }).join('')}
        </div>
    </div>`;

    setTimeout(() => {
        // Charts
        const typeData = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
        const typeChart = document.getElementById('ew-type-chart');
        if (typeChart) makeHBar(typeChart.getContext('2d'),
            typeData.map(([t]) => t.replace(/_/g, ' ')),
            typeData.map(([, c]) => c),
            typeData.map(([, c]) => c > 5 ? C.danger : c > 2 ? C.orange : C.accent)
        );

        const provData = Object.entries(provinceAlerts).sort((a, b) => b[1] - a[1]);
        const provChart = document.getElementById('ew-province-chart');
        if (provChart) makeHBar(provChart.getContext('2d'),
            provData.map(([p]) => p.substring(0, 8)),
            provData.map(([, c]) => c),
            provData.map(([, c]) => c > 5 ? C.danger : c > 2 ? C.warning : C.accent)
        );

        const sevChart = document.getElementById('ew-severity-chart');
        if (sevChart) makeDoughnut(sevChart.getContext('2d'),
            severities.map(s => s.toUpperCase()),
            severities.map(s => counts[s]),
            [C.danger, C.orange, C.warning, C.success]
        );

        // Map with alert markers
        const map = initFloodReplayMap('ew-map', { zoom: 6 });
        const alertLayer = L.layerGroup();
        alerts.forEach(a => {
            const d = weatherData[a.district];
            if (!d) return;
            const sevColors = { extreme: C.danger, severe: C.orange, moderate: C.warning, low: C.success };
            const color = sevColors[a.severity] || C.info;
            const marker = L.circleMarker([d.lat, d.lng], {
                radius: a.severity === 'extreme' ? 12 : a.severity === 'severe' ? 10 : 8,
                fillColor: color, color: '#fff', weight: 2, opacity: 0.9, fillOpacity: 0.8
            });
            marker.bindPopup(`<div style="min-width:180px">
                <b>${a.icon || ''} ${a.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</b><br>
                ${severityBadge(a.severity)}<br><hr style="border-color:#30363d;margin:4px 0">
                <b>${a.district}</b> · ${d.province}<br>
                Value: ${fmt(a.value, 0)}<br>
                ${a.message || ''}
            </div>`);
            alertLayer.addLayer(marker);
        });
        alertLayer.addTo(map);

        // Filters
        const sevSel = document.getElementById('ew-severity');
        const typeSel = document.getElementById('ew-type');
        const sortSel = document.getElementById('ew-sort');
        function applyFilter() {
            severityFilter = sevSel.value;
            typeFilter = typeSel.value;
            sortBy = sortSel.value;
            el.innerHTML = ''; // Clear and re-render would be heavy, so just update table
            // Simpler: just re-render the whole section
            render_early_warning(el);
        }
        if (sevSel) sevSel.addEventListener('change', applyFilter);
        if (typeSel) typeSel.addEventListener('change', applyFilter);
        if (sortSel) sortSel.addEventListener('change', applyFilter);
    }, 150);
}
