const AXIS = {
  axisLine: { lineStyle: { color: '#424955' } },
  axisLabel: { color: '#939CAC', fontFamily: 'Poppins, "Segoe UI", sans-serif', fontSize: 11 },
  splitLine: { lineStyle: { color: 'rgba(66,73,85,0.35)' } },
}

export function baseGrid(extra = {}) {
  return { left: 48, right: 18, top: 28, bottom: 28, ...extra }
}

export function baseTooltip() {
  return {
    trigger: 'axis',
    backgroundColor: 'rgba(8, 12, 18, 0.94)',
    borderColor: 'rgba(71, 223, 237, 0.22)',
    textStyle: { color: '#C5CBCE', fontSize: 12 },
  }
}

export function categoryAxis(labels) {
  return { type: 'category', data: labels, boundaryGap: false, ...AXIS }
}

export function valueAxis(name) {
  return { type: 'value', name, nameTextStyle: { color: '#68707E', fontSize: 11 }, ...AXIS }
}

export function forecastOption({ labels, actual, p50, p10, p90, clearSky, markIndex, yName = 'MW' }) {
  const band = p10.map((low, i) => {
    if (low === null || p90[i] === null) return null
    return Number((p90[i] - low).toFixed(2))
  })
  const series = [
    {
      name: 'P10',
      type: 'line',
      data: p10,
      stack: 'band',
      symbol: 'none',
      lineStyle: { opacity: 0 },
      itemStyle: { color: 'rgba(71,223,237,0.2)' },
      emphasis: { disabled: true },
    },
    {
      name: 'P10–P90',
      type: 'line',
      data: band,
      stack: 'band',
      symbol: 'none',
      lineStyle: { opacity: 0 },
      areaStyle: { color: 'rgba(71,223,237,0.2)' },
      itemStyle: { color: 'rgba(71,223,237,0.35)' },
    },
    {
      name: 'P50',
      type: 'line',
      data: p50,
      symbol: 'none',
      lineStyle: { width: 2, type: 'dashed', color: '#9af6ff' },
      itemStyle: { color: '#9af6ff' },
    },
    {
      name: '实际',
      type: 'line',
      data: actual,
      connectNulls: false,
      symbol: 'none',
      lineStyle: { width: 2.5, color: '#47DFED' },
      itemStyle: { color: '#47DFED' },
    },
  ]
  const legend = ['实际', 'P50', 'P10–P90']
  if (clearSky) {
    series.push({
      name: '晴空基准',
      type: 'line',
      data: clearSky,
      symbol: 'none',
      lineStyle: { width: 1, type: 'dotted', color: '#68707E' },
      itemStyle: { color: '#68707E' },
    })
    legend.push('晴空基准')
  }
  return {
    color: ['#47DFED', '#9af6ff', 'rgba(71,223,237,0.35)', '#68707E'],
    tooltip: {
      ...baseTooltip(),
      formatter(items) {
        const rows = [items[0]?.axisValueLabel || '']
        const byName = Object.fromEntries(items.map((item) => [item.seriesName, item]))
        const actual = byName['实际']
        const mid = byName.P50
        if (actual && actual.data !== null && actual.data !== undefined) rows.push(`实际　${Number(actual.data).toFixed(2)} MW`)
        if (mid && mid.data !== null && mid.data !== undefined) rows.push(`P50　${Number(mid.data).toFixed(2)} MW`)
        if (byName.P10?.data !== null && byName.P10?.data !== undefined && byName['P10–P90']?.data !== null) {
          const low = Number(byName.P10.data)
          const high = low + Number(byName['P10–P90'].data)
          rows.push(`P10　${low.toFixed(2)} MW`)
          rows.push(`P90　${high.toFixed(2)} MW`)
        }
        return rows.join('<br/>')
      },
    },
    legend: { data: legend, textStyle: { color: '#939CAC', fontSize: 11 }, top: 0, right: 0 },
    grid: baseGrid({ top: 32 }),
    xAxis: categoryAxis(labels),
    yAxis: valueAxis(yName),
    series,
  }
}

export function withMarkLine(option, markIndex, label) {
  if (markIndex === undefined || markIndex < 0) return option
  const next = { ...option, series: option.series.map((item, idx) => (idx === 2 ? {
    ...item,
    markLine: {
      symbol: 'none',
      label: { formatter: label || '当前', color: '#FFD83C', fontSize: 11 },
      lineStyle: { color: '#FFD83C', type: 'solid' },
      data: [{ xAxis: markIndex }],
    },
  } : item)) }
  delete next.seriesMark
  return next
}

export function loadForecastOption({ labels, actual, p50, low, high, net }) {
  const band = low.map((v, i) => (v === null || high[i] === null ? null : Number((high[i] - v).toFixed(2))))
  return {
    tooltip: baseTooltip(),
    legend: { data: ['实际负荷', 'P50', 'P10–P90', '净负荷'], textStyle: { color: '#939CAC', fontSize: 11 }, top: 0, right: 0 },
    grid: baseGrid({ top: 32 }),
    xAxis: categoryAxis(labels),
    yAxis: valueAxis('MW'),
    series: [
      { name: 'P10', type: 'line', data: low, stack: 'band', symbol: 'none', lineStyle: { opacity: 0 } },
      { name: 'P10–P90', type: 'line', data: band, stack: 'band', symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { color: 'rgba(255,216,60,0.2)' }, itemStyle: { color: 'rgba(255,216,60,0.45)' } },
      { name: 'P50', type: 'line', data: p50, symbol: 'none', lineStyle: { width: 2, type: 'dashed', color: '#ffe98a' }, itemStyle: { color: '#ffe98a' } },
      { name: '实际负荷', type: 'line', data: actual, connectNulls: false, symbol: 'none', lineStyle: { width: 2.5, color: '#FFD83C' }, itemStyle: { color: '#FFD83C' } },
      { name: '净负荷', type: 'line', data: net, symbol: 'none', lineStyle: { width: 1.5, color: '#47DFED' }, itemStyle: { color: '#47DFED' } },
    ],
  }
}

export function planOption(points, visible) {
  const labels = points.map((p) => p.label)
  const show = (key) => visible.includes(key)
  const series = []
  if (show('load')) series.push({ name: '负荷', type: 'line', data: points.map((p) => p.load), symbol: 'none', lineStyle: { width: 2, color: '#FFD83C' }, itemStyle: { color: '#FFD83C' } })
  if (show('pv')) series.push({ name: '光伏', type: 'line', data: points.map((p) => p.pv), symbol: 'none', lineStyle: { width: 2, color: '#47DFED' }, itemStyle: { color: '#47DFED' } })
  if (show('grid')) series.push({ name: '购售电', type: 'line', data: points.map((p) => p.gridExchange), symbol: 'none', lineStyle: { width: 1.5, color: '#939CAC' }, itemStyle: { color: '#939CAC' } })
  if (show('ess')) series.push({ name: '储能', type: 'bar', data: points.map((p) => p.essNet), barWidth: 4, itemStyle: { color: (p) => (p.value >= 0 ? '#00FF79' : '#F8473A') } })
  if (show('soc')) series.push({ name: 'SOC', type: 'line', yAxisIndex: 1, data: points.map((p) => p.soc), symbol: 'none', lineStyle: { width: 1.5, color: '#7dffe0' }, itemStyle: { color: '#7dffe0' } })
  if (show('charge')) series.push({ name: '充电功率', type: 'line', data: points.map((p) => p.chargePower), symbol: 'none', lineStyle: { width: 1.5, color: '#9fb4c4' }, itemStyle: { color: '#9fb4c4' } })
  return {
    tooltip: baseTooltip(),
    legend: { textStyle: { color: '#939CAC', fontSize: 11 }, top: 0, right: 0 },
    grid: baseGrid({ top: 32, right: 46 }),
    xAxis: categoryAxis(labels),
    yAxis: [
      valueAxis('MW'),
      { type: 'value', name: 'SOC %', min: 0, max: 100, nameTextStyle: { color: '#68707E', fontSize: 11 }, ...AXIS },
    ],
    series,
  }
}

export function lineOption({ labels, series, yName = 'MW', y2Name = '' }) {
  const dual = series.some((item) => item.yAxisIndex === 1)
  return {
    tooltip: baseTooltip(),
    legend: { textStyle: { color: '#939CAC', fontSize: 11 }, top: 0, right: 0 },
    grid: baseGrid({ top: 32, right: dual ? 52 : 18 }),
    xAxis: categoryAxis(labels),
    yAxis: dual ? [valueAxis(yName), valueAxis(y2Name)] : valueAxis(yName),
    series: series.map((item) => ({
      type: 'line',
      symbol: 'none',
      connectNulls: false,
      ...item,
      lineStyle: { width: 2, ...(item.lineStyle || {}) },
    })),
  }
}
