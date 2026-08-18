/* ─── Overview Section ────────────────────────────────────── */
function render_overview(el) {
    const s = summaryData;
    const hottest = s.hottest || {};
    const wettest = s.wettest || {};
    const worstAqi = s.worst_aqi || {};
    const highestRiver = s.highest_river || {};
    const alerts = alertsData || [];
    el.innerHTML = `
    <div class="hero">
        <h1>🌍 Climate Monitoring System — Pakistan</h1>
        <p>Real-time monitoring of temperature, air quality, precipitation, drought, wind, UV, river discharge, flood risk — across all provinces.</p>
        <div class="hero-stats">
            <div class="hero-stat"><div class="val">${s.districts_monitored||0}</div><div class="lbl">Districts Monitored</div></div>
            <div class="hero-stat"><div class="val" style="color:${tempColor(hottest.temp)}">${fmtC(hottest.temp)}</div><div class="lbl">Hottest Today</div></div>
            <div class="hero-stat"><div class="val" style="color:${rainColor(wettest.rain)}">${fmtMm(wettest.rain)}</div><div class="lbl">Most Rainfall (7d)</div></div>
            <div class="hero-stat"><div class="val" style="color:${aqiColor(worstAqi.aqi)}">${worstAqi.aqi?Math.round(worstAqi.aqi):'-'}</div><div class="lbl">Worst AQI</div></div>
            <div class="hero-stat"><div class="val" style="color:${C.cyan}">${highestRiver.discharge?fmtCusecs(highestRiver.discharge):'-'}</div><div class="lbl">Peak River Flow</div></div>
            <div class="hero-stat"><div class="val" style="color:${alerts.length?C.danger:C.success}">${alerts.length}</div><div class="lbl">Active Alerts</div></div>
        </div>
    </div>
    <div class="pipeline">
        <div class="pipeline-step"><div class="step-num">1</div><div class="step-title">Monitor</div><div class="step-desc">Real-time weather, AQI, river data for 51 districts</div></div>
        <div class="pipeline-step"><div class="step-num">2</div><div class="step-title">Analyze</div><div class="step-desc">Climate facts, drought SPI, heat index, risk scoring</div></div>
        <div class="pipeline-step"><div class="step-num">3</div><div class="step-title">Predict</div><div class="step-desc">7-day forecasts, trend analysis, anomaly detection</div></div>
        <div class="pipeline-step"><div class="step-num">4</div><div class="step-title">Warn</div><div class="step-desc">Auto alerts by severity — heat, rain, AQI, flood, UV</div></div>
    </div>
    <div class="card-grid g3" id="ov-top3"></div>

    <!-- Time-Series Charts with Day/Week/Month Toggles -->
    <div class="card-grid g3 mt-3">
        <div class="card" id="ts-temp-container">
            <h3 style="margin-bottom:8px">📈 Temperature Trends</h3>
            ${createTimePeriodButtons('ts-temp-container','temperature')}
            <div style="height:220px"><canvas id="ts-temp-chart"></canvas></div>
        </div>
        <div class="card" id="ts-rain-container">
            <h3 style="margin-bottom:8px">📈 Rainfall Patterns</h3>
            ${createTimePeriodButtons('ts-rain-container','rainfall')}
            <div style="height:220px"><canvas id="ts-rain-chart"></canvas></div>
        </div>
        <div class="card" id="ts-aqi-container">
            <h3 style="margin-bottom:8px">📈 Air Quality Trends</h3>
            ${createTimePeriodButtons('ts-aqi-container','aqi')}
            <div style="height:220px"><canvas id="ts-aqi-chart"></canvas></div>
        </div>
    </div>

    <div class="card-grid g2 mt-3">
        <div class="card"><h3 style="margin-bottom:10px">🚨 Active Alerts (${alerts.length})</h3><div class="tbl-scroll" style="max-height:260px"><table class="tbl"><thead><tr><th></th><th>Type</th><th>District</th><th>Severity</th><th>Value</th></tr></thead><tbody>
        ${alerts.slice(0,15).map(a=>`<tr><td>${a.icon||''}</td><td>${a.type.replace(/_/g,' ')}</td><td>${a.district}</td><td>${severityBadge(a.severity)}</td><td>${fmt(a.value,0)}</td></tr>`).join('')||'<tr><td colspan=\"5\" style=\"text-align:center;color:var(--text-muted)\">No active alerts ✅</td></tr>'}
        </tbody></table></div></div>
        <div class="card"><h3 style="margin-bottom:10px">🌡 Top 10 Hottest Districts</h3><div class="tbl-scroll" style="max-height:260px"><table class="tbl"><thead><tr><th>District</th><th>Province</th><th>Max Temp</th></tr></thead><tbody>
        ${Object.entries(weatherData).sort((a,b)=>(b[1].stats?.temp_max_7d||0)-(a[1].stats?.temp_max_7d||0)).slice(0,10).map(([n,d])=>`<tr><td>${n}</td><td>${d.province}</td><td style=\"color:${tempColor(d.stats?.temp_max_7d)}\"><b>${fmtC(d.stats?.temp_max_7d)}</b></td></tr>`).join('')}
        </tbody></table></div></div>
    </div>

    <!-- Below-fold charts -->
    <div class="card-grid g3 mt-3" id="ov-below3"></div>

    <!-- Cold/Warm City Tables -->
    <div class="card-grid g2 mt-3">
        <div class="card"><h3 style="margin-bottom:10px">❄ Top 10 Coldest Cities</h3><div class="tbl-scroll" style="max-height:220px"><table class="tbl"><thead><tr><th>District</th><th>Province</th><th>Min Temp</th></tr></thead><tbody>
        ${Object.entries(weatherData).sort((a,b)=>(a[1].stats?.temp_min_7d||99)-(b[1].stats?.temp_min_7d||99)).slice(0,10).map(([n,d])=>`<tr><td>${n}</td><td>${d.province}</td><td style=\"color:${d.stats?.temp_min_7d<15?'#a78bfa':'#fbbf24'}\"><b>${fmtC(d.stats?.temp_min_7d)}</b></td></tr>`).join('')}
        </tbody></table></div></div>
        <div class="card"><h3 style="margin-bottom:10px">🔥 Top 10 Warmest Cities</h3><div class="tbl-scroll" style="max-height:220px"><table class="tbl"><thead><tr><th>District</th><th>Province</th><th>Max Temp</th></tr></thead><tbody>
        ${Object.entries(weatherData).sort((a,b)=>(b[1].stats?.temp_max_7d||0)-(a[1].stats?.temp_max_7d||0)).slice(0,10).map(([n,d])=>`<tr><td>${n}</td><td>${d.province}</td><td style=\"color:${tempColor(d.stats?.temp_max_7d)}\"><b>${fmtC(d.stats?.temp_max_7d)}</b></td></tr>`).join('')}
        </tbody></table></div></div>
    </div>`;

    setTimeout(()=>{ renderTopRankings(); initTimeSeriesCharts(); },300);
    // Render below-fold charts
    window._renderOverviewBelowFold = function(){ renderBelowFoldCharts(); };
    window._renderOverviewBelowFold();
    setTimeout(window._renderOverviewBelowFold, 500);
    setTimeout(window._renderOverviewBelowFold, 1500);
    window.addEventListener('scroll', window._renderOverviewBelowFold, {once:true});
    window.addEventListener('resize', window._renderOverviewBelowFold, {once:true});
}

/* ─── Horizontal Progress Bar Ranking ───────────────────── */
function makeRanking(container, title, emoji, items, colorFn, unit, maxVal) {
    if (!items.length) return;
    const mx = maxVal || Math.max(...items.map(d=>d.value)) || 1;
    container.innerHTML = `
    <div class="card" style="overflow:hidden">
        <h3 style="margin-bottom:14px">${emoji} ${title}</h3>
        <div class="ranking-list">
            ${items.map((d,i) => {
                const pct = Math.min((d.value / mx) * 100, 100);
                const c = colorFn(d.value, i);
                return `<div class="ranking-row">
                    <span class="rank-num">${i+1}</span>
                    <span class="rank-name">${d.name}</span>
                    <div class="rank-bar-track">
                        <div class="rank-bar-fill" style="width:${pct}%;background:linear-gradient(90deg, ${c}cc, ${c})"></div>
                    </div>
                    <span class="rank-val" style="color:${c}">${d.display}</span>
                </div>`;
            }).join('')}
        </div>
    </div>`;
}

function renderTopRankings() {
    const container = document.getElementById('ov-top3');
    if (!container) return;

    // Temperature Top 10
    const t10 = Object.entries(weatherData)
        .sort((a,b)=>(b[1].stats?.temp_max_7d||0)-(a[1].stats?.temp_max_7d||0))
        .slice(0,10)
        .map(([n,d])=>({name:n.substring(0,10), value:d.stats?.temp_max_7d||0, display:fmtC(d.stats?.temp_max_7d)}));
    const tempColors = ['#b48aff','#9b7bf5','#818cf8','#6d8cf7','#60a5fa','#4eb8e8','#38bdf8','#2dd4bf','#34d399','#4ade80'];

    // Rainfall Top 10
    const r10 = Object.entries(weatherData)
        .sort((a,b)=>(b[1].stats?.rain_total_7d||0)-(a[1].stats?.rain_total_7d||0))
        .slice(0,10)
        .map(([n,d])=>({name:n.substring(0,10), value:d.stats?.rain_total_7d||0, display:fmtMm(d.stats?.rain_total_7d)}));
    const rainColors = ['#a78bfa','#8b5cf6','#7c3aed','#6366f1','#818cf8','#818cf8','#60a5fa','#38bdf8','#22d3ee','#2dd4bf'];

    // AQI Top 10
    const a10 = Object.entries(aqiData).filter(([,d])=>d.stats)
        .sort((a,b)=>(b[1].stats?.aqi_max||0)-(a[1].stats?.aqi_max||0))
        .slice(0,10)
        .map(([n,d])=>({name:n.substring(0,10), value:d.stats?.aqi_max||0, display:Math.round(d.stats?.aqi_max||0)}));
    const aqiColors = ['#f472b6','#e879f9','#c084fc','#a78bfa','#818cf8','#818cf8','#60a5fa','#38bdf8','#22d3ee','#2dd4bf'];

    const cols = container.children;
    makeRanking(container, 'Temperature (Top 10)', '🔥', t10, (v,i)=>tempColors[i], '°C');
    // Need 3 separate containers
    container.innerHTML = '';
    const c1 = document.createElement('div');
    const c2 = document.createElement('div');
    const c3 = document.createElement('div');
    container.appendChild(c1);
    container.appendChild(c2);
    container.appendChild(c3);
    makeRanking(c1, 'Temperature (Top 10)', '🔥', t10, (v,i)=>tempColors[i], '°C');
    makeRanking(c2, 'Rainfall 7-Day (Top 10)', '🌧', r10, (v,i)=>rainColors[i], 'mm');
    makeRanking(c3, 'AQI (Top 10)', '💨', a10, (v,i)=>aqiColors[i], '');
}

function renderBelowFoldCharts() {
    const container = document.getElementById('ov-below3');
    if (!container || container._rendered) return;

    // Humidity Range Top 10
    const h10 = Object.entries(weatherData).map(([n,d])=>{
        const hum=d.forecast?.hourly?.relative_humidity_2m;
        if(!hum||!hum.length) return null;
        const min=Math.min(...hum), max=Math.max(...hum), avg=Math.round(hum.reduce((a,b)=>a+b,0)/hum.length);
        return {name:n.substring(0,10),min,max,avg,range:max-min};
    }).filter(Boolean).sort((a,b)=>b.range-a.range).slice(0,10);
    const humColors = ['#818cf8','#6d8cf7','#60a5fa','#4eb8e8','#38bdf8','#22d3ee','#2dd4bf','#34d399','#4ade80','#a3e635'];

    // Wind Speed Top 10
    const w10 = Object.entries(weatherData).map(([n,d])=>{
        const ws=d.forecast?.hourly?.wind_speed_10m;
        const maxW=ws&&ws.length?Math.round(Math.max(...ws)):0;
        return {name:n.substring(0,10),value:maxW,display:maxW+' km/h'};
    }).filter(d=>d.value>0).sort((a,b)=>b.value-a.value).slice(0,10);
    const windColors = ['#b48aff','#9b7bf5','#818cf8','#60a5fa','#38bdf8','#22d3ee','#2dd4bf','#34d399','#a78bfa','#c084fc'];

    // Coldest vs Warmest
    const sorted2 = Object.entries(weatherData).sort((a,b)=>(b[1].stats?.temp_max_7d||0)-(a[1].stats?.temp_max_7d||0));
    const cold5 = sorted2.slice(-5).reverse().map(([n,d])=>({name:n.substring(0,10), value:Math.abs(d.stats?.temp_min_7d||0), display:fmtC(d.stats?.temp_min_7d)}));
    const warm5 = sorted2.slice(0,5).map(([n,d])=>({name:n.substring(0,10), value:d.stats?.temp_max_7d||0, display:fmtC(d.stats?.temp_max_7d)}));
    const cwItems = [...cold5.map(d=>({...d, _cold:true})), ...warm5];
    const cwColors = cold5.map(()=>['#60a5fa','#818cf8']).flat().concat(warm5.map(()=>['#f472b6','#c084fc']).flat());

    container.innerHTML = '';
    const c1 = document.createElement('div');
    const c2 = document.createElement('div');
    const c3 = document.createElement('div');
    container.appendChild(c1);
    container.appendChild(c2);
    container.appendChild(c3);

    makeRanking(c1, 'Humidity Range (Top 10)', '💧',
        h10.map(d=>({name:d.name, value:d.range, display:d.min+'–'+d.max+'%'})),
        (v,i)=>humColors[i], '%');
    makeRanking(c2, 'Wind Speed (Top 10)', '🌬', w10,
        (v,i)=>windColors[i], 'km/h');
    makeRanking(c3, 'Coldest vs Warmest', '❄',
        cwItems.map(d=>({name:d.name, value:d.value, display:d.display})),
        (v,i)=>cwColors[i]||'#a78bfa', '');

    container._rendered = true;
}
