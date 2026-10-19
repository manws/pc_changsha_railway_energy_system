<template>
  <div class="page scroll">
    <SectionCard title="实时告警" desc="聚合光伏、负荷、储能和接口告警">
      <div v-if="!scene.alarms.length" class="state-panel" style="height: 240px">
        <p>当前筛选范围暂无数据</p>
      </div>
      <div v-else class="dark-table">
        <el-table :data="scene.alarms" size="small">
          <el-table-column prop="id" label="编号" width="110" />
          <el-table-column label="级别" width="90">
            <template #default="{ row }"><StatusBadge :text="row.level" /></template>
          </el-table-column>
          <el-table-column prop="deviceName" label="设备" min-width="160" />
          <el-table-column prop="content" label="内容" min-width="280" />
          <el-table-column prop="code" label="代码" width="140" />
          <el-table-column label="开始时间" min-width="170">
            <template #default="{ row }">{{ formatDateTime(row.start) }}</template>
          </el-table-column>
          <el-table-column prop="duration" label="持续" width="100" />
          <el-table-column prop="status" label="处理" width="100" />
        </el-table>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { currentScene } from '../data/store'
import { formatDateTime } from '../utils/format'
import SectionCard from '../components/SectionCard.vue'
import StatusBadge from '../components/StatusBadge.vue'

const scene = currentScene
</script>
