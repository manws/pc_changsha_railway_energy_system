<template>
  <div class="page">
    <div class="banner info">测算模式。执行状态只展示，参观版不能向现场下发。</div>
    <div class="kpi-row">
      <KpiCard label="预计节省" :value="money(active.saving)" sub="较无储能基准" color="#FFD83C" :tip="scene.constants.tariffNote" />
      <KpiCard label="自用率" :value="num(active.selfUseRate, 1)" unit="%" :sub="`基准 ${num(baseline.selfUseRate, 1)}%`" color="#00FF79" />
      <KpiCard label="电网峰值" :value="num(active.peakDemand)" unit="MW" :sub="`基准 ${num(baseline.peakDemand)} MW`" />
      <KpiCard label="弃光" :value="num(active.curtail)" unit="MWh" sub="当前策略为 0" />
      <KpiCard label="储能吞吐" :value="num(active.essThroughput)" unit="MWh" />
      <KpiCard label="充电满足率" :value="num(active.chargeSatisfaction, 1)" unit="%" sub="预约示意" />
    </div>
    <div class="split main">
      <SectionCard :title="`当前策略 · ${active.name}`" desc="正充负放，正购负售">
        <ChartBox class="grow" :option="chartOption" />
      </SectionCard>
      <SectionCard title="策略说明">
        <div v-for="item in scene.strategies" :key="item.code" class="plain-row" :style="{ borderLeft: `3px solid ${item.color}` }">
          <div>
            <strong>{{ item.time }} {{ item.title }}</strong>
            <p class="muted secondary-copy">{{ item.desc }}</p>
          </div>
          <span class="muted">{{ item.code }}</span>
        </div>
        <router-link class="link" to="/schedule/day-ahead">查看日前 96 点与方案对比</router-link>
      </SectionCard>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { currentScene } from '../data/store'
import { formatMoney, formatNumber } from '../utils/format'
import { planOption } from '../utils/charts'
import KpiCard from '../components/KpiCard.vue'
import SectionCard from '../components/SectionCard.vue'
import ChartBox from '../components/ChartBox.vue'

const scene = currentScene
const active = computed(() => scene.value.plans.find((item) => item.id === scene.value.activePlanId))
const baseline = computed(() => scene.value.plans.find((item) => item.id === 'baseline'))
const chartOption = computed(() => planOption(active.value.points, ['pv', 'load', 'ess', 'grid']))
function num(value, digits = 2) { return formatNumber(value, digits) }
function money(value) { return formatMoney(value) }
</script>

<style scoped>
.plain-row { margin-bottom: 8px; }
</style>
