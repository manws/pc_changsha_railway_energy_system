// Energy Overview Page (OV-01)
import { formatPower, formatPercent } from '../mockData.js';

export function renderOverview(container, data) {
    const { overview, energyFlow, alarms, weather } = data;

    container.innerHTML = `
        <div class="grid grid-cols-6 gap-3 mb-4">
            ${kpiCard('PV Generation', formatPower(overview.pvPower.value), overview.pvPower.trend, 'fa-sun', '#47DFED')}
            ${kpiCard('Total Load', formatPower(overview.loadPower.value), overview.loadPower.trend, 'fa-bolt', '#FFD83C')}
            ${kpiCard('ESS Power', formatPower(Math.abs(overview.essPower.value)), overview.essPower.trend, 'fa-battery-full', '#00FF79')}
            ${kpiCard('ESS SOC', formatPercent(overview.essSoc.value), '', 'fa-battery-half', '#47DFED')}
            ${kpiCard('Grid Exchange', formatPower(overview.gridPower.value), overview.gridPower.trend, 'fa-plug', '#939CAC')}
            ${kpiCard('Today Saving', overview.todaySaving.value + ' ' + overview.todaySaving.unit, '', 'fa-coins', '#FFD83C')}
        </div>

        <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="card col-span-2">
                <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">Real-time Energy Flow</div>
                <div id="energyFlowChart" class="chart-container" style="height:280px;"></div>
            </div>
            <div class="card">
                <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">Weather & Environment</div>
                <div class="flex flex-col items-center mb-4">
                    <i class="fa-solid fa-cloud-sun text-5xl text-[#FFD83C] mb-2"></i>
                    <div class="text-2xl font-bold">${weather.current.temp}C</div>
                    <div class="text-xs text-[#939CAC]">${weather.current.condition}</div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    ${envItem('Irradiance', weather.current.irradiance, 'W/m2', '#47DFED')}
                    ${envItem('Humidity', weather.current.humidity, '%', '#47DFED')}
                    ${envItem('Wind Speed', weather.current.windSpeed, 'm/s', '#47DFED')}
                    ${envItem('Self-use Rate', overview.selfUseRate.value + '%', overview.selfUseRate.trend, '#00FF79')}
                </div>
            </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
            <div class="card col-span-2">
                <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">Today Power Curve</div>
                <div id="powerCurveChart" class="chart-container" style="height:250px;"></div>
            </div>
            <div class="card">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-semibold text-[#C5CBCE]">Latest Alarms</span>
                    <span class="text-xs text-[#68707E]">Total ${alarms.length}</span>
                </div>
                <div class="space-y-2">
                    ${alarms.map(a => `
                        <div class="flex items-center justify-between p-2 bg-[#0a0e17] rounded text-xs">
                            <div class="flex items-center gap-2">
                                <span class="badge badge-${a.level === 'alarm' ? 'alarm' : a.level === 'warning' ? 'warning' : 'normal'}">${a.level.toUpperCase()}</span>
                                <span class="text-[#C5CBCE]">${a.content}</span>
                            </div>
                            <span class="text-[#68707E]">${a.time.slice(11, 16)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        renderEnergyFlowChart(data);
        renderPowerCurveChart();
    }, 100);
}

function kpiCard(title, value, trend, icon, color) {
    return `<div class="kpi-card">
        <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-[#68707E]">${title}</span>
            <i class="fa-solid ${icon}" style="color:${color}"></i>
        </div>
        <div class="text-xl font-bold" style="color:${color}">${value}</div>
        ${trend ? `<div class="text-xs mt-1" style="color:${color}">${trend}</div>` : '<div class="text-xs mt-1 text-[#68707E]">&nbsp;</div>'}
    </div>`;
}

function envItem(label, value, unit, color) {
    return `<div class="text-center p-2 bg-[#0a0e17] rounded">
        <div class="text-xs text-[#68707E]">${label}</div>
        <div class="text-lg font-bold" style="color:${color}">${value}</div>
        <div class="text-xs text-[#68707E]">${unit}</div>
    </div>`;
}

function renderEnergyFlowChart(data) {
    const chart = echarts.init(document.getElementById('energyFlowChart'));
    const ef = data.energyFlow;
    chart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
            type: 'sankey', layout: 'none', emphasis: { focus: 'adjacency' }, nodeAlign: 'left',
            data: [
                { name: 'PV\n' + ef.pv.gen + 'MW' },
                { name: 'ESS\nSOC ' + ef.ess.soc + '%' },
                { name: 'Grid' },
                { name: 'Load\n' + ef.load.total + 'MW' },
                { name: 'To Grid\n' + ef.pv.toGrid + 'MW' },
            ],
            links: [
                { source: 'PV\n' + ef.pv.gen + 'MW', target: 'Load\n' + ef.load.total + 'MW', value: ef.pv.selfUse },
                { source: 'PV\n' + ef.pv.gen + 'MW', target: 'ESS\nSOC ' + ef.ess.soc + '%', value: ef.pv.toEss },
                { source: 'PV\n' + ef.pv.gen + 'MW', target: 'To Grid\n' + ef.pv.toGrid + 'MW', value: ef.pv.toGrid },
                { source: 'ESS\nSOC ' + ef.ess.soc + '%', target: 'Load\n' + ef.load.total + 'MW', value: ef.ess.discharge },
                { source: 'Grid', target: 'Load\n' + ef.load.total + 'MW', value: ef.grid.buy },
            ],
            lineStyle: { color: 'gradient', curveness: 0.5 },
            label: { color: '#C5CBCE', fontSize: 11 },
            itemStyle: { borderColor: '#1a2332', borderWidth: 1 },
            color: ['#47DFED', '#00FF79', '#939CAC', '#FFD83C', '#68707E']
        }]
    });
}

function renderPowerCurveChart() {
    const chart = echarts.init(document.getElementById('powerCurveChart'));
    const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
    const pvData = [0.2, 2.5, 4.8, 6.8, 6.5, 4.2, 1.0];
    const loadData = [4.5, 6.8, 8.5, 9.3, 9.0, 8.2, 6.5];
    const essData = [-1.5, -1.2, 0, 0, 0.8, 1.5, 1.0];
    chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['PV', 'Load', 'ESS'], bottom: 0, textStyle: { color: '#939CAC', fontSize: 11 } },
        grid: { top: 10, right: 20, bottom: 30, left: 50 },
        xAxis: { type: 'category', data: hours, axisLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E', fontSize: 10 } },
        yAxis: { type: 'value', name: 'MW', nameTextStyle: { color: '#68707E' }, axisLine: { lineStyle: { color: '#1a2332' } }, splitLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E' } },
        series: [
            { name: 'PV', type: 'line', data: pvData, smooth: true, lineStyle: { color: '#FFD83C', width: 2 }, itemStyle: { color: '#FFD83C' }, symbol: 'circle', symbolSize: 4 },
            { name: 'Load', type: 'line', data: loadData, smooth: true, lineStyle: { color: '#47DFED', width: 2 }, itemStyle: { color: '#47DFED' }, symbol: 'circle', symbolSize: 4 },
            { name: 'ESS', type: 'line', data: essData, smooth: true, lineStyle: { color: '#00FF79', width: 2, type: 'dashed' }, itemStyle: { color: '#00FF79' }, symbol: 'diamond', symbolSize: 4 },
        ]
    });
}
