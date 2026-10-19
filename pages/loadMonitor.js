// Load Monitor & Forecast Page
import { formatPower } from '../mockData.js';

export function renderLoadMonitor(container, data) {
    const { loadData } = data;

    container.innerHTML = `
        <div class="grid grid-cols-4 gap-3 mb-4">
            ${kpi('Current Load', formatPower(loadData.totalLoad), 'fa-bolt', '#FFD83C')}
            ${kpi('Month Max Demand', formatPower(loadData.demand.monthMax), 'fa-chart-bar', '#47DFED')}
            ${kpi('Contract Limit', formatPower(loadData.demand.limit), 'fa-file-contract', '#939CAC')}
            ${kpi('Remaining Margin', formatPower(loadData.demand.margin), 'fa-check-circle', '#00FF79')}
        </div>
        <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="card col-span-2">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-semibold text-[#C5CBCE]">Load Curve</span>
                    <div class="flex gap-2">
                        <button class="tab-item active">Total</button><button class="tab-item">Net</button><button class="tab-item">Breakdown</button>
                    </div>
                </div>
                <div id="loadCurveChart" class="chart-container" style="height:260px;"></div>
            </div>
            <div class="card">
                <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">Load Breakdown</div>
                <div id="loadPieChart" class="chart-container" style="height:260px;"></div>
            </div>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="card">
                <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">Load Details</div>
                <table class="data-table">
                    <thead><tr><th>Category</th><th>Power(MW)</th><th>Share</th><th>Source</th></tr></thead>
                    <tbody>${loadData.subLoads.map(s => `<tr>
                        <td>${s.name}</td><td class="font-semibold">${s.value}</td>
                        <td><div class="flex items-center gap-2"><div class="progress-bar flex-1"><div class="progress-fill primary" style="width:${(s.value/loadData.totalLoad*100).toFixed(0)}%"></div></div><span class="text-xs text-[#68707E]">${(s.value/loadData.totalLoad*100).toFixed(1)}%</span></div></td>
                        <td><span class="badge badge-${s.source==='Measured'?'normal':'warning'}">${s.source}</span></td>
                    </tr>`).join('')}</tbody>
                </table>
            </div>
            <div class="card">
                <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">Demand & Power Quality</div>
                <div class="grid grid-cols-2 gap-3">
                    ${qcard('Current Demand', formatPower(loadData.demand.current), 'normal')}
                    ${qcard('Power Factor', loadData.powerFactor.toFixed(2), loadData.powerFactor>=0.9?'normal':'warning')}
                    ${qcard('Frequency', loadData.frequency.toFixed(2)+' Hz', 'normal')}
                    ${qcard('Over-limit Risk', 'None', 'normal')}
                </div>
                <div class="mt-4"><div class="text-xs text-[#68707E] mb-2">Demand Trend (15min rolling)</div><div id="demandTrendChart" class="chart-container" style="height:150px;"></div></div>
            </div>
        </div>
        <div class="card">
            <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">4-Hour Load Forecast</div>
            <div class="grid grid-cols-4 gap-3">
                ${fitem('Peak Forecast', '10.2 MW', '14:30', '#FFD83C')}
                ${fitem('Adjustable Load', '2.15 MW', 'EV+HVAC', '#47DFED')}
                ${fitem('Over-limit Risk', 'Low', 'Safe next 4h', '#00FF79')}
                ${fitem('Model Status', 'Normal', 'MAE: 0.28MW', '#939CAC')}
            </div>
        </div>
    `;
    setTimeout(() => {
        renderLoadCurve(); renderLoadPie(data); renderDemandTrend();
    }, 100);
}

function kpi(title, value, icon, color) {
    return `<div class="kpi-card"><div class="flex items-center justify-between mb-1"><span class="text-xs text-[#68707E]">${title}</span><i class="fa-solid ${icon}" style="color:${color}"></i></div><div class="text-xl font-bold" style="color:${color}">${value}</div></div>`;
}

function qcard(title, value, status) {
    const c = status==='normal'?'text-[#00FF79]':'text-[#FFD83C]';
    return `<div class="p-3 bg-[#0a0e17] rounded text-center"><div class="text-xs text-[#68707E] mb-1">${title}</div><div class="text-lg font-bold ${c}">${value}</div></div>`;
}

function fitem(title, value, sub, color) {
    return `<div class="p-3 bg-[#0a0e17] rounded"><div class="text-xs text-[#68707E] mb-1">${title}</div><div class="text-lg font-bold" style="color:${color}">${value}</div><div class="text-xs text-[#68707E] mt-1">${sub}</div></div>`;
}

function renderLoadCurve() {
    const chart = echarts.init(document.getElementById('loadCurveChart'));
    const hours = []; const ld = [];
    for (let i = 0; i < 24; i++) {
        hours.push(i+':00');
        const f = i<6?0.5:i<9?0.7:i<12?0.85:i<14?0.9:i<17?0.85:i<20?0.75:0.5;
        ld.push(parseFloat((12*f+Math.random()*1.5).toFixed(2)));
    }
    chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { top: 10, right: 20, bottom: 20, left: 50 },
        xAxis: { type: 'category', data: hours, axisLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E', fontSize: 10 } },
        yAxis: { type: 'value', name: 'MW', nameTextStyle: { color: '#68707E' }, axisLine: { lineStyle: { color: '#1a2332' } }, splitLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E' } },
        series: [{
            type: 'line', data: ld, smooth: true, lineStyle: { color: '#47DFED', width: 2 }, itemStyle: { color: '#47DFED' },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(71,223,237,0.3)' }, { offset: 1, color: 'rgba(71,223,237,0.02)' }] } },
            symbol: 'none',
            markLine: { silent: true, symbol: 'none', lineStyle: { color: '#F8473A', type: 'dashed' }, data: [{ yAxis: 15, label: { formatter: 'Limit', color: '#F8473A', fontSize: 10 } }] }
        }]
    });
}

function renderLoadPie(data) {
    const chart = echarts.init(document.getElementById('loadPieChart'));
    chart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie', radius: ['50%', '75%'], center: ['50%', '50%'],
            data: data.loadData.subLoads.map(s => ({ name: s.name, value: s.value })),
            label: { color: '#939CAC', fontSize: 10 },
            itemStyle: { borderColor: '#0d1117', borderWidth: 2 },
            color: ['#47DFED', '#00FF79', '#FFD83C', '#F8473A', '#939CAC', '#68707E', '#424955']
        }]
    });
}

function renderDemandTrend() {
    const chart = echarts.init(document.getElementById('demandTrendChart'));
    const times = []; const d = [];
    for (let i = 0; i < 20; i++) {
        times.push((10+Math.floor(i/4))+':'+((i%4)*15).toString().padStart(2,'0'));
        d.push(parseFloat((8.5+Math.random()*2.5).toFixed(2)));
    }
    chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { top: 5, right: 10, bottom: 20, left: 45 },
        xAxis: { type: 'category', data: times, axisLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E', fontSize: 9, interval: 3 } },
        yAxis: { type: 'value', name: 'MW', nameTextStyle: { color: '#68707E', fontSize: 10 }, axisLine: { lineStyle: { color: '#1a2332' } }, splitLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E', fontSize: 10 } },
        series: [{
            type: 'line', data: d, smooth: true, lineStyle: { color: '#FFD83C', width: 1.5 }, itemStyle: { color: '#FFD83C' },
            symbol: 'none', areaStyle: { color: 'rgba(255,216,60,0.1)' },
            markLine: { silent: true, symbol: 'none', lineStyle: { color: '#F8473A', type: 'dashed' }, data: [{ yAxis: 15, label: { formatter: 'Limit', fontSize: 9 } }] }
        }]
    });
}
