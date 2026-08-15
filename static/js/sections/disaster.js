/* ─── Disaster Center Section ─────────────────────────────── */
function render_disaster(el) {
    const alerts = alertsData || [];
    // Group alerts by hazard type
    const byType = {};
    alerts.forEach(a => {
        const t = (a.type || 'unknown').replace(/_/g, ' ');
        if (!byType[t]) byType[t] = [];
        byType[t].push(a);
    });
    const typeNames = Object.keys(byType).sort((a, b) => byType[b].length - byType[a].length);

    // Severity counts
    const sevCounts = { extreme: 0, severe: 0, moderate: 0, low: 0 };
    alerts.forEach(a => { if (sevCounts[a.severity] !== undefined) sevCounts[a.severity]++; });

    // Province breakdown
    const provAlerts = {};
    alerts.forEach(a => {
        const p = a.province || 'Unknown';
        if (!provAlerts[p]) provAlerts[p] = 0;
        provAlerts[p]++;
    });
    const provArr = Object.entries(provAlerts).sort((a, b) => b[1] - a[1]);

    // Icons for hazard types
    const typeIcons = {
        'heat': '🔥', 'temperature': '🌡', 'flood': '🌊', 'rain': '🌧',
        'wind': '💨', 'uv': '☀', 'aqi': '🌫', 'air quality': '🌫',
        'drought': '🏜', 'cold': '❄', 'river': '🏞', 'hail': '🧊'
    };
    function getIcon(type) {
        for (const [k, v] of Object.entries(typeIcons)) {
            if (type.toLowerCase().includes(k)) return v;
        }
        return '⚠';
    }

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>🌋 Disaster Response Center</h2>
        <p>All active alerts organized by hazard type — comprehensive disaster monitoring across Pakistan</p>
        <div class="hdr-meta">
            <span>🚨 ${alerts.length} active alerts</span>
            <span>📋 ${typeNames.length} hazard types</span>
            <span>${sevCounts.extreme ? '🔴 ' + sevCounts.extreme + ' extreme' : '✅ No extreme alerts'}</span>
        </div>
    </div>

    <div class="card-grid g4">
        <div class="stat-card s-red"><div class="stat-icon">🔴</div><div class="stat-value" style="color:${C.danger}">${sevCounts.extreme}</div><div class="stat-label">Extreme</div><div class="stat-sub">Immediate action</div></div>
        <div class="stat-card s-orange"><div class="stat-icon">🟠</div><div class="stat-value" style="color:${C.orange}">${sevCounts.severe}</div><div class="stat-label">Severe</div><div class="stat-sub">Urgent advisory</div></div>
        <div class="stat-card s-yellow"><div class="stat-icon">🟡</div><div class="stat-value" style="color:${C.yellow}">${sevCounts.moderate}</div><div class="stat-label">Moderate</div><div class="stat-sub">Monitor closely</div></div>
        <div class="stat-card s-green"><div class="stat-icon">🟢</div><div class="stat-value" style="color:${C.success}">${sevCounts.low}</div><div class="stat-label">Low</div><div class="stat-sub">Advisory only</div></div>
    </div>

    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">📊 Alerts by Hazard Type</h3>
            <div style="height:220px"><canvas id="dz-types"></canvas></div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">📊 Severity Distribution</h3>
            <div style="height:220px"><canvas id="dz-severity"></canvas></div>
        </div>
    </div>

    <div class="card mt-3">
        <h3 style="margin-bottom:10px">🗺 Disaster Alert Map</h3>
        <div id="dz-map" class="map-container" style="height:400px"></div>
    </div>

    ${typeNames.map(type => `
    <div class="card mt-3">
        <h3 style="margin-bottom:10px">${getIcon(type)} ${type.toUpperCase()} (${byType[type].length})</h3>
        <div class="tbl-scroll" style="max-height:250px">
            <table class="tbl">
                <thead><tr><th>District</th><th>Severity</th><th>Value</th><th>Message</th></tr></thead>
                <tbody>
                ${byType[type].map(a => `<tr>
                    <td><b>${a.district}</b>${a.province ? ' <span style="color:var(--text-muted)">(' + a.province + ')</span>' : ''}</td>
                    <td>${severityBadge(a.severity)}</td>
                    <td>${fmt(a.value, 1)}</td>
                    <td style="color:var(--text-muted)">${a.message || '-'}</td>
                </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>`).join('')}

    ${provArr.length ? `
    <div class="card mt-3">
        <h3 style="margin-bottom:10px">📊 Alerts by Province</h3>
        <div style="height:200px"><canvas id="dz-province"></canvas></div>
    </div>` : ''}`;

    setTimeout(() => {
        // Map with colored markers
        const map = initFloodReplayMap('dz-map', { zoom: 6 });
        const layer = L.layerGroup();
        alerts.forEach(a => {
            const color = a.severity === 'extreme' ? C.danger : a.severity === 'severe' ? C.orange :
                          a.severity === 'moderate' ? C.warning : C.success;
            const lat = a.lat || weatherData[a.district]?.lat;
            const lng = a.lng || weatherData[a.district]?.lng;
            if (lat && lng) {
                const m = L.circleMarker([lat, lng], {
                    radius: 9, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.85
                });
                m.bindPopup(`<b>${a.district}</b><br>${getIcon(a.type)} ${a.type}<br>${severityBadge(a.severity)}<br>${a.message || ''}`);
                layer.addLayer(m);
            }
        });
        layer.addTo(map);

        // Type bar chart
        const typeCanvas = document.getElementById('dz-types');
        if (typeCanvas && typeNames.length) {
            makeBar(typeCanvas.getContext('2d'),
                typeNames.slice(0, 10), typeNames.slice(0, 10).map(t => byType[t].length),
                [C.danger, C.orange, C.warning, C.info, C.success, C.purple, C.cyan, C.yellow, C.accent, '#8b949e'],
                { barThickness: 20 });
        }

        // Severity doughnut
        const sevCanvas = document.getElementById('dz-severity');
        if (sevCanvas) {
            makeDoughnut(sevCanvas.getContext('2d'),
                ['Extreme', 'Severe', 'Moderate', 'Low'],
                [sevCounts.extreme, sevCounts.severe, sevCounts.moderate, sevCounts.low],
                [C.danger, C.orange, C.warning, C.success]);
        }

        // Province chart
        const provCanvas = document.getElementById('dz-province');
        if (provCanvas && provArr.length) {
            makeHBar(provCanvas.getContext('2d'),
                provArr.map(([p]) => p), provArr.map(([, c]) => c),
                provArr.map(([, c]) => c > 10 ? C.danger : c > 5 ? C.warning : C.info));
        }
    }, 150);
}
