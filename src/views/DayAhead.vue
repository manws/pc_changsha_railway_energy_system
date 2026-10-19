<template>
  <div class="page">
    <div class="toolbar">
      <el-button v-if="!isLeader" :disabled="submitting" @click="simulate">生成测算</el-button>
      <el-button @click="exportCsv">导出</el-button>
      <el-tooltip content="参观展示版本禁止向现场设备下发控制指令" placement="top">
        <span><el-button type="primary" disabled>执行下发</el-button></span>
      </el-tooltip>
      <StatusBadge text="待审批" />
      <span class="muted">SCH-20261015-001 · 测算 · 不下发</span>
    </div>
    <div class="kpi-row cols-4">
      <KpiCard v-for="plan in selectedPlans" :key="plan.id" :label="plan.name" :value="money(plan.saving)" :sub="`自用 ${num(plan.selfUseRate, 1)}% · 需量 ${num(plan.peakDemand)} MW`" />
    </div>
    <SectionCard class="grow" title="96 点计划" desc="最多同时对比 3 个方案">
      <template #extra>
        <el-checkbox-group v-model="picked" :max="3">
          <el-checkbox v-for="plan in scene.plans" :key="plan.id" :value="plan.id">{{ plan.name }}</el-checkbox>
        </el-checkbox-group>
      </template>
      <div class="toolbar">
        <el-checkbox-group v-model="layers">
          <el-checkbox value="load">负荷</el-checkbox>
          <el-checkbox value="pv">光伏</el-checkbox>
          <el-checkbox value="grid">购售电</el-checkbox>
          <el-checkbox value="ess">储能</el-checkbox>
          <el-checkbox value="soc">SOC</el-checkbox>
          <el-checkbox value="charge">充电功率</el-checkbox>
        </el-checkbox-group>
      </div>
      <ChartBox class="grow" :option="chartOption" />
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { currentScene, isLeader } from '../data/store'
import { formatMoney, formatNumber } from '../utils/format'
import { planOption } from '../utils/charts'
import KpiCard from '../components/KpiCard.vue'
import SectionCard from '../components/SectionCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import ChartBox from '../components/ChartBox.vue'

const scene = currentScene
const picked = ref(['baseline', 'economic', 'demand'])
const layers = ref(['pv', 'load', 'ess', 'grid'])
const submitting = ref(false)
const selectedPlans = computed(() => scene.value.plans.filter((item) => picked.value.includes(item.id)).slice(0, 3))
const focus = computed(() => selectedPlans.value.find((item) => item.id === scene.value.activePlanId) || selectedPlans.value[0] || scene.value.plans[1])
const chartOption = computed(() => planOption(focus.value.points, layers.value))

function simulate() {
  if (submitting.value) return
  submitting.value = true
  ElMessage.success('测算任务已提交（演示），不会下发现场')
  setTimeout(() => { submitting.value = false }, 1500)
}

function exportCsv() {
  const plan = focus.value
  const header = 'time,pv,load,ess,grid,soc'
  const body = plan.points.map((p) => [p.label, p.pv, p.load, p.essNet, p.gridExchange, p.soc].join(',')).join('\n')
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${plan.id}-96.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function num(value, digits = 2) { return formatNumber(value, digits) }
function money(value) { return formatMoney(value) }
</script>
