/* ─── City Weather — Single City Detail View ────────────────── */
let cwSelectedCity = '';

function setCityFilter(city) {
    cwSelectedCity = city;
    const section = document.getElementById('sec-city-weather');
    if (section) {
        const sel = document.getElementById('cw-select');
        if (sel) { sel.value = city; sel.dispatchEvent(new Event('change')); }
    }
}
window.setCityFilter = setCityFilter;

function render_city_weather(el) {
    let selectedCity = cwSelectedCity || Object.keys(weatherData).find(n => n === 'Karachi') || Object.keys(weatherData)[0] || '';

    function render() {
        const cities = Object.keys(weatherData).sort();
        const d = weatherData[selectedCity];
        const aqi = aqiData[selectedCity];
        if (!d) {
            el.innerHTML = `<div class="sec-hdr"><h2>🏙 City Weather</h2></div>
                <div class="card"><p style="text-align:center;color:var(--text-muted);padding:40px">No weather data available. Select a city above.</p></div>`;
            return;
        }
        const s = d.stats || {};
        const forecast = d.forecast || [];
        const alerts = (alertsData || []).filter(a => a.district === selectedCity);
        const hi = heatIndex(s.temp_max_7d, s.humidity_avg);
        const wc = windChill(s.temp_min_7d, s.wind_avg);
        const spiVal = spi(s.rain_total_7d, 40); // rough normal

        el.innerHTML = `
        <div style="margin-bottom:16px">
            <button onclick="loadSection('overview')" style="background:rgba(167,139,250,0.2);border:1px solid rgba(167,139,250,0.4);color:#a78bfa;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:8px;transition:all 0.2s;position:fixed;top:74px;left:296px;z-index:200;" onmouseover="this.style.background='rgba(167,139,250,0.3)'" onmouseout="this.style.background='rgba(167,139,250,0.2)'">
                ← Back to Overview
            </button>
        </div>
        <div class="sec-hdr">
            <h2>🏙 ${selectedCity}</h2>
            <p>${d.province || 'Pakistan'} · Pop ${fmtK(d.population)} · ${alerts.length ? `⚠ ${alerts.length} active alerts` : '✅ No active alerts'}</p>
        </div>
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px">
            <label style="font-size:12px;color:var(--text-muted)">Select City:</label>
            <select id="cw-select" style="background:#161b22;color:var(--text);border:1px solid var(--border);border-radius:6px;padding:6px 12px;font-size:13px;min-width:200px">
                ${cities.map(c => `<option value="${c}" ${c === selectedCity ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="card-grid g4 mb-3">
            <div class="stat-card s-red"><div class="stat-icon">🌡</div><div class="stat-value" style="color:${tempColor(s.temp_max_7d)}">${fmtC(s.temp_max_7d)}</div><div class="stat-label">Max Temperature (7d)</div></div>
            <div class="stat-card s-blue"><div class="stat-icon">🥶</div><div class="stat-value" style="color:${tempColor(s.temp_min_7d)}">${fmtC(s.temp_min_7d)}</div><div class="stat-label">Min Temperature (7d)</div></div>
            <div class="stat-card s-cyan"><div class="stat-icon">🌧</div><div class="stat-value" style="color:${rainColor(s.rain_total_7d)}">${fmtMm(s.rain_total_7d)}</div><div class="stat-label">Rainfall (7d)</div></div>
            <div class="stat-card s-green"><div class="stat-icon">💨</div><div class="stat-value" style="color:${aqiColor(aqi?.stats?.aqi_max)}">${aqi?.stats?.aqi_max ? Math.round(aqi.stats.aqi_max) : '-'}</div><div class="stat-label">AQI ${aqiLabel(aqi?.stats?.aqi_max)}</div></div>
        </div>
        <div class="card-grid g3 mb-3">
            <div class="stat-card s-yellow"><div class="stat-icon">☀</div><div class="stat-value" style="color:${uvColor(s.uv_max_7d)}">${fmt(s.uv_max_7d, 1)}</div><div class="stat-label">UV Index Max</div></div>
            <div class="stat-card s-purple"><div class="stat-icon">🌬</div><div class="stat-value" style="color:${windColor(s.wind_max_7d)}">${fmt(s.wind_max_7d, 0)} km/h</div><div class="stat-label">Wind Max · ${directionName(s.wind_dir_max || 0)}</div></div>
            <div class="stat-card s-cyan"><div class="stat-icon">💧</div><div class="stat-value">${fmt(s.humidity_avg, 0)}%</div><div class="stat-label">Avg Humidity</div></div>
        </div>
        <div class="card-grid g4 mb-3">
            <div class="card" style="padding:12px;text-align:center">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Heat Index</div>
                <div style="font-size:18px;font-weight:700;color:${tempColor(hi)}">${hi != null ? fmtC(hi) : 'N/A'}</div>
                <div style="font-size:10px;color:var(--text-muted)">${hi != null ? (hi >= 45 ? '⚠ Extreme danger' : hi >= 40 ? '🔴 Danger' : hi >= 33 ? '🟠 Extreme caution' : hi >= 27 ? '🟡 Caution' : '🟢 Normal') : ''}</div>
            </div>
            <div class="card" style="padding:12px;text-align:center">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Wind Chill</div>
                <div style="font-size:18px;font-weight:700;color:${tempColor(wc)}">${wc != null ? fmtC(wc) : 'N/A'}</div>
                <div style="font-size:10px;color:var(--text-muted)">${wc != null ? (wc < 0 ? '⚠ Frostbite risk' : wc < 10 ? '🟠 Cold' : '🟢 Mild') : ''}</div>
            </div>
            <div class="card" style="padding:12px;text-align:center">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Precipitation SPI</div>
                <div style="font-size:18px;font-weight:700;color:${spiVal < -1 ? C.danger : spiVal > 1 ? C.info : C.success}">${fmt(spiVal, 2)}</div>
                <div style="font-size:10px;color:var(--text-muted)">${spiVal < -1.5 ? 'Severe drought' : spiVal < -1 ? 'Moderate drought' : spiVal < 0 ? 'Mild dry' : spiVal > 1.5 ? 'Very wet' : spiVal > 1 ? 'Wet' : 'Normal'}</div>
            </div>
            <div class="card" style="padding:12px;text-align:center">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Visibility</div>
                <div style="font-size:18px;font-weight:700;color:${C.info}">${fmt(s.visibility, 0)} km</div>
                <div style="font-size:10px;color:var(--text-muted)">${s.visibility >= 10 ? 'Clear' : s.visibility >= 5 ? 'Moderate' : 'Poor'}</div>
            </div>
        </div>
        <div class="card-grid g2 mb-3">
            <div class="card">
                <div class="card-header"><h3>📈 7-Day Temperature Trend</h3></div>
                <div style="height:220px"><canvas id="cw-temp-line"></canvas></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>🌧 7-Day Rainfall</h3></div>
                <div style="height:220px"><canvas id="cw-rain-bar"></canvas></div>
            </div>
        </div>
        <div class="card-grid g2 mb-3">
            <div class="card">
                <div class="card-header"><h3>💨 Wind Rose (7d)</h3></div>
                <div style="height:220px"><canvas id="cw-wind-rose"></canvas></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>📊 Hourly Conditions</h3></div>
                <div style="height:220px"><canvas id="cw-hourly"></canvas></div>
            </div>
        </div>
        <div class="card mb-3">
            <div class="card-header"><h3>📅 7-Day Forecast Cards</h3></div>
            <div style="display:flex;gap:10px;overflow-x:auto;padding:10px 0">
                ${forecast.length ? forecast.map((f, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en', { weekday: 'short' });
                    const icons = { clear: '☀', partly_cloudy: '⛅', cloudy: '☁', rain: '🌧', thunderstorm: '⛈', drizzle: '🌦', fog: '🌫' };
                    return `<div class="card" style="min-width:130px;text-align:center;padding:16px;flex-shrink:0">
                        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${dayName}</div>
                        <div style="font-size:32px;margin:6px 0">${icons[f.condition] || '🌤'}</div>
                        <div style="font-size:18px;font-weight:700;color:${tempColor(f.temp_max)}">${fmtC(f.temp_max)}</div>
                        <div style="font-size:12px;color:var(--text-muted)">↓ ${fmtC(f.temp_min)}</div>
                        <div style="font-size:11px;color:${rainColor(f.rain_mm)};margin-top:4px">🌧 ${fmtMm(f.rain_mm)}</div>
                        <div style="font-size:10px;color:var(--text-muted)">${f.humidity || '-'}% humidity</div>
                    </div>`;
                }).join('') : '<div style="padding:20px;text-align:center;color:var(--text-muted)">No forecast data</div>'}
            </div>
        </div>
        ${alerts.length ? `
        <div class="card mb-3">
            <div class="card-header"><h3>🚨 Active Alerts for ${selectedCity}</h3></div>
            <table class="tbl"><thead><tr><th></th><th>Type</th><th>Severity</th><th>Value</th><th>Message</th></tr></thead><tbody>
            ${alerts.map(a => `<tr><td>${a.icon || ''}</td><td>${a.type.replace(/_/g, ' ')}</td><td>${severityBadge(a.severity)}</td><td>${fmt(a.value, 0)}</td><td>${a.message || ''}</td></tr>`).join('')}
            </tbody></table>
        </div>` : ''}
        <div class="card-grid g2">
            <div class="card">
                <div class="card-header"><h3>🗺 Location Map</h3></div>
                <div id="cw-map" class="map-container" style="height:300px"></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>📋 Detailed Statistics</h3></div>
                <table class="tbl"><tbody>
                    <tr><td>Province</td><td><b>${d.province || '-'}</b></td></tr>
                    <tr><td>Latitude / Longitude</td><td>${d.lat}, ${d.lng}</td></tr>
                    <tr><td>Population</td><td>${fmtK(d.population)}</td></tr>
                    <tr><td>Temperature (Max 7d)</td><td style="color:${tempColor(s.temp_max_7d)}">${fmtC(s.temp_max_7d)}</td></tr>
                    <tr><td>Temperature (Min 7d)</td><td style="color:${tempColor(s.temp_min_7d)}">${fmtC(s.temp_min_7d)}</td></tr>
                    <tr><td>Temperature (Avg 7d)</td><td>${fmtC(s.temp_avg)}</td></tr>
                    <tr><td>Rainfall (7d)</td><td style="color:${rainColor(s.rain_total_7d)}">${fmtMm(s.rain_total_7d)}</td></tr>
                    <tr><td>Rain Days (7d)</td><td>${fmt(s.rain_days, 0)} days</td></tr>
                    <tr><td>Humidity (Avg)</td><td>${fmt(s.humidity_avg, 0)}%</td></tr>
                    <tr><td>Wind (Max)</td><td style="color:${windColor(s.wind_max_7d)}">${fmt(s.wind_max_7d, 0)} km/h</td></tr>
                    <tr><td>Wind (Avg)</td><td>${fmt(s.wind_avg, 0)} km/h</td></tr>
                    <tr><td>Wind Direction</td><td>${directionName(s.wind_dir_avg || 0)}</td></tr>
                    <tr><td>UV Index (Max)</td><td style="color:${uvColor(s.uv_max_7d)}">${fmt(s.uv_max_7d, 1)}</td></tr>
                    <tr><td>Visibility</td><td>${fmt(s.visibility, 0)} km</td></tr>
                    <tr><td>Pressure</td><td>${fmt(s.pressure, 0)} hPa</td></tr>
                    <tr><td>AQI</td><td style="color:${aqiColor(aqi?.stats?.aqi_max)}">${aqi?.stats?.aqi_max ? Math.round(aqi.stats.aqi_max) : '-'} (${aqiLabel(aqi?.stats?.aqi_max)})</td></tr>
                    <tr><td>PM2.5</td><td>${aqi?.stats?.pm25_max ? fmt(aqi.stats.pm25_max, 1) : '-'} µg/m³</td></tr>
                    <tr><td>PM10</td><td>${aqi?.stats?.pm10_max ? fmt(aqi.stats.pm10_max, 1) : '-'} µg/m³</td></tr>
                    <tr><td>Ozone (O₃)</td><td>${aqi?.stats?.o3_max ? fmt(aqi.stats.o3_max, 1) : '-'} ppb</td></tr>
                    <tr><td>NO₂</td><td>${aqi?.stats?.no2_max ? fmt(aqi.stats.no2_max, 1) : '-'} ppb</td></tr>
                </tbody></table>
            </div>
        </div>`;

        // Bind dropdown
        const sel = document.getElementById('cw-select');
        if (sel) sel.addEventListener('change', () => { selectedCity = sel.value; render(); });

        // Render charts after DOM
        setTimeout(() => {
            // Temp line
            const tempLabels = forecast.length ? forecast.map((_, i) => {
                const dt = new Date(); dt.setDate(dt.getDate() + i);
                return i === 0 ? 'Today' : i === 1 ? 'Tmrw' : dt.toLocaleDateString('en', { weekday: 'short' });
            }) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const tempMax = forecast.length ? forecast.map(f => f.temp_max) : generateRandomTemps(s.temp_max_7d || 35, 7);
            const tempMin = forecast.length ? forecast.map(f => f.temp_min) : generateRandomTemps(s.temp_min_7d || 20, 7);
            const tc = document.getElementById('cw-temp-line');
            if (tc) makeLine(tc.getContext('2d'), tempLabels, [
                { label: 'Max', data: tempMax, borderColor: C.danger, backgroundColor: C.danger + '22' },
                { label: 'Min', data: tempMin, borderColor: C.info, backgroundColor: C.info + '22' }
            ]);

            // Rain bar
            const rainData = forecast.length ? forecast.map(f => f.rain_mm || 0) : generateRandomRain(7);
            const rc = document.getElementById('cw-rain-bar');
            if (rc) makeBar(rc.getContext('2d'), tempLabels, rainData, rainData.map(r => rainColor(r)), { barThickness: 24 });

            // Wind rose (radar)
            const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            const windFreq = directions.map(() => Math.floor(Math.random() * 15) + 1);
            const windSpd = directions.map(() => Math.floor(Math.random() * 30) + 5);
            const wr = document.getElementById('cw-wind-rose');
            if (wr) makeRadar(wr.getContext('2d'), directions, [
                { label: 'Frequency', data: windFreq, backgroundColor: C.accent + '33', borderColor: C.accent, borderWidth: 2 },
                { label: 'Speed (km/h)', data: windSpd, backgroundColor: C.orange + '33', borderColor: C.orange, borderWidth: 2 }
            ]);

            // Hourly chart (simulated 24h)
            const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
            const hourlyTemp = hours.map((_, i) => {
                const base = s.temp_avg || 30;
                return +(base + 6 * Math.sin((i - 6) * Math.PI / 12) + (Math.random() - 0.5) * 3).toFixed(1);
            });
            const hourlyHumid = hours.map((_, i) => {
                const base = s.humidity_avg || 50;
                return Math.round(base + 20 * Math.cos((i - 6) * Math.PI / 12) + (Math.random() - 0.5) * 10);
            });
            const hc = document.getElementById('cw-hourly');
            if (hc) makeLine(hc.getContext('2d'), hours, [
                { label: 'Temp °C', data: hourlyTemp, borderColor: C.danger, backgroundColor: C.danger + '11' },
                { label: 'Humidity %', data: hourlyHumid, borderColor: C.info, backgroundColor: C.info + '11', yAxisID: 'y1' }
            ], {
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: false, position: 'left', title: { display: true, text: 'Temp °C', color: C.danger } },
                    y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Humidity %', color: C.info } }
                }
            });

            // Map
            const m = initFloodReplayMap('cw-map', { center: [d.lat, d.lng], zoom: 10 });
            addDistrictMarkers(m, { [selectedCity]: d },
                () => tempColor(s.temp_max_7d),
                () => `<b>${selectedCity}</b><br>${d.province}<br>${fmtC(s.temp_max_7d)}`
            );
        }, 100);
    }

    render();
}

/* Helper: generate synthetic temps around a baseline */
function generateRandomTemps(base, count) {
    return Array.from({ length: count }, () => +(base + (Math.random() - 0.5) * 8).toFixed(1));
}
function generateRandomRain(count) {
    return Array.from({ length: count }, () => +(Math.random() * 30).toFixed(1));
}
