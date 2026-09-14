// ═══ Floating Transparent Alert Toasts — Bottom Right ═══
let _alertToastTimer = null;

function showFloatingAlerts() {
    const container = document.getElementById('alert-toast');
    if (!container || !alertsData || !alertsData.length) return;
    
    // Cancel any previous auto-dismiss
    if (_alertToastTimer) { clearTimeout(_alertToastTimer); _alertToastTimer = null; }
    
    container.innerHTML = '';
    
    // Get the latest/most severe alerts
    const alerts = alertsData.slice(0, 3);
    if (!alerts.length) return;
    
    alerts.forEach((a, i) => {
        const sev = (a.severity || 'moderate').toLowerCase();
        const icon = a.icon || (sev === 'extreme' ? '🔴' : sev === 'severe' ? '🟠' : '🟡');
        const title = (a.type || 'Alert').replace(/_/g, ' ').toUpperCase();
        const msg = (a.district || '') + (a.value != null ? ' — ' + a.value : '');
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        const el = document.createElement('div');
        el.className = 'alert-toast-item';
        el.style.animationDelay = (i * 150) + 'ms';
        el.innerHTML = '<div class="alert-toast-icon ' + sev + '">' + icon + '</div>' +
            '<div class="alert-toast-body">' +
                '<div class="alert-toast-title ' + sev + '">' + title + '</div>' +
                '<div class="alert-toast-msg">' + msg + '</div>' +
            '</div>' +
            '<span class="alert-toast-time">' + timeStr + '</span>' +
            '<button class="alert-toast-close" onclick="dismissAlertToast(this)" title="Dismiss">×</button>';
        container.appendChild(el);
    });
    
    // Auto-dismiss after 30 seconds (gives user time to read)
    _alertToastTimer = setTimeout(function() {
        _alertToastTimer = null;
        if (!container) return;
        var items = container.querySelectorAll('.alert-toast-item');
        items.forEach(function(item, idx) {
            setTimeout(function() {
                item.classList.add('dismissing');
                setTimeout(function() { item.remove(); }, 350);
            }, idx * 200);
        });
    }, 30000);
}

function dismissAlertToast(btn) {
    var item = btn.closest('.alert-toast-item');
    if (item) {
        item.classList.add('dismissing');
        setTimeout(function() { item.remove(); }, 350);
    }
}
