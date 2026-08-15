/* ─── Utility Helpers ─────────────────────────────────────── */
const C = {
    danger:'#f85149', warning:'#d29922', yellow:'#e3b341', success:'#3fb950',
    info:'#79c0ff', accent:'#58a6ff', purple:'#bc8cff', cyan:'#39d2c0', orange:'#f0883e',
    bg:'#0a0a0a', card:'#1c2128', border:'#30363d', text:'#e6edf3', muted:'#8b949e'
};

function $(sel, ctx=document) { return ctx.querySelector(sel); }
function $$(sel, ctx=document) { return [...ctx.querySelectorAll(sel)]; }

async function api(path) {
    try {
        const r = await fetch(path);
        if (!r.ok) throw new Error(r.statusText);
        return await r.json();
    } catch(e) {
        console.warn('API error:', path, e);
        return null;
    }
}

function fmt(n, d=1) { return n != null ? Number(n).toFixed(d) : '-'; }
function fmtK(n) { return n != null ? (n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'k' : n.toString()) : '-'; }
function fmtC(n) { return n != null ? fmt(n,1)+'°C' : '-'; }
function fmtMm(n) { return n != null ? fmt(n,1)+'mm' : '-'; }
function fmtCusecs(n) { return n != null ? (n/1000).toFixed(0)+'k cusecs' : '-'; }

function tempColor(t) {
    if (t >= 45) return '#dc2626';  // Deep red — extreme heat
    if (t >= 40) return '#ef4444';  // Red — very hot
    if (t >= 35) return '#f97316';  // Orange — hot
    if (t >= 30) return '#eab308';  // Yellow — warm
    if (t >= 25) return '#84cc16';  // Lime — mild
    if (t >= 20) return '#22c55e';  // Green — pleasant
    if (t >= 15) return '#06b6d4';  // Cyan — cool
    return '#3b82f6';                // Blue — cold
}

function aqiColor(v) {
    if (v >= 200) return C.danger;
    if (v >= 150) return C.orange;
    if (v >= 100) return C.warning;
    if (v >= 50) return C.yellow;
    return C.success;
}

function aqiLabel(v) {
    if (v >= 200) return 'Severe';
    if (v >= 150) return 'Very Poor';
    if (v >= 100) return 'Poor';
    if (v >= 50) return 'Moderate';
    return 'Good';
}

function rainColor(mm) {
    if (mm >= 80) return C.danger;
    if (mm >= 50) return C.orange;
    if (mm >= 25) return C.warning;
    if (mm >= 10) return C.yellow;
    return C.success;
}

function uvColor(v) {
    if (v >= 11) return C.danger;
    if (v >= 8) return C.orange;
    if (v >= 6) return C.warning;
    if (v >= 3) return C.yellow;
    return C.success;
}

function windColor(kph) {
    if (kph >= 80) return C.danger;
    if (kph >= 60) return C.orange;
    if (kph >= 40) return C.warning;
    if (kph >= 20) return C.yellow;
    return C.success;
}

function severityBadge(s) {
    const map = {extreme:'b-danger',severe:'b-orange',moderate:'b-yellow',low:'b-success',normal:'b-info'};
    return `<span class="badge ${map[s]||'b-info'}">${s.toUpperCase()}</span>`;
}

function categoryBadge(c) {
    const map = {'Extreme':'b-danger','Very High':'b-orange','High':'b-yellow','Moderate':'b-info','Low':'b-success','Normal':'b-success'};
    return `<span class="badge ${map[c]||'b-info'}">${c}</span>`;
}

function heatIndex(temp, rh) {
    if (temp == null || rh == null) return null;
    const T = temp * 9/5 + 32;
    const R = rh;
    let HI = -42.379 + 2.04901523*T + 10.14333127*R - 0.22475541*T*R
        - 0.00683783*T*T - 0.05481717*R*R + 0.00122874*T*T*R
        + 0.00085282*T*R*R - 0.00000199*T*T*R*R;
    return (HI - 32) * 5/9;
}

function windChill(temp, wind) {
    if (temp == null || wind == null || temp > 10) return null;
    return 13.12 + 0.6215*temp - 11.37*Math.pow(wind,0.16) + 0.3965*temp*Math.pow(wind,0.16);
}

function spi(precip, normal) {
    if (!precip || !normal || normal === 0) return 0;
    return ((precip - normal) / normal) * 2;
}

function showToast(msg, type='info') {
    const toast = document.getElementById('alert-toast');
    const el = document.createElement('div');
    el.className = `alert-banner alert-${type}`;
    el.innerHTML = msg;
    toast.appendChild(el);
    setTimeout(() => el.remove(), 8000);
}

function timeAgo(dateStr) {
    if (!dateStr) return 'Never';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    return Math.floor(diff/86400) + 'd ago';
}

function directionName(deg) {
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round(deg/22.5) % 16];
}
