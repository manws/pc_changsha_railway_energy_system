export const TERMS = {
  SOC: '荷电状态，当前可用电量占额定容量的百分比。',
  SOH: '健康状态，当前可用容量相对出厂容量的比例。',
  PR: '性能比，实际功率与按辐照折算的理论功率之比。辐照度缺失时不计算实时 PR。',
  'P10/P50/P90': 'P50 是中位预测，P10 到 P90 是 80% 置信区间。只返回单点预测时不绘制区间。',
  净负荷: '总负荷减去光伏功率。正值表示仍需购电或放电，负值表示光伏富余。',
  自用率: '光伏未上网、未弃光的电量占光伏发电量的比例，包含存入储能的光伏电量，不含电网充电后再释放的电量。',
}

export function isMissing(value) {
  return value === null || value === undefined || Number.isNaN(value)
}

export function formatNumber(value, digits = 2) {
  if (isMissing(value)) return '--'
  return Number(value).toFixed(digits)
}

export function formatUnit(value, digits, unit) {
  if (isMissing(value)) return '--'
  return `${Number(value).toFixed(digits)} ${unit}`
}

export function formatSignedMw(value) {
  if (isMissing(value)) return '--'
  const n = Number(value)
  const text = `${n > 0 ? '+' : ''}${n.toFixed(2)} MW`
  return text
}

export function formatMoney(yuan) {
  if (isMissing(yuan)) return '--'
  const abs = Math.abs(Number(yuan))
  if (abs >= 10000) return `${(Number(yuan) / 10000).toFixed(2)} 万元`
  return `${Number(yuan).toFixed(2)} 元`
}

export function formatDateTime(iso) {
  if (!iso) return '--'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '--'
  const text = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
  return text.replace(/\//g, '-')
}

export function formatClock(iso) {
  const full = formatDateTime(iso)
  return full === '--' ? '--' : full.slice(11, 19)
}

export function essDirection(essNet) {
  if (isMissing(essNet) || Math.abs(essNet) < 0.01) return '待机'
  return essNet > 0 ? '充电' : '放电'
}

export function gridDirection(gridExchange) {
  if (isMissing(gridExchange) || Math.abs(gridExchange) < 0.01) return '平衡'
  return gridExchange > 0 ? '购电' : '上网'
}
