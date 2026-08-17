/* ─── Compare Districts Section ─────────────────────────────── */
function render_compare(el) {
    const cities = Object.keys(weatherData || {}).sort();
    if (cities.length < 2) {
        el.innerHTML = `<div class="sec-hdr"><h2>⚖️ Compare Districts</h2></div>
            <div class="card"><p style="text-align:center;color:var(--text-muted);padding:40px">Not enough district data to compare.</p></div>`;
        return;
    }

    let cityA = cities[0];
    let cityB = cities[1] || cities[0];

    function getDistrictData(name) {
        const w = weatherData[name] || {};
        const a = aqiData[name] || {};
        const s = w.stats || {};
        const aq = a.stats || {};
        return {
            name,
            province: w.province || 'Unknown',
            temp: s.temp_max_7d,
            tempMin: s.temp_min_7d,
            humidity: s.humidity_avg,
            wind: s.wind_avg,
            windMax: s.wind_max_7d,
            windDir: s.wind_dir_max,
            rainfall: s.rain_total_7d,
            uv: s.uv_max_7d,
            aqi: aq.aqi_avg || aq.aqi_max || null,
            aqiMax: aq.aqi_max,
            aqiLabel: aqiLabel(aq.aqi_max),
            population: w.population
        };
    }

    function diffArrow(a, b) {
        if (a == null || b == null) return '';
        const diff = a - b;
        if (Math.abs(diff) < 0.1) return ' <span style="color:var(--text-muted);font-size:11px">=</span>';
        if (diff > 0) return ` <span style="color:${C.danger};font-size:11px">▲ ${fmt(Math.abs(diff))}</span>`;
        return ` <span style="color:${C.success};font-size:11px">▼ ${fmt(Math.abs(diff))}</span>`;
    }

    function diffColor(a, b, invert) {
        if (a == null || b == null) return '';
        const diff = a - b;
        if (Math.abs(diff) < 0.1) return 'var(--text-muted)';
        if (invert) return diff > 0 ? C.success : C.danger;
        return diff > 0 ? C.danger : C.success;
    }

    function render() {
        const a = getDistrictData(cityA);
        const b = getDistrictData(cityB);

        el.innerHTML = `
        <div class="sec-hdr">
            <h2>⚖️ Compare Districts</h2>
            <p>Side-by-side comparison of key climate metrics for any two districts</p>
            <div class="hdr-meta">
                <span>📊 ${cities.length} districts available</span>
                <span>${a.name !== b.name ? '🔄 Comparing ' + a.name + ' vs ' + b.name : '⚠ Select two different districts'}</span>
            </div>
        </div>

        <!-- District Selectors -->
        <div style="display:flex;gap:16px;align-items:center;margin-bottom:20px;flex-wrap:wrap">
            <div style="flex:1;min-width:200px">
                <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">District A</label>
                <select id="compare-a" style="width:100%;background:var(--bg-card,#1c2128);color:var(--text,#e6edf3);border:1px solid var(--border,#30363d);border-radius:6px;padding:8px 12px;font-size:13px">
                    ${cities.map(c => `<option value="${c}" ${c === cityA ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
            <div style="padding-top:18px;font-size:18px;color:var(--text-muted)">⚡</div>
            <div style="flex:1;min-width:200px">
                <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">District B</label>
                <select id="compare-b" style="width:100%;background:var(--bg-card,#1c2128);color:var(--text,#e6edf3);border:1px solid var(--border,#30363d);border-radius:6px;padding:8px 12px;font-size:13px">
                    ${cities.map(c => `<option value="${c}" ${c === cityB ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
        </div>

        <!-- Side-by-side Metric Cards -->
        <div class="card-grid g2 mb-3">
            <!-- District A Card -->
            <div class="card" style="border-left:3px solid ${C.accent}">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
                    <h3>📍 ${a.name}</h3>
                    <span class="badge b-info">${a.province}</span>
                </div>
                <div class="card-grid g3" style="margin-top:8px">
                    <div class="stat-card s-red" style="margin:0">
                        <div class="stat-icon">🌡</div>
                        <div class="stat-value" style="color:${tempColor(a.temp)}">${fmtC(a.temp)}</div>
                        <div class="stat-label">Temperature</div>
                        <div class="stat-sub" style="font-size:10px;color:${diffColor(a.temp, b.temp, true)}">${diffArrow(a.temp, b.temp)}</div>
                    </div>
                    <div class="stat-card s-cyan" style="margin:0">
                        <div class="stat-icon">💧</div>
                        <div class="stat-value">${fmt(a.humidity, 0)}%</div>
                        <div class="stat-label">Humidity</div>
                        <div class="stat-sub" style="font-size:10px;color:${diffColor(a.humidity, b.humidity, true)}">${diffArrow(a.humidity, b.humidity)}</div>
                    </div>
                    <div class="stat-card s-green" style="margin:0">
                        <div class="stat-icon">🌬</div>
                        <div class="stat-value" style="color:${windColor(a.wind)}">${fmt(a.wind, 0)} km/h</div>
                        <div class="stat-label">Wind</div>
                        <div class="stat-sub" style="font-size:10px;color:${diffColor(a.wind, b.wind, false)}">${diffArrow(a.wind, b.wind)}</div>
                    </div>
                    <div class="stat-card s-orange" style="margin:0">
                        <div class="stat-icon">💨</div>
                        <div class="stat-value" style="color:${aqiColor(a.aqi)}">${a.aqi != null ? Math.round(a.aqi) : '-'}</div>
                        <div class="stat-label">AQI · ${a.aqiLabel}</div>
                        <div class="stat-sub" style="font-size:10px;color:${diffColor(a.aqi, b.aqi, true)}">${diffArrow(a.aqi, b.aqi)}</div>
                    </div>
                    <div class="stat-card s-blue" style="margin:0">
                        <div class="stat-icon">🌧</div>
                        <div class="stat-value" style="color:${rainColor(a.rainfall)}">${fmtMm(a.rainfall)}</div>
                        <div class="stat-label">Rainfall</div>
                        <div class="stat-sub" style="font-size:10px;color:${diffColor(a.rainfall, b.rainfall, false)}">${diffArrow(a.rainfall, b.rainfall)}</div>
                    </div>
                    <div class="stat-card s-yellow" style="margin:0">
                        <div class="stat-icon">☀</div>
                        <div class="stat-value" style="color:${uvColor(a.uv)}">${fmt(a.uv, 1)}</div>
                        <div class="stat-label">UV Index</div>
                        <div class="stat-sub" style="font-size:10px;color:${diffColor(a.uv, b.uv, false)}">${diffArrow(a.uv, b.uv)}</div>
                    </div>
                </div>
            </div>

            <!-- District B Card -->
            <div class="card" style="border-left:3px solid ${C.purple}">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
                    <h3>📍 ${b.name}</h3>
                    <span class="badge b-purple" style="background:rgba(188,140,255,.15);color:${C.purple}">${b.province}</span>
                </div>
                <div class="card-grid g3" style="margin-top:8px">
                    <div class="stat-card s-red" style="margin:0">
                        <div class="stat-icon">🌡</div>
                        <div class="stat-value" style="color:${tempColor(b.temp)}">${fmtC(b.temp)}</div>
                        <div class="stat-label">Temperature</div>
                        <div class="stat-sub" style="font-size:10px;color:${diffColor(b.temp, a.temp, true)}">${diffArrow(b.temp, a.temp)}</div>
                    </div>
                    <div class="stat-card s-cyan" style="margin:0">
                        <div class="stat-icon">💧</div>
                        <div class="stat-value">${fmt(b.humidity, 0)}%</div>
                        <div class="stat-label">Humidity</div>
                        <div class="stat-sub" style="font-size:10px;color:${diffColor(b.humidity, a.humidity, true)}">${diffArrow(b.humidity, a.humidity)}</div>
                    </div>
                    <div class="stat-card s-green" style="margin:0">
                        <div class="stat-icon">🌬</div>
                        <div class="stat-value" style="color:${windColor(b.wind)}">${fmt(b.wind, 0)} km/h</div>
                        <div class="stat-label">Wind</div>
                        <div class="stat-sub" style="font-size:10px;color:${diffColor(b.wind, a.wind, false)}">${diffArrow(b.wind, a.wind)}</div>
                    </div>
                    <div class="stat-card s-orange" style="margin:0">
                        <div class="stat-icon">💨</div>
                        <div class="stat-value" style="color:${aqiColor(b.aqi)}">${b.aqi != null ? Math.round(b.aqi) : '-'}</div>
                        <div class="stat-label">AQI · ${b.aqiLabel}</div>
                        <div class="stat-sub" style="font-size:10px;color:${diffColor(b.aqi, a.aqi, true)}">${diffArrow(b.aqi, a.aqi)}</div>
                    </div>
                    <div class="stat-card s-blue" style="margin:0">
                        <div class="stat-icon">🌧</div>
                        <div class="stat-value" style="color:${rainColor(b.rainfall)}">${fmtMm(b.rainfall)}</div>
                        <div class="stat-label">Rainfall</div>
                        <div class="stat-sub" style="font-size:10px;color:${diffColor(b.rainfall, a.rainfall, false)}">${diffArrow(b.rainfall, a.rainfall)}</div>
                    </div>
                    <div class="stat-card s-yellow" style="margin:0">
                        <div class="stat-icon">☀</div>
                        <div class="stat-value" style="color:${uvColor(b.uv)}">${fmt(b.uv, 1)}</div>
                        <div class="stat-label">UV Index</div>
                        <div class="stat-sub" style="font-size:10px;color:${diffColor(b.uv, a.uv, false)}">${diffArrow(b.uv, a.uv)}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Comparison Bar Chart -->
        <div class="card mb-3">
            <div class="card-header"><h3>📊 Metric Comparison</h3></div>
            <div style="height:340px;position:relative">
                <canvas id="compare-chart"></canvas>
            </div>
        </div>

        <!-- Summary Table -->
        <div class="card">
            <div class="card-header"><h3>📋 Detailed Comparison</h3></div>
            <div style="overflow-x:auto">
                <table style="width:100%;border-collapse:collapse;font-size:13px">
                    <thead>
                        <tr style="border-bottom:1px solid var(--border)">
                            <th style="text-align:left;padding:8px 12px;color:var(--text-muted)">Metric</th>
                            <th style="text-align:center;padding:8px 12px;color:${C.accent}">${a.name}</th>
                            <th style="text-align:center;padding:8px 12px;color:${C.purple}">${b.name}</th>
                            <th style="text-align:center;padding:8px 12px;color:var(--text-muted)">Difference</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${[
                            { label: '🌡 Temperature (High)', valA: a.temp, valB: b.temp, unit: '°C', invert: true },
                            { label: '❄ Temperature (Low)', valA: a.tempMin, valB: b.tempMin, unit: '°C', invert: false },
                            { label: '💧 Humidity', valA: a.humidity, valB: b.humidity, unit: '%', invert: true },
                            { label: '🌬 Avg Wind', valA: a.wind, valB: b.wind, unit: 'km/h', invert: false },
                            { label: '💨 AQI', valA: a.aqi, valB: b.aqi, unit: '', invert: true },
                            { label: '🌧 Rainfall (7d)', valA: a.rainfall, valB: b.rainfall, unit: 'mm', invert: false },
                            { label: '☀ UV Index', valA: a.uv, valB: b.uv, unit: '', invert: false },
                        ].map(row => {
                            const diff = (row.valA != null && row.valB != null) ? row.valA - row.valB : null;
                            const arrow = diff == null ? '' : (diff > 0.05 ? '🔴 A higher' : diff < -0.05 ? '🟢 B higher' : '⚖ Equal');
                            return `<tr style="border-bottom:1px solid var(--border)">
                                <td style="padding:8px 12px;color:var(--text-primary,#e6edf3)">${row.label}</td>
                                <td style="text-align:center;padding:8px 12px;font-weight:600;color:${C.accent}">${row.valA != null ? fmt(row.valA, 1) + row.unit : '-'}</td>
                                <td style="text-align:center;padding:8px 12px;font-weight:600;color:${C.purple}">${row.valB != null ? fmt(row.valB, 1) + row.unit : '-'}</td>
                                <td style="text-align:center;padding:8px 12px;font-size:11px">${arrow}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;

        // Render comparison bar chart
        renderChart();
    }

    function renderChart() {
        const a = getDistrictData(cityA);
        const b = getDistrictData(cityB);

        const metrics = [
            { label: 'Temp (°C)', valA: a.temp || 0, valB: b.temp || 0 },
            { label: 'Humidity (%)', valA: a.humidity || 0, valB: b.humidity || 0 },
            { label: 'Wind (km/h)', valA: a.wind || 0, valB: b.wind || 0 },
            { label: 'AQI', valA: a.aqi || 0, valB: b.aqi || 0 },
            { label: 'Rainfall (mm)', valA: a.rainfall || 0, valB: b.rainfall || 0 },
            { label: 'UV Index', valA: a.uv || 0, valB: b.uv || 0 },
        ];

        const labels = metrics.map(m => m.label);
        const dataA = metrics.map(m => m.valA);
        const dataB = metrics.map(m => m.valB);

        const canvas = document.getElementById('compare-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        destroyChart('compare-chart');

        chartInstances['compare-chart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: a.name,
                        data: dataA,
                        backgroundColor: C.accent + 'cc',
                        borderColor: C.accent,
                        borderWidth: 1,
                        borderRadius: 4,
                        barPercentage: 0.8,
                        categoryPercentage: 0.7
                    },
                    {
                        label: b.name,
                        data: dataB,
                        backgroundColor: C.purple + 'cc',
                        borderColor: C.purple,
                        borderWidth: 1,
                        borderRadius: 4,
                        barPercentage: 0.8,
                        categoryPercentage: 0.7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: {
                        callbacks: {
                            afterBody: function(items) {
                                if (items.length >= 2) {
                                    const diff = items[0].raw - items[1].raw;
                                    if (Math.abs(diff) > 0.01) {
                                        return `\nDifference: ${diff > 0 ? '+' : ''}${diff.toFixed(1)}`;
                                    }
                                    return '\nNo difference';
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // Bind dropdown events
    el.addEventListener('change', (e) => {
        if (e.target.id === 'compare-a') {
            cityA = e.target.value;
            render();
        } else if (e.target.id === 'compare-b') {
            cityB = e.target.value;
            render();
        }
    });

    // Initial render
    render();
}
