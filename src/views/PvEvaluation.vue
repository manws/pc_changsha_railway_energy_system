<template>
  <div class="page scroll">
    <SectionCard title="光伏预测评估" :desc="`任务 ${scene.forecast.fallbackTaskId || scene.forecast.taskId} · 示意评估，与曲线任务编号一致`">
      <div class="toolbar filter-bar">
        <el-select v-model="weather" style="width: 140px">
          <el-option label="全部天气" value="" />
          <el-option v-for="item in ['晴', '多云', '阴']" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="dayType" style="width: 140px">
          <el-option label="全部日期" value="" />
          <el-option label="工作日" value="工作日" />
          <el-option label="周末" value="周末" />
        </el-select>
      </div>
      <div class="kpi-row cols-4">
        <KpiCard label="MAE" :value="num(summary.mae)" unit="MW" />
        <KpiCard label="RMSE" :value="num(summary.rmse)" unit="MW" />
        <KpiCard label="nRMSE" :value="num(summary.nrmse, 1)" unit="%" />
        <KpiCard label="样本" :value="String(filtered.length)" unit="组" :sub="scene.forecast.modelVersion" />
      </div>
      <div class="dark-table">
        <el-table :data="filtered" size="small">
          <el-table-column prop="weather" label="天气" />
          <el-table-column prop="dayType" label="日期类型" />
          <el-table-column prop="mae" label="MAE (MW)" />
          <el-table-column prop="rmse" label="RMSE (MW)" />
          <el-table-column prop="nrmse" label="nRMSE (%)" />
          <el-table-column prop="taskId" label="任务编号" min-width="180" />
        </el-table>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { currentScene } from '../data/store'
import { formatNumber } from '../utils/format'
import KpiCard from '../components/KpiCard.vue'
import SectionCard from '../components/SectionCard.vue'

const scene = currentScene
const weather = ref('')
const dayType = ref('')
const rows = computed(() => {
  const task = scene.value.forecast.fallbackTaskId || scene.value.forecast.taskId
  return [
    { weather: '晴', dayType: '工作日', mae: 0.18, rmse: 0.24, nrmse: 4.6, taskId: task },
    { weather: '晴', dayType: '周末', mae: 0.16, rmse: 0.21, nrmse: 4.1, taskId: task },
    { weather: '多云', dayType: '工作日', mae: 0.46, rmse: 0.61, nrmse: 11.2, taskId: task },
    { weather: '多云', dayType: '周末', mae: 0.41, rmse: 0.55, nrmse: 10.4, taskId: task },
    { weather: '阴', dayType: '工作日', mae: 0.33, rmse: 0.41, nrmse: 8.4, taskId: task },
  ]
})
const filtered = computed(() => rows.value.filter((item) => (!weather.value || item.weather === weather.value) && (!dayType.value || item.dayType === dayType.value)))
const summary = computed(() => {
  const list = filtered.value
  if (!list.length) return { mae: null, rmse: null, nrmse: null }
  const avg = (key) => list.reduce((sum, item) => sum + item[key], 0) / list.length
  return { mae: avg('mae'), rmse: avg('rmse'), nrmse: avg('nrmse') }
})
function num(value, digits = 2) { return formatNumber(value, digits) }
</script>

<style scoped>
.kpi-row { margin: 12px 0; }
</style>
