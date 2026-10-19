<template>
  <div class="page">
    <div class="toolbar">
      <el-radio-group v-model="view">
        <el-radio-button value="total">总负荷</el-radio-button>
        <el-radio-button value="net">净负荷</el-radio-button>
        <el-radio-button value="category">分项</el-radio-button>
      </el-radio-group>
      <span class="muted">{{ TERMS.净负荷 }}</span>
    </div>
    <div class="kpi-row cols-5">
      <KpiCard label="预计峰值" :value="num(peak.value)" unit="MW" :sub="peak.label" color="#FFD83C" />
      <KpiCard label="可调负荷" :value="num(flexible)" unit="MW" sub="铁路作业，估算" />
      <KpiCard label="需量超限时长" :value="String(exceed)" unit="个 15 分钟点" :sub="`限额 ${scene.constants.demandLimit.toFixed(2)} MW`" />
      <KpiCard label="模型状态" value="正常" sub="LD-FC-V1" color="#00FF79" />
      <KpiCard label="nRMSE" value="6.8" unit="%" sub="工作日示意" />
    </div>
    <SectionCard class="grow" :title="title" desc="作业事件来自铁路和物流系统，缺失时不生成虚假事件">
      <ChartBox v-if="view !== 'category'" class="grow" :option="chartOption" />
      <div v-else class="cats">
        <div v-for="item in scene.categories" :key="item.key" class="cat">
          <span>{{ item.key }}</span>
          <div class="bar"><i :style="{ width: `${(item.value / snap.load) * 100}%`, background: item.color }"></i></div>
          <b class="num">{{ num(item.value) }}</b>
          <StatusBadge :text="item.source" />
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { currentScene } from '../data/store'
import { formatNumber, TERMS } from '../utils/format'
import { loadForecastOption } from '../utils/charts'
import KpiCard from '../components/KpiCard.vue'
import SectionCard from '../components/SectionCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import ChartBox from '../components/ChartBox.vue'

const scene = currentScene
const view = ref('total')
const snap = computed(() => scene.value.snapshot)
const points = computed(() => scene.value.forecast.dayAhead)
const peak = computed(() => points.value.reduce((best, item) => (item.loadP50 > best.value ? { value: item.loadP50, label: item.label } : best), { value: 0, label: '--' }))
const flexible = computed(() => scene.value.categories.find((item) => item.key === '铁路作业')?.value)
const exceed = computed(() => points.value.filter((item) => item.loadP50 >= scene.value.constants.demandLimit).length)
const title = computed(() => ({ total: '总负荷预测', net: '净负荷预测', category: '分项负荷' }[view.value]))
const chartOption = computed(() => loadForecastOption({
  labels: points.value.map((item) => item.label),
  actual: points.value.map((item) => item.loadActual),
  p50: points.value.map((item) => item.loadP50),
  low: points.value.map((item) => item.loadP10),
  high: points.value.map((item) => item.loadP90),
  net: view.value === 'net' ? points.value.map((item) => Number((item.loadP50 - item.p50).toFixed(2))) : points.value.map(() => null),
}))
function num(value, digits = 2) { return formatNumber(value, digits) }
</script>

<style scoped>
.cats { display: flex; flex-direction: column; gap: 10px; }
.cat { display: grid; grid-template-columns: 88px 1fr 72px auto; gap: 8px; align-items: center; }
.bar { height: 8px; background: #1a2332; border-radius: 4px; }
.bar i { display: block; height: 100%; border-radius: 4px; }
</style>
