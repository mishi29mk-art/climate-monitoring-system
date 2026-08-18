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
        <div class="hero-top">
            <div>
                <h1>🌍 Climate Monitoring System — Pakistan</h1>
                <p>Real-time monitoring of temperature, air quality, precipitation, drought, wind, UV, river discharge, flood risk — across all provinces.</p>
            </div>
            <div class="dashboard-clock" id="dashboard-clock"></div>
        </div>
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
    <div class="card-grid g3">
        <div class="card"><h3 style="margin-bottom:10px">🔥 Temperature (Top 10)</h3><div style="height:180px"><canvas id="ov-temp"></canvas></div></div>
        <div class="card"><h3 style="margin-bottom:10px">🌧 Rainfall 7-Day (Top 10)</h3><div style="height:180px"><canvas id="ov-rain"></canvas></div></div>
        <div class="card"><h3 style="margin-bottom:10px">💨 AQI (Top 10)</h3><div style="height:180px"><canvas id="ov-aqi"></canvas></div></div>
    </div>

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
        ${alerts.slice(0,15).map(a=>`<tr><td>${a.icon||''}</td><td>${a.type.replace(/_/g,' ')}</td><td>${a.district}</td><td>${severityBadge(a.severity)}</td><td>${fmt(a.value,0)}</td></tr>`).join('')||'<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No active alerts ✅</td></tr>'}
        </tbody></table></div></div>
        <div class="card"><h3 style="margin-bottom:10px">🌡 Top 10 Hottest Districts</h3><div class="tbl-scroll" style="max-height:260px"><table class="tbl"><thead><tr><th>District</th><th>Province</th><th>Max Temp</th></tr></thead><tbody>
        ${Object.entries(weatherData).sort((a,b)=>(b[1].stats?.temp_max_7d||0)-(a[1].stats?.temp_max_7d||0)).slice(0,10).map(([n,d])=>`<tr><td>${n}</td><td>${d.province}</td><td style="color:${tempColor(d.stats?.temp_max_7d)}"><b>${fmtC(d.stats?.temp_max_7d)}</b></td></tr>`).join('')}
        </tbody></table></div></div>
    </div>

    <!-- 💧 Humidity & Wind Speed Charts -->
    <div class="card-grid g3 mt-3">
        <div class="card"><h3 style="margin-bottom:10px">💧 Humidity Range (Top 10)</h3><div style="height:180px"><canvas id="ov-hum-high"></canvas></div></div>
        <div class="card"><h3 style="margin-bottom:10px">🌬 Wind Speed (Top 10)</h3><div style="height:180px"><canvas id="ov-wind"></canvas></div></div>
        <div class="card"><h3 style="margin-bottom:10px">❄ Coldest vs Warmest (Top 10)</h3><div style="height:180px"><canvas id="ov-cold-warm"></canvas></div></div>
    </div>

    <!-- Cold/Warm City Tables -->
    <div class="card-grid g2 mt-3">
        <div class="card"><h3 style="margin-bottom:10px">❄ Top 10 Coldest Cities</h3><div class="tbl-scroll" style="max-height:220px"><table class="tbl"><thead><tr><th>District</th><th>Province</th><th>Min Temp</th></tr></thead><tbody>
        ${Object.entries(weatherData).sort((a,b)=>(a[1].stats?.temp_min_7d||99)-(b[1].stats?.temp_min_7d||99)).slice(0,10).map(([n,d])=>`<tr><td>${n}</td><td>${d.province}</td><td style="color:${d.stats?.temp_min_7d<15?'#60a5fa':'#fbbf24'}"><b>${fmtC(d.stats?.temp_min_7d)}</b></td></tr>`).join('')}
        </tbody></table></div></div>
        <div class="card"><h3 style="margin-bottom:10px">🔥 Top 10 Warmest Cities</h3><div class="tbl-scroll" style="max-height:220px"><table class="tbl"><thead><tr><th>District</th><th>Province</th><th>Max Temp</th></tr></thead><tbody>
        ${Object.entries(weatherData).sort((a,b)=>(b[1].stats?.temp_max_7d||0)-(a[1].stats?.temp_max_7d||0)).slice(0,10).map(([n,d])=>`<tr><td>${n}</td><td>${d.province}</td><td style="color:${tempColor(d.stats?.temp_max_7d)}"><b>${fmtC(d.stats?.temp_max_7d)}</b></td></tr>`).join('')}
        </tbody></table></div></div>
    </div>`;
    setTimeout(()=>{
        const t10=Object.entries(weatherData).sort((a,b)=>(b[1].stats?.temp_max_7d||0)-(a[1].stats?.temp_max_7d||0)).slice(0,10);
        const tc=document.getElementById('ov-temp'); if(tc) makeBar(tc.getContext('2d'),t10.map(([n])=>n.substring(0,6)),t10.map(([,d])=>d.stats?.temp_max_7d||0),t10.map(([,d])=>tempColor(d.stats?.temp_max_7d)),{barThickness:14});
        const r10=Object.entries(weatherData).sort((a,b)=>(b[1].stats?.rain_total_7d||0)-(a[1].stats?.rain_total_7d||0)).slice(0,10);
        const rc=document.getElementById('ov-rain'); if(rc) makeBar(rc.getContext('2d'),r10.map(([n])=>n.substring(0,6)),r10.map(([,d])=>d.stats?.rain_total_7d||0),r10.map(([,d])=>rainColor(d.stats?.rain_total_7d)),{barThickness:14});
        const a10=Object.entries(aqiData).filter(([,d])=>d.stats).sort((a,b)=>(b[1].stats?.aqi_max||0)-(a[1].stats?.aqi_max||0)).slice(0,10);
        const ac=document.getElementById('ov-aqi'); if(ac) makeBar(ac.getContext('2d'),a10.map(([n])=>n.substring(0,6)),a10.map(([,d])=>d.stats?.aqi_max||0),a10.map(([,d])=>aqiColor(d.stats?.aqi_max)),{barThickness:14});
        // Initialize time-series charts with day/week/month toggles
        initTimeSeriesCharts();

    },300);
    // Render below-fold charts (global for scroll listener)
    window._renderOverviewBelowFold = function(){
        const hc2=document.getElementById('ov-hum-high');
        if(hc2 && !hc2._rendered){
            const h10=Object.entries(weatherData).map(([n,d])=>{
                const hum=d.forecast?.hourly?.relative_humidity_2m;
                if(!hum||!hum.length) return null;
                const min=Math.min(...hum), max=Math.max(...hum), avg=Math.round(hum.reduce((a,b)=>a+b,0)/hum.length);
                return {name:n,min,max,avg,range:max-min};
            }).filter(Boolean).sort((a,b)=>b.range-a.range).slice(0,10);
            destroyChart('ov-hum-high');
            chartInstances['ov-hum-high'] = new Chart(hc2.getContext('2d'), {
                type: 'bar',
                data: { labels: h10.map(d=>d.name.substring(0,8)), datasets: [{
                    label: 'Humidity Range (min–max)',
                    data: h10.map(d=>[d.min, d.max]),
                    backgroundColor: h10.map(d=>d.range>50?'#f97316':d.range>30?'#eab308':'#3b82f6'),
                    borderRadius:4, barThickness:14
                }] },
                options: { responsive:true, maintainAspectRatio:false, plugins:{
                    legend:{display:false},
                    tooltip:{callbacks:{label:ctx=>{const v=ctx.raw; return v[0]+'% – '+v[1]+'% (avg '+h10[ctx.dataIndex].avg+'%)';}}}
                }, scales:{x:{grid:{display:false}},y:{beginAtZero:true, max:100, ticks:{callback:v=>v+'%'}}} }
            });
            hc2._rendered=true;
        }
        const wc2=document.getElementById('ov-wind');
        if(wc2 && !wc2._rendered){
            const w10=Object.entries(weatherData).map(([n,d])=>{
                const ws=d.forecast?.hourly?.wind_speed_10m;
                const maxW=ws&&ws.length?Math.round(Math.max(...ws)):0;
                return {name:n,wind:maxW};
            }).filter(d=>d.wind>0).sort((a,b)=>b.wind-a.wind).slice(0,10);
            makeBar(wc2.getContext('2d'),w10.map(d=>d.name.substring(0,6)),w10.map(d=>d.wind),w10.map(d=>d.wind>40?'#ef4444':d.wind>25?'#f59e0b':'#22c55e'),{barThickness:14});
            wc2._rendered=true;
        }
        const cwc2=document.getElementById('ov-cold-warm');
        if(cwc2 && !cwc2._rendered){
            const sorted2=Object.entries(weatherData).sort((a,b)=>(b[1].stats?.temp_max_7d||0)-(a[1].stats?.temp_max_7d||0));
            const cold5b=sorted2.slice(-5).reverse();
            const warm5b=sorted2.slice(0,5);
            makeBar(cwc2.getContext('2d'),
                [...cold5b.map(([n])=>n.substring(0,5)),...warm5b.map(([n])=>n.substring(0,5))],
                [...cold5b.map(([,d])=>d.stats?.temp_min_7d||0),...warm5b.map(([,d])=>d.stats?.temp_max_7d||0)],
                [...cold5b.map(()=>'#60a5fa'),...warm5b.map(()=>'#ef4444')],
                {barThickness:12});
            cwc2._rendered=true;
        }
    }
    // Use multiple strategies to ensure charts render
    window._renderOverviewBelowFold();
    setTimeout(window._renderOverviewBelowFold, 500);
    setTimeout(window._renderOverviewBelowFold, 1500);
    window.addEventListener('scroll', window._renderOverviewBelowFold, {once:true});
    window.addEventListener('resize', window._renderOverviewBelowFold, {once:true});
    console.log("CLOCK DEBUG: Starting clock init"); // Live Dashboard Clock
    (function(){
        const el = document.getElementById('dashboard-clock');
        if (!el) return;
        function tick() {
            const now = new Date();
            const pk = new Date(now.toLocaleString('en-US', {timeZone:'Asia/Karachi'}));
            const h = pk.getHours();
            const m = String(pk.getMinutes()).padStart(2,'0');
            const s = String(pk.getSeconds()).padStart(2,'0');
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            el.innerHTML = '<div class="clock-label">Pakistan Standard Time</div>' +
                '<div class="clock-time">' + h12 + ':' + m + '<span class="clock-sec">:' + s + '</span><span class="clock-ampm"> ' + ampm + '</span></div>' +
                '<div class="clock-date">' + pk.getDate() + ' ' + months[pk.getMonth()] + ' ' + pk.getFullYear() + '</div>' +
                '<div class="clock-day">' + days[pk.getDay()] + '</div>';
        }
        tick();
        setInterval(tick, 1000);
    })();
}
