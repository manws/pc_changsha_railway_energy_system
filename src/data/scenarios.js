// 四个固定场景共用同一天、同一套功率平衡。页面只读这里的结果。
// 负荷 = 光伏直供 + 储能放电 + 电网购电
// 光伏 = 光伏直供 + 储能充电 + 上网 + 弃光
// 储能功率正值充电、负值放电；电网交换正值购电、负值上网。

const DATE = '2026-10-14'
const PV_CAPACITY = 6.58
const ESS_CAPACITY = 5
const ESS_POWER = 2
const SOC_MIN = 15
const SOC_MAX = 90
const DEMAND_LIMIT = 8
const EXPORT_PRICE = 0.35
const EMISSION_FACTOR = 0.5703

export const SCENE_LIST = [
  { id: 'sunny', name: '晴天高消纳', nowIndex: 48 },
  { id: 'cloudy', name: '多云预测偏差', nowIndex: 57 },
  { id: 'peak', name: '晚高峰削峰', nowIndex: 76 },
  { id: 'alarm', name: '设备通讯告警', nowIndex: 44 },
]

const INVERTER_CATALOG = [
  { id: 'INV-001', name: '屋顶A-1#逆变器', zone: '屋顶A', model: 'SUN2000-100KTL', ratedKw: 1000, efficiency: 98.2, temp: 41.2, freq: 50.02 },
  { id: 'INV-002', name: '屋顶A-2#逆变器', zone: '屋顶A', model: 'SUN2000-80KTL', ratedKw: 800, efficiency: 97.9, temp: 42.0, freq: 50.01 },
  { id: 'INV-003', name: '屋顶B-1#逆变器', zone: '屋顶B', model: 'SUN2000-80KTL', ratedKw: 800, efficiency: 98.0, temp: 43.4, freq: 50.02 },
  { id: 'INV-004', name: '屋顶B-2#逆变器', zone: '屋顶B', model: 'SUN2000-70KTL', ratedKw: 700, efficiency: 97.6, temp: 42.8, freq: 49.98 },
  { id: 'INV-005', name: '车棚C-1#逆变器', zone: '车棚C', model: 'SUN2000-50KTL', ratedKw: 500, efficiency: 98.1, temp: 40.6, freq: 50.00 },
  { id: 'INV-006', name: '车棚C-2#逆变器', zone: '车棚C', model: 'SUN2000-36KTL', ratedKw: 380, efficiency: 97.4, temp: 44.1, freq: 50.03 },
  { id: 'INV-007', name: '地面D-1#逆变器', zone: '地面D', model: 'SUN2000-80KTL', ratedKw: 800, efficiency: 98.4, temp: 39.8, freq: 50.01 },
  { id: 'INV-008', name: '地面D-2#逆变器', zone: '地面D', model: 'SUN2000-60KTL', ratedKw: 600, efficiency: 98.0, temp: 40.4, freq: 50.02 },
  { id: 'INV-009', name: '仓储E-1#逆变器', zone: '仓储E', model: 'SUN2000-60KTL', ratedKw: 600, efficiency: 97.8, temp: 41.6, freq: 49.99 },
  { id: 'INV-010', name: '仓储E-2#逆变器', zone: '仓储E', model: 'SUN2000-40KTL', ratedKw: 400, efficiency: 97.5, temp: 42.2, freq: 50.00 },
]

export const CATEGORY_META = [
  { key: '装卸', source: '实测', color: '#47DFED' },
  { key: '冷链', source: '实测', color: '#00FF79' },
  { key: '充电', source: '实测', color: '#7dffe0' },
  { key: '照明办公', source: '实测', color: '#FFD83C' },
  { key: '铁路作业', source: '估算', color: '#9fb4c4' },
  { key: '其他', source: '估算', color: '#939CAC' },
]

function round(n, d = 2) {
  const p = 10 ** d
  return Math.round((n + Number.EPSILON) * p) / p
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

export function tariff(hour) {
  if (hour < 8) return 0.36
  if (hour < 10) return 0.72
  if (hour < 12) return 1.2
  if (hour < 14) return 0.72
  if (hour < 19) return 1.2
  return 0.72
}

function indexToParts(i) {
  const h = Math.floor(i / 4)
  const m = (i % 4) * 15
  return { h, m, hour: h + m / 60 }
}

function indexToIso(i) {
  const { h, m } = indexToParts(i)
  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  return `${DATE}T${hh}:${mm}:00+08:00`
}

function labelOf(i) {
  const { h, m } = indexToParts(i)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function solarShape(hour) {
  if (hour < 6 || hour > 18.5) return 0
  const x = (hour - 6) / 12.5
  return Math.sin(Math.PI * x) ** 1.2
}

function cloudFactor(hour) {
  let cloud = 0.58 + 0.16 * Math.sin(hour * 2.15)
  if (hour > 13.25 && hour < 14.75) cloud = 0.26
  return clamp(cloud, 0.2, 0.95)
}

function pvAt(hour, sceneId) {
  const shape = solarShape(hour)
  const avail = sceneId === 'alarm' ? (6580 - 380) / 6580 : 1
  let factor = 0.72
  if (sceneId === 'cloudy') factor = 0.72 * cloudFactor(hour)
  if (sceneId === 'peak') factor = 0.68
  return PV_CAPACITY * shape * factor * avail
}

function loadAt(hour, sceneId) {
  if (hour < 6) return 2.15
  if (hour < 8) return 2.15 + 1.05 * ((hour - 6) / 2)
  if (hour < 17) return 3.15 + 0.22 * Math.sin(((hour - 8) / 9) * Math.PI)
  if (hour < 21) {
    const peak = sceneId === 'peak' ? 7.55 : 6.15
    return 3.25 + (peak - 3.25) * Math.sin(((hour - 17) / 4) * Math.PI)
  }
  return 3.25 + (2.2 - 3.25) * Math.min(1, (hour - 21) / 2)
}

function ghiAt(hour, sceneId) {
  const shape = solarShape(hour)
  if (shape <= 0) return 0
  if (sceneId === 'cloudy') return 1000 * shape * 0.45
  return 1000 * shape * 0.82
}

function categoryShares(hour) {
  if (hour >= 17 && hour < 21) {
    return { 装卸: 0.2, 冷链: 0.16, 充电: 0.2, 照明办公: 0.08, 铁路作业: 0.22, 其他: 0.14 }
  }
  if (hour >= 8 && hour < 17) {
    return { 装卸: 0.24, 冷链: 0.18, 充电: 0.12, 照明办公: 0.1, 铁路作业: 0.16, 其他: 0.2 }
  }
  return { 装卸: 0.16, 冷链: 0.22, 充电: 0.08, 照明办公: 0.14, 铁路作业: 0.12, 其他: 0.28 }
}

function splitLoad(load, hour) {
  const shares = categoryShares(hour)
  const keys = Object.keys(shares)
  const out = {}
  let used = 0
  keys.forEach((key, idx) => {
    if (idx === keys.length - 1) out[key] = round(load - used, 2)
    else {
      out[key] = round(load * shares[key], 2)
      used = round(used + out[key], 2)
    }
  })
  return out
}

function dischargeTarget(hour, mode) {
  if (mode === 'baseline' || hour < 18 || hour >= 21) return 0
  if (mode === 'demand') return 1.6
  if (mode === 'absorb') return 0.4
  return 1.15
}

function chargeRatio(mode) {
  if (mode === 'baseline') return 0
  if (mode === 'absorb') return 1
  if (mode === 'demand') return 0.45
  return 0.72
}

function reconcile(pv, load, essCharge, essDischarge) {
  pv = round(pv, 2)
  load = round(load, 2)
  essCharge = round(Math.max(0, essCharge), 2)
  essDischarge = round(Math.max(0, essDischarge), 2)
  let pvSelf = round(pv - essCharge, 2)
  const supplied = round(pvSelf + essDischarge, 2)
  let gridBuy = 0
  let gridSell = 0
  const curtail = 0
  if (supplied >= load) {
    gridSell = round(supplied - load, 2)
    pvSelf = round(pvSelf - gridSell, 2)
  } else {
    gridBuy = round(load - supplied, 2)
  }
  const pvDrift = round(pv - (pvSelf + essCharge + gridSell + curtail), 2)
  if (pvDrift !== 0) gridSell = round(Math.max(0, gridSell + pvDrift), 2)
  const loadDrift = round(load - (pvSelf + essDischarge + gridBuy), 2)
  if (loadDrift !== 0) gridBuy = round(Math.max(0, gridBuy + loadDrift), 2)
  return {
    pv,
    load,
    pvSelf,
    essCharge,
    essDischarge,
    gridBuy,
    gridSell,
    curtail,
    essNet: round(essCharge - essDischarge, 2),
    gridExchange: round(gridBuy - gridSell, 2),
  }
}

function simulate(sceneId, mode) {
  let soc = 42
  const points = []
  for (let i = 0; i < 96; i += 1) {
    const { hour } = indexToParts(i)
    const pvRaw = pvAt(hour, sceneId)
    const loadRaw = loadAt(hour, sceneId)
    const roomMw = ((SOC_MAX - soc) / 100) * ESS_CAPACITY / 0.25
    const availMw = ((soc - SOC_MIN) / 100) * ESS_CAPACITY / 0.25
    let essCharge = 0
    let essDischarge = 0
    const surplus = pvRaw - loadRaw
    if (mode !== 'baseline' && surplus > 0.05) {
      essCharge = Math.min(ESS_POWER, surplus * chargeRatio(mode), Math.max(0, roomMw))
    } else if (mode !== 'baseline' && surplus < -0.05) {
      const deficit = -surplus
      essDischarge = Math.min(ESS_POWER, dischargeTarget(hour, mode), deficit, Math.max(0, availMw))
    }
    const row = reconcile(pvRaw, loadRaw, essCharge, essDischarge)
    soc = clamp(soc + ((row.essCharge - row.essDischarge) * 0.25 / ESS_CAPACITY) * 100, SOC_MIN, SOC_MAX)
    const categories = splitLoad(row.load, hour)
    points.push({
      index: i,
      t: indexToIso(i),
      label: labelOf(i),
      hour,
      ...row,
      soc: round(soc, 1),
      ghi: round(ghiAt(hour, sceneId), 0),
      temp: round(18 + 8 * solarShape(hour) + (sceneId === 'cloudy' ? -1.5 : 0), 1),
      categories,
      chargePower: categories['充电'],
      price: tariff(hour),
    })
  }
  return points
}

function pointCost(p) {
  const buy = p.gridBuy * 0.25 * 1000 * p.price
  const sell = p.gridSell * 0.25 * 1000 * EXPORT_PRICE
  return buy - sell
}

function sumCost(points, until) {
  let cost = 0
  const end = until === undefined ? points.length - 1 : until
  for (let i = 0; i <= end; i += 1) cost += pointCost(points[i])
  return round(cost, 2)
}

function integrate(points, key, until) {
  let total = 0
  for (let i = 0; i <= until; i += 1) total += points[i][key] * 0.25
  return round(total, 2)
}

function peakOf(points, key) {
  let best = points[0]
  points.forEach((p) => {
    if (p[key] > best[key]) best = p
  })
  return best
}

function buildForecast(points, sceneId, nowIndex) {
  const cloudy = sceneId === 'cloudy'
  const band = cloudy ? 0.24 : sceneId === 'alarm' ? 0.11 : 0.08
  const bias = cloudy ? 0.07 : 0
  const mapPoint = (p, i) => {
    const wobble = cloudy ? 0.28 * Math.sin(i / 1.6) : 0
    const p50 = round(Math.max(0, p.pv * (1 + bias) + wobble), 2)
    return {
      t: p.t,
      label: p.label,
      p10: round(p50 * (1 - band), 2),
      p50,
      p90: round(p50 * (1 + band), 2),
      actual: i <= nowIndex ? p.pv : null,
      clearSky: round(PV_CAPACITY * solarShape(p.hour) * 0.9, 2),
      loadP50: round(p.load * (cloudy ? 1.03 : 1), 2),
      loadP10: round(p.load * 0.92, 2),
      loadP90: round(p.load * (cloudy ? 1.14 : 1.06), 2),
      loadActual: i <= nowIndex ? p.load : null,
    }
  }
  const all = points.map(mapPoint)
  const failed = cloudy
  return {
    status: failed ? 'FAILED' : 'OK',
    reason: failed ? 'NWP 到报超时，日内模型未完成' : '',
    taskId: failed ? 'PVFC-20261014-1415' : `PVFC-20261014-${labelOf(nowIndex).replace(':', '')}`,
    fallbackTaskId: failed ? 'PVFC-20261014-1200' : '',
    modelVersion: 'PV-FC-V1',
    modelName: '物理晴空 + 梯度提升',
    trainWindow: '2025-10-01 ~ 2026-09-30',
    generatedAt: failed ? `${DATE}T12:00:00+08:00` : points[nowIndex].t,
    inputComplete: failed ? 86.4 : 99.2,
    resolutionMinutes: 15,
    dayAhead: all,
    intraday: all.filter((p, i) => i >= nowIndex - 8 && i <= nowIndex + 16),
    weather: cloudy ? '多云' : sceneId === 'peak' ? '晴转多云' : '晴',
    cloud: cloudy ? 72 : 18,
    nwpSource: 'CMA-NWP',
    nwpUpdated: failed ? `${DATE}T11:40:00+08:00` : points[nowIndex].t,
  }
}

function buildInverters(sceneId, snapshot, todayGeneration) {
  const offlineId = sceneId === 'alarm' ? 'INV-006' : ''
  const warnId = sceneId === 'cloudy' ? 'INV-003' : ''
  const onlineRated = INVERTER_CATALOG.filter((d) => d.id !== offlineId).reduce((s, d) => s + d.ratedKw, 0)
  let used = 0
  const online = INVERTER_CATALOG.filter((d) => d.id !== offlineId)
  return INVERTER_CATALOG.map((d) => {
    const offline = d.id === offlineId
    const warning = d.id === warnId
    let activePowerKw = 0
    if (offline) activePowerKw = null
    else if (snapshot.pv <= 0) activePowerKw = 0
    else if (d.id === online[online.length - 1].id) activePowerKw = round(snapshot.pv * 1000 - used, 1)
    else {
      activePowerKw = round((snapshot.pv * 1000 * d.ratedKw) / onlineRated, 1)
      used = round(used + activePowerKw, 1)
    }
    const share = offline || !snapshot.pv ? 0 : (activePowerKw / (snapshot.pv * 1000))
    const efficiency = warning ? 95.1 : d.efficiency
    const freq = warning ? 50.21 : d.freq
    const status = offline ? '离线' : snapshot.pv <= 0 ? '待机' : '运行'
    const alarmStatus = offline ? '告警' : warning ? '提醒' : '正常'
    const updated = offline ? `${DATE}T10:58:30+08:00` : snapshot.t
    return {
      ...d,
      status,
      alarmStatus,
      activePowerKw,
      dcVoltage: offline ? null : round(650 + (d.ratedKw % 17), 1),
      dcCurrent: offline || !activePowerKw ? (offline ? null : 0) : round((activePowerKw * 1000) / (650 + (d.ratedKw % 17)), 1),
      acFrequency: offline ? null : freq,
      freqOver: !offline && Math.abs(freq - 50) > 0.2,
      efficiency: offline ? null : efficiency,
      efficiencyLow: !offline && efficiency < 96,
      energyTodayMwh: round(todayGeneration * share, 2),
      energyMonthMwh: round(28.4 * (d.ratedKw / 6580) + todayGeneration * share, 2),
      updatedAt: updated,
      stale: offline,
      commAddr: `10.8.21.${d.id.slice(-2)}`,
      firmware: 'V3.2.18',
      commissioned: '2024-06-18',
      ratedPowerMw: round(d.ratedKw / 1000, 2),
    }
  })
}

function buildZones(inverters) {
  const names = ['屋顶A', '屋顶B', '车棚C', '地面D', '仓储E']
  return names.map((name) => {
    const list = inverters.filter((d) => d.zone === name)
    const capacityMw = round(list.reduce((s, d) => s + d.ratedKw, 0) / 1000, 2)
    const powerMw = round(list.reduce((s, d) => s + (d.activePowerKw || 0), 0) / 1000, 2)
    const alarmCount = list.filter((d) => d.alarmStatus !== '正常').length
    let status = '正常'
    if (list.some((d) => d.status === '离线' || d.alarmStatus === '告警')) status = '告警'
    else if (list.some((d) => d.alarmStatus === '提醒')) status = '提醒'
    else if (list.every((d) => d.status === '待机')) status = '待机'
    return { name, capacityMw, powerMw, status, alarmCount }
  })
}

function buildTransformers(load) {
  const shares = [
    { id: 'TR-01', name: '1#变压器', capacityKva: 4000, share: 0.4, temp: 46 },
    { id: 'TR-02', name: '2#变压器', capacityKva: 2500, share: 0.27, temp: 51 },
    { id: 'TR-03', name: '3#变压器', capacityKva: 3150, share: 0.33, temp: 48 },
  ]
  let used = 0
  return shares.map((item, idx) => {
    const loadMw = idx === shares.length - 1 ? round(load - used, 2) : round(load * item.share, 2)
    used = round(used + loadMw, 2)
    const loadRate = round((loadMw / (item.capacityKva / 1000)) * 100, 1)
    return {
      ...item,
      loadMw,
      loadRate,
      status: loadRate >= 80 ? '提醒' : '正常',
      demandLimitMw: round((item.capacityKva / 1000) * 0.9, 2),
    }
  })
}

function buildFeeders(transformers) {
  return transformers.flatMap((tr) => [1, 2].map((n) => {
    const powerMw = round(tr.loadMw / 2, 2)
    return {
      id: `${tr.id}-F${n}`,
      name: `${tr.name.replace('变压器', '')}馈线${n}`,
      transformerId: tr.id,
      transformerName: tr.name,
      voltageKv: round(10.15 + n * 0.05, 2),
      currentA: round((powerMw * 1000) / (1.732 * 10.2), 1),
      powerMw,
      powerFactor: 0.94,
      switchStatus: '合闸',
    }
  }))
}

function buildEvents(sceneId) {
  const base = [
    { time: '08:20', type: '列车到发', source: '铁路作业系统', impactMw: 0.35, confidence: '高', detail: 'X45 次到达，站台与装卸同时启动' },
    { time: '09:40', type: '装卸', source: '物流作业系统', impactMw: 0.42, confidence: '高', detail: '3 号月台卸车' },
    { time: '11:10', type: '冷链设定', source: '冷链监控', impactMw: 0.18, confidence: '中', detail: '冷库设定 2℃' },
    { time: '16:30', type: '充电预约', source: '充电桩平台', impactMw: 0.55, confidence: '高', detail: '8 辆作业车预约 17:00 后补能' },
    { time: '18:40', type: '列车到发', source: '铁路作业系统', impactMw: 0.48, confidence: '高', detail: '晚班到达，牵引与照明叠加' },
  ]
  if (sceneId === 'cloudy') {
    return base.map((e) => (e.time === '11:10' ? { ...e, missing: false } : e))
  }
  return base
}

function buildAlarms(sceneId, nowIso) {
  if (sceneId === 'sunny' || sceneId === 'peak') return []
  if (sceneId === 'cloudy') {
    return [{
      id: 'ALM-101',
      level: '提醒',
      deviceId: 'INV-003',
      deviceName: '屋顶B-1#逆变器',
      content: '逆变效率 95.1%，低于 96% 关注阈值',
      start: `${DATE}T13:40:00+08:00`,
      duration: '35分钟',
      status: '未确认',
      code: 'PV-EFF-LOW',
    }]
  }
  return [
    {
      id: 'ALM-201',
      level: '告警',
      deviceId: 'INV-006',
      deviceName: '车棚C-2#逆变器',
      content: '通讯中断，已超过 60 秒无新数据',
      start: `${DATE}T10:58:30+08:00`,
      duration: '1分30秒',
      status: '未确认',
      code: 'PV-COMM-LOST',
    },
    {
      id: 'ALM-202',
      level: '提醒',
      deviceId: 'BMS-01',
      deviceName: '1#电池舱 BMS',
      content: '单体压差 47 mV，接近 50 mV 关注阈值，未达到故障停机',
      start: nowIso,
      duration: '持续中',
      status: '未确认',
      code: 'ESS-CELL-DIFF',
    },
  ]
}

function buildSuggestions(point, sceneId) {
  const list = []
  if (point.essCharge > 0.05) {
    list.push({
      time: point.label,
      action: '储能充电',
      powerMw: point.essCharge,
      reason: '光伏出力高于同期负荷，优先把富余电量存入储能',
      impact: `当前上网仅 ${point.gridSell.toFixed(2)} MW，避免低价上网`,
    })
  }
  if (point.essDischarge > 0.05) {
    list.push({
      time: point.label,
      action: '储能放电',
      powerMw: -point.essDischarge,
      reason: sceneId === 'peak' ? '晚高峰负荷逼近需量限额，放电削峰' : '峰段电价较高，放电替代购电',
      impact: `少购电 ${point.essDischarge.toFixed(2)} MW，需量留有裕度`,
    })
  }
  if (point.load >= DEMAND_LIMIT * 0.8) {
    list.push({
      time: point.label,
      action: '需量关注',
      powerMw: point.load,
      reason: `负荷已达到限额 ${DEMAND_LIMIT.toFixed(2)} MW 的 80%`,
      impact: '调度页与负荷页同步黄色提醒，不直接控设备',
    })
  }
  if (!list.length) {
    list.push({
      time: point.label,
      action: '维持当前计划',
      powerMw: point.essNet,
      reason: '功率平衡正常，无需改变充放电方向',
      impact: '继续按日前计划跟踪',
    })
  }
  return list
}

function energyOf(points, until) {
  const end = until === undefined ? points.length - 1 : until
  let gen = 0
  let sell = 0
  let curtail = 0
  let throughput = 0
  for (let i = 0; i <= end; i += 1) {
    gen += points[i].pv * 0.25
    sell += points[i].gridSell * 0.25
    curtail += points[i].curtail * 0.25
    throughput += (points[i].essCharge + points[i].essDischarge) * 0.25
  }
  const onsite = gen - sell - curtail
  return {
    gen: round(gen, 2),
    sell: round(sell, 2),
    onsite: round(onsite, 2),
    selfUseRate: gen ? round((onsite / gen) * 100, 1) : null,
    throughput: round(throughput, 2),
  }
}

function planSummary(points, baseline, name, id) {
  const gridPeak = peakOf(points, 'gridExchange')
  const energy = energyOf(points)
  const cost = sumCost(points)
  const baseCost = sumCost(baseline)
  return {
    id,
    name,
    cost: round(cost, 0),
    saving: round(baseCost - cost, 0),
    selfUseRate: energy.selfUseRate,
    peakDemand: round(Math.max(gridPeak.gridExchange, 0), 2),
    loadPeak: round(peakOf(points, 'load').load, 2),
    curtail: round(points.reduce((s, p) => s + p.curtail * 0.25, 0), 2),
    essThroughput: energy.throughput,
    chargeSatisfaction: id === 'demand' ? 94.2 : 97.6,
    points,
  }
}

function buildRevisions(points, nowIndex, sceneId) {
  return points.slice(Math.max(0, nowIndex - 4), nowIndex + 5).map((p) => {
    const past = p.index <= nowIndex
    const bias = sceneId === 'cloudy' && !past ? 0.35 : 0
    return {
      time: p.label,
      past,
      original: p.essNet,
      revised: past ? p.essNet : round(p.essNet + bias, 2),
      executed: past ? p.essNet : null,
      reason: past ? '已执行，不可修改' : (sceneId === 'cloudy' ? '预测偏差：云团造成光伏低于日前' : '跟踪日前计划'),
      impact: past ? '该时段已冻结' : '修正后预计少购电，SOC 下限仍高于 15%',
      constraint: 'SOC 15%–90%，功率 ±2 MW',
    }
  })
}

function buildSources(sceneId, nowIso) {
  const forecastDown = sceneId === 'cloudy'
  return [
    { name: '光伏 SCADA', protocol: 'WebSocket', latencyMs: 160, status: sceneId === 'alarm' ? '部分离线' : '正常', source: 'SCADA', updated: nowIso },
    { name: '负荷总表', protocol: 'REST', latencyMs: 240, status: '正常', source: 'SCADA', updated: nowIso },
    { name: '储能 EMS', protocol: 'WebSocket', latencyMs: 120, status: '正常', source: 'EMS', updated: nowIso },
    { name: 'NWP 气象', protocol: 'REST', latencyMs: forecastDown ? 4200 : 800, status: forecastDown ? '超时' : '正常', source: 'NWP', updated: forecastDown ? `${DATE}T11:40:00+08:00` : nowIso },
    { name: '光伏预测', protocol: 'REST', latencyMs: forecastDown ? 8000 : 640, status: forecastDown ? '失败' : '正常', source: 'MODEL', updated: forecastDown ? `${DATE}T12:00:00+08:00` : nowIso },
    { name: '负荷预测', protocol: 'REST', latencyMs: 700, status: '正常', source: 'MODEL', updated: nowIso },
    { name: '调度测算', protocol: 'REST', latencyMs: 300, status: '正常', source: 'MOCK', updated: nowIso },
    { name: '充电桩平台', protocol: 'REST', latencyMs: 500, status: '正常', source: 'EMS', updated: nowIso },
    { name: '作业计划', protocol: 'REST', latencyMs: 450, status: '正常', source: 'SCADA', updated: nowIso },
  ]
}

function buildScene(meta) {
  const economic = simulate(meta.id, 'economic')
  const baseline = simulate(meta.id, 'baseline')
  const absorb = simulate(meta.id, 'absorb')
  const demand = simulate(meta.id, 'demand')
  const activeMode = meta.id === 'peak' ? 'demand' : 'economic'
  const points = activeMode === 'demand' ? demand : economic
  const now = points[meta.nowIndex]
  const todayGeneration = integrate(points, 'pv', meta.nowIndex)
  const todayEnergy = energyOf(points, meta.nowIndex)
  const todaySelf = todayEnergy.onsite
  const todayGridBuy = integrate(points, 'gridBuy', meta.nowIndex)
  const todaySell = integrate(points, 'gridSell', meta.nowIndex)
  const todayLoad = integrate(points, 'load', meta.nowIndex)
  const todayCharge = integrate(points, 'essCharge', meta.nowIndex)
  const todayDischarge = integrate(points, 'essDischarge', meta.nowIndex)
  const baselineNow = sumCost(baseline, meta.nowIndex)
  const activeNow = sumCost(points, meta.nowIndex)
  const daySaving = round(sumCost(baseline) - sumCost(points), 0)
  const realizedSaving = round(baselineNow - activeNow, 0)
  const inverters = buildInverters(meta.id, now, todayGeneration)
  const zones = buildZones(inverters)
  const online = inverters.filter((d) => d.status === '运行').length
  const standby = inverters.filter((d) => d.status === '待机').length
  const fault = inverters.filter((d) => d.status === '故障').length
  const offline = inverters.filter((d) => d.status === '离线').length
  const theoretical = now.ghi > 0 ? PV_CAPACITY * (now.ghi / 1000) : null
  const pr = meta.id === 'alarm' || !theoretical ? null : round((now.pv / theoretical) * 100, 1)
  const displayed = points.map((p, i) => {
    const gap = meta.id === 'alarm' && [meta.nowIndex - 5, meta.nowIndex - 3, meta.nowIndex - 1].includes(i)
    return gap ? { ...p, pv: null, load: null, gap: true } : { ...p, gap: false }
  })
  const samples = meta.nowIndex + 1
  const missing = meta.id === 'alarm' ? 3 : 0
  const essStatus = now.essCharge > 0.01 ? '充电' : now.essDischarge > 0.01 ? '放电' : '待机'
  const plans = [
    planSummary(baseline, baseline, '基准（无储能）', 'baseline'),
    planSummary(economic, baseline, '经济优先', 'economic'),
    planSummary(absorb, baseline, '消纳优先', 'absorb'),
    planSummary(demand, baseline, '需量优先', 'demand'),
  ]
  const forecast = buildForecast(points, meta.id, meta.nowIndex)
  const loadPeakPoint = points.slice(0, meta.nowIndex + 1).reduce((a, b) => (a.load > b.load ? a : b))
  const vDiff = meta.id === 'alarm' ? 47 : 28
  return {
    id: meta.id,
    name: meta.name,
    pageClock: now.t,
    nowLabel: now.label,
    nowIndex: meta.nowIndex,
    constants: {
      park: '长沙铁路物流园区',
      org: '广州局集团有限公司',
      pvCapacity: PV_CAPACITY,
      essCapacity: ESS_CAPACITY,
      essPower: ESS_POWER,
      demandLimit: DEMAND_LIMIT,
      emissionFactor: EMISSION_FACTOR,
      emissionVersion: 'EF-2026-CSG-01',
      tariffNote: '示意分时电价：谷 0.36 / 平 0.72 / 峰 1.20 元/kWh，上网 0.35 元/kWh，不含需量电费',
      signNote: '储能正充负放，电网正购负售',
    },
    snapshot: {
      ...now,
      ghi: meta.id === 'alarm' ? null : now.ghi,
      selfUseRate: todayEnergy.selfUseRate,
      todaySaving: daySaving,
      realizedSaving,
      todayGeneration,
      todaySelf,
      todayGridBuy,
      todaySell,
      todayLoad,
      todayEssThroughput: round(todayCharge + todayDischarge, 2),
      carbonTon: round(todaySelf * EMISSION_FACTOR, 2),
      peakDemand: round(loadPeakPoint.load, 2),
      peakDemandTime: loadPeakPoint.label,
      soh: 96.8,
      availableEnergy: round((now.soc / 100) * ESS_CAPACITY, 2),
      cycleCount: 412,
      roundTripEfficiency: 92.4,
      reactivePower: round(now.load * 0.28, 2),
      powerFactor: 0.94,
      frequency: 50.02,
      equivalentHours: round(todayGeneration / PV_CAPACITY, 2),
      availability: round(((inverters.length - offline) / inverters.length) * 100, 1),
      pr,
      energyMonth: round(186.4 + todayGeneration, 1),
      energyYear: round(1680 + 186.4 + todayGeneration, 1),
      essStatus,
      demandRisk: now.load >= DEMAND_LIMIT * 0.8,
      completeness: round(((samples - missing) / samples) * 100, 1),
    },
    series: displayed,
    balanceSeries: points,
    forecast,
    zones,
    inverters,
    deviceStats: {
      total: inverters.length,
      online,
      standby,
      fault,
      offline,
    },
    categories: CATEGORY_META.map((metaItem) => ({
      ...metaItem,
      value: now.categories[metaItem.key],
    })),
    transformers: buildTransformers(now.load),
    feeders: buildFeeders(buildTransformers(now.load)),
    events: buildEvents(meta.id),
    alarms: buildAlarms(meta.id, now.t),
    suggestions: buildSuggestions(now, meta.id),
    plans,
    activePlanId: activeMode,
    revisions: buildRevisions(points, meta.nowIndex, meta.id),
    sources: buildSources(meta.id, now.t),
    ess: {
      status: essStatus,
      temp: round(27 + now.soc / 40, 1),
      insulation: 86,
      vDiff,
      tDiff: 6.3,
      maxCellVoltage: meta.id === 'alarm' ? 3.385 : 3.352,
      maxCellPos: '12簇-3号',
      minCellVoltage: meta.id === 'alarm' ? 3.338 : 3.324,
      minCellPos: '7簇-16号',
      maxTemperature: 32.4,
      maxTempPos: '5簇-2号',
      minTemperature: 26.1,
      minTempPos: '2簇-9号',
      comms: [
        { name: 'BMS', status: '正常' },
        { name: 'PCS', status: '正常' },
        { name: 'EMS', status: '正常' },
        { name: '并网开关', status: '合闸' },
        { name: '急停', status: '正常' },
        { name: '消防', status: '正常' },
      ],
      lastMaintenance: '2026-09-18',
      nextMaintenance: '2026-12-18',
    },
    strategies: [
      { time: '00:00–08:00', title: '谷段预充', code: 'LOW_TARIFF_CHARGE', desc: '低电价时段按 SOC 下限以上小功率补电，留给午间光伏。', color: '#47DFED' },
      { time: '08:00–16:00', title: '光伏就地消纳', code: 'PV_SELF_USE', desc: '富余光伏优先充电，减少上网。', color: '#00FF79' },
      { time: '16:00–21:00', title: '峰段放电', code: 'PEAK_SHAVING', desc: '跟踪负荷与需量限额放电，保留 15% SOC。', color: '#FFD83C' },
    ],
  }
}

export const SCENES = Object.fromEntries(SCENE_LIST.map((meta) => [meta.id, buildScene(meta)]))

export function assertScenes() {
  const problems = []
  Object.values(SCENES).forEach((scene) => {
    scene.balanceSeries.forEach((p) => {
      const pv = round(p.pvSelf + p.essCharge + p.gridSell + p.curtail, 2)
      const load = round(p.pvSelf + p.essDischarge + p.gridBuy, 2)
      if (Math.abs(pv - p.pv) > 0.021) problems.push(`${scene.id} ${p.label} pv ${pv} != ${p.pv}`)
      if (Math.abs(load - p.load) > 0.021) problems.push(`${scene.id} ${p.label} load ${load} != ${p.load}`)
      if (p.essCharge > 0 && p.essDischarge > 0) problems.push(`${scene.id} ${p.label} charge and discharge`)
      const cat = round(Object.values(p.categories).reduce((s, n) => s + n, 0), 2)
      if (Math.abs(cat - p.load) > 0.021) problems.push(`${scene.id} ${p.label} category ${cat} != ${p.load}`)
    })
    const zonePower = round(scene.zones.reduce((s, z) => s + z.powerMw, 0), 2)
    if (Math.abs(zonePower - scene.snapshot.pv) > 0.05) problems.push(`${scene.id} zone ${zonePower} != ${scene.snapshot.pv}`)
    const stats = scene.deviceStats
    if (stats.online + stats.standby + stats.fault + stats.offline !== stats.total) problems.push(`${scene.id} device stats`)
  })
  return problems
}
