/* ─── Climate Monitor SPA Router ──────────────────────────── */
let weatherData = null, aqiData = null, riverData = null, alertsData = null, summaryData = null;
let lastDataUpdate = null;
window.weatherData = null; window.aqiData = null; window.riverData = null; window.alertsData = null; window.summaryData = null;
let dataLoaded = false;

// ─── Fix #6: Interval ID tracking for cleanup ──────────────
const _intervalIds = [];
function trackedSetInterval(fn, ms) {
    const id = setInterval(fn, ms);
    _intervalIds.push(id);
    return id;
}
function clearAllIntervals() {
    _intervalIds.forEach(id => clearInterval(id));
    _intervalIds.length = 0;
}
window.addEventListener('beforeunload', clearAllIntervals);

// ─── Security: XSS Prevention ──────────────────────────────
function escapeHtml(s) {
    if (s == null) return '';
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
}

// ─── Security: JWT Helpers ─────────────────────────────────
function parseJwt(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        return JSON.parse(atob(parts[1]));
    } catch(e) { return null; }
}

function isTokenExpired(token) {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
}

// ─── Security: Login Attempt Lockout ───────────────────────
const _loginAttempts = { count: 0, lockedUntil: 0 };
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 5 * 60 * 1000;

document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle
    const savedTheme = localStorage.getItem('climate-theme') || 'dark';
    if (savedTheme === 'light') document.documentElement.classList.add('light');
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        document.documentElement.classList.toggle('light');
        localStorage.setItem('climate-theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
        updateMapTilesForTheme();
    });

    // Nav
    $$('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            loadSection(btn.dataset.s);
            if (window.innerWidth <= 900) {
                document.querySelector('.sidebar')?.classList.remove('open');
                const overlay = document.getElementById('sidebar-overlay');
                if (overlay) overlay.style.display = 'none';
            }
        });
    });

    // ─── Security: Check token expiry on load ──────────────
    if (authToken) {
        if (isTokenExpired(authToken)) {
            console.warn('Auth token expired — clearing session');
            authToken = null; currentUser = null;
            localStorage.removeItem('climate-token');
        } else {
            fetch('/api/auth/verify', {
                headers: { 'Authorization': 'Bearer ' + authToken }
            }).then(r => r.json()).then(d => {
                if (!d.valid) {
                    authToken = null; currentUser = null;
                    localStorage.removeItem('climate-token');
                } else {
                    currentUser = d.user;
                }
            }).catch(() => {});
        }
    }

    // Load data then render default section
    loadAllData().then(() => {
        dataLoaded = true;
        if (typeof updateBellBadge === 'function') updateBellBadge();
        try {
            loadSection('overview');
        } catch(e) {
            console.error('Failed to load overview:', e);
            const el = document.getElementById('sec-overview');
            if (el && typeof render_overview === 'function') {
                render_overview(el);
            }
        }
        setTimeout(() => {
            ['command-center', 'temperature', 'rivers'].forEach(id => {
                loadSectionScript(id).catch(() => {});
            });
        }, 2000);
    }).catch(e => {
        console.error('loadAllData failed:', e);
        dataLoaded = true;
        try {
            loadSection('overview');
        } catch(e2) {
            console.error('Overview fallback also failed:', e2);
        }
    });
});

async function loadAllData() {
    const results = await Promise.allSettled([
        api('/api/weather/all'),
        api('/api/aqi/all'),
        api('/api/rivers'),
        api('/api/alerts'),
        api('/api/summary')
    ]);
    weatherData = (results[0].status === 'fulfilled' && results[0].value) || {};
    aqiData = (results[1].status === 'fulfilled' && results[1].value) || {};
    riverData = (results[2].status === 'fulfilled' && results[2].value) || {};
    alertsData = (results[3].status === 'fulfilled' && results[3].value) || [];
    summaryData = (results[4].status === 'fulfilled' && results[4].value) || {};
    lastDataUpdate = new Date();
    window.weatherData = weatherData; window.aqiData = aqiData;
    window.riverData = riverData; window.alertsData = alertsData; window.summaryData = summaryData;
    window.lastDataUpdate = lastDataUpdate;
    try { renderAlerts(); } catch(e) { console.warn('renderAlerts failed:', e); }
    try { showFloatingAlerts(); } catch(e) { console.warn('showFloatingAlerts failed:', e); }
    try { updateLastUpdatedBadge(); } catch(e) { console.warn('updateLastUpdatedBadge failed:', e); }
}

// Fix #6: Use tracked intervals — auto-refresh data every 30 minutes
trackedSetInterval(async () => {
    try {
        await loadAllData();
        console.log('🔄 Data auto-refreshed at', new Date().toLocaleTimeString());
    } catch(e) { console.error('Auto-refresh failed:', e); }
}, 30 * 60 * 1000);

function updateLastUpdatedBadge() {
    const badge = document.getElementById('last-updated-badge');
    if (badge && lastDataUpdate) {
        const ago = Math.round((Date.now() - lastDataUpdate.getTime()) / 60000);
        badge.textContent = ago < 1 ? 'Updated just now' : `Updated ${ago}m ago`;
        badge.title = lastDataUpdate.toLocaleString();
    }
}
trackedSetInterval(updateLastUpdatedBadge, 60000);

function renderAlerts() {
    const dot = document.querySelector('.alert-dot');
    if (dot && alertsData.length) {
        dot.style.display = 'block';
        dot.title = alertsData.length + ' active alerts';
    } else if (dot) { dot.style.display = 'none'; }
}

// Update map tiles when theme changes
function updateMapTilesForTheme() {
    const isLight = document.documentElement.classList.contains('light');
    const tileStyle = isLight ? 'light' : 'dark';
    
    document.querySelectorAll('.leaflet-container').forEach(container => {
        if (container._floodTileLayer && container._floodTileStyle !== undefined) {
            container.removeLayer(container._floodTileLayer);
            const subdomains = container._floodTileStyle === 'satellite' ? [] : 
                              (container._floodTileStyle === 'terrain' ? 'abc' : 'abcd');
            const attribution = container._floodTileStyle === 'satellite' ? '© Esri' : 
                               (container._floodTileStyle === 'terrain' ? '© OpenTopoMap' : '© CartoDB');
            container._floodTileLayer = L.tileLayer(FLOOD_TILE_URLS[tileStyle], {
                maxZoom: 18,
                subdomains: subdomains,
                attribution: attribution
            }).addTo(container);
            container._floodTileStyle = tileStyle;
            const btn = container.querySelector('.basemap-btn');
            if (btn) btn.textContent = FLOOD_TILE_NAMES[tileStyle];
        }
    });
}

/* ─── Lazy-load section JS on demand ──────────────────────────── */
const _loadedSections = new Set();
const _loadingSections = new Set();

function loadSectionScript(id) {
    return new Promise((resolve, reject) => {
        if (_loadedSections.has(id)) { resolve(); return; }
        if (_loadingSections.has(id)) {
            const check = trackedSetInterval(() => {
                if (_loadedSections.has(id)) { clearInterval(check); resolve(); }
            }, 50);
            return;
        }
        _loadingSections.add(id);
        const script = document.createElement('script');
        script.src = `/static/js/sections/${id}.js?v=4`;
        script.onload = () => { _loadedSections.add(id); _loadingSections.delete(id); resolve(); };
        script.onerror = () => { _loadingSections.delete(id); reject(new Error(`Failed to load ${id}.js`)); };
        document.body.appendChild(script);
    });
}

// Fix #7: Section error boundary with retry
function _sectionErrorHTML(id, errorMsg) {
    const safeId = escapeHtml(id);
    const safeMsg = escapeHtml(errorMsg || 'Unknown error');
    return `<div class="card" style="text-align:center;padding:32px">
        <div style="font-size:24px;margin-bottom:8px">⚠️</div>
        <h3 style="margin-bottom:8px;color:var(--text-primary)">Section unavailable</h3>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">${safeMsg}</p>
        <button onclick="retrySection('${safeId}')" class="retry-btn"
            style="padding:8px 20px;border-radius:8px;border:1px solid rgba(100,80,255,0.3);background:rgba(100,80,255,0.15);color:#b48aff;cursor:pointer;font-size:12px;font-weight:600">
            ↻ Retry
        </button>
    </div>`;
}

function retrySection(id) {
    _loadedSections.delete(id);
    _loadingSections.delete(id);
    loadSection(id);
}

function loadSection(id) {
    $$('.nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`[data-s="${id}"]`);
    if (btn) btn.classList.add('active');
    const mc = document.getElementById('main-content');
    mc.innerHTML = `<div class="section active" id="sec-${escapeHtml(id)}"><div class="loading">Loading…</div></div>`;
    const el = document.getElementById(`sec-${id}`);

    loadSectionScript(id).then(() => {
        const fn = window['render_' + id.replace(/-/g, '_')];
        if (fn) fn(el); else el.innerHTML = '<div class="card"><h3>Section coming soon</h3></div>';
        if(window.lucide) lucide.createIcons();
    }).catch(err => {
        console.error(`Section load failed [${id}]:`, err);
        el.innerHTML = _sectionErrorHTML(id, err.message);
        if(window.lucide) lucide.createIcons();
    });
}

// ═══ Multi-language Support ════════════════════════════════
let currentLang = localStorage.getItem('climate-lang') || 'en';
const translations = {
    en: { overview:'Overview', command_center:'Command Center', temperature:'Temperature & Heatwaves', air_quality:'Air Quality (AQI)', precipitation:'Precipitation', drought:'Drought Monitor', wind:'Wind Patterns', uv:'UV Index', humidity:'Humidity', rivers:'River Discharge', flood_risk:'Flood Risk', disaster:'Disaster Center', climate_trends:'Climate Trends', satellite:'Satellite Watch', agriculture:'Agriculture', ghg:'Greenhouse Gases', geospatial:'Geospatial / GIS', climate_gis:'Climate GIS', hazard_risk:'Hazard & Risk', socioeconomic:'Socio-Economic', ai_analyst:'AI Analyst', weather_portal:'Weather Portal', city_weather:'City Weather', early_warning:'Early Warning', resilience:'Resilience Center', interactive_map:'Interactive Map', spatial_analysis:'Spatial Analysis', data_export:'Data Export', predictive:'Predictive Analytics', history:'Historical Data', data_ingestion:'Data Ingestion', data_processing:'Data Processing', mapping_viz:'Mapping & Viz', dashboard_sys:'Dashboard System', alert_notif:'Alert & Notification', user_mgmt:'User Management', reports:'Report Generation', data_sources:'Data Sources', districts_monitored:'Districts Monitored', hottest_today:'Hottest Today', most_rainfall:'Most Rainfall', worst_aqi:'Worst AQI', peak_river:'Peak River Flow', active_alerts:'Active Alerts', login:'Login', logout:'Logout', language:'Language' },
    ur: { overview:' Overview', command_center:' ', temperature:' ', air_quality:' (AQI)', precipitation:' ', drought:' ', wind:' ', uv:' UV ', humidity:' ', rivers:' ', flood_risk:' ', disaster:' ', climate_trends:' ', satellite:' ', agriculture:' ', ghg:' ', geospatial:' / GIS', hazard_risk:'  ', socioeconomic:' ', ai_analyst:' ', weather_portal:' ', city_weather:' ', early_warning:' ', resilience:' ', interactive_map:' ', spatial_analysis:' ', data_export:' ', predictive:' ', history:' ', data_ingestion:' ', data_processing:' ', mapping_viz:'  ', dashboard_sys:' ', alert_notif:'  ', user_mgmt:' ', reports:' ', data_sources:' ', districts_monitored:' ', hottest_today:' ', most_rainfall:' ', worst_aqi:'AQI ', peak_river:' ', active_alerts:' ', login:' ', logout:' ', language:' ' }
};

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'ur' : 'en';
    localStorage.setItem('climate-lang', currentLang);
    document.documentElement.dir = currentLang === 'ur' ? 'rtl' : 'ltr';
    document.getElementById('lang-toggle').innerHTML = currentLang === 'en' ? '<i data-lucide="globe"></i> EN' : '<i data-lucide="globe"></i> اردو';
    if(window.lucide) lucide.createIcons();
    applyTranslations();
}

// ═══ Mobile Sidebar Toggle ════════════════════════════════
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('open');
    const isOpen = sidebar.classList.contains('open');
    if (overlay) overlay.style.display = isOpen ? 'block' : 'none';
    // Fix #9: Update ARIA state
    const menuBtn = document.getElementById('mobile-menu-btn');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(isOpen));
}

function applyTranslations() {
    const t = translations[currentLang] || translations.en;
    $$('.nav-btn').forEach(btn => {
        const key = btn.dataset.s?.replace(/-/g, '_');
        if (key && t[key]) {
            const icon = btn.querySelector('.nav-icon')?.innerHTML || '';
            btn.innerHTML = `<span class="nav-icon">${icon}</span>${t[key]}`;
        }
    });
    if(window.lucide) lucide.createIcons();
}

// ═══ Auth System ═══════════════════════════════════════════
let authToken = localStorage.getItem('climate-token') || null;
let currentUser = null;

function showAuthError(msg) {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function hideAuthError() {
    const el = document.getElementById('auth-error');
    if (el) { el.style.display = 'none'; }
}

async function doLogin() {
    const now = Date.now();
    if (_loginAttempts.lockedUntil > now) {
        const mins = Math.ceil((_loginAttempts.lockedUntil - now) / 60000);
        showAuthError(`Too many failed attempts. Try again in ${mins}m.`);
        return;
    }

    const user = document.getElementById('auth-user')?.value?.trim();
    const pass = document.getElementById('auth-pass')?.value;
    hideAuthError();

    if (!user || !pass) {
        showAuthError('Username and password required');
        return;
    }

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();

        if (data.token) {
            if (isTokenExpired(data.token)) {
                showAuthError('Server returned expired token. Try again.');
                return;
            }
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('climate-token', authToken);
            document.getElementById('auth-modal').style.display = 'none';
            _loginAttempts.count = 0;
            _loginAttempts.lockedUntil = 0;
            alert('Welcome, ' + escapeHtml(data.user.name) + '! Role: ' + escapeHtml(data.user.role));
        } else {
            _loginAttempts.count++;
            if (_loginAttempts.count >= MAX_ATTEMPTS) {
                _loginAttempts.lockedUntil = now + LOCKOUT_MS;
                _loginAttempts.count = 0;
                showAuthError('Account locked for 5 minutes due to too many failed attempts.');
            } else {
                const remaining = MAX_ATTEMPTS - _loginAttempts.count;
                showAuthError(`Invalid credentials (${remaining} attempts remaining)`);
            }
        }
    } catch(e) {
        showAuthError('Login error: ' + e.message);
    }
}

function doLogout() {
    authToken = null; currentUser = null;
    localStorage.removeItem('climate-token');
    window.location.reload();
}

// ═══ District Search (XSS-safe) ═════════════════════════════
(function() {
    const searchInput = document.getElementById('district-search');
    const dropdown = document.getElementById('district-search-dropdown');
    if (!searchInput || !dropdown) return;

    let debounceTimer = null;

    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => handleDistrictSearch(), 200);
    });

    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    searchInput.addEventListener('focus', function() {
        handleDistrictSearch();
    });

    function handleDistrictSearch() {
        const query = searchInput.value.trim().toLowerCase();
        const navBtns = $$('.nav-btn');
        const navLabels = $$('.nav-section-label');

        navBtns.forEach(btn => {
            const text = btn.textContent.toLowerCase();
            btn.style.display = (!query || text.includes(query)) ? '' : 'none';
        });
        navLabels.forEach(label => {
            if (!query) { label.style.display = ''; return; }
            let next = label.nextElementSibling;
            let hasVisible = false;
            while (next && !next.classList.contains('nav-section-label')) {
                if (next.classList.contains('nav-btn') && next.style.display !== 'none') {
                    hasVisible = true;
                    break;
                }
                next = next.nextElementSibling;
            }
            label.style.display = hasVisible ? '' : 'none';
        });

        if (query.length >= 3 && window.weatherData && Object.keys(window.weatherData).length > 0) {
            const matches = [];
            for (const [name, d] of Object.entries(window.weatherData)) {
                if (!d || !d.lat) continue;
                const province = (d.province || '').toLowerCase();
                if (name.toLowerCase().includes(query) || province.includes(query)) {
                    const temp = d.daily?.temperature_2m_max?.[0];
                    matches.push({ name, province: d.province || '', temp });
                    if (matches.length >= 20) break;
                }
            }
            if (matches.length > 0) {
                dropdown.innerHTML = matches.map(d => {
                    const temp = d.temp != null ? Math.round(d.temp) + '°C' : 'N/A';
                    const safeName = escapeHtml(d.name);
                    const safeProvince = escapeHtml(d.province);
                    return `<div class="district-search-item" data-district="${escapeHtml(d.name)}">
                        <span class="district-search-name">${safeName}</span>
                        <span class="district-search-meta">${safeProvince} · ${temp}</span>
                    </div>`;
                }).join('');
                dropdown.style.display = 'block';

                dropdown.querySelectorAll('.district-search-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const district = item.dataset.district;
                        searchInput.value = district;
                        dropdown.style.display = 'none';
                        loadSection('city-weather');
                        setTimeout(() => {
                            const section = document.getElementById('sec-city-weather');
                            if (section) {
                                const filterInput = section.querySelector('input[type="text"], select');
                                if (filterInput && filterInput.tagName === 'INPUT') {
                                    filterInput.value = district;
                                    filterInput.dispatchEvent(new Event('input'));
                                }
                                if (typeof window.setCityFilter === 'function') {
                                    window.setCityFilter(district);
                                }
                            }
                        }, 500);
                    });
                });
            } else {
                dropdown.innerHTML = '<div class="district-search-empty">No matching districts</div>';
                dropdown.style.display = 'block';
            }
        } else if (query.length >= 3) {
            dropdown.innerHTML = '<div class="district-search-empty">Weather data not loaded yet</div>';
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    }
})();

// Auto-save snapshot daily
async function autoSaveSnapshot() {
    const lastSave = localStorage.getItem('climate-last-save');
    const today = new Date().toDateString();
    if (lastSave !== today) {
        try { await fetch('/api/history/save', {method:'POST'}); localStorage.setItem('climate-last-save', today); } catch(e) {}
    }
}
autoSaveSnapshot();
