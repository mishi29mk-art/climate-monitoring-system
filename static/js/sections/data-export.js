/* ─── Data Export & API ─────────────────────────────────────── */
async function render_data_export(el) {
    el.innerHTML = '<div class="loading">Loading export options…</div>';
    try {
        el.innerHTML = `
        <div class="sec-hdr"><h2>📤 Data Export & API</h2><p>Export climate data as CSV, GeoJSON, JSON — REST API for third-party integrations</p>
        <div class="hdr-meta"><span>📊 Multiple formats</span><span>🔗 REST API</span><span>📥 Bulk download</span></div></div>

        <div class="card-grid g4">
            <div class="stat-card s-green"><div class="stat-icon">📊</div><div class="stat-value" style="color:${C.success}">CSV</div><div class="stat-label">Spreadsheet Export</div><div class="stat-sub">Excel compatible</div></div>
            <div class="stat-card s-blue"><div class="stat-icon">🗺</div><div class="stat-value" style="color:${C.info}">GeoJSON</div><div class="stat-label">GIS Export</div><div class="stat-sub">Map-ready format</div></div>
            <div class="stat-card s-orange"><div class="stat-icon">📋</div><div class="stat-value" style="color:${C.orange}">JSON</div><div class="stat-label">Full Data Export</div><div class="stat-sub">All parameters</div></div>
            <div class="stat-card s-purple"><div class="stat-icon">🔗</div><div class="stat-value" style="color:${C.purple}">API</div><div class="stat-label">REST Endpoints</div><div class="stat-sub">Third-party access</div></div>
        </div>

        <!-- Export Options -->
        <div class="card-grid g3 mt-3">
            <div class="card" style="text-align:center;cursor:pointer" onclick="window.open('/api/export/csv','_blank')">
                <div style="font-size:40px;margin-bottom:8px">📊</div>
                <h3 style="margin-bottom:4px">CSV Export</h3>
                <p style="font-size:12px;color:var(--text-secondary)">All districts with temperature, rainfall, AQI, wind, UV data in spreadsheet format</p>
                <div style="margin-top:10px"><span class="badge b-success">Download CSV</span></div>
            </div>
            <div class="card" style="text-align:center;cursor:pointer" onclick="window.open('/api/export/geojson','_blank')">
                <div style="font-size:40px;margin-bottom:8px">🗺</div>
                <h3 style="margin-bottom:4px">GeoJSON Export</h3>
                <p style="font-size:12px;color:var(--text-secondary)">Point features with all climate attributes — ready for QGIS, ArcGIS, Leaflet</p>
                <div style="margin-top:10px"><span class="badge b-info">Download GeoJSON</span></div>
            </div>
            <div class="card" style="text-align:center;cursor:pointer" onclick="window.open('/api/export/json','_blank')">
                <div style="font-size:40px;margin-bottom:8px">📋</div>
                <h3 style="margin-bottom:4px">Full JSON Export</h3>
                <p style="font-size:12px;color:var(--text-secondary)">Complete dataset — weather, AQI, rivers, forecasts, alerts in JSON format</p>
                <div style="margin-top:10px"><span class="badge b-orange">Download JSON</span></div>
            </div>
        </div>

        <!-- REST API Documentation -->
        <div class="card mt-3">
            <div class="card-header"><h3>🔗 REST API Endpoints</h3><span class="badge b-success">Public API</span></div>
            <div class="tbl-scroll" style="max-height:400px"><table class="tbl"><thead><tr><th>Method</th><th>Endpoint</th><th>Description</th><th>Format</th></tr></thead><tbody>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/weather/all</code></td><td>All district weather data (7-day forecast)</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/weather/{district}</code></td><td>Single district weather data</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/aqi/all</code></td><td>All district air quality data</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/rivers</code></td><td>River discharge stations</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/alerts</code></td><td>Active climate alerts</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/summary</code></td><td>National summary stats</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/map/layers</code></td><td>All map layers with data points</td><td>JSON</td></tr>
                <tr><td><span class="badge b-info">POST</span></td><td><code>/api/map/query</code></td><td>Query climate stats at {lat, lng}</td><td>JSON</td></tr>
                <tr><td><span class="badge b-info">POST</span></td><td><code>/api/map/region-stats</code></td><td>Aggregated stats for polygon area</td><td>JSON</td></tr>
                <tr><td><span class="badge b-info">POST</span></td><td><code>/api/map/compare</code></td><td>Compare two regions side-by-side</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/alerts/thresholds</code></td><td>Alert thresholds & history</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/export/csv</code></td><td>Download all data as CSV</td><td>CSV</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/export/geojson</code></td><td>Download as GeoJSON features</td><td>GeoJSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/export/json</code></td><td>Download full dataset as JSON</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/export/district/{name}</code></td><td>Single district full export</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/modules/ingestion</code></td><td>Data source registry</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/modules/processing</code></td><td>Pipeline status & metrics</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/modules/geospatial</code></td><td>GIS data sources</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/modules/hazard-risk</code></td><td>Hazard & risk assessment</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/modules/socioeconomic</code></td><td>Population & economic data</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/modules/ghg</code></td><td>Greenhouse gas emissions</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/modules/users</code></td><td>User management data</td><td>JSON</td></tr>
                <tr><td><span class="badge b-success">GET</span></td><td><code>/api/modules/reports</code></td><td>Report templates & history</td><td>JSON</td></tr>
            </tbody></table></div>
        </div>

        <!-- API Usage Examples -->
        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header"><h3>💻 cURL Examples</h3></div>
                <div style="padding:12px;background:var(--bg-secondary);border-radius:var(--r-md);font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.8;overflow-x:auto">
                    <div style="color:var(--text-muted)"># Get all weather data</div>
                    <div style="color:${C.success}">curl https://climate.12.jugaar.ai/api/weather/all</div><br>
                    <div style="color:var(--text-muted)"># Query a specific district</div>
                    <div style="color:${C.success}">curl https://climate.12.jugaar.ai/api/weather/Lahore</div><br>
                    <div style="color:var(--text-muted)"># Download CSV export</div>
                    <div style="color:${C.success}">curl -O https://climate.12.jugaar.ai/api/export/csv</div><br>
                    <div style="color:var(--text-muted)"># Query location (POST)</div>
                    <div style="color:${C.success}">curl -X POST https://climate.12.jugaar.ai/api/map/query \<br>  -H "Content-Type: application/json" \<br>  -d '{"lat":31.55,"lng":74.35}'</div>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>🐍 Python Example</h3></div>
                <div style="padding:12px;background:var(--bg-secondary);border-radius:var(--r-md);font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.8;overflow-x:auto">
                    <div style="color:var(--text-muted)">import requests</div><br>
                    <div style="color:${C.purple}">base</div> = <div style="color:${C.success}">"https://climate.12.jugaar.ai"</div><br><br>
                    <div style="color:var(--text-muted)"># Get all weather data</div>
                    <div style="color:${C.info}">weather</div> = requests.get(f"{base}/api/weather/all").json()<br><br>
                    <div style="color:var(--text-muted)"># Get alerts</div>
                    <div style="color:${C.info}">alerts</div> = requests.get(f"{base}/api/alerts").json()<br><br>
                    <div style="color:var(--text-muted)"># Query a location</div>
                    <div style="color:${C.info}">result</div> = requests.post(f"{base}/api/map/query",<br>  json={"lat": 31.55, "lng": 74.35}).json()<br>
                    <div style="color:${C.purple}">print</div>(result[<div style="color:${C.success}">"district"</div>], result[<div style="color:${C.success}">"temperature"</div>])
                </div>
            </div>
        </div>

        <!-- Screenshot Export -->
        <div class="card mt-3">
            <div class="card-header"><h3>📸 Export Map View</h3></div>
            <div style="padding:12px;display:flex;gap:12px;align-items:center">
                <span style="font-size:12px;color:var(--text-secondary)">Capture current map view as image:</span>
                <button onclick="html2canvas(document.getElementById('main-content')).then(c=>{const l=document.createElement('a');l.download='climate-map-export.png';l.href=c.toDataURL();l.click()})" style="background:var(--accent);color:#fff;border:none;border-radius:6px;padding:8px 16px;cursor:pointer;font-size:12px;font-weight:600">📸 Export as PNG</button>
                <button onclick="window.print()" style="background:var(--bg-input);color:var(--text-primary);border:1px solid var(--border);border-radius:6px;padding:8px 16px;cursor:pointer;font-size:12px">🖨 Print / PDF</button>
            </div>
        </div>`;
    } catch(e) { el.innerHTML = '<div class="loading">Error: '+e.message+'</div>'; }
}
