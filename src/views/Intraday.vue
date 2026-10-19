<template>
  <div class="page scroll">
    <div class="banner info">已经过去的时段不可修改。修正建议同时给出原因、指标变化和约束影响。</div>
    <SectionCard title="原计划 / 修正 / 已执行">
      <ChartBox :option="chartOption" height="300px" />
    </SectionCard>
    <SectionCard title="修正建议">
      <div class="dark-table">
        <el-table :data="scene.revisions" size="small">
          <el-table-column prop="time" label="时间" width="80" />
          <el-table-column label="原计划" width="100">
            <template #default="{ row }">{{ signed(row.original) }}</template>
          </el-table-column>
          <el-table-column label="修正" width="100">
            <template #default="{ row }">{{ signed(row.revised) }}</template>
          </el-table-column>
          <el-table-column label="已执行" width="100">
            <template #default="{ row }">{{ row.executed === null ? '--' : signed(row.executed) }}</template>
          </el-table-column>
          <el-table-column prop="reason" label="原因" min-width="220" />
          <el-table-column prop="impact" label="影响" min-width="180" />
          <el-table-column prop="constraint" label="约束" min-width="160" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-tooltip :content="row.past ? '已过去时段不可修改' : '参观版不应用修正到现场'">
                <span><el-button size="small" disabled>{{ row.past ? '已冻结' : '应用' }}</el-button></span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { currentScene } from '../data/store'
import { formatSignedMw } from '../utils/format'
import { lineOption } from '../utils/charts'
import SectionCard from '../components/SectionCard.vue'
import ChartBox from '../components/ChartBox.vue'

const scene = currentScene
const chartOption = computed(() => lineOption({
  labels: scene.value.revisions.map((item) => item.time),
  series: [
    { name: '原计划', data: scene.value.revisions.map((item) => item.original), lineStyle: { type: 'dashed', color: '#939CAC' }, itemStyle: { color: '#939CAC' } },
    { name: '修正计划', data: scene.value.revisions.map((item) => item.revised), lineStyle: { color: '#47DFED' }, itemStyle: { color: '#47DFED' } },
    { name: '已执行', data: scene.value.revisions.map((item) => item.executed), connectNulls: false, lineStyle: { color: '#00FF79', width: 2.5 }, itemStyle: { color: '#00FF79' } },
  ],
}))
function signed(value) { return formatSignedMw(value) }
</script>
