// ═══ Floating Transparent Alert Toasts — Bottom Right ═══
let _alertToastTimer = null;

function showFloatingAlerts() {
    const container = document.getElementById('alert-toast');
    if (!container || !alertsData || !alertsData.length) return;
    
    // Cancel any previous auto-dismiss
    if (_alertToastTimer) { clearTimeout(_alertToastTimer); _alertToastTimer = null; }
    
    container.innerHTML = '';
    
    const critical = alertsData.filter(a => 
        a.severity === 'severe' || a.severity === 'high' || a.severity === 'critical'
    );
    if (!critical.length) return;
    
    critical.slice(0, 5).forEach((a, i) => {
        const sev = (a.severity || 'moderate').toLowerCase();
        const icon = a.icon || (sev === 'severe' ? '🔴' : sev === 'high' ? '🟠' : '🟡');
        const title = (a.type || 'Alert').replace(/_/g, ' ').toUpperCase();
        const msg = (a.district || '') + (a.value != null ? ' — ' + a.value : '');
        
        const el = document.createElement('div');
        el.className = 'alert-toast-item';
        el.style.animationDelay = (i * 150) + 'ms';
        el.innerHTML = '<div class="alert-toast-icon ' + sev + '">' + icon + '</div>' +
            '<div class="alert-toast-body">' +
                '<div class="alert-toast-title ' + sev + '">' + title + '</div>' +
                '<div class="alert-toast-msg">' + msg + '</div>' +
            '</div>' +
            '<button class="alert-toast-close" onclick="dismissAlertToast(this)" title="Dismiss">×</button>';
        container.appendChild(el);
    });
    
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
    }, 20000);
}

function dismissAlertToast(btn) {
    var item = btn.closest('.alert-toast-item');
    if (item) {
        item.classList.add('dismissing');
        setTimeout(function() { item.remove(); }, 350);
    }
}
