/* ─── Alert Settings & Notification Bell ─────────────────── */

const ALERT_THRESHOLDS_KEY = 'climate-alert-thresholds';
const ALERT_TOAST_SHOWN_KEY = 'climate-alert-toast-shown';

const defaultThresholds = {
    temperature: 45,   // °C
    aqi: 200,          // AQI
    rainfall: 80,      // mm
    wind: 60           // km/h
};

function getThresholds() {
    try {
        const saved = localStorage.getItem(ALERT_THRESHOLDS_KEY);
        return saved ? { ...defaultThresholds, ...JSON.parse(saved) } : { ...defaultThresholds };
    } catch { return { ...defaultThresholds }; }
}

function saveThresholds(t) {
    localStorage.setItem(ALERT_THRESHOLDS_KEY, JSON.stringify(t));
}

/* ─── Bell Dropdown ───────────────────────────────────────── */
function initBell() {
    const btn = document.getElementById('bell-btn');
    const dropdown = document.getElementById('bell-dropdown');
    if (!btn || !dropdown) return;

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = dropdown.classList.toggle('open');
        if (open) renderBellDropdown(dropdown);
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== btn) {
            dropdown.classList.remove('open');
        }
    });

    // Update bell badge after data loads
    updateBellBadge();
    // Re-check periodically
    setInterval(updateBellBadge, 60000);
}

function updateBellBadge() {
    const badge = document.getElementById('bell-badge');
    const alerts = window.alertsData || [];
    if (badge) {
        const count = alerts.length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function severityColor(sev) {
    const s = (sev || '').toLowerCase();
    if (s === 'extreme' || s === 'critical') return 'var(--danger)';
    if (s === 'severe' || s === 'high') return 'var(--orange)';
    if (s === 'moderate' || s === 'medium') return 'var(--warning)';
    if (s === 'low') return 'var(--success)';
    return 'var(--info)';
}

function renderBellDropdown(dd) {
    const alerts = (window.alertsData || []).slice(0, 10);
    if (!alerts.length) {
        dd.innerHTML = `
            <div class="bell-dropdown-header">Active Alerts</div>
            <div class="bell-dropdown-empty">✅ No active alerts</div>`;
        return;
    }

    const items = alerts.map(a => `
        <div class="bell-dropdown-item">
            <span class="bell-severity-dot" style="background:${severityColor(a.severity)}"></span>
            <div class="bell-item-info">
                <div class="bell-item-type">${a.type || 'Unknown'}</div>
                <div class="bell-item-detail">${a.district || ''} — ${a.severity || 'info'}</div>
            </div>
            <span class="bell-item-value" style="color:${severityColor(a.severity)}">${a.value != null ? a.value : ''}</span>
        </div>
    `).join('');

    dd.innerHTML = `
        <div class="bell-dropdown-header">
            Active Alerts <span class="bell-count">${alerts.length}${(window.alertsData||[]).length > 10 ? ' of ' + (window.alertsData||[]).length : ''}</span>
        </div>
        ${items}
        <div class="bell-dropdown-footer">
            <a href="#" onclick="event.preventDefault();loadSection('alert-notif');document.getElementById('bell-dropdown').classList.remove('open');">View all alerts →</a>
        </div>`;
}

/* ─── Threshold Toast Notifications ───────────────────────── */
function checkThresholdAlerts() {
    const thresholds = getThresholds();
    const shown = JSON.parse(localStorage.getItem(ALERT_TOAST_SHOWN_KEY) || '[]');
    const now = Date.now();
    // Only show each unique alert once per 30 minutes
    const THIRTY_MIN = 30 * 60 * 1000;
    const recentShown = shown.filter(s => now - s.time < THIRTY_MIN);
    const recentKeys = new Set(recentShown.map(s => s.key));

    const weather = window.weatherData || {};
    const aqi = window.aqiData || {};
    const newAlerts = [];

    // Check temperature
    Object.entries(weather).forEach(([district, data]) => {
        const temp = data.stats?.temp_max_7d;
        if (temp != null && temp > thresholds.temperature) {
            const key = `temp-${district}`;
            if (!recentKeys.has(key)) {
                newAlerts.push({
                    key,
                    msg: `🌡 Temperature ${fmtC(temp)} exceeds threshold (${thresholds.temperature}°C) in <b>${district}</b>`,
                    type: 'danger'
                });
                recentShown.push({ key, time: now });
            }
        }
    });

    // Check AQI
    Object.entries(aqi).forEach(([district, data]) => {
        const v = data.stats?.aqi_max;
        if (v != null && v > thresholds.aqi) {
            const key = `aqi-${district}`;
            if (!recentKeys.has(key)) {
                newAlerts.push({
                    key,
                    msg: `💨 AQI ${v} exceeds threshold (${thresholds.aqi}) in <b>${district}</b>`,
                    type: 'danger'
                });
                recentShown.push({ key, time: now });
            }
        }
    });

    // Check rainfall (from weatherData stats)
    Object.entries(weather).forEach(([district, data]) => {
        const rain = data.stats?.rain_total_7d;
        if (rain != null && rain > thresholds.rainfall) {
            const key = `rain-${district}`;
            if (!recentKeys.has(key)) {
                newAlerts.push({
                    key,
                    msg: `🌧 Rainfall ${fmtMm(rain)} exceeds threshold (${thresholds.rainfall}mm) in <b>${district}</b>`,
                    type: 'warning'
                });
                recentShown.push({ key, time: now });
            }
        }
    });

    // Check wind
    Object.entries(weather).forEach(([district, data]) => {
        const wind = data.stats?.wind_max;
        if (wind != null && wind > thresholds.wind) {
            const key = `wind-${district}`;
            if (!recentKeys.has(key)) {
                newAlerts.push({
                    key,
                    msg: `🌬 Wind ${fmt(wind, 0)} km/h exceeds threshold (${thresholds.wind} km/h) in <b>${district}</b>`,
                    type: 'warning'
                });
                recentShown.push({ key, time: now });
            }
        }
    });

    // Save and show
    localStorage.setItem(ALERT_TOAST_SHOWN_KEY, JSON.stringify(recentShown.slice(-100)));

    const toastContainer = document.getElementById('threshold-toast');
    if (toastContainer && newAlerts.length) {
        newAlerts.forEach(a => {
            showThresholdToast(a.msg, a.type, toastContainer);
        });
    }
}

function showThresholdToast(msg, type, container) {
    const el = document.createElement('div');
    el.className = `threshold-toast threshold-toast-${type}`;
    el.innerHTML = `
        <div class="threshold-toast-icon">${type === 'danger' ? '🚨' : '⚠️'}</div>
        <div class="threshold-toast-msg">${msg}</div>
        <button class="threshold-toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(el);
    // Auto-remove after 12 seconds
    setTimeout(() => { if (el.parentElement) el.remove(); }, 12000);
}

/* ─── Alert Settings Form ─────────────────────────────────── */
function render_alert_settings(el) {
    const thresholds = getThresholds();
    el.innerHTML = `
    <div class="hero" style="margin-bottom:20px">
        <h1>⚙ Alert Threshold Settings</h1>
        <p style="color:var(--text-secondary);margin-top:6px;font-size:13px">
            Set custom thresholds for each climate parameter. When data exceeds these thresholds, you'll receive a toast notification.
        </p>
    </div>

    <div class="card" style="padding:24px;max-width:640px">
        <h3 style="margin-bottom:20px;color:var(--text-primary)">📊 Threshold Configuration</h3>
        <form id="threshold-form" onsubmit="event.preventDefault();saveThresholdForm();">
            <div class="threshold-form-grid">
                <div class="threshold-field">
                    <label class="threshold-label">
                        <span class="threshold-icon">🌡</span>
                        <span>Temperature</span>
                    </label>
                    <div class="threshold-input-wrap">
                        <input type="number" id="th-temp" class="threshold-input" value="${thresholds.temperature}" min="0" max="60" step="1">
                        <span class="threshold-unit">°C</span>
                    </div>
                    <div class="threshold-hint">Alert when max temperature exceeds this value</div>
                </div>

                <div class="threshold-field">
                    <label class="threshold-label">
                        <span class="threshold-icon">💨</span>
                        <span>Air Quality Index</span>
                    </label>
                    <div class="threshold-input-wrap">
                        <input type="number" id="th-aqi" class="threshold-input" value="${thresholds.aqi}" min="0" max="500" step="5">
                        <span class="threshold-unit">AQI</span>
                    </div>
                    <div class="threshold-hint">Alert when AQI exceeds this value (200 = Very Unhealthy)</div>
                </div>

                <div class="threshold-field">
                    <label class="threshold-label">
                        <span class="threshold-icon">🌧</span>
                        <span>Rainfall</span>
                    </label>
                    <div class="threshold-input-wrap">
                        <input type="number" id="th-rain" class="threshold-input" value="${thresholds.rainfall}" min="0" max="500" step="1">
                        <span class="threshold-unit">mm</span>
                    </div>
                    <div class="threshold-hint">Alert when 7-day cumulative rainfall exceeds this value</div>
                </div>

                <div class="threshold-field">
                    <label class="threshold-label">
                        <span class="threshold-icon">🌬</span>
                        <span>Wind Speed</span>
                    </label>
                    <div class="threshold-input-wrap">
                        <input type="number" id="th-wind" class="threshold-input" value="${thresholds.wind}" min="0" max="200" step="1">
                        <span class="threshold-unit">km/h</span>
                    </div>
                    <div class="threshold-hint">Alert when max wind speed exceeds this value</div>
                </div>
            </div>

            <div style="display:flex;gap:10px;margin-top:20px;align-items:center">
                <button type="submit" class="threshold-save-btn">💾 Save Thresholds</button>
                <button type="button" class="threshold-reset-btn" onclick="resetThresholds()">↺ Reset Defaults</button>
                <span id="threshold-status" class="threshold-status"></span>
            </div>
        </form>
    </div>

    <div class="card" style="padding:20px;max-width:640px;margin-top:16px">
        <h3 style="margin-bottom:12px;color:var(--text-primary)">ℹ How it works</h3>
        <ul style="font-size:13px;color:var(--text-secondary);line-height:1.8;padding-left:18px">
            <li>Toast notifications appear at the <b>bottom-right</b> of the screen when thresholds are exceeded</li>
            <li>Each alert is shown at most <b>once every 30 minutes</b> to avoid spam</li>
            <li>Thresholds are stored in your browser's <b>localStorage</b></li>
            <li>Click the <b>🔔 bell icon</b> in the bottom-left to see active system alerts</li>
        </ul>
    </div>`;
}

function saveThresholdForm() {
    const temp = parseFloat(document.getElementById('th-temp')?.value);
    const aqi = parseFloat(document.getElementById('th-aqi')?.value);
    const rain = parseFloat(document.getElementById('th-rain')?.value);
    const wind = parseFloat(document.getElementById('th-wind')?.value);

    const thresholds = {
        temperature: isNaN(temp) ? defaultThresholds.temperature : temp,
        aqi: isNaN(aqi) ? defaultThresholds.aqi : aqi,
        rainfall: isNaN(rain) ? defaultThresholds.rainfall : rain,
        wind: isNaN(wind) ? defaultThresholds.wind : wind
    };

    saveThresholds(thresholds);

    // Clear the toast shown log so new thresholds trigger fresh checks
    localStorage.removeItem(ALERT_TOAST_SHOWN_KEY);

    const status = document.getElementById('threshold-status');
    if (status) {
        status.textContent = '✅ Saved! New thresholds will be checked on next data refresh.';
        status.classList.add('show');
        setTimeout(() => { status.textContent = ''; status.classList.remove('show'); }, 4000);
    }

    // Run an immediate check with new thresholds
    checkThresholdAlerts();
}

function resetThresholds() {
    saveThresholds({ ...defaultThresholds });
    localStorage.removeItem(ALERT_TOAST_SHOWN_KEY);

    // Re-render the form with defaults
    const el = document.getElementById('sec-alert-settings');
    if (el) render_alert_settings(el);
}

/* ─── Initialize on DOM ready ─────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    initBell();

    // Check thresholds after data loads (hook into existing data load)
    const origLoadAllData = window.loadAllData;
    // Run threshold check after initial load completes
    setTimeout(checkThresholdAlerts, 5000);
    // Check on each auto-refresh cycle (30 min)
    setInterval(checkThresholdAlerts, 30 * 60 * 1000);
});
