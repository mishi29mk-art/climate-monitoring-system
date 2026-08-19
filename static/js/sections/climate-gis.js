/* ═══════════════════════════════════════════════════════════════
   Climate GIS Section — 4-Tab Layout
   Cities · Provinces · Interactive Map · Map Layers
   ═══════════════════════════════════════════════════════════════ */

function injectClimGisStyles() {
    if (document.getElementById('cgis-styles')) return;
    const s = document.createElement('style');
    s.id = 'cgis-styles';
    s.textContent = `
    .cgis-tabs{display:flex;gap:6px;margin-bottom:20px;flex-wrap:wrap}
    .cgis-tab{padding:10px 18px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);
      background:rgba(15,23,42,0.7);color:var(--text-secondary);cursor:pointer;
      font-size:13px;font-weight:600;transition:all .25s;display:flex;align-items:center;gap:6px}
    .cgis-tab:hover{border-color:rgba(180,138,255,0.3);color:var(--text-primary)}
    .cgis-tab.active{background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(99,102,241,0.15));
      border-color:rgba(139,92,246,0.4);color:#b48aff;box-shadow:0 0 16px rgba(139,92,246,0.12)}
    .cgis-glass{background:rgba(15,23,42,0.85);border:1px solid rgba(255,255,255,0.08);
      border-radius:16px;padding:20px;position:relative;overflow:hidden;transition:all .25s}
    .cgis-glass:hover{border-color:rgba(139,92,246,0.2);box-shadow:0 4px 20px rgba(0,0,0,0.2)}
    .cgis-glass::before{content:'';position:absolute;inset:0;
      background:linear-gradient(135deg,rgba(139,92,246,0.04) 0%,transparent 50%);pointer-events:none}
    .cgis-grid{display:grid;gap:16px}
    .cgis-grid-3{grid-template-columns:repeat(auto-fill,minmax(320px,1fr))}
    .cgis-grid-2{grid-template-columns:repeat(auto-fill,minmax(400px,1fr))}
    .cgis-grid-4{grid-template-columns:repeat(2,1fr)}
    .cgis-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
    .cgis-hum-bar{height:6px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden;margin-top:6px}
    .cgis-hum-fill{height:100%;border-radius:3px;transition:width .5s}
    .cgis-dist-list{max-height:300px;overflow-y:auto;margin-top:12px}
    .cgis-dist-item{display:flex;justify-content:space-between;padding:8px 12px;
      border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px}
    .cgis-dist-item:last-child{border-bottom:none}
    .cgis-map-container{border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)}
    .cgis-legend{position:absolute;bottom:20px;left:20px;background:rgba(15,23,42,0.9);
      border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:12px;z-index:1000;
      font-size:11px;line-height:1.8}
    .cgis-loading{text-align:center;padding:60px 20px;color:var(--text-secondary)}
    .cgis-loading .spinner{width:40px;height:40px;border:3px solid rgba(180,138,255,0.2);
      border-top-color:#b48aff;border-radius:50%;animation:cgisSpin .8s linear infinite;margin:0 auto 16px}
    @keyframes cgisSpin{to{transform:rotate(360deg)}}
    `;
    document.head.appendChild(s);
}

/* ── Helpers ── */
function _cgisEsc(s) { return s == null ? '' : escapeHtml(String(s)); }

function _cgisTempColor(t) {
    if (t == null) return '#94a3b8';
    if (t >= 40) return '#ef4444';
    if (t >= 35) return '#f97316';
    if (t >= 30) return '#eab308';
    if (t >= 25) return '#22c55e';
    return '#38bdf8';
}

function _cgisAqiColor(a) {
    if (a == null || a <= 0) return '#94a3b8';
    if (a <= 50) return '#22c55e';
    if (a <= 100) return '#eab308';
    if (a <= 150) return '#f97316';
    return '#ef4444';
}

function _cgisAqiLabel(a) {
    if (a == null || a <= 0) return 'N/A';
    if (a <= 50) return 'Good';
    if (a <= 100) return 'Moderate';
    if (a <= 150) return 'Unhealthy (SG)';
    return 'Unhealthy';
}

function _cgisTempMarkerColor(t) {
    if (t == null) return '#94a3b8';
    if (t >= 42) return '#dc2626';
    if (t >= 38) return '#ef4444';
    if (t >= 35) return '#f97316';
    if (t >= 30) return '#eab308';
    if (t >= 25) return '#84cc16';
    if (t >= 20) return '#22c55e';
    if (t >= 15) return '#14b8a6';
    if (t >= 10) return '#06b6d4';
    return '#3b82f6';
}

/* ═══════════════════════════════════════════════════════════════
   MAIN RENDER FUNCTION
   ═══════════════════════════════════════════════════════════════ */
function render_climate_gis(el) {
    injectClimGisStyles();
    let activeTab = 0;
    let citiesData = [];
    let provincesData = {};
    let mapData = [];
    let provMaps = {};

    const TABS = [
        { label: '🏙 Major Cities', key: 'cities' },
        { label: '🗺 Provinces', key: 'provinces' },
        { label: '📍 Interactive Map', key: 'imap' },
        { label: '📊 Map Layers', key: 'layers' },
    ];

    function renderShell() {
        el.innerHTML = `
        <div class="sec-hdr">
            <h2>🌍 Climate GIS</h2>
            <p>Geospatial climate data for Pakistan — cities, provinces, interactive maps & layered views</p>
        </div>
        <div class="cgis-tabs" id="cgis-tabbar"></div>
        <div id="cgis-content" class="cgis-loading"><div class="spinner"></div>Loading climate data...</div>`;
        renderTabs();
    }

    function renderTabs() {
        const bar = document.getElementById('cgis-tabbar');
        if (!bar) return;
        bar.innerHTML = TABS.map((t, i) =>
            `<div class="cgis-tab${i === activeTab ? ' active' : ''}" data-tidx="${i}">${t.label}</div>`
        ).join('');
        bar.querySelectorAll('.cgis-tab').forEach(btn => {
            btn.onclick = () => { activeTab = +btn.dataset.tidx; renderTabs(); renderContent(); };
        });
    }

    function renderContent() {
        const c = document.getElementById('cgis-content');
        if (!c) return;
        c.className = '';
        c.innerHTML = '';
        // Destroy any existing province maps
        Object.values(provMaps).forEach(m => { try { m.remove(); } catch(e){} });
        provMaps = {};
        if (activeTab === 0) renderCitiesTab(c);
        else if (activeTab === 1) renderProvincesTab(c);
        else if (activeTab === 2) renderInteractiveMapTab(c);
        else renderMapLayersTab(c);
    }

    /* ── Tab 1: Major Cities ── */
    function renderCitiesTab(container) {
        if (!citiesData.length) {
            container.innerHTML = '<div class="cgis-loading"><div class="spinner"></div>Loading cities...</div>';
            fetch('/api/climate-gis/cities').then(r => r.json()).then(d => {
                citiesData = d.cities || [];
                renderCitiesTab(container);
            }).catch(() => { container.innerHTML = '<p style="color:#ef4444">Failed to load cities data.</p>'; });
            return;
        }
        container.innerHTML = `
        <div class="cgis-grid cgis-grid-3">
            ${citiesData.map(c => {
                const tc = _cgisTempColor(c.temp);
                const ac = _cgisAqiColor(c.aqi);
                const al = _cgisAqiLabel(c.aqi);
                const hum = c.humidity || 0;
                const humColor = hum > 80 ? '#3b82f6' : hum > 60 ? '#06b6d4' : hum > 40 ? '#22c55e' : '#f97316';
                const desc = _cgisEsc(c.description || 'No description available.');
                return `
                <div class="cgis-glass">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
                        <div>
                            <div style="font-size:17px;font-weight:700;color:var(--text-primary)">${_cgisEsc(c.name)}</div>
                            <span class="cgis-badge" style="background:rgba(139,92,246,0.15);color:#b48aff;margin-top:4px">${_cgisEsc(c.province)}</span>
                        </div>
                        <div style="text-align:right">
                            <div style="font-size:28px;font-weight:800;color:${tc};line-height:1">${c.temp != null ? Math.round(c.temp) + '°' : '--'}</div>
                            <div style="font-size:11px;color:var(--text-muted)">${c.max_temp != null ? Math.round(c.max_temp) + '°' : '--'} / ${c.min_temp != null ? Math.round(c.min_temp) + '°' : '--'}</div>
                        </div>
                    </div>
                    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;line-height:1.5">${desc}</div>
                    <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--text-muted);margin-bottom:10px">
                        <span title="Humidity"><i data-lucide="droplets" style="width:13px;height:13px;vertical-align:-2px"></i> ${hum}%</span>
                        <span title="Wind Speed"><i data-lucide="wind" style="width:13px;height:13px;vertical-align:-2px"></i> ${c.wind_speed != null ? Math.round(c.wind_speed) + ' km/h' : '--'}</span>
                        <span title="Rainfall 7d"><i data-lucide="cloud-rain" style="width:13px;height:13px;vertical-align:-2px"></i> ${c.rain_7d != null ? c.rain_7d + ' mm' : '--'}</span>
                    </div>
                    <div class="cgis-hum-bar"><div class="cgis-hum-fill" style="width:${hum}%;background:${humColor}"></div></div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
                        <span style="font-size:11px;color:var(--text-muted)">AQI</span>
                        <span class="cgis-badge" style="background:${ac}22;color:${ac};border:1px solid ${ac}44">${_cgisEsc(al)} (${c.aqi != null ? Math.round(c.aqi) : '--'})</span>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    /* ── Tab 2: Provinces ── */
    function renderProvincesTab(container) {
        const keys = Object.keys(provincesData);
        if (!keys.length) {
            container.innerHTML = '<div class="cgis-loading"><div class="spinner"></div>Loading provinces...</div>';
            Promise.all([
                fetch('/api/climate-gis/provinces').then(r => r.json()),
                fetch('/api/climate-gis/map-data').then(r => r.json())
            ]).then(([provResp, mapResp]) => {
                provincesData = provResp.provinces || {};
                mapData = mapResp.districts || [];
                renderProvincesTab(container);
            }).catch(() => { container.innerHTML = '<p style="color:#ef4444">Failed to load province data.</p>'; });
            return;
        }

        let expandedProv = null;

        function renderProvCards() {
            const provs = Object.entries(provincesData);
            container.innerHTML = `
            <div class="cgis-grid cgis-grid-3">
                ${provs.map(([name, p]) => {
                    const col = p.color || '#b48aff';
                    const isOpen = expandedProv === name;
                    const distList = mapData.filter(d => d.province === name);
                    return `
                    <div class="cgis-glass" style="border-left:3px solid ${col};cursor:pointer" data-prov="${_cgisEsc(name)}">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start">
                            <div>
                                <div style="font-size:17px;font-weight:700;color:${col}">${_cgisEsc(name)}</div>
                                <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Capital: ${_cgisEsc(p.capital)}</div>
                            </div>
                            <div style="text-align:right">
                                <div style="font-size:11px;color:var(--text-muted)">Districts</div>
                                <div style="font-size:22px;font-weight:700;color:var(--text-primary)">${p.district_count || 0}</div>
                            </div>
                        </div>
                        <div style="display:flex;gap:16px;margin-top:12px;font-size:12px;color:var(--text-secondary)">
                            <span><i data-lucide="thermometer" style="width:12px;height:12px;vertical-align:-2px"></i> Avg ${p.avg_temp != null ? Math.round(p.avg_temp) + '°C' : '--'}</span>
                            <span><i data-lucide="droplets" style="width:12px;height:12px;vertical-align:-2px"></i> ${p.avg_humidity != null ? Math.round(p.avg_humidity) + '%' : '--'}</span>
                        </div>
                        <div style="display:flex;gap:12px;margin-top:8px;font-size:11px">
                            <span style="color:#ef4444">▲ ${p.max_temp != null ? Math.round(p.max_temp) + '°' : '--'}</span>
                            <span style="color:#38bdf8">▼ ${p.min_temp != null ? Math.round(p.min_temp) + '°' : '--'}</span>
                        </div>
                        ${isOpen ? `
                        <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08)">
                            <div style="font-size:12px;font-weight:600;color:var(--text-primary);margin-bottom:8px">
                                <i data-lucide="map-pin" style="width:12px;height:12px;vertical-align:-2px"></i>
                                Districts (${distList.length})
                            </div>
                            <div class="cgis-dist-list">
                                ${distList.map(d => `
                                <div class="cgis-dist-item">
                                    <span>${_cgisEsc(d.name)}</span>
                                    <span style="color:${_cgisTempColor(d.temp)};font-weight:600">${d.temp != null ? Math.round(d.temp) + '°C' : '--'}</span>
                                </div>`).join('')}
                                ${distList.length === 0 ? '<div style="text-align:center;color:var(--text-muted);padding:16px;font-size:12px">No district data available</div>' : ''}
                            </div>
                        </div>` : ''}
                    </div>`;
                }).join('')}
            </div>`;

            container.querySelectorAll('[data-prov]').forEach(card => {
                card.onclick = () => {
                    const pn = card.dataset.prov;
                    expandedProv = expandedProv === pn ? null : pn;
                    renderProvCards();
                };
            });
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        renderProvCards();
    }

    /* ── Tab 3: Interactive Map ── */
    function renderInteractiveMapTab(container) {
        if (!mapData.length) {
            container.innerHTML = '<div class="cgis-loading"><div class="spinner"></div>Loading map data...</div>';
            fetch('/api/climate-gis/map-data').then(r => r.json()).then(d => {
                mapData = d.districts || [];
                renderInteractiveMapTab(container);
            }).catch(() => { container.innerHTML = '<p style="color:#ef4444">Failed to load map data.</p>'; });
            return;
        }

        container.innerHTML = `
        <div style="position:relative" class="cgis-map-container">
            <div id="cgis-main-map" style="width:100%;height:500px;background:#0d1030"></div>
            <div class="cgis-legend" id="cgis-main-legend"></div>
        </div>`;

        setTimeout(() => {
            const map = L.map('cgis-main-map', {
                center: [30.3753, 69.3451], zoom: 5,
                zoomControl: true, attributionControl: false
            });
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 18
            }).addTo(map);

            mapData.forEach(d => {
                if (!d.lat || !d.lng) return;
                const col = _cgisTempMarkerColor(d.temp);
                const marker = L.circleMarker([d.lat, d.lng], {
                    radius: 6, fillColor: col, color: col,
                    weight: 1, opacity: 0.9, fillOpacity: 0.75
                }).addTo(map);
                marker.bindPopup(`
                    <div style="min-width:160px;font-family:inherit">
                        <div style="font-weight:700;font-size:14px;margin-bottom:6px">${_cgisEsc(d.name)}</div>
                        <div style="font-size:11px;color:#888;margin-bottom:8px">${_cgisEsc(d.province)}</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:12px">
                            <span>🌡 Temp</span><span style="color:${col};font-weight:600">${d.temp != null ? Math.round(d.temp) + '°C' : '--'}</span>
                            <span>💧 Humidity</span><span>${d.humidity != null ? Math.round(d.humidity) + '%' : '--'}</span>
                            <span>💨 Wind</span><span>${d.wind_speed != null ? Math.round(d.wind_speed) + ' km/h' : '--'}</span>
                            <span>🌫 AQI</span><span style="color:${_cgisAqiColor(d.aqi)}">${d.aqi != null ? Math.round(d.aqi) : '--'}</span>
                            <span>🌧 Rain 7d</span><span>${d.rain_7d != null ? d.rain_7d + ' mm' : '--'}</span>
                        </div>
                    </div>
                `, { className: 'cgis-popup' });
            });

            // Legend
            const legend = document.getElementById('cgis-main-legend');
            if (legend) {
                const ranges = [
                    ['≥ 42°C', '#dc2626'], ['38–42°C', '#ef4444'], ['35–38°C', '#f97316'],
                    ['30–35°C', '#eab308'], ['25–30°C', '#84cc16'], ['20–25°C', '#22c55e'],
                    ['15–20°C', '#14b8a6'], ['10–15°C', '#06b6d4'], ['< 10°C', '#3b82f6']
                ];
                legend.innerHTML = '<div style="font-weight:600;margin-bottom:4px;color:#b48aff">Temperature Scale</div>' +
                    ranges.map(([l, c]) => `<div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${c};margin-right:6px;vertical-align:middle"></span>${l}</div>`).join('');
            }
            setTimeout(() => map.invalidateSize(), 100);
        }, 50);
    }

    /* ── Tab 4: Map Layers ── */
    function renderMapLayersTab(container) {
        if (!mapData.length) {
            container.innerHTML = '<div class="cgis-loading"><div class="spinner"></div>Loading map layers...</div>';
            fetch('/api/climate-gis/map-data').then(r => r.json()).then(d => {
                mapData = d.districts || [];
                renderMapLayersTab(container);
            }).catch(() => { container.innerHTML = '<p style="color:#ef4444">Failed to load map data.</p>'; });
            return;
        }

        container.innerHTML = `
        <div class="cgis-grid cgis-grid-4">
            <div class="cgis-glass" style="padding:12px">
                <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:#ef4444">
                    <i data-lucide="thermometer" style="width:16px;height:16px;vertical-align:-3px"></i> Temperature Heatmap
                </div>
                <div class="cgis-map-container"><div id="cgis-layer-temp" style="width:100%;height:300px;background:#0d1030"></div></div>
            </div>
            <div class="cgis-glass" style="padding:12px">
                <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:#f97316">
                    <i data-lucide="wind" style="width:16px;height:16px;vertical-align:-3px"></i> AQI Map
                </div>
                <div class="cgis-map-container"><div id="cgis-layer-aqi" style="width:100%;height:300px;background:#0d1030"></div></div>
            </div>
            <div class="cgis-glass" style="padding:12px">
                <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:#3b82f6">
                    <i data-lucide="cloud-rain" style="width:16px;height:16px;vertical-align:-3px"></i> Rainfall Map
                </div>
                <div class="cgis-map-container"><div id="cgis-layer-rain" style="width:100%;height:300px;background:#0d1030"></div></div>
            </div>
            <div class="cgis-glass" style="padding:12px">
                <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:#22c55e">
                    <i data-lucide="cloud-wind" style="width:16px;height:16px;vertical-align:-3px"></i> Wind Speed Map
                </div>
                <div class="cgis-map-container"><div id="cgis-layer-wind" style="width:100%;height:300px;background:#0d1030"></div></div>
            </div>
        </div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        setTimeout(() => { initLayerMap('cgis-layer-temp', buildTempCircles); initLayerMap('cgis-layer-aqi', buildAqiCircles); initLayerMap('cgis-layer-rain', buildRainCircles); initLayerMap('cgis-layer-wind', buildWindCircles); }, 80);
    }

    function initLayerMap(id, builder) {
        const el = document.getElementById(id);
        if (!el) return;
        const map = L.map(id, { center: [30.3753, 69.3451], zoom: 5, zoomControl: false, attributionControl: false });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map);
        builder(map);
        setTimeout(() => map.invalidateSize(), 100);
    }

    function buildTempCircles(map) {
        mapData.forEach(d => {
            if (!d.lat || !d.lng || d.temp == null) return;
            const r = Math.max(5, Math.min(20, (d.temp - 5) * 0.6));
            L.circleMarker([d.lat, d.lng], {
                radius: r, fillColor: _cgisTempMarkerColor(d.temp),
                color: 'transparent', weight: 0, fillOpacity: 0.7
            }).addTo(map).bindPopup(`<b>${_cgisEsc(d.name)}</b><br>🌡 ${Math.round(d.temp)}°C`);
        });
    }

    function buildAqiCircles(map) {
        mapData.forEach(d => {
            if (!d.lat || !d.lng || !d.aqi) return;
            const r = Math.max(5, Math.min(18, d.aqi / 12));
            L.circleMarker([d.lat, d.lng], {
                radius: r, fillColor: _cgisAqiColor(d.aqi),
                color: 'transparent', weight: 0, fillOpacity: 0.75
            }).addTo(map).bindPopup(`<b>${_cgisEsc(d.name)}</b><br>🌫 AQI ${Math.round(d.aqi)}<br><span style="color:${_cgisAqiColor(d.aqi)}">${_cgisAqiLabel(d.aqi)}</span>`);
        });
    }

    function buildRainCircles(map) {
        mapData.forEach(d => {
            if (!d.lat || !d.lng) return;
            const r = Math.max(3, Math.min(20, (d.rain_7d || 0) / 4));
            L.circleMarker([d.lat, d.lng], {
                radius: r, fillColor: '#3b82f6',
                color: 'transparent', weight: 0, fillOpacity: 0.7
            }).addTo(map).bindPopup(`<b>${_cgisEsc(d.name)}</b><br>🌧 ${d.rain_7d || 0} mm (7d)`);
        });
    }

    function buildWindCircles(map) {
        mapData.forEach(d => {
            if (!d.lat || !d.lng) return;
            const r = Math.max(3, Math.min(18, (d.wind_speed || 0) / 3));
            L.circleMarker([d.lat, d.lng], {
                radius: r, fillColor: '#22c55e',
                color: 'transparent', weight: 0, fillOpacity: 0.7
            }).addTo(map).bindPopup(`<b>${_cgisEsc(d.name)}</b><br>💨 ${d.wind_speed != null ? Math.round(d.wind_speed) + ' km/h' : '--'}`);
        });
    }

    // ── Initialize ──
    renderShell();
    renderContent();
}
