/* ─── Spatial Analysis Tools ────────────────────────────────── */
async function render_spatial_analysis(el) {
    el.innerHTML = '<div class="loading">Loading spatial analysis…</div>';
    try {
        el.innerHTML = `
        <div class="sec-hdr"><h2>📐 Spatial Analysis Tools</h2><p>Draw polygons, buffer analysis, region comparison — aggregate climate stats for any area</p>
        <div class="hdr-meta"><span>🖱 Draw on map</span><span>📊 Aggregated stats</span><span>⚖ Compare regions</span></div></div>

        <div class="card-grid g4">
            <div class="stat-card s-blue"><div class="stat-icon">📐</div><div class="stat-value" style="color:${C.info}">Draw</div><div class="stat-label">Polygon Tool</div><div class="stat-sub">Click to draw area</div></div>
            <div class="stat-card s-green"><div class="stat-icon">📊</div><div class="stat-value" style="color:${C.success}">Stats</div><div class="stat-label">Region Stats</div><div class="stat-sub">Aggregated data</div></div>
            <div class="stat-card s-orange"><div class="stat-icon">⚖</div><div class="stat-value" style="color:${C.orange}">Compare</div><div class="stat-label">Region Compare</div><div class="stat-sub">Side-by-side</div></div>
            <div class="stat-card s-purple"><div class="stat-icon">📏</div><div class="stat-value" style="color:${C.purple}">Buffer</div><div class="stat-label">Buffer Analysis</div><div class="stat-sub">5km radius zones</div></div>
        </div>

        <div class="card-grid g2 mt-3">
            <div class="card" style="padding:0;overflow:hidden">
                <div class="card-header" style="padding:12px 18px;border-bottom:1px solid var(--border)">
                    <h3 style="font-size:14px">📐 Draw Polygon on Map</h3>
                    <div style="display:flex;gap:8px">
                        <button id="draw-polygon-btn" style="background:var(--accent);color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:600">✏ Draw Polygon</button>
                        <button id="clear-polygon-btn" style="background:var(--bg-input);color:var(--text-primary);border:1px solid var(--border);border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px">🗑 Clear</button>
                    </div>
                </div>
                <div id="spatial-map" style="height:450px;border-radius:0"></div>
                <div style="padding:8px 18px;font-size:11px;color:var(--text-muted);border-top:1px solid var(--border)">
                    Click "Draw Polygon" then click points on the map. Double-click to finish.
                </div>
            </div>
            <div>
                <div id="region-stats-card" class="card">
                    <div class="card-header"><h3>📊 Region Statistics</h3></div>
                    <div id="region-stats-content" style="padding:12px;color:var(--text-muted);text-align:center">
                        Draw a polygon on the map to see aggregated climate stats for the selected area
                    </div>
                </div>
                <div id="buffer-card" class="card mt-3">
                    <div class="card-header"><h3>📏 Buffer Analysis</h3></div>
                    <div style="padding:12px">
                        <div style="display:flex;gap:8px;margin-bottom:10px">
                            <select id="buffer-center" style="flex:1;background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);padding:8px;border-radius:6px;font-size:12px">
                                <option value="">Select center district…</option>
                            </select>
                            <select id="buffer-radius" style="width:100px;background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);padding:8px;border-radius:6px;font-size:12px">
                                <option value="50">5 km</option>
                                <option value="100" selected>10 km</option>
                                <option value="200">20 km</option>
                                <option value="500">50 km</option>
                            </select>
                            <button id="buffer-btn" style="background:var(--accent);color:#fff;border:none;border-radius:6px;padding:8px 14px;cursor:pointer;font-size:12px">Analyze</button>
                        </div>
                        <div id="buffer-result" style="font-size:12px;color:var(--text-muted)">Select a center point and radius to analyze nearby districts</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card mt-3">
            <div class="card-header"><h3>⚖ Region Comparison</h3></div>
            <div style="padding:16px">
                <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:start">
                    <div>
                        <div style="font-weight:600;margin-bottom:8px">Region A</div>
                        <select id="compare-a" style="width:100%;background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);padding:8px;border-radius:6px;font-size:12px">
                            <option value="">Select province…</option>
                            <option value="Punjab">Punjab</option>
                            <option value="Sindh">Sindh</option>
                            <option value="KPK">KPK</option>
                            <option value="Balochistan">Balochistan</option>
                            <option value="GB">Gilgit-Baltistan</option>
                        </select>
                        <div id="compare-a-result" style="margin-top:8px"></div>
                    </div>
                    <div style="text-align:center;padding-top:20px"><span style="font-size:24px">⚖</span><br><button id="compare-btn" style="background:var(--accent);color:#fff;border:none;border-radius:6px;padding:8px 16px;cursor:pointer;font-size:12px;margin-top:8px">Compare</button></div>
                    <div>
                        <div style="font-weight:600;margin-bottom:8px">Region B</div>
                        <select id="compare-b" style="width:100%;background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);padding:8px;border-radius:6px;font-size:12px">
                            <option value="">Select province…</option>
                            <option value="Punjab">Punjab</option>
                            <option value="Sindh">Sindh</option>
                            <option value="KPK">KPK</option>
                            <option value="Balochistan">Balochistan</option>
                            <option value="GB">Gilgit-Baltistan</option>
                        </select>
                        <div id="compare-b-result" style="margin-top:8px"></div>
                    </div>
                </div>
                <div id="compare-chart" style="height:200px;margin-top:16px"></div>
            </div>
        </div>`;

        setTimeout(() => {
            const map = initFloodReplayMap('spatial-map', { zoom: 6 });
            let drawPoints = [];
            let drawLayer = null;
            let polygonPoints = [];

            // Populate buffer center dropdown
            const weather = (window.weatherData || typeof weatherData !== "undefined" ? weatherData : null) || {};
            const bufferSelect = document.getElementById('buffer-center');
            if (bufferSelect) {
                Object.entries(weather).forEach(([name, d]) => {
                    if (d.lat) bufferSelect.innerHTML += `<option value="${name}">${name} (${d.province})</option>`;
                });
            }

            // Draw polygon tool
            let isDrawing = false;
            document.getElementById('draw-polygon-btn')?.addEventListener('click', () => {
                isDrawing = !isDrawing;
                document.getElementById('draw-polygon-btn').textContent = isDrawing ? '⏹ Stop Drawing' : '✏ Draw Polygon';
                document.getElementById('draw-polygon-btn').style.background = isDrawing ? '#ef4444' : 'var(--accent)';
            });

            map.on('click', (e) => {
                if (!isDrawing) return;
                const { lat, lng } = e.latlng;
                drawPoints.push([lat, lng]);
                polygonPoints.push([lat, lng]);
                
                // Draw marker
                L.circleMarker([lat, lng], { radius: 5, fillColor: '#3b82f6', color: '#fff', weight: 2, fillOpacity: 0.9 }).addTo(map);
                
                // Draw lines
                if (drawLayer) map.removeLayer(drawLayer);
                drawLayer = L.polyline(drawPoints, { color: '#3b82f6', weight: 2, dashArray: '5,5' }).addTo(map);
            });

            map.on('dblclick', async (e) => {
                if (!isDrawing || drawPoints.length < 3) return;
                L.DomUtil.stopPropagation(e);
                isDrawing = false;
                document.getElementById('draw-polygon-btn').textContent = '✏ Draw Polygon';
                document.getElementById('draw-polygon-btn').style.background = 'var(--accent)';
                
                // Close polygon
                drawPoints.push(drawPoints[0]);
                if (drawLayer) map.removeLayer(drawLayer);
                drawLayer = L.polygon(drawPoints, { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2 }).addTo(map);
                
                // Query region stats
                try {
                    const res = await fetch('/api/map/region-stats', {
                        method: 'POST', headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({ polygon: drawPoints })
                    });
                    const data = await res.json();
                    const sc = document.getElementById('region-stats-content');
                    if (data.districts?.length) {
                        sc.innerHTML = `
                            <div style="font-size:14px;font-weight:600;margin-bottom:8px">${data.summary.count} Districts in Selection</div>
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                                <div style="padding:8px;background:var(--bg-secondary);border-radius:6px;text-align:center"><div style="font-size:16px;font-weight:700;color:${C.orange}">${data.summary.avg_temp}°C</div><div style="font-size:10px;color:var(--text-muted)">Avg Temp</div></div>
                                <div style="padding:8px;background:var(--bg-secondary);border-radius:6px;text-align:center"><div style="font-size:16px;font-weight:700;color:${C.danger}">${data.summary.max_temp}°C</div><div style="font-size:10px;color:var(--text-muted)">Max Temp</div></div>
                                <div style="padding:8px;background:var(--bg-secondary);border-radius:6px;text-align:center"><div style="font-size:16px;font-weight:700;color:${C.info}">${data.summary.avg_rain}mm</div><div style="font-size:10px;color:var(--text-muted)">Avg Rain</div></div>
                                <div style="padding:8px;background:var(--bg-secondary);border-radius:6px;text-align:center"><div style="font-size:16px;font-weight:700;color:${data.summary.avg_aqi>100?C.danger:C.success}">${data.summary.avg_aqi}</div><div style="font-size:10px;color:var(--text-muted)">Avg AQI</div></div>
                            </div>
                            <div style="margin-top:8px;font-size:11px;color:var(--text-muted)">Districts: ${data.districts.map(d=>d.name).join(', ')}</div>`;
                    } else {
                        sc.innerHTML = '<div style="color:var(--text-muted)">No districts found in selection. Try a larger area.</div>';
                    }
                } catch(e) { console.error(e); }
            });

            // Clear polygon
            document.getElementById('clear-polygon-btn')?.addEventListener('click', () => {
                drawPoints = []; polygonPoints = [];
                if (drawLayer) map.removeLayer(drawLayer);
                drawLayer = null;
                map.eachLayer(l => { if (l instanceof L.CircleMarker || l instanceof L.Polyline) map.removeLayer(l); });
                document.getElementById('region-stats-content').innerHTML = 'Draw a polygon on the map to see aggregated climate stats';
            });

            // Buffer analysis
            document.getElementById('buffer-btn')?.addEventListener('click', () => {
                const center = document.getElementById('buffer-center').value;
                const radius = parseInt(document.getElementById('buffer-radius').value);
                if (!center || !weather[center]) return;
                const cd = weather[center];
                const nearby = Object.entries(weather).filter(([n, d]) => {
                    if (!d.lat) return false;
                    const dist = Math.sqrt((d.lat-cd.lat)**2 + (d.lng-cd.lng)**2) * 111; // rough km
                    return dist <= radius && n !== center;
                });
                const all = [[center, cd], ...nearby];
                const n = all.length;
                const avgTemp = (all.reduce((s,[,d]) => s + (d.stats?.temp_max_7d||0), 0) / n).toFixed(1);
                const avgRain = (all.reduce((s,[,d]) => s + (d.stats?.rain_total_7d||0), 0) / n).toFixed(1);
                document.getElementById('buffer-result').innerHTML = `
                    <div style="padding:8px;background:var(--bg-secondary);border-radius:6px;margin-top:8px">
                        <div style="font-weight:600;margin-bottom:4px">📊 ${radius}km Buffer around ${center}</div>
                        <div style="font-size:12px">${n} districts found · Avg Temp: <b style="color:${C.orange}">${avgTemp}°C</b> · Avg Rain: <b style="color:${C.info}">${avgRain}mm</b></div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Districts: ${all.map(([n])=>n).join(', ')}</div>
                    </div>`;
            });

            // Compare regions
            document.getElementById('compare-btn')?.addEventListener('click', async () => {
                const provA = document.getElementById('compare-a').value;
                const provB = document.getElementById('compare-b').value;
                if (!provA || !provB) return;
                const w = (window.weatherData || typeof weatherData !== "undefined" ? weatherData : null) || {};
                const getStats = (prov) => {
                    const ds = Object.entries(w).filter(([,d]) => d.province === prov);
                    if (!ds.length) return null;
                    const n = ds.length;
                    return { count:n, avg_temp: (ds.reduce((s,[,d])=>s+(d.stats?.temp_max_7d||0),0)/n).toFixed(1), avg_rain: (ds.reduce((s,[,d])=>s+(d.stats?.rain_total_7d||0),0)/n).toFixed(1) };
                };
                const a = getStats(provA), b = getStats(provB);
                document.getElementById('compare-a-result').innerHTML = a ? `<div style="padding:8px;background:var(--bg-secondary);border-radius:6px;font-size:12px"><b>${a.count}</b> districts<br>Temp: <b style="color:${C.orange}">${a.avg_temp}°C</b><br>Rain: <b style="color:${C.info}">${a.avg_rain}mm</b></div>` : '';
                document.getElementById('compare-b-result').innerHTML = b ? `<div style="padding:8px;background:var(--bg-secondary);border-radius:6px;font-size:12px"><b>${b.count}</b> districts<br>Temp: <b style="color:${C.orange}">${b.avg_temp}°C</b><br>Rain: <b style="color:${C.info}">${b.avg_rain}mm</b></div>` : '';
            });
        }, 100);
    } catch(e) { el.innerHTML = '<div class="loading">Error: '+e.message+'</div>'; }
}
