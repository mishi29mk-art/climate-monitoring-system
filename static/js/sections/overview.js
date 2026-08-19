/* ═══════════════════════════════════════════════════════════════
   Overview Section — Premium Glassmorphism Redesign
   2-Column Layout: Left (flex:2) main, Right (flex:1) sidebar
   Purple/violet/blue palette: #b48aff, #818cf8, #60a5fa, #22c55e, #f97316, #ef4444
   ═══════════════════════════════════════════════════════════════ */

/* ── Inline Scoped Styles (injected once) ── */
function injectOverviewStyles() {
    if (document.getElementById('overview-glass-styles')) return;
    const s = document.createElement('style');
    s.id = 'overview-glass-styles';
    s.textContent = `
    /* ── Glass Card Base ── */
    .ov-glass {
        background: linear-gradient(135deg, rgba(20,22,58,0.72) 0%, rgba(30,25,70,0.55) 100%);
        backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
        border: 1px solid rgba(139,92,246,0.15);
        border-radius: 16px;
        padding: 20px;
        position: relative;
        overflow: hidden;
        transition: border-color .25s, box-shadow .25s, transform .25s;
    }
    .ov-glass:hover {
        border-color: rgba(139,92,246,0.3);
        box-shadow: 0 0 24px rgba(139,92,246,0.1), 0 4px 16px rgba(0,0,0,0.25);
        transform: translateY(-2px);
    }
    .ov-glass::before {
        content: '';
        position: absolute; inset: 0;
        background: linear-gradient(135deg, rgba(139,92,246,0.06) 0%, transparent 50%);
        pointer-events: none;
    }

    /* ── Two-Column Layout ── */
    .ov-layout { display: flex; gap: 20px; align-items: flex-start; }
    .ov-main   { flex: 2; min-width: 0; }
    .ov-sidebar { flex: 1; min-width: 280px; max-width: 380px; }

    /* ── Hero Gradient Banner ── */
    .ov-hero {
        background: linear-gradient(135deg, #1a1040 0%, #0d1030 30%, #141240 60%, #1a0d30 100%);
        border: 1px solid rgba(139,92,246,0.2);
        border-radius: 20px;
        padding: 32px 28px 28px;
        position: relative;
        overflow: hidden;
        margin-bottom: 20px;
    }
    .ov-hero::before {
        content: '';
        position: absolute; top: -60px; right: -40px;
        width: 300px; height: 300px;
        background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
        pointer-events: none;
    }
    .ov-hero::after {
        content: '';
        position: absolute; bottom: -40px; left: -30px;
        width: 200px; height: 200px;
        background: radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 70%);
        pointer-events: none;
    }
    .ov-hero-title {
        font-size: 26px; font-weight: 700; letter-spacing: -0.02em;
        color: var(--text-primary); position: relative; z-index: 1;
        display: flex; align-items: center; gap: 10px;
    }
    .ov-hero-sub {
        font-size: 13px; color: var(--text-secondary);
        margin-top: 4px; position: relative; z-index: 1;
        max-width: 600px;
    }

    /* ── Hero Metric Cards (glass) ── */
    .ov-hero-metrics {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 12px;
        margin-top: 22px;
        position: relative; z-index: 1;
    }
    .ov-hero-card {
        background: linear-gradient(135deg, rgba(20,22,60,0.8) 0%, rgba(30,25,80,0.6) 100%);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(139,92,246,0.12);
        border-radius: 14px;
        padding: 16px 12px;
        text-align: center;
        transition: all .25s ease;
    }
    .ov-hero-card:hover {
        border-color: rgba(139,92,246,0.3);
        box-shadow: 0 0 20px rgba(139,92,246,0.1);
        transform: translateY(-2px);
    }
    .ov-hero-card .ov-hc-icon {
        width: 36px; height: 36px;
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 10px;
        font-size: 16px;
    }
    .ov-hero-card .ov-hc-val {
        font-size: 24px; font-weight: 700;
        letter-spacing: -0.02em; line-height: 1.1;
        font-family: 'Source Code Pro', ui-monospace, monospace;
    }
    .ov-hero-card .ov-hc-lbl {
        font-size: 10px; color: var(--text-muted);
        text-transform: uppercase; letter-spacing: 0.8px;
        margin-top: 4px; font-weight: 500;
        font-family: 'Source Code Pro', ui-monospace, monospace;
    }

    /* ── Ranking Card Wrapper ── */
    .ov-ranking-card { margin-bottom: 0; }
    .ov-ranking-card h3 {
        font-size: 15px; font-weight: 600; margin-bottom: 14px;
        display: flex; align-items: center; gap: 8px;
        color: var(--text-primary);
    }
    .ov-ranking-card h3 i, .ov-ranking-card h3 svg { width: 18px; height: 18px; opacity: 0.7; }

    /* ── Radial Gauge (pure CSS conic-gradient) ── */
    .ov-gauge-wrap { text-align: center; padding: 10px 0 6px; }
    .ov-gauge {
        width: 160px; height: 160px;
        border-radius: 50%;
        position: relative;
        margin: 0 auto;
        display: flex; align-items: center; justify-content: center;
    }
    .ov-gauge-bg {
        width: 160px; height: 160px;
        border-radius: 50%;
        background: conic-gradient(
            #22c55e 0deg 90deg,
            #eab308 90deg 180deg,
            #f97316 180deg 270deg,
            #ef4444 270deg 360deg
        );
        display: flex; align-items: center; justify-content: center;
        position: relative;
    }
    .ov-gauge-inner {
        width: 120px; height: 120px;
        border-radius: 50%;
        background: #0d1030;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        z-index: 1;
    }
    .ov-gauge-value {
        font-size: 32px; font-weight: 700;
        font-family: 'Source Code Pro', ui-monospace, monospace;
        line-height: 1;
    }
    .ov-gauge-label {
        font-size: 10px; color: var(--text-muted);
        text-transform: uppercase; letter-spacing: 1px;
        margin-top: 4px;
        font-family: 'Source Code Pro', ui-monospace, monospace;
    }
    .ov-gauge-needle {
        position: absolute;
        width: 3px; height: 55px;
        background: var(--text-primary);
        bottom: 50%; left: 50%;
        transform-origin: bottom center;
        border-radius: 2px;
        z-index: 2;
        box-shadow: 0 0 6px rgba(255,255,255,0.3);
    }
    .ov-gauge-scale {
        display: flex; justify-content: space-between;
        padding: 0 8px; margin-top: 10px;
        font-size: 9px; color: var(--text-muted);
        font-family: 'Source Code Pro', ui-monospace, monospace;
    }

    /* ── Recommendation Panel ── */
    .ov-rec-list { display: flex; flex-direction: column; gap: 10px; }
    .ov-rec-item {
        display: flex; gap: 12px; align-items: flex-start;
        padding: 12px;
        background: rgba(20,22,58,0.5);
        border: 1px solid rgba(139,92,246,0.08);
        border-radius: 10px;
        transition: border-color .2s;
    }
    .ov-rec-item:hover { border-color: rgba(139,92,246,0.2); }
    .ov-rec-icon {
        width: 34px; height: 34px; border-radius: 9px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; font-size: 15px;
    }
    .ov-rec-text h4 {
        font-size: 12.5px; font-weight: 600; color: var(--text-primary);
        margin-bottom: 2px;
    }
    .ov-rec-text p {
        font-size: 11.5px; color: var(--text-secondary);
        line-height: 1.45; margin: 0;
    }

    /* ── Trend Chart Card ── */
    .ov-trend-card canvas { width: 100% !important; }

    /* ── Time Period Toggle ── */
    .ov-period-btns {
        display: flex; gap: 6px; margin-bottom: 10px;
    }
    .ov-period-btn {
        padding: 4px 12px;
        border-radius: 20px;
        border: 1px solid rgba(139,92,246,0.15);
        background: transparent;
        color: var(--text-secondary);
        font-size: 11px; font-weight: 500;
        cursor: pointer;
        transition: all .2s;
        font-family: 'Source Code Pro', ui-monospace, monospace;
    }
    .ov-period-btn:hover {
        border-color: rgba(139,92,246,0.3);
        color: var(--text-primary);
    }
    .ov-period-btn.active {
        background: rgba(139,92,246,0.2);
        border-color: rgba(139,92,246,0.4);
        color: #b48aff;
    }

    /* ── Alerts Table ── */
    .ov-alert-badge {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 3px 10px; border-radius: 20px;
        font-size: 11px; font-weight: 600;
        font-family: 'Source Code Pro', ui-monospace, monospace;
    }
    .ov-alert-badge.sev-high {
        background: rgba(239,68,68,0.15); color: #ef4444;
        border: 1px solid rgba(239,68,68,0.25);
    }
    .ov-alert-badge.sev-medium {
        background: rgba(249,115,22,0.15); color: #f97316;
        border: 1px solid rgba(249,115,22,0.25);
    }
    .ov-alert-badge.sev-low {
        background: rgba(234,179,8,0.12); color: #eab308;
        border: 1px solid rgba(234,179,8,0.2);
    }
    .ov-alert-badge.sev-critical {
        background: rgba(239,68,68,0.25); color: #ff6b6b;
        border: 1px solid rgba(239,68,68,0.4);
    }

    /* ── Section Headers ── */
    .ov-section-head {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 16px; padding-bottom: 10px;
        border-bottom: 1px solid rgba(139,92,246,0.1);
    }
    .ov-section-head h2 {
        font-size: 18px; font-weight: 600; color: var(--text-primary);
    }
    .ov-section-head .ov-sh-badge {
        padding: 2px 10px; border-radius: 20px;
        background: rgba(139,92,246,0.12);
        color: var(--text-muted); font-size: 11px; font-weight: 600;
        font-family: 'Source Code Pro', ui-monospace, monospace;
    }

    /* ── Responsive ── */
    @media (max-width: 1100px) {
        .ov-hero-metrics { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 900px) {
        .ov-layout { flex-direction: column; }
        .ov-sidebar { min-width: 0; max-width: 100%; }
        .ov-hero-metrics { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 600px) {
        .ov-hero-metrics { grid-template-columns: repeat(2, 1fr); }
        .ov-hero-title { font-size: 20px; }
        .ov-hero-card .ov-hc-val { font-size: 20px; }
    }
    `;
    document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════════════════════
   RENDER OVERVIEW — Main entry point
   Same signature, same data variables, same initTimeSeriesCharts() call
   ═══════════════════════════════════════════════════════════════ */
function render_overview(el) {
    injectOverviewStyles();

    const s  = summaryData;
    const hottest   = s.hottest || {};
    const wettest   = s.wettest || {};
    const worstAqi  = s.worst_aqi || {};
    const highestRiver = s.highest_river || {};
    const alerts    = alertsData || [];

    /* helper: escape dynamic strings */
    const esc = (typeof escapeHtml === 'function') ? escapeHtml : (v)=>String(v);

    /* helper: AQI category label */
    function aqiLabel(v) {
        if (v == null) return '-';
        if (v <= 50)  return 'Good';
        if (v <= 100) return 'Moderate';
        if (v <= 150) return 'Unhealthy (SG)';
        if (v <= 200) return 'Unhealthy';
        if (v <= 300) return 'Very Unhealthy';
        return 'Hazardous';
    }

    /* ── Build hero metric cards ── */
    const heroMetrics = [
        { icon: 'building-2',  val: esc(s.districts_monitored || 0),    lbl: 'Districts',     color: '#b48aff', bg: 'rgba(180,138,255,0.12)' },
        { icon: 'thermometer', val: esc(fmtC(hottest.temp)),            lbl: 'Hottest Today', color: tempColor(hottest.temp), bg: 'rgba(239,68,68,0.1)' },
        { icon: 'cloud-rain',  val: esc(fmtMm(wettest.rain)),           lbl: 'Most Rain (7d)',color: rainColor(wettest.rain), bg: 'rgba(96,165,250,0.1)' },
        { icon: 'wind',        val: esc(worstAqi.aqi != null ? Math.round(worstAqi.aqi) : '-'), lbl: 'Worst AQI',  color: aqiColor(worstAqi.aqi), bg: 'rgba(249,115,22,0.1)' },
        { icon: 'waves',       val: esc(highestRiver.discharge ? fmtCusecs(highestRiver.discharge) : '-'), lbl: 'Peak River Flow', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
        { icon: 'bell-ring',   val: esc(alerts.length),                lbl: 'Active Alerts',  color: alerts.length ? '#ef4444' : '#22c55e', bg: alerts.length ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)' }
    ];

    /* ── Build AQI gauge needle angle (0-300 AQI → 0-270°) ── */
    const aqiVal = worstAqi.aqi != null ? Math.round(worstAqi.aqi) : 0;
    const gaugeAngle = Math.min(aqiVal / 300, 1) * 270 - 135;
    const aqiGaugeColor = aqiColor(worstAqi.aqi);

    /* ── Build recommendations based on data ── */
    const recs = [];
    if (hottest.temp != null && hottest.temp > 40) {
        recs.push({ icon: 'thermometer-sun', title: 'Heat Advisory Active', desc: 'Extreme temperatures detected. Limit outdoor exposure during peak hours (11am–4pm).', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' });
    }
    if (worstAqi.aqi != null && worstAqi.aqi > 150) {
        recs.push({ icon: 'mask', title: 'Air Quality Warning', desc: 'AQI exceeds safe levels. Use N95 masks outdoors. Close windows and run air purifiers.', color: '#f97316', bg: 'rgba(249,115,22,0.12)' });
    }
    if (wettest.rain != null && wettest.rain > 50) {
        recs.push({ icon: 'cloud-lightning', title: 'Heavy Rainfall Alert', desc: 'Significant precipitation detected. Monitor flood-prone areas and ensure drainage systems are clear.', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' });
    }
    if (highestRiver.discharge != null && highestRiver.discharge > 50000) {
        recs.push({ icon: 'waves', title: 'River Discharge Warning', desc: 'High river discharge levels. Maintain safe distance from riverbanks and monitor flood warnings.', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' });
    }
    if (alerts.length > 0) {
        recs.push({ icon: 'alert-triangle', title: `${alerts.length} Active Alert${alerts.length > 1 ? 's' : ''} Require Attention`, desc: 'Review active alerts across all districts. Take preventive measures for affected areas.', color: '#b48aff', bg: 'rgba(180,138,255,0.12)' });
    }
    recs.push({ icon: 'shield-check', title: 'Climate Resilience', desc: 'Regularly update emergency kits, review evacuation plans, and ensure community communication channels are active.', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' });
    recs.push({ icon: 'droplets', title: 'Water Conservation', desc: 'Monitor local water indices. Practice efficient water usage and support watershed management initiatives.', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' });
    recs.push({ icon: 'trees', title: 'Urban Greenery', desc: 'Support tree planting drives to reduce urban heat island effect and improve local air quality naturally.', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' });

    /* ── Build alerts table rows ── */
    const sevClass = (sev) => {
        const v = (sev || '').toLowerCase();
        if (v === 'critical') return 'sev-critical';
        if (v === 'high') return 'sev-high';
        if (v === 'medium' || v === 'moderate') return 'sev-medium';
        return 'sev-low';
    };

    /* ── Build hottest top 10 table ── */
    const hottest10 = Object.entries(weatherData)
        .sort((a,b) => (b[1].stats?.temp_max_7d||0) - (a[1].stats?.temp_max_7d||0))
        .slice(0, 10)
        .map(([n,d]) => `<tr><td>${esc(n)}</td><td>${esc(d.province)}</td><td style="color:${tempColor(d.stats?.temp_max_7d)}"><b>${fmtC(d.stats?.temp_max_7d)}</b></td></tr>`)
        .join('');

    /* ── Build coldest top 10 ── */
    const coldest10 = Object.entries(weatherData)
        .sort((a,b) => (a[1].stats?.temp_min_7d||99) - (b[1].stats?.temp_min_7d||99))
        .slice(0, 10)
        .map(([n,d]) => `<tr><td>${esc(n)}</td><td>${esc(d.province)}</td><td style="color:${d.stats?.temp_min_7d < 15 ? '#a78bfa' : '#fbbf24'}"><b>${fmtC(d.stats?.temp_min_7d)}</b></td></tr>`)
        .join('');

    /* ═══════════════════════════════════════════
       MAIN HTML TEMPLATE — 2-Column Layout
       ═══════════════════════════════════════════ */
    el.innerHTML = `
    <!-- ═══ HERO GRADIENT BANNER ═══ -->
    <div class="ov-hero">
        <div class="ov-hero-title">
            <i data-lucide="globe-2"></i>
            Climate Monitoring System — Pakistan
        </div>
        <div class="ov-hero-sub">Real-time monitoring of temperature, air quality, precipitation, drought, wind, UV, river discharge & flood risk across all provinces.</div>
        <div class="ov-hero-metrics">
            ${heroMetrics.map(m => `
            <div class="ov-hero-card">
                <div class="ov-hc-icon" style="background:${m.bg};color:${m.color}">
                    <i data-lucide="${m.icon}"></i>
                </div>
                <div class="ov-hc-val" style="color:${m.color}">${m.val}</div>
                <div class="ov-hc-lbl">${m.lbl}</div>
            </div>`).join('')}
        </div>
    </div>

    <!-- ═══ PIPELINE STEPS ═══ -->
    <div class="pipeline">
        <div class="pipeline-step"><div class="step-num">1</div><div class="step-title">Monitor</div><div class="step-desc">Real-time weather, AQI, river data for 51 districts</div></div>
        <div class="pipeline-step"><div class="step-num">2</div><div class="step-title">Analyze</div><div class="step-desc">Climate facts, drought SPI, heat index, risk scoring</div></div>
        <div class="pipeline-step"><div class="step-num">3</div><div class="step-title">Predict</div><div class="step-desc">7-day forecasts, trend analysis, anomaly detection</div></div>
        <div class="pipeline-step"><div class="step-num">4</div><div class="step-title">Warn</div><div class="step-desc">Auto alerts by severity — heat, rain, AQI, flood, UV</div></div>
    </div>

    <!-- ═══ 2-COLUMN LAYOUT ═══ -->
    <div class="ov-layout">

        <!-- ── LEFT COLUMN (flex:2) ── -->
        <div class="ov-main">

            <!-- Rankings Section -->
            <div class="ov-section-head">
                <i data-lucide="trophy"></i>
                <h2>Top District Rankings</h2>
            </div>
            <div class="card-grid g3" id="ov-top3"></div>

            <!-- Trend Charts -->
            <div class="ov-section-head" style="margin-top:24px">
                <i data-lucide="trending-up"></i>
                <h2>Trend Analysis</h2>
            </div>
            <div class="card-grid g3">
                <div class="card ov-glass ov-trend-card" id="ts-temp-container">
                    <h3 style="margin-bottom:8px;display:flex;align-items:center;gap:8px">
                        <i data-lucide="thermometer" style="width:18px;height:18px;opacity:0.7"></i>
                        Temperature Trends
                    </h3>
                    ${createTimePeriodButtons('ts-temp-container','temperature')}
                    <div style="height:220px"><canvas id="ts-temp-chart"></canvas></div>
                </div>
                <div class="card ov-glass ov-trend-card" id="ts-rain-container">
                    <h3 style="margin-bottom:8px;display:flex;align-items:center;gap:8px">
                        <i data-lucide="cloud-rain" style="width:18px;height:18px;opacity:0.7"></i>
                        Rainfall Patterns
                    </h3>
                    ${createTimePeriodButtons('ts-rain-container','rainfall')}
                    <div style="height:220px"><canvas id="ts-rain-chart"></canvas></div>
                </div>
                <div class="card ov-glass ov-trend-card" id="ts-aqi-container">
                    <h3 style="margin-bottom:8px;display:flex;align-items:center;gap:8px">
                        <i data-lucide="wind" style="width:18px;height:18px;opacity:0.7"></i>
                        Air Quality Trends
                    </h3>
                    ${createTimePeriodButtons('ts-aqi-container','aqi')}
                    <div style="height:220px"><canvas id="ts-aqi-chart"></canvas></div>
                </div>
            </div>

            <!-- Alerts Table + Hottest Table -->
            <div class="ov-section-head" style="margin-top:24px">
                <i data-lucide="bell-ring"></i>
                <h2>Alerts &amp; Top Hottest</h2>
                <span class="ov-sh-badge">${alerts.length} active</span>
            </div>
            <div class="card-grid g2">
                <div class="card ov-glass">
                    <div class="tbl-scroll" style="max-height:280px">
                        <table class="tbl">
                            <thead><tr><th></th><th>Type</th><th>District</th><th>Severity</th><th>Value</th></tr></thead>
                            <tbody>
                            ${alerts.slice(0,15).map(a =>
                                `<tr>
                                    <td>${a.icon||''}</td>
                                    <td>${esc(a.type.replace(/_/g,' '))}</td>
                                    <td>${esc(a.district)}</td>
                                    <td><span class="ov-alert-badge ${sevClass(a.severity)}">${esc(a.severity)}</span></td>
                                    <td>${fmt(a.value,0)}</td>
                                </tr>`
                            ).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px">No active alerts ✅</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="card ov-glass">
                    <h3 style="margin-bottom:10px;display:flex;align-items:center;gap:8px">
                        <i data-lucide="flame" style="width:18px;height:18px;opacity:0.7"></i>
                        Top 10 Hottest Districts
                    </h3>
                    <div class="tbl-scroll" style="max-height:280px">
                        <table class="tbl">
                            <thead><tr><th>District</th><th>Province</th><th>Max Temp</th></tr></thead>
                            <tbody>${hottest10}</tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Below-fold Rankings -->
            <div class="ov-section-head" style="margin-top:24px">
                <i data-lucide="bar-chart-3"></i>
                <h2>Additional Rankings</h2>
            </div>
            <div class="card-grid g3" id="ov-below3"></div>

            <!-- Coldest vs Warmest Tables -->
            <div class="card-grid g2" style="margin-top:16px">
                <div class="card ov-glass">
                    <h3 style="margin-bottom:10px;display:flex;align-items:center;gap:8px">
                        <i data-lucide="snowflake" style="width:18px;height:18px;opacity:0.7;color:#a78bfa"></i>
                        Top 10 Coldest Cities
                    </h3>
                    <div class="tbl-scroll" style="max-height:240px">
                        <table class="tbl">
                            <thead><tr><th>District</th><th>Province</th><th>Min Temp</th></tr></thead>
                            <tbody>${coldest10}</tbody>
                        </table>
                    </div>
                </div>
                <div class="card ov-glass">
                    <h3 style="margin-bottom:10px;display:flex;align-items:center;gap:8px">
                        <i data-lucide="flame" style="width:18px;height:18px;opacity:0.7;color:#f97316"></i>
                        Top 10 Warmest Cities
                    </h3>
                    <div class="tbl-scroll" style="max-height:240px">
                        <table class="tbl">
                            <thead><tr><th>District</th><th>Province</th><th>Max Temp</th></tr></thead>
                            <tbody>${hottest10}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── RIGHT COLUMN / SIDEBAR (flex:1) ── -->
        <div class="ov-sidebar">

            <!-- AQI Radial Gauge -->
            <div class="card ov-glass" style="margin-bottom:16px">
                <div class="ov-section-head" style="border-bottom:none;margin-bottom:6px;padding-bottom:0">
                    <i data-lucide="activity"></i>
                    <h2 style="font-size:15px">AQI Index</h2>
                </div>
                <div class="ov-gauge-wrap">
                    <div class="ov-gauge">
                        <div class="ov-gauge-bg">
                            <div class="ov-gauge-needle" style="transform:rotate(${gaugeAngle}deg)"></div>
                            <div class="ov-gauge-inner">
                                <div class="ov-gauge-value" style="color:${aqiGaugeColor}">${aqiVal || '-'}</div>
                                <div class="ov-gauge-label">${aqiLabel(worstAqi.aqi)}</div>
                            </div>
                        </div>
                    </div>
                    <div class="ov-gauge-scale">
                        <span>0</span><span>50</span><span>100</span><span>150</span><span>200</span><span>300+</span>
                    </div>
                </div>
            </div>

            <!-- Recommendations Panel -->
            <div class="card ov-glass">
                <div class="ov-section-head" style="border-bottom:none;margin-bottom:10px;padding-bottom:0">
                    <i data-lucide="lightbulb"></i>
                    <h2 style="font-size:15px">Recommendations</h2>
                </div>
                <div class="ov-rec-list">
                    ${recs.map(r => `
                    <div class="ov-rec-item">
                        <div class="ov-rec-icon" style="background:${r.bg};color:${r.color}">
                            <i data-lucide="${r.icon}"></i>
                        </div>
                        <div class="ov-rec-text">
                            <h4>${esc(r.title)}</h4>
                            <p>${esc(r.desc)}</p>
                        </div>
                    </div>`).join('')}
                </div>
            </div>
        </div>
    </div>`;

    /* ── Post-render hooks ── */
    setTimeout(() => { renderTopRankings(); initTimeSeriesCharts(); }, 300);

    window._renderOverviewBelowFold = function() { renderBelowFoldCharts(); };
    window._renderOverviewBelowFold();
    setTimeout(window._renderOverviewBelowFold, 500);
    setTimeout(window._renderOverviewBelowFold, 1500);
    window.addEventListener('scroll', window._renderOverviewBelowFold, { once: true });
    window.addEventListener('resize', window._renderOverviewBelowFold, { once: true });
}

/* ═══════════════════════════════════════════════════════════════
   HORIZONTAL PROGRESS BAR RANKING (kept from original)
   CSS classes: .ranking-list, .ranking-row, .rank-num, .rank-name,
                .rank-bar-track, .rank-bar-fill, .rank-val
   ═══════════════════════════════════════════════════════════════ */
function makeRanking(container, title, emoji, items, colorFn, unit, maxVal) {
    if (!items.length) return;
    const mx = maxVal || Math.max(...items.map(d=>d.value)) || 1;
    container.innerHTML = `
    <div class="card ov-glass ov-ranking-card">
        <h3>${emoji} ${title}</h3>
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

/* ═══════════════════════════════════════════════════════════════
   RENDER TOP RANKINGS (Temp, Rain, AQI)
   ═══════════════════════════════════════════════════════════════ */
function renderTopRankings() {
    const container = document.getElementById('ov-top3');
    if (!container) return;

    const tempColors = ['#b48aff','#9b7bf5','#818cf8','#6d8cf7','#60a5fa','#4eb8e8','#38bdf8','#2dd4bf','#34d399','#4ade80'];
    const rainColors = ['#a78bfa','#8b5cf6','#7c3aed','#6366f1','#818cf8','#818cf8','#60a5fa','#38bdf8','#22d3ee','#2dd4bf'];
    const aqiColors  = ['#f472b6','#e879f9','#c084fc','#a78bfa','#818cf8','#818cf8','#60a5fa','#38bdf8','#22d3ee','#2dd4bf'];

    /* Temperature Top 10 */
    const t10 = Object.entries(weatherData)
        .sort((a,b)=>(b[1].stats?.temp_max_7d||0)-(a[1].stats?.temp_max_7d||0))
        .slice(0,10)
        .map(([n,d])=>({name:n.substring(0,10), value:d.stats?.temp_max_7d||0, display:fmtC(d.stats?.temp_max_7d)}));

    /* Rainfall Top 10 */
    const r10 = Object.entries(weatherData)
        .sort((a,b)=>(b[1].stats?.rain_total_7d||0)-(a[1].stats?.rain_total_7d||0))
        .slice(0,10)
        .map(([n,d])=>({name:n.substring(0,10), value:d.stats?.rain_total_7d||0, display:fmtMm(d.stats?.rain_total_7d)}));

    /* Major Cities Weather Updates */
    const majorCities = [
        {name:'Karachi', province:'Sindh'},
        {name:'Lahore', province:'Punjab'},
        {name:'Islamabad', province:'ICT'},
        {name:'Faisalabad', province:'Punjab'},
        {name:'Multan', province:'Punjab'},
        {name:'Hyderabad', province:'Sindh'},
        {name:'Rawalpindi', province:'Punjab'},
        {name:'Peshawar', province:'KPK'},
        {name:'Quetta', province:'Balochistan'},
        {name:'Gilgit', province:'GB'}
    ];

    function getCityWeather(city) {
        const d = weatherData[city.name] || {};
        const fc = d.forecast || {};
        const hourly = fc.hourly || {};
        const temps = hourly.temperature_2m || [];
        const humidity = hourly.relative_humidity_2m || [];
        const wind = hourly.wind_speed_10m || [];
        const currentTemp = temps.length ? Math.round(temps[0]) : null;
        const currentHumidity = humidity.length ? Math.round(humidity[0]) : null;
        const currentWind = wind.length ? Math.round(wind[0]) : null;
        return {temp: currentTemp, humidity: currentHumidity, wind: currentWind};
    }

    function getTempColor(temp) {
        if (temp >= 40) return '#ef4444';
        if (temp >= 35) return '#f97316';
        if (temp >= 30) return '#eab308';
        if (temp >= 25) return '#22c55e';
        if (temp >= 20) return '#3b82f6';
        return '#06b6d4';
    }

    container.innerHTML = '';
    const c1 = document.createElement('div');
    const c2 = document.createElement('div');
    const c3 = document.createElement('div');
    container.appendChild(c1);
    container.appendChild(c2);
    container.appendChild(c3);

    /* Temperature & Rainfall Rankings */
    makeRanking(c1, 'Temperature (Top 10)', '🔥', t10, (v,i)=>tempColors[i], '°C');
    makeRanking(c2, 'Rainfall 7-Day (Top 10)', '🌧', r10, (v,i)=>rainColors[i], 'mm');

    /* Major Cities Weather Cards */
    const cityCards = majorCities.map(city => {
        const w = getCityWeather(city);
        const tempColor = getTempColor(w.temp);
        return '<div class="city-weather-card" style="background:rgba(15,23,42,0.85);backdrop-filter:blur(15px);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px;margin-bottom:12px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                '<div>' +
                    '<div style="font-size:15px;font-weight:600;color:#f8fafc;">' + city.name + '</div>' +
                    '<div style="font-size:11px;color:#94a3b8;">' + city.province + '</div>' +
                '</div>' +
                '<div style="font-size:28px;font-weight:700;color:' + tempColor + ';">' + (w.temp != null ? w.temp + '°' : '--') + '</div>' +
            '</div>' +
            '<div style="display:flex;gap:16px;font-size:12px;color:#94a3b8;">' +
                '<span>💧 ' + (w.humidity != null ? w.humidity + '%' : '--') + '</span>' +
                '<span>💨 ' + (w.wind != null ? w.wind + ' km/h' : '--') + '</span>' +
            '</div>' +
        '</div>';
    }).join('');

    c3.innerHTML = '<div class="card ov-glass" style="max-height:480px;overflow-y:auto;">' +
        '<h3 style="margin-bottom:12px;">🏙 Major Cities Weather</h3>' +
        cityCards +
    '</div>';
}

/* ═══════════════════════════════════════════════════════════════
   RENDER BELOW-FOLD CHARTS (Humidity, Wind, Coldest vs Warmest)
   ═══════════════════════════════════════════════════════════════ */
function renderBelowFoldCharts() {
    const container = document.getElementById('ov-below3');
    if (!container || container._rendered) return;

    /* Humidity Range Top 10 */
    const h10 = Object.entries(weatherData).map(([n,d])=>{
        const hum=d.forecast?.hourly?.relative_humidity_2m;
        if(!hum||!hum.length) return null;
        const min=Math.min(...hum), max=Math.max(...hum), avg=Math.round(hum.reduce((a,b)=>a+b,0)/hum.length);
        return {name:n.substring(0,10),min,max,avg,range:max-min};
    }).filter(Boolean).sort((a,b)=>b.range-a.range).slice(0,10);
    const humColors = ['#b48aff','#a78bfa','#9b7bf5','#8b5cf6','#818cf8','#7c3aed','#6d28d9','#6366f1','#7e6ce8','#9580f0'];

    /* Wind Speed Top 10 */
    const w10 = Object.entries(weatherData).map(([n,d])=>{
        const ws=d.forecast?.hourly?.wind_speed_10m;
        const maxW=ws&&ws.length?Math.round(Math.max(...ws)):0;
        return {name:n.substring(0,10),value:maxW,display:maxW+' km/h'};
    }).filter(d=>d.value>0).sort((a,b)=>b.value-a.value).slice(0,10);
    const windColors = ['#c084fc','#b48aff','#a78bfa','#9b7bf5','#8b5cf6','#818cf8','#7c3aed','#6366f1','#818cf8','#9580f0'];

    /* Coldest vs Warmest */
    const sorted2 = Object.entries(weatherData).sort((a,b)=>(b[1].stats?.temp_max_7d||0)-(a[1].stats?.temp_max_7d||0));
    const cold5 = sorted2.slice(-5).reverse().map(([n,d])=>({name:n.substring(0,10), value:Math.abs(d.stats?.temp_min_7d||0), display:fmtC(d.stats?.temp_min_7d)}));
    const warm5 = sorted2.slice(0,5).map(([n,d])=>({name:n.substring(0,10), value:d.stats?.temp_max_7d||0, display:fmtC(d.stats?.temp_max_7d)}));
    const cwItems = [...cold5.map(d=>({...d, _cold:true})), ...warm5];
    const cwColors = cold5.map(()=>['#6366f1','#818cf8']).flat().concat(warm5.map(()=>['#e879f9','#c084fc']).flat());

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
