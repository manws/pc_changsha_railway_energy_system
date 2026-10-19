// Smart Energy Scheduling Page
import { formatPower } from '../mockData.js';

export function renderSchedule(container, data) {
    const { schedule, overview } = data;

    container.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
                <span class="text-sm font-semibold text-[#C5CBCE]">Smart Energy Scheduling</span>
                <span class="badge badge-normal">${schedule.mode==='SIMULATION'?'Simulation':'Live'}</span>
                <span class="text-xs text-[#68707E]">Plan: ${schedule.planId}</span>
            </div>
            <div class="flex gap-2">
                <button class="btn btn-secondary text-xs"><i class="fa-solid fa-rotate"></i> Recalculate</button>
                <button class="btn btn-primary text-xs" disabled title="Demo mode - execution disabled"><i class="fa-solid fa-play"></i> Execute</button>
            </div>
        </div>
        <div class="grid grid-cols-4 gap-3 mb-4">
            ${kpi('Est. Cost Saving', schedule.summary.estimatedSaving+' 万元', 'vs no-schedule', '#FFD83C')}
            ${kpi('PV Self-use Boost', '+'+schedule.summary.selfUseRateImprovement+'%', 'Est. '+(overview.selfUseRate.value+schedule.summary.selfUseRateImprovement).toFixed(1)+'%', '#00FF79')}
            ${kpi('Peak Shaving', formatPower(schedule.summary.peakShaving), 'Peak reduction', '#47DFED')}
            ${kpi('CO2 Reduction', schedule.summary.co2Reduction+' tons', 'Today estimate', '#939CAC')}
        </div>
        <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="card col-span-2">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-semibold text-[#C5CBCE]">Day-ahead 96-Point Schedule</span>
                    <div class="flex items-center gap-2 text-xs">
                        <span><span class="inline-block w-3 h-3 rounded-sm bg-[#FFD83C] mr-1"></span>PV</span>
                        <span><span class="inline-block w-3 h-3 rounded-sm bg-[#47DFED] mr-1"></span>Load</span>
                        <span><span class="inline-block w-3 h-3 rounded-sm bg-[#00FF79] mr-1"></span>ESS</span>
                        <span><span class="inline-block w-3 h-3 rounded-sm bg-[#939CAC] mr-1"></span>Grid</span>
                    </div>
                </div>
                <div id="scheduleChart" class="chart-container" style="height:300px;"></div>
            </div>
            <div class="card">
                <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">Strategy Explanation</div>
                <div class="space-y-3">
                    ${strategy('00:00-08:00', 'LOW_TARIFF_CHARGE', 'Off-peak Charging', 'Charge ESS to 80% SOC using low night tariffs for daytime peak preparation.', '#00FF79')}
                    ${strategy('08:00-17:00', 'PV_SELF_USE', 'PV Self-consumption', 'PV generation prioritized for园区 load, surplus stored in ESS to maximize green energy utilization.', '#FFD83C')}
                    ${strategy('17:00-20:00', 'PEAK_SHAVING', 'Evening Peak Shaving', 'ESS discharge配合 grid supply to reduce evening peak load and demand charges.', '#47DFED')}
                    ${strategy('20:00-24:00', 'LOW_TARIFF_CHARGE', 'Flat Period Top-up', 'Moderate ESS charging for next day preparation, maintain SOC >= 30%.', '#939CAC')}
                </div>
            </div>
        </div>
        <div class="card">
            <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">Intraday Rolling Corrections</div>
            <div class="space-y-2">
                ${correction('10:15', 'Forecast Deviation', 'Actual PV output 0.3MW below forecast,建议 reduce ESS charging by 0.2MW', 'medium')}
                ${correction('10:00', 'Device Availability', 'ESS-03 temperature elevated,建议 reduce charge/discharge to 0.5MW', 'low')}
                ${correction('09:30', 'EV Demand', 'EV charging load 0.15MW above forecast, grid purchase plan auto-adjusted', 'low')}
            </div>
        </div>
    `;
    setTimeout(() => renderScheduleChart(), 100);
}

function kpi(title, value, sub, color) {
    return `<div class="kpi-card"><div class="text-xs text-[#68707E] mb-1">${title}</div><div class="text-xl font-bold" style="color:${color}">${value}</div><div class="text-xs mt-1 text-[#68707E]">${sub}</div></div>`;
}

function strategy(time, code, title, desc, color) {
    return `<div class="p-3 bg-[#0a0e17] rounded border-l-2" style="border-left-color:${color}">
        <div class="flex items-center justify-between mb-1"><span class="text-xs font-semibold" style="color:${color}">${time}</span><span class="text-xs text-[#68707E]">${code}</span></div>
        <div class="text-sm text-[#C5CBCE] font-semibold mb-1">${title}</div>
        <div class="text-xs text-[#68707E]">${desc}</div>
    </div>`;
}

function correction(time, reason, suggestion, priority) {
    const bm = { high: 'badge-alarm', medium: 'badge-warning', low: 'badge-normal' };
    return `<div class="flex items-center gap-3 p-2 bg-[#0a0e17] rounded text-xs">
        <span class="text-[#68707E] w-12">${time}</span>
        <span class="badge ${bm[priority]}">${reason}</span>
        <span class="text-[#C5CBCE] flex-1">${suggestion}</span>
        <span class="text-[#68707E]">${priority==='high'?'Urgent':priority==='medium'?'Suggested':'Info'}</span>
    </div>`;
}

function renderScheduleChart() {
    const chart = echarts.init(document.getElementById('scheduleChart'));
    const times = []; const pvD = []; const ldD = []; const essD = []; const gridD = [];
    for (let i = 0; i < 96; i++) {
        const h = Math.floor(i/4); const m = (i%4)*15;
        times.push(h+':'+m.toString().padStart(2,'0'));
        let pvF=0, ldF=0;
        if (h<6){pvF=0.02;ldF=0.5;}else if(h<9){pvF=0.15+(h-6)*0.2;ldF=0.7;}else if(h<12){pvF=0.5+(h-9)*0.15;ldF=0.85;}else if(h<14){pvF=0.95;ldF=0.9;}else if(h<17){pvF=0.95-(h-14)*0.2;ldF=0.85;}else if(h<20){pvF=0.35-(h-17)*0.1;ldF=0.75;}else{pvF=0.02;ldF=0.5;}
        const pv = 8.5*pvF; const ld = 12*ldF+Math.random()*0.5;
        const ess = pv>ld?-(pv-ld)*0.7:(ld-pv)*0.4;
        pvD.push(parseFloat(pv.toFixed(2)));
        ldD.push(parseFloat(ld.toFixed(2)));
        essD.push(parseFloat(ess.toFixed(2)));
        gridD.push(parseFloat((ld-pv-ess).toFixed(2)));
    }
    chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['PV', 'Load', 'ESS Plan', 'Grid Exchange'], bottom: 0, textStyle: { color: '#939CAC', fontSize: 10 } },
        grid: { top: 10, right: 50, bottom: 30, left: 50 },
        xAxis: { type: 'category', data: times, axisLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E', fontSize: 9, interval: 7 } },
        yAxis: { type: 'value', name: 'MW', nameTextStyle: { color: '#68707E' }, axisLine: { lineStyle: { color: '#1a2332' } }, splitLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E' } },
        series: [
            { name: 'PV', type: 'line', data: pvD, smooth: true, lineStyle: { color: '#FFD83C', width: 1.5 }, itemStyle: { color: '#FFD83C' }, symbol: 'none' },
            { name: 'Load', type: 'line', data: ldD, smooth: true, lineStyle: { color: '#47DFED', width: 1.5 }, itemStyle: { color: '#47DFED' }, symbol: 'none' },
            { name: 'ESS Plan', type: 'bar', data: essD, itemStyle: { color: (p) => p.value >= 0 ? 'rgba(0,255,121,0.5)' : 'rgba(248,71,58,0.5)' }, barWidth: '80%' },
            { name: 'Grid Exchange', type: 'line', data: gridD, smooth: true, lineStyle: { color: '#939CAC', width: 1, type: 'dotted' }, itemStyle: { color: '#939CAC' }, symbol: 'none' },
        ]
    });
}
