/* ─── 24-Hour City Forecast ─────────────────────────────────────── */
async function render_climate_trends(el) {
    el.innerHTML = '<div class="loading">Loading 24h forecast data…</div>';
    
    let cities;
    try {
        const res = await fetch('/api/weather/all');
        cities = await res.json();
    } catch (e) {
        el.innerHTML = `<div class="loading">Error loading forecast: ${e.message}</div>`;
        return;
    }

    // Pick 8 major cities as default tabs
    const majorCities = ['Islamabad','Lahore','Karachi','Peshawar','Quetta','Faisalabad','Multan','Hyderabad'];
    const available = majorCities.filter(c => cities[c]);
    if (!available.length) {
        el.innerHTML = '<div class="loading">No city data available</div>';
        return;
    }
    let activeCity = available[0];

    function getWeatherIcon(temp, humidity, precip, hour) {
        const isNight = hour >= 19 || hour < 6;
        if (precip > 5) return { icon: '⛈️', label: 'Thunderstorm', color: '#8b5cf6' };
        if (precip > 2) return { icon: '🌧️', label: 'Heavy Rain', color: '#3b82f6' };
        if (precip > 0.5) return { icon: '🌦️', label: 'Light Rain', color: '#60a5fa' };
        if (humidity > 85 && temp < 15) return { icon: '🌫️', label: 'Fog', color: '#94a3b8' };
        if (humidity > 80) return { icon: isNight ? '☁️' : '🌥️', label: isNight ? 'Cloudy' : 'Overcast', color: '#64748b' };
        if (temp > 40) return { icon: '🔥', label: 'Extreme Heat', color: '#ef4444' };
        if (isNight) return { icon: '🌙', label: 'Clear Night', color: '#818cf8' };
        return { icon: '☀️', label: 'Sunny', color: '#fbbf24' };
    }

    function getWindLevel(speed) {
        if (speed < 5) return { label: 'Calm', color: '#22c55e' };
        if (speed < 15) return { label: 'Breeze', color: '#06b6d4' };
        if (speed < 30) return { label: 'Windy', color: '#f59e0b' };
        return { label: 'Strong', color: '#ef4444' };
    }

    function render() {
        const city = cities[activeCity];
        if (!city || !city.forecast || !city.forecast.hourly) {
            el.innerHTML = '<div class="loading">No forecast data for this city</div>';
            return;
        }
        const h = city.forecast.hourly;
        const d = city.daily;
        const temps = h.temperature_2m || [];
        const humids = h.relative_humidity_2m || [];
        const winds = h.wind_speed_10m || [];
        
        // Get current hour's index (use first data point as "now")
        const nowIdx = 0;
        const currentTemp = temps[nowIdx] || 0;
        const currentHumid = humids[nowIdx] || 0;
        const currentWind = winds[nowIdx] || 0;
        const totalRain = (d.precipitation_sum || []).reduce((a, b) => a + b, 0);
        const todayRain = d.precipitation_sum ? d.precipitation_sum[0] : 0;

        // Generate 24-hour labels starting from today
        const today = new Date();
        const hourLabels = [];
        for (let i = 0; i < 24; i++) {
            const dt = new Date(today);
            dt.setHours(dt.getHours() + i);
            const hh = String(dt.getHours()).padStart(2, '0');
            const isToday = i === 0 ? 'Now' : (dt.getDate() === today.getDate() ? `${hh}:00` : `${dt.getMonth()+1}/${dt.getDate()} ${hh}h`);
            hourLabels.push(isToday);
        }

        el.innerHTML = `
        <div class="sec-hdr">
            <h2>⏰ 24-Hour City Forecast</h2>
            <p>Hourly weather forecast — temperature, humidity, wind, and precipitation for major cities</p>
            <div class="hdr-meta">
                <span>🏙 ${available.length} cities</span>
                <span>📅 24-hour outlook</span>
                <span>🌡 High: ${Math.max(...temps).toFixed(0)}°C</span>
                <span>💧 Total rain: ${totalRain.toFixed(1)}mm</span>
            </div>
        </div>

        <!-- ═══ City Selector Tabs ═══ -->
        <div class="card" style="padding:12px 16px;margin-bottom:16px">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
                <span style="font-size:12px;color:var(--text-muted);margin-right:4px">📍 Select City:</span>
                ${available.map(c => {
                    const cd = cities[c];
                    const icon = getWeatherIcon(cd.forecast.hourly.temperature_2m[0], cd.forecast.hourly.relative_humidity_2m[0], (cd.daily.precipitation_sum||[])[0], today.getHours());
                    const isActive = c === activeCity;
                    return `<button onclick="window._selectForecastCity('${c}')" style="
                        padding:6px 14px;border-radius:20px;border:1px solid ${isActive ? '#39d2c0' : 'var(--border)'};
                        background:${isActive ? 'rgba(57,210,192,0.15)' : 'transparent'};
                        color:${isActive ? '#39d2c0' : 'var(--text-muted)'};cursor:pointer;font-size:12px;
                        font-weight:${isActive ? '600' : '400'};transition:all 0.2s;display:flex;align-items:center;gap:4px;
                    ">${icon.icon} ${c}</button>`;
                }).join('')}
            </div>
        </div>

        <!-- ═══ Current Conditions Hero ═══ -->
        <div class="card" style="padding:24px;margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:32px;flex-wrap:wrap">
                <div style="text-align:center">
                    <div style="font-size:64px;line-height:1">${getWeatherIcon(currentTemp, currentHumid, todayRain, today.getHours()).icon}</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${getWeatherIcon(currentTemp, currentHumid, todayRain, today.getHours()).label}</div>
                </div>
                <div>
                    <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Current in ${activeCity}</div>
                    <div style="font-size:56px;font-weight:800;color:#e2e8f0;line-height:1.1">${currentTemp.toFixed(0)}°<span style="font-size:24px;color:var(--text-muted)">C</span></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 32px">
                    <div>
                        <div style="font-size:11px;color:var(--text-muted)">💧 Humidity</div>
                        <div style="font-size:22px;font-weight:700;color:#39d2c0">${currentHumid}%</div>
                    </div>
                    <div>
                        <div style="font-size:11px;color:var(--text-muted)">🌬 Wind</div>
                        <div style="font-size:22px;font-weight:700;color:${getWindLevel(currentWind).color}">${currentWind.toFixed(0)} km/h</div>
                    </div>
                    <div>
                        <div style="font-size:11px;color:var(--text-muted)">🌡 Feels Like</div>
                        <div style="font-size:22px;font-weight:700;color:var(--text-info)">${(currentTemp + (currentHumid > 70 ? 2 : -1)).toFixed(0)}°C</div>
                    </div>
                    <div>
                        <div style="font-size:11px;color:var(--text-muted)">🌧 Rain Today</div>
                        <div style="font-size:22px;font-weight:700;color:${todayRain > 2 ? '#f59e0b' : '#22c55e'}">${todayRain.toFixed(1)}mm</div>
                    </div>
                </div>
                <div style="margin-left:auto;text-align:right">
                    <div style="font-size:11px;color:var(--text-muted)">7-Day Range</div>
                    <div style="font-size:28px;font-weight:700">
                        <span style="color:#ef4444">${Math.max(...(d.temperature_2m_max || [0])).toFixed(0)}°</span>
                        <span style="color:var(--text-muted);font-size:16px"> / </span>
                        <span style="color:#3b82f6">${Math.min(...(d.temperature_2m_min || [40])).toFixed(0)}°</span>
                    </div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Province: ${city.province || '-'}</div>
                </div>
            </div>
        </div>

        <!-- ═══ 24-Hour Hourly Scroll ═══ -->
        <div class="card" style="padding:16px;margin-bottom:16px;overflow:hidden">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
                <span style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">🕐 Hourly Forecast</span>
                <span style="font-size:10px;color:var(--text-muted)">← scroll →</span>
            </div>
            <div id="hourly-scroll" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;scroll-behavior:smooth">
                ${temps.slice(0, 24).map((temp, i) => {
                    const hum = humids[i] || 0;
                    const wind = winds[i] || 0;
                    const rain = (d.precipitation_sum || [])[0] || 0;
                    const hourPrecip = rain * (hum > 70 ? 0.1 : 0.02);
                    const wi = getWeatherIcon(temp, hum, hourPrecip, (today.getHours() + i) % 24);
                    const isNow = i === 0;
                    return `<div style="
                        min-width:72px;padding:12px 8px;border-radius:12px;text-align:center;flex-shrink:0;
                        background:${isNow ? 'rgba(57,210,192,0.12)' : 'rgba(255,255,255,0.03)'};
                        border:1px solid ${isNow ? '#39d2c0' : 'var(--border)'};
                        transition:all 0.2s;
                    ">
                        <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;white-space:nowrap">${hourLabels[i] || `${i}h`}</div>
                        <div style="font-size:24px;margin:4px 0">${wi.icon}</div>
                        <div style="font-size:18px;font-weight:700;color:#e2e8f0">${temp.toFixed(0)}°</div>
                        <div style="height:3px;width:100%;background:#1c2128;border-radius:2px;margin:4px 0;overflow:hidden">
                            <div style="width:${hum}%;height:100%;background:${hum > 80 ? '#3b82f6' : hum > 60 ? '#06b6d4' : '#22c55e'};border-radius:2px"></div>
                        </div>
                        <div style="font-size:10px;color:var(--text-muted)">${hum}%</div>
                        <div style="font-size:9px;color:${getWindLevel(wind).color};margin-top:2px">💨${wind.toFixed(0)}</div>
                    </div>`;
                }).join('')}
            </div>
        </div>

        <!-- ═══ Temperature & Humidity Chart ═══ -->
        <div class="card-grid g2" style="margin-bottom:16px">
            <div class="card">
                <h3 style="margin-bottom:10px">🌡 Temperature Trend (24h)</h3>
                <div style="height:240px"><canvas id="fc-temp-chart"></canvas></div>
            </div>
            <div class="card">
                <h3 style="margin-bottom:10px">💧 Humidity & Wind (24h)</h3>
                <div style="height:240px"><canvas id="fc-humid-chart"></canvas></div>
            </div>
        </div>

        <!-- ═══ 7-Day Forecast ═══ -->
        <div class="card" style="margin-bottom:16px">
            <h3 style="margin-bottom:12px">📅 7-Day Forecast</h3>
            <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px">
                ${(d.time || []).map((date, i) => {
                    const maxT = d.temperature_2m_max ? d.temperature_2m_max[i] : 0;
                    const minT = d.temperature_2m_min ? d.temperature_2m_min[i] : 0;
                    const rain = d.precipitation_sum ? d.precipitation_sum[i] : 0;
                    const uv = d.uv_index_max ? d.uv_index_max[i] : 0;
                    const wind = d.wind_speed_10m_max ? d.wind_speed_10m_max[i] : 0;
                    const dt = new Date(date);
                    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dt.toLocaleDateString('en', { weekday: 'short' });
                    const dayDate = dt.toLocaleDateString('en', { month: 'short', day: 'numeric' });
                    const wi = getWeatherIcon(maxT, rain > 3 ? 90 : 50, rain, 12);
                    return `<div style="
                        min-width:110px;padding:14px 12px;border-radius:12px;text-align:center;flex-shrink:0;
                        background:${i === 0 ? 'rgba(57,210,192,0.08)' : 'rgba(255,255,255,0.02)'};
                        border:1px solid ${i === 0 ? '#39d2c040' : 'var(--border)'};
                    ">
                        <div style="font-size:11px;font-weight:600;color:${i === 0 ? '#39d2c0' : 'var(--text-muted)'}">${dayName}</div>
                        <div style="font-size:10px;color:var(--text-muted)">${dayDate}</div>
                        <div style="font-size:32px;margin:6px 0">${wi.icon}</div>
                        <div style="font-size:16px;font-weight:700;color:#e2e8f0">${maxT.toFixed(0)}° <span style="color:#3b82f6;font-weight:400;font-size:13px">${minT.toFixed(0)}°</span></div>
                        ${rain > 0 ? `<div style="font-size:11px;color:#3b82f6;margin-top:4px">💧 ${rain.toFixed(1)}mm</div>` : '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">No rain</div>'}
                        <div style="font-size:10px;color:var(--text-muted);margin-top:4px">
                            <span title="UV Index">☀ ${uv.toFixed(1)}</span> · <span title="Max Wind">💨 ${wind.toFixed(0)}</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>

        <!-- ═══ Multi-City Comparison ═══ -->
        <div class="card">
            <h3 style="margin-bottom:12px">🏙 City Comparison — Now</h3>
            <div class="tbl-scroll" style="max-height:340px">
                <table class="tbl">
                    <thead><tr><th>City</th><th>Temp</th><th>Feels</th><th>Humidity</th><th>Wind</th><th>Rain</th><th>UV</th><th>Condition</th></tr></thead>
                    <tbody>
                    ${available.map(c => {
                        const cd = cities[c];
                        const ch = cd.forecast?.hourly || {};
                        const cdaily = cd.daily || {};
                        const t = (ch.temperature_2m || [0])[0];
                        const hu = (ch.relative_humidity_2m || [0])[0];
                        const wi = (ch.wind_speed_10m || [0])[0];
                        const rain = (cdaily.precipitation_sum || [0])[0];
                        const uv = (cdaily.uv_index_max || [0])[0];
                        const cond = getWeatherIcon(t, hu, rain, today.getHours());
                        const feels = t + (hu > 70 ? 2 : -1);
                        return `<tr style="cursor:pointer;${c === activeCity ? 'background:rgba(57,210,192,0.08)' : ''}" onclick="window._selectForecastCity('${c}')">
                            <td><b>${c}</b> <span style="font-size:10px;color:var(--text-muted)">${cd.province||''}</span></td>
                            <td style="font-size:18px;font-weight:700;color:#e2e8f0">${t.toFixed(0)}°C</td>
                            <td style="color:var(--text-muted)">${feels.toFixed(0)}°C</td>
                            <td style="color:#39d2c0">${hu}%</td>
                            <td style="color:${getWindLevel(wi).color}">${wi.toFixed(0)} km/h</td>
                            <td style="color:${rain > 2 ? '#f59e0b' : '#22c55e'}">${rain.toFixed(1)}mm</td>
                            <td style="color:${uv > 8 ? '#ef4444' : uv > 5 ? '#f59e0b' : '#22c55e'}">${uv.toFixed(1)}</td>
                            <td>${cond.icon} ${cond.label}</td>
                        </tr>`;
                    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;

        // ─── Charts ──────────────────────────────────
        requestAnimationFrame(() => {
            // Temperature chart
            const tc = document.getElementById('fc-temp-chart');
            if (tc) {
                const ctx = tc.getContext('2d');
                const labels = hourLabels.slice(0, 24);
                const gradient = ctx.createLinearGradient(0, 0, 0, 240);
                gradient.addColorStop(0, 'rgba(239,68,68,0.3)');
                gradient.addColorStop(1, 'rgba(239,68,68,0)');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Temperature °C',
                            data: temps.slice(0, 24),
                            borderColor: '#ef4444',
                            backgroundColor: gradient,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 2,
                            pointHoverRadius: 6,
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            y: { ticks: { color: '#94a3b8', font: { size: 10 }, callback: v => v + '°' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                        }
                    }
                });
            }

            // Humidity + Wind chart
            const hc = document.getElementById('fc-humid-chart');
            if (hc) {
                const ctx = hc.getContext('2d');
                const labels = hourLabels.slice(0, 24);
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Humidity %',
                            data: humids.slice(0, 24),
                            borderColor: '#39d2c0',
                            backgroundColor: 'rgba(57,210,192,0.1)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 2,
                            borderWidth: 2,
                            yAxisID: 'y'
                        }, {
                            label: 'Wind km/h',
                            data: winds.slice(0, 24),
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139,92,246,0.1)',
                            fill: false,
                            tension: 0.4,
                            pointRadius: 2,
                            borderWidth: 2,
                            borderDash: [5, 3],
                            yAxisID: 'y1'
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
                        scales: {
                            x: { ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            y: { position: 'left', ticks: { color: '#39d2c0', font: { size: 10 }, callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            y1: { position: 'right', ticks: { color: '#8b5cf6', font: { size: 10 }, callback: v => v + 'km/h' }, grid: { display: false } }
                        }
                    }
                });
            }
        });
    }

    // Expose city selector to global scope
    window._selectForecastCity = (city) => {
        activeCity = city;
        render();
    };

    render();
}
