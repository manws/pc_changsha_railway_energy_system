<template>
  <div class="page scroll">
    <SectionCard title="数据模式" desc="领导页只看徽标。测试开关只对管理员显示，且不能切到生产控制。">
      <div class="modes">
        <StatusBadge v-for="item in modes" :key="item" :text="item" />
      </div>
      <p class="muted">当前为「{{ dataMode.text }}」。实时、部分实时和历史回放留给真实接口，演示数据不伪装成现场实时。</p>
      <div v-if="!isLeader" class="toolbar">
        <el-button @click="setFault('ok')">恢复演示</el-button>
        <el-button @click="setFault('loading')">加载中</el-button>
        <el-button @click="setFault('empty')">空数据</el-button>
        <el-button @click="setFault('error')">接口异常</el-button>
        <el-button @click="setFault('offline')">数据源离线</el-button>
      </div>
    </SectionCard>
    <SectionCard title="接口健康" desc="延迟、来源和模式">
      <div class="dark-table">
        <el-table :data="scene.sources" size="small">
          <el-table-column prop="name" label="数据源" min-width="140" />
          <el-table-column prop="protocol" label="协议" width="120" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }"><StatusBadge :text="row.status" /></template>
          </el-table-column>
          <el-table-column prop="latencyMs" label="延迟 (ms)" width="110" />
          <el-table-column prop="source" label="来源" width="100" />
          <el-table-column label="更新时间" min-width="180">
            <template #default="{ row }">{{ formatDateTime(row.updated) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { currentScene, dataMode, isLeader, setFault } from '../data/store'
import { formatDateTime } from '../utils/format'
import SectionCard from '../components/SectionCard.vue'
import StatusBadge from '../components/StatusBadge.vue'

const scene = currentScene
const modes = ['实时数据', '部分实时', '演示数据', '历史回放', '离线']
</script>

<style scoped>
.modes { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.toolbar { margin-top: 12px; }
</style>
