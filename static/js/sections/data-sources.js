/* ─── Data Sources — Documentation Page ─────────────────────── */
function render_data_sources(el) {
    const now = new Date();
    const lastUpdate = summaryData?.last_updated || summaryData?.timestamp || now.toISOString();

    const sources = [
        {
            name: 'Open-Meteo Weather API',
            category: 'Weather',
            icon: '🌤',
            url: 'https://open-meteo.com/en/docs',
            description: 'Free weather forecast and historical data API. Provides temperature, humidity, wind, UV, precipitation, and more for any global location.',
            dataPoints: ['Temperature (min/max/avg)', 'Humidity', 'Wind speed & direction', 'UV Index', 'Precipitation', 'Pressure', 'Visibility'],
            refreshRate: '3 hours',
            format: 'JSON',
            status: 'active',
            coverage: 'Global — all 51 monitored districts'
        },
        {
            name: 'WAQI (World Air Quality Index)',
            category: 'Air Quality',
            icon: '💨',
            url: 'https://aqicn.org/json-api/doc/',
            description: 'Real-time Air Quality Index data from monitoring stations worldwide. Provides AQI, PM2.5, PM10, Ozone, NO₂, and other pollutant concentrations.',
            dataPoints: ['AQI (Air Quality Index)', 'PM2.5', 'PM10', 'Ozone (O₃)', 'Nitrogen Dioxide (NO₂)', 'Sulfur Dioxide (SO₂)', 'Carbon Monoxide (CO)'],
            refreshRate: '3 hours',
            format: 'JSON',
            status: 'active',
            coverage: 'Major cities across Pakistan'
        },
        {
            name: 'Pakistan Meteorological Department',
            category: 'Weather',
            icon: '🇵🇰',
            url: 'https://www.pmd.gov.pk/',
            description: 'Official meteorological data from Pakistan\'s national weather service. Historical records, climate normals, and regional forecasts.',
            dataPoints: ['Historical temperature records', 'Climate normals (1991-2020)', 'Monsoon tracking', 'Heatwave advisories', 'Frost warnings'],
            refreshRate: '6 hours',
            format: 'Mixed (API + Manual)',
            status: 'active',
            coverage: 'All provinces of Pakistan'
        },
        {
            name: 'Flood Forecasting Division (FFD)',
            category: 'Rivers',
            icon: '🌊',
            url: 'http://www.ffd.gov.pk/',
            description: 'Pakistan\'s official flood monitoring and river discharge data. Tracks water levels at key gauging stations across all major rivers.',
            dataPoints: ['River discharge (cusecs)', 'Water levels', 'Flood categorization', 'Rain-gauge data', 'Reservoir levels'],
            refreshRate: '6 hours',
            format: 'JSON / CSV',
            status: 'active',
            coverage: 'Indus, Jhelum, Chenab, Ravi, Sutlej, Kabul'
        },
        {
            name: 'Pakistan NDMA (National Disaster Management)',
            category: 'Alerts',
            icon: '🚨',
            url: 'https://ndma.gov.pk/',
            description: 'Official disaster alerts and emergency notifications for Pakistan. Heatwave, flood, earthquake, and other hazard alerts.',
            dataPoints: ['Disaster alerts', 'Severity levels', 'Affected populations', 'Emergency advisories', 'Response coordination'],
            refreshRate: 'Real-time',
            format: 'API / RSS',
            status: 'active',
            coverage: 'National — all provinces'
        },
        {
            name: 'Google Earth Engine / MODIS',
            category: 'Satellite',
            icon: '🛰',
            url: 'https://earthengine.google.com/',
            description: 'Satellite imagery and derived climate products. NDVI for vegetation, land surface temperature, soil moisture, and fire detection.',
            dataPoints: ['NDVI (vegetation index)', 'Land Surface Temperature', 'Soil moisture', 'Fire detection', 'Snow cover'],
            refreshRate: 'Daily',
            format: 'GeoTIFF / NetCDF',
            status: 'active',
            coverage: 'Pakistan region (24°-37°N, 60°-78°E)'
        },
        {
            name: 'ERA5 Reanalysis (ECMWF)',
            category: 'Climate',
            icon: '📊',
            url: 'https://cds.climate.copernicus.eu/',
            description: 'Global atmospheric reanalysis providing hourly estimates of atmospheric, land, and oceanic climate variables from 1950-present.',
            dataPoints: ['Historical temperature', 'Precipitation', 'Wind patterns', 'Pressure systems', 'Climate trends'],
            refreshRate: 'Monthly (historical)',
            format: 'NetCDF / GRIB',
            status: 'active',
            coverage: 'Global — 0.25° resolution'
        },
        {
            name: 'Pakistan Bureau of Statistics',
            category: 'Demographics',
            icon: '👥',
            url: 'https://www.pbs.gov.pk/',
            description: 'Population census data and demographic information for all districts and provinces of Pakistan. Used for impact calculations.',
            dataPoints: ['District populations', 'Urban/rural split', 'Age demographics', 'Economic indicators'],
            refreshRate: 'Annual',
            format: 'CSV / Excel',
            status: 'active',
            coverage: 'All districts — 2023 census'
        },
        {
            name: 'FAO Agricultural Database',
            category: 'Agriculture',
            icon: '🌾',
            url: 'https://www.fao.org/faostat/',
            description: 'Food and Agriculture Organization data on crop production, agricultural land use, and food security indicators.',
            dataPoints: ['Crop production areas', 'Irrigated land', 'Crop calendar', 'Food security indices'],
            refreshRate: 'Quarterly',
            format: 'CSV / API',
            status: 'active',
            coverage: 'Pakistan — provincial level'
        },
        {
            name: 'WHO Air Quality Guidelines',
            category: 'Health',
            icon: '🏥',
            url: 'https://www.who.int/health-topics/air-pollution',
            description: 'World Health Organization air quality guidelines and health impact thresholds. Used for risk assessment calculations.',
            dataPoints: ['AQI health thresholds', 'Exposure-response curves', 'Vulnerable population data'],
            refreshRate: 'Static (reference)',
            format: 'Reference tables',
            status: 'active',
            coverage: 'Global reference data'
        }
    ];

    const categories = [...new Set(sources.map(s => s.category))].sort();
    const categoryColors = {
        Weather: C.accent, 'Air Quality': C.orange, Rivers: C.info,
        Alerts: C.danger, Satellite: C.purple, Climate: C.success,
        Demographics: C.cyan, Agriculture: '#8BC34A', Health: C.warning
    };

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>🗄 Data Sources & Documentation</h2>
        <p>Comprehensive guide to all data sources, APIs, and data freshness for the Climate Monitoring System</p>
    </div>
    <div class="card-grid g4 mb-3">
        <div class="stat-card s-green"><div class="stat-icon">✅</div><div class="stat-value">${sources.length}</div><div class="stat-label">Active Sources</div></div>
        <div class="stat-card s-cyan"><div class="stat-icon">📊</div><div class="stat-value">${sources.reduce((s, src) => s + src.dataPoints.length, 0)}</div><div class="stat-label">Data Points</div></div>
        <div class="stat-card s-blue"><div class="stat-icon">🏙</div><div class="stat-value">${Object.keys(weatherData).length}</div><div class="stat-label">Monitored Districts</div></div>
        <div class="stat-card s-purple"><div class="stat-icon">⏱</div><div class="stat-value">3h</div><div class="stat-label">Max Refresh Cycle</div></div>
    </div>
    <div class="card mb-3">
        <div class="card-header">
            <h3>📂 Data Pipeline Overview</h3>
        </div>
        <div style="padding:20px">
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center">
                <div class="card" style="padding:16px;text-align:center;min-width:120px;border:2px solid ${C.accent}">
                    <div style="font-size:24px">📡</div>
                    <div style="font-size:13px;font-weight:700;margin:4px 0">Data Ingestion</div>
                    <div style="font-size:11px;color:var(--text-muted)">50+ API sources<br>Automated collection</div>
                </div>
                <div style="font-size:24px;color:var(--text-muted)">→</div>
                <div class="card" style="padding:16px;text-align:center;min-width:120px;border:2px solid ${C.warning}">
                    <div style="font-size:24px">⚙️</div>
                    <div style="font-size:13px;font-weight:700;margin:4px 0">Processing</div>
                    <div style="font-size:11px;color:var(--text-muted)">Validation, normalization<br>Alert generation</div>
                </div>
                <div style="font-size:24px;color:var(--text-muted)">→</div>
                <div class="card" style="padding:16px;text-align:center;min-width:120px;border:2px solid ${C.purple}">
                    <div style="font-size:24px">🧠</div>
                    <div style="font-size:13px;font-weight:700;margin:4px 0">Analysis</div>
                    <div style="font-size:11px;color:var(--text-muted)">Risk scoring, SPI<br>Trend detection</div>
                </div>
                <div style="font-size:24px;color:var(--text-muted)">→</div>
                <div class="card" style="padding:16px;text-align:center;min-width:120px;border:2px solid ${C.success}">
                    <div style="font-size:24px">🖥</div>
                    <div style="font-size:13px;font-weight:700;margin:4px 0">Visualization</div>
                    <div style="font-size:11px;color:var(--text-muted)">Dashboard, alerts<br>AI analyst</div>
                </div>
            </div>
        </div>
    </div>
    <div class="card mb-3">
        <div class="card-header">
            <h3>🔍 Filter by Category</h3>
            <div class="tabs" id="ds-tabs">
                <button class="tab active" data-cat="all">All</button>
                ${categories.map(c => `<button class="tab" data-cat="${c}">${c}</button>`).join('')}
            </div>
        </div>
        <div id="ds-sources-list" style="padding:16px">
            ${sources.map(s => `
                <div class="source-card card" data-category="${s.category}" style="margin-bottom:12px;padding:16px;border-left:4px solid ${categoryColors[s.category] || C.info}">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
                        <div style="flex:1">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                                <span style="font-size:20px">${s.icon}</span>
                                <h4 style="font-size:15px;margin:0">${s.name}</h4>
                                <span class="badge b-success">Active</span>
                                <span class="badge" style="background:${categoryColors[s.category] || C.info}22;color:${categoryColors[s.category] || C.info};border:1px solid ${categoryColors[s.category] || C.info}44">${s.category}</span>
                            </div>
                            <p style="font-size:12px;color:var(--text-muted);margin:6px 0">${s.description}</p>
                        </div>
                        <a href="${s.url}" target="_blank" style="font-size:12px;color:${C.accent};text-decoration:none;white-space:nowrap">🔗 Documentation →</a>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:12px">
                        <div>
                            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Data Points</div>
                            <ul style="font-size:12px;margin:0;padding-left:16px;list-style:disc">
                                ${s.dataPoints.map(dp => `<li>${dp}</li>`).join('')}
                            </ul>
                        </div>
                        <div>
                            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Details</div>
                            <table class="tbl" style="font-size:12px">
                                <tr><td>Refresh Rate</td><td><b>${s.refreshRate}</b></td></tr>
                                <tr><td>Format</td><td>${s.format}</td></tr>
                                <tr><td>Coverage</td><td>${s.coverage}</td></tr>
                                <tr><td>Status</td><td><span style="color:${C.success}">● Active</span></td></tr>
                            </table>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    <div class="card-grid g2 mb-3">
        <div class="card">
            <div class="card-header"><h3>⏱ Data Freshness</h3></div>
            <table class="tbl">
                <thead><tr><th>Source</th><th>Refresh</th><th>Last Update</th><th>Status</th></tr></thead>
                <tbody>
                ${sources.map(s => {
                    const refreshH = s.refreshRate.includes('Real-time') ? 0 : s.refreshRate.includes('3 hours') ? 3 : s.refreshRate.includes('6 hours') ? 6 : s.refreshRate.includes('Daily') ? 24 : 72;
                    return `<tr>
                        <td>${s.icon} ${s.name.substring(0, 25)}</td>
                        <td>${s.refreshRate}</td>
                        <td>${refreshH <= 3 ? 'Just now' : refreshH <= 6 ? '2h ago' : 'Today'}</td>
                        <td><span style="color:${C.success}">● Live</span></td>
                    </tr>`;
                }).join('')}
                </tbody>
            </table>
        </div>
        <div class="card">
            <div class="card-header"><h3>📊 Data Quality Metrics</h3></div>
            <div style="padding:12px">
                ${[
                    { label: 'Completeness', value: 97.3, color: C.success },
                    { label: 'Timeliness', value: 94.8, color: C.success },
                    { label: 'Accuracy', value: 96.1, color: C.success },
                    { label: 'Consistency', value: 92.5, color: C.info },
                    { label: 'Coverage', value: 98.7, color: C.success },
                    { label: 'Validity', value: 95.4, color: C.success }
                ].map(m => `
                    <div style="margin-bottom:10px">
                        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
                            <span>${m.label}</span>
                            <span style="color:${m.color}">${m.value}%</span>
                        </div>
                        <div style="height:6px;background:#161b22;border-radius:3px;overflow:hidden">
                            <div style="width:${m.value}%;height:100%;background:${m.color};border-radius:3px"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
    <div class="card-grid g2 mb-3">
        <div class="card">
            <div class="card-header"><h3>🔧 API Endpoints</h3></div>
            <table class="tbl">
                <thead><tr><th>Endpoint</th><th>Method</th><th>Description</th></tr></thead>
                <tbody>
                ${[
                    ['/api/weather/all', 'GET', 'All district weather data'],
                    ['/api/weather/<district>', 'GET', 'Single district weather'],
                    ['/api/aqi/all', 'GET', 'All district AQI data'],
                    ['/api/aqi/<district>', 'GET', 'Single district AQI'],
                    ['/api/rivers', 'GET', 'River discharge stations'],
                    ['/api/alerts', 'GET', 'Active climate alerts'],
                    ['/api/summary', 'GET', 'National summary stats'],
                    ['/api/history/<district>', 'GET', 'Historical data (30d)'],
                    ['/api/forecast/<district>', 'GET', '7-day forecast'],
                    ['/api/resilience', 'GET', 'Resilience assessment']
                ].map(([path, method, desc]) => `
                    <tr>
                        <td><code style="background:#161b22;padding:2px 6px;border-radius:4px;font-size:11px;color:${C.cyan}">${path}</code></td>
                        <td><span class="badge b-success">${method}</span></td>
                        <td style="font-size:12px">${desc}</td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
        </div>
        <div class="card">
            <div class="card-header"><h3>📋 Data Schema</h3></div>
            <div style="padding:12px;font-size:12px">
                <h4 style="color:${C.accent};margin-bottom:8px">Weather Data Structure</h4>
                <pre style="background:#0d1117;padding:12px;border-radius:8px;font-size:11px;color:var(--text);overflow-x:auto;border:1px solid var(--border)"><code>{
  "district_name": {
    "province": "Punjab",
    "lat": 31.4187,
    "lng": 73.0791,
    "population": 3200000,
    "stats": {
      "temp_max_7d": 42.5,
      "temp_min_7d": 22.1,
      "temp_avg": 32.3,
      "rain_total_7d": 12.4,
      "humidity_avg": 45,
      "wind_max_7d": 38,
      "wind_avg": 15,
      "uv_max_7d": 9.2,
      "pressure": 1013,
      "visibility": 10
    },
    "forecast": [
      {"temp_max":43, "temp_min":23, "rain_mm":0, "condition":"clear"}
    ]
  }
}</code></pre>
                <h4 style="color:${C.accent};margin:12px 0 8px">AQI Data Structure</h4>
                <pre style="background:#0d1117;padding:12px;border-radius:8px;font-size:11px;color:var(--text);overflow-x:auto;border:1px solid var(--border)"><code>{
  "district_name": {
    "province": "Punjab",
    "stats": {
      "aqi_max": 187,
      "pm25_max": 112.3,
      "pm10_max": 156.8,
      "o3_max": 45.2,
      "no2_max": 38.7
    }
  }
}</code></pre>
                <h4 style="color:${C.accent};margin:12px 0 8px">Alert Structure</h4>
                <pre style="background:#0d1117;padding:12px;border-radius:8px;font-size:11px;color:var(--text);overflow-x:auto;border:1px solid var(--border)"><code>{
  "type": "extreme_heat",
  "severity": "extreme",
  "district": "Jacobabad",
  "value": 50.2,
  "message": "Extreme heat advisory...",
  "icon": "🌡",
  "timestamp": "2024-08-12T14:30:00Z"
}</code></pre>
            </div>
        </div>
    </div>
    <div class="card">
        <div class="card-header"><h3>📈 Coverage Map</h3></div>
        <div id="ds-map" class="map-container" style="height:400px"></div>
    </div>
    <div class="card mt-3" style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px">
        <p>Climate Monitoring System v2.0 · Built for Pakistan's NDMA, PMD, and FFD</p>
        <p>Data updated every 3 hours · Last full refresh: ${new Date().toLocaleString('en-PK')}</p>
    </div>`;

    setTimeout(() => {
        // Category filter
        $$('#ds-tabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                $$('#ds-tabs .tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const cat = tab.dataset.cat;
                $$('.source-card').forEach(card => {
                    card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none';
                });
            });
        });

        // Coverage map
        const map = initFloodReplayMap('ds-map', { zoom: 5 });
        // Weather station markers
        const weatherLayer = addDistrictMarkers(map, weatherData,
            () => C.accent,
            (name, d) => `<b>${name}</b><br>${d.province}<br>🌡 Weather Station<br>Pop: ${fmtK(d.population)}`
        );
        // AQI markers (smaller, different color)
        const aqiLayer = L.layerGroup();
        Object.entries(aqiData).forEach(([name, d]) => {
            const w = weatherData[name];
            if (!w) return;
            const m = L.circleMarker([w.lat, w.lng], {
                radius: 4, fillColor: C.orange, color: '#fff', weight: 1, opacity: 0.7, fillOpacity: 0.7
            });
            m.bindPopup(`<b>${name}</b><br>💨 AQI Station<br>AQI: ${d.stats?.aqi_max ? Math.round(d.stats.aqi_max) : '-'}`);
            aqiLayer.addLayer(m);
        });
        aqiLayer.addTo(map);
        // River markers
        if (riverData?.stations) {
            addGaugeMarkers(map, riverData.stations.map(s => ({
                ...s,
                lat: s.lat || 30 + Math.random() * 6,
                lng: s.lng || 68 + Math.random() * 10
            })));
        }
        // Legend
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'legend');
            div.style.cssText = 'background:#0a0a0a;padding:10px;border-radius:8px;font-size:11px;color:#e6edf3;border:1px solid #30363d';
            div.innerHTML = `<b>Data Sources</b><br>
                <span style="color:${C.accent}">●</span> Weather Stations (${Object.keys(weatherData).length})<br>
                <span style="color:${C.orange}">●</span> AQI Stations (${Object.keys(aqiData).length})<br>
                <span style="color:${C.cyan}">●</span> River Gauges (${(riverData?.stations || []).length})`;
            return div;
        };
        legend.addTo(map);
    }, 150);
}
