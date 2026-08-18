/* ─── Time-Series Chart Helper ──────────────────────────────── */
let _tsData = null;

async function loadTimeSeriesData() {
    if (_tsData) return _tsData;
    try {
        const res = await fetch('/api/charts/timeseries');
        _tsData = await res.json();
        return _tsData;
    } catch(e) { console.error('TS data error:', e); return null; }
}

/* Create gradient fill for a dataset line */
function makeGradient(ctx, color, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h || 280);
    g.addColorStop(0, color + '40');
    g.addColorStop(0.5, color + '15');
    g.addColorStop(1, color + '02');
    return g;
}

/* Modern chart defaults */
const _modernDefaults = {
    tension: 0.45,
    pointRadius: 3,
    pointHoverRadius: 6,
    pointBorderWidth: 2,
    borderWidth: 2.5,
};

function renderTimeSeriesChart(canvasId, data, period, title, unit, colors) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    
    const periodData = data[period] || {};
    const labels = data.labels?.[period] || [];
    const districtNames = Object.keys(periodData).slice(0, 5);
    
    const datasets = districtNames.map((name, i) => {
        const color = colors[i % colors.length];
        const gradient = makeGradient(ctx, color, 280);
        return {
            label: name,
            data: periodData[name] || [],
            borderColor: color,
            backgroundColor: gradient,
            borderWidth: _modernDefaults.borderWidth,
            pointRadius: period === 'daily' ? 2 : _modernDefaults.pointRadius,
            pointHoverRadius: _modernDefaults.pointHoverRadius,
            pointBackgroundColor: '#0d1030',
            pointBorderColor: color,
            pointBorderWidth: _modernDefaults.pointBorderWidth,
            pointHoverBackgroundColor: color,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
            tension: _modernDefaults.tension,
            fill: true,
        };
    });
    
    // Destroy existing chart if any
    const existing = Chart.getChart(ctx.canvas);
    if (existing) existing.destroy();
    
    new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#b0b8d0',
                        font: { size: 10, family: "'Inter', 'Segoe UI', sans-serif" },
                        boxWidth: 20,
                        boxHeight: 3,
                        padding: 14,
                        usePointStyle: false,
                    }
                },
                title: {
                    display: true,
                    text: title,
                    color: '#e2e8f0',
                    font: { size: 13, weight: '600', family: "'Inter', 'Segoe UI', sans-serif" },
                    padding: { bottom: 12 }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 12, 30, 0.92)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#b0b8d0',
                    borderColor: 'rgba(100, 80, 255, 0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 10,
                    titleFont: { size: 11, weight: '600' },
                    bodyFont: { size: 11 },
                    displayColors: true,
                    boxWidth: 8,
                    boxHeight: 8,
                    boxPadding: 4,
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#64748b',
                        font: { size: 9 },
                        maxRotation: 45,
                    },
                    grid: {
                        color: 'rgba(100, 80, 255, 0.06)',
                        drawBorder: false,
                    },
                    border: { display: false }
                },
                y: {
                    ticks: {
                        color: '#64748b',
                        font: { size: 10 },
                        callback: v => v + unit,
                    },
                    grid: {
                        color: 'rgba(100, 80, 255, 0.06)',
                        drawBorder: false,
                    },
                    border: { display: false }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeOutQuart',
            }
        }
    });
}

function createTimePeriodButtons(containerId, chartType) {
    return `
        <div style="display:flex;gap:6px;margin-bottom:12px">
            <button onclick="switchTimePeriod('${chartType}','daily','${containerId}')" class="ts-btn active" data-period="daily" style="padding:5px 12px;border-radius:16px;border:1px solid rgba(100,80,255,0.3);background:rgba(100,80,255,0.15);color:#b48aff;cursor:pointer;font-size:11px;font-weight:600">📅 Today</button>
            <button onclick="switchTimePeriod('${chartType}','weekly','${containerId}')" class="ts-btn" data-period="weekly" style="padding:5px 12px;border-radius:16px;border:1px solid rgba(100,116,139,0.2);background:transparent;color:#94a3b8;cursor:pointer;font-size:11px">📅 This Week</button>
            <button onclick="switchTimePeriod('${chartType}','monthly','${containerId}')" class="ts-btn" data-period="monthly" style="padding:5px 12px;border-radius:16px;border:1px solid rgba(100,116,139,0.2);background:transparent;color:#94a3b8;cursor:pointer;font-size:11px">📅 This Month</button>
        </div>`;
}

async function switchTimePeriod(chartType, period, containerId) {
    // Update button states
    const container = document.getElementById(containerId);
    if (container) {
        container.querySelectorAll('.ts-btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = 'transparent';
            b.style.color = '#94a3b8';
            b.style.borderColor = 'rgba(100,116,139,0.2)';
        });
        const activeBtn = container.querySelector(`[data-period="${period}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = 'rgba(100,80,255,0.15)';
            activeBtn.style.color = '#b48aff';
            activeBtn.style.borderColor = 'rgba(100,80,255,0.3)';
        }
    }
    
    const data = await loadTimeSeriesData();
    if (!data) return;
    
    /* Elegant violet-blue palette */
    const colors = {
        temp: ['#b48aff','#818cf8','#60a5fa','#38bdf8','#22d3ee'],
        rain: ['#a78bfa','#8b5cf6','#7c3aed','#6366f1','#818cf8'],
        aqi:  ['#f472b6','#c084fc','#a78bfa','#818cf8','#60a5fa'],
    };
    
    if (chartType === 'temperature') {
        renderTimeSeriesChart('ts-temp-chart', data.temperature, period, 'Temperature Trends', '°C', colors.temp);
    } else if (chartType === 'rainfall') {
        renderTimeSeriesChart('ts-rain-chart', data.rainfall, period, 'Rainfall Patterns', 'mm', colors.rain);
    } else if (chartType === 'aqi') {
        renderTimeSeriesChart('ts-aqi-chart', data.aqi, period, 'Air Quality Index', ' AQI', colors.aqi);
    }
}

async function initTimeSeriesCharts() {
    const data = await loadTimeSeriesData();
    if (!data) return;
    
    /* Elegant violet-blue palette */
    const colors = {
        temp: ['#b48aff','#818cf8','#60a5fa','#38bdf8','#22d3ee'],
        rain: ['#a78bfa','#8b5cf6','#7c3aed','#6366f1','#818cf8'],
        aqi:  ['#f472b6','#c084fc','#a78bfa','#818cf8','#60a5fa'],
    };
    
    renderTimeSeriesChart('ts-temp-chart', data.temperature, 'daily', 'Temperature Trends', '°C', colors.temp);
    renderTimeSeriesChart('ts-rain-chart', data.rainfall, 'daily', 'Rainfall Patterns', 'mm', colors.rain);
    renderTimeSeriesChart('ts-aqi-chart', data.aqi, 'daily', 'Air Quality Index', ' AQI', colors.aqi);
}
