/* ─── Chart.js Helpers ────────────────────────────────────── */
Chart.defaults.color = '#8b949e';
Chart.defaults.borderColor = '#30363d';
Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
Chart.defaults.font.size = 11;
Chart.defaults.plugins.legend.labels.boxWidth = 10;
Chart.defaults.plugins.legend.labels.padding = 12;
Chart.defaults.animation.duration = 600;

const chartInstances = {};
function destroyChart(id) { if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; } }

function makeLine(ctx, labels, datasets, opts={}) {
    destroyChart(ctx.canvas.id);
    chartInstances[ctx.canvas.id] = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: datasets.map(d => ({tension:.3,pointRadius:1,borderWidth:2,...d})) },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:datasets.length>1}}, scales:{x:{grid:{display:false}},y:{beginAtZero:opts.beginAtZero!==false}}, ...opts }
    });
    return chartInstances[ctx.canvas.id];
}

function makeBar(ctx, labels, data, colors, opts={}) {
    destroyChart(ctx.canvas.id);
    chartInstances[ctx.canvas.id] = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{data, backgroundColor:colors||C.accent,borderRadius:4,barThickness:opts.barThickness||16}] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}},y:{beginAtZero:true}}, ...opts }
    });
    return chartInstances[ctx.canvas.id];
}

function makeHBar(ctx, labels, data, colors, opts={}) {
    destroyChart(ctx.canvas.id);
    chartInstances[ctx.canvas.id] = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{data, backgroundColor:colors||C.accent,borderRadius:4}] },
        options: { indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{grid:{display:false}},x:{beginAtZero:true}}, ...opts }
    });
    return chartInstances[ctx.canvas.id];
}

function makeDoughnut(ctx, labels, data, colors) {
    destroyChart(ctx.canvas.id);
    chartInstances[ctx.canvas.id] = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{data, backgroundColor:colors,borderWidth:0}] },
        options: { responsive:true, maintainAspectRatio:false, cutout:'65%', plugins:{legend:{position:'bottom'}} }
    });
    return chartInstances[ctx.canvas.id];
}

function makeArea(ctx, labels, datasets, opts={}) {
    destroyChart(ctx.canvas.id);
    datasets = datasets.map(d => ({...d, fill:true, backgroundColor:d.backgroundColor||'rgba(88,166,255,.1)', tension:.3, pointRadius:1, borderWidth:2}));
    chartInstances[ctx.canvas.id] = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:datasets.length>1}}, scales:{x:{grid:{display:false}},y:{beginAtZero:true}}, ...opts }
    });
    return chartInstances[ctx.canvas.id];
}

function makeRadar(ctx, labels, datasets, opts={}) {
    destroyChart(ctx.canvas.id);
    chartInstances[ctx.canvas.id] = new Chart(ctx, {
        type: 'radar',
        data: { labels, datasets },
        options: { responsive:true, maintainAspectRatio:false, scales:{r:{grid:{color:'#30363d'},pointLabels:{color:'#8b949e'}}}, ...opts }
    });
    return chartInstances[ctx.canvas.id];
}

function makeScatter(ctx, points, opts={}) {
    destroyChart(ctx.canvas.id);
    chartInstances[ctx.canvas.id] = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: [{data:points, backgroundColor:C.accent+'88', pointRadius:4}] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, ...opts }
    });
    return chartInstances[ctx.canvas.id];
}
