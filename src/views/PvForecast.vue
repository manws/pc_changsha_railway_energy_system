<template>
  <div class="page">
    <div v-if="scene.forecast.status === 'FAILED'" class="banner warn">
      预测任务 {{ scene.forecast.taskId }} 失败：{{ scene.forecast.reason }}。当前展示最近一次成功结果 {{ scene.forecast.fallbackTaskId }}，生成于 {{ formatDateTime(scene.forecast.generatedAt) }}。
    </div>
    <SectionCard title="查询条件" desc="修改条件后需点击查询，避免连续请求">
      <div class="toolbar filter-bar">
        <el-date-picker v-model="draft.date" type="date" value-format="YYYY-MM-DD" disabled />
        <el-select v-model="draft.zone" style="width: 140px">
          <el-option label="全园" value="全园" />
          <el-option v-for="zone in scene.zones" :key="zone.name" :label="zone.name" :value="zone.name" />
        </el-select>
        <el-radio-group v-model="draft.type">
          <el-radio-button value="intraday">日内</el-radio-button>
          <el-radio-button value="dayahead">日前</el-radio-button>
        </el-radio-group>
        <el-select v-model="draft.resolution" style="width: 120px">
          <el-option label="15 分钟" :value="15" />
          <el-option label="60 分钟" :value="60" />
        </el-select>
        <el-button type="primary" @click="applyQuery">查询</el-button>
        <span class="muted">模型 {{ scene.forecast.modelVersion }}</span>
      </div>
    </SectionCard>
    <div class="kpi-row cols-5">
      <KpiCard label="预测发电量" :value="num(energy)" unit="MWh" sub="P50 积分" />
      <KpiCard label="峰值功率" :value="num(peak.value)" unit="MW" :sub="peak.label" color="#47DFED" />
      <KpiCard label="区间宽度" :value="num(width)" unit="MW" sub="峰值时刻 P90-P10" :tip="TERMS['P10/P50/P90']" />
      <KpiCard label="自用率" :value="num(snap.selfUseRate, 1)" unit="%" sub="与总览同一口径" />
      <KpiCard label="模型状态" :value="scene.forecast.status === 'FAILED' ? '降级' : '正常'" :sub="scene.forecast.modelName" :color="scene.forecast.status === 'FAILED' ? '#FFD83C' : '#00FF79'" />
    </div>
    <div class="split main">
      <SectionCard :title="applied.type === 'intraday' ? '日内预测' : '日前预测'" :desc="`生成于 ${formatDateTime(scene.forecast.generatedAt)} · ${applied.resolution} 分钟`">
        <ChartBox class="grow" :option="chartOption" />
      </SectionCard>
      <div class="stack">
        <SectionCard title="气象">
          <div class="metric-list">
            <div class="metric-item"><span>天气</span><strong>{{ scene.forecast.weather }}</strong></div>
            <div class="metric-item"><span>GHI</span><strong class="num">{{ num(snap.ghi, 0) }}<em>W/m²</em></strong></div>
            <div class="metric-item"><span>温度</span><strong class="num">{{ num(snap.temp, 1) }}<em>℃</em></strong></div>
            <div class="metric-item"><span>云量</span><strong class="num">{{ scene.forecast.cloud }}<em>%</em></strong></div>
            <div class="metric-item"><span>来源</span><strong>{{ scene.forecast.nwpSource }}</strong></div>
            <div class="metric-item"><span>更新</span><strong>{{ formatClock(scene.forecast.nwpUpdated) }}</strong></div>
          </div>
        </SectionCard>
        <SectionCard title="模型">
          <p>任务 <button type="button" class="link" @click="copy(scene.forecast.taskId)">{{ scene.forecast.taskId }}</button></p>
          <p class="muted">训练窗 {{ scene.forecast.trainWindow }}</p>
          <p class="muted">输入完整率 {{ num(scene.forecast.inputComplete, 1) }}%</p>
          <p class="muted">{{ scene.forecast.reason || '任务成功，曲线与元数据使用同一任务编号' }}</p>
        </SectionCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { currentScene } from '../data/store'
import { formatClock, formatDateTime, formatNumber, TERMS } from '../utils/format'
import { forecastOption, withMarkLine } from '../utils/charts'
import KpiCard from '../components/KpiCard.vue'
import SectionCard from '../components/SectionCard.vue'
import ChartBox from '../components/ChartBox.vue'

const scene = currentScene
const snap = computed(() => scene.value.snapshot)
const draft = reactive({ date: '2026-10-14', zone: '全园', type: 'intraday', resolution: 15 })
const applied = ref({ ...draft })

const scale = computed(() => {
  if (applied.value.zone === '全园') return 1
  const zone = scene.value.zones.find((item) => item.name === applied.value.zone)
  return zone ? zone.capacityMw / scene.value.constants.pvCapacity : 1
})

const source = computed(() => {
  const rows = applied.value.type === 'intraday' ? scene.value.forecast.intraday : scene.value.forecast.dayAhead
  const step = applied.value.resolution === 60 ? 4 : 1
  return rows.filter((_, index) => index % step === 0).map((item) => ({
    ...item,
    p10: Number((item.p10 * scale.value).toFixed(2)),
    p50: Number((item.p50 * scale.value).toFixed(2)),
    p90: Number((item.p90 * scale.value).toFixed(2)),
    actual: item.actual === null ? null : Number((item.actual * scale.value).toFixed(2)),
    clearSky: Number((item.clearSky * scale.value).toFixed(2)),
  }))
})

const peak = computed(() => source.value.reduce((best, item) => (item.p50 > best.value ? { value: item.p50, label: item.label } : best), { value: 0, label: '--' }))
const width = computed(() => {
  const point = source.value.find((item) => item.label === peak.value.label) || source.value[0]
  return point ? point.p90 - point.p10 : null
})
const energy = computed(() => source.value.reduce((sum, item) => sum + item.p50, 0) * (applied.value.resolution / 60))
const chartOption = computed(() => {
  const mark = source.value.findIndex((item) => item.label === scene.value.nowLabel)
  return withMarkLine(forecastOption({
    labels: source.value.map((item) => item.label),
    actual: source.value.map((item) => item.actual),
    p50: source.value.map((item) => item.p50),
    p10: source.value.map((item) => item.p10),
    p90: source.value.map((item) => item.p90),
    clearSky: source.value.map((item) => item.clearSky),
  }), mark, '当前')
})

function applyQuery() { applied.value = { ...draft } }
function num(value, digits = 2) { return formatNumber(value, digits) }
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制任务编号')
  } catch {
    ElMessage.info(text)
  }
}
</script>
