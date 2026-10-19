<template>
  <div class="page scroll">
    <SectionCard title="逆变器列表" desc="只读。不提供启停和参数下发。">
      <div class="toolbar filter-bar">
        <el-input v-model="keyword" placeholder="搜索设备名称" clearable />
        <el-select v-model="statuses" multiple collapse-tags placeholder="运行状态" style="width: 220px">
          <el-option v-for="item in ['运行', '待机', '停机', '故障', '离线']" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="zone" clearable placeholder="全部分区" style="width: 140px">
          <el-option v-for="item in zones" :key="item" :label="item" :value="item" />
        </el-select>
      </div>
      <div class="dark-table">
        <el-table :data="rows" size="small" :row-class-name="rowClass">
          <el-table-column label="设备名称" min-width="180">
            <template #default="{ row }">
              <button type="button" class="link" @click="open(row.id)">{{ row.zone }} / {{ row.name }}</button>
            </template>
          </el-table-column>
          <el-table-column label="运行状态" width="100">
            <template #default="{ row }"><StatusBadge :text="row.status" /></template>
          </el-table-column>
          <el-table-column label="告警" width="90">
            <template #default="{ row }"><StatusBadge :text="row.alarmStatus" /></template>
          </el-table-column>
          <el-table-column label="有功功率" prop="activePowerKw" sortable width="120">
            <template #default="{ row }">{{ num(row.activePowerKw, 1) }} kW</template>
          </el-table-column>
          <el-table-column label="直流电压/电流" width="140">
            <template #default="{ row }">{{ num(row.dcVoltage, 1) }} V / {{ num(row.dcCurrent, 1) }} A</template>
          </el-table-column>
          <el-table-column label="频率" width="90">
            <template #default="{ row }"><span :class="{ 'alarm-text': row.freqOver }">{{ num(row.acFrequency, 2) }} Hz</span></template>
          </el-table-column>
          <el-table-column label="效率" width="90">
            <template #default="{ row }"><span :class="{ 'warn-text': row.efficiencyLow }">{{ num(row.efficiency, 1) }}%</span></template>
          </el-table-column>
          <el-table-column label="今日发电" prop="energyTodayMwh" sortable width="110">
            <template #default="{ row }">{{ num(row.energyTodayMwh) }} MWh</template>
          </el-table-column>
          <el-table-column label="更新时间" width="110">
            <template #default="{ row }"><span :class="{ 'warn-text': row.stale }">{{ clock(row.updatedAt) }}</span></template>
          </el-table-column>
          <el-table-column label="操作" width="90">
            <template #default="{ row }"><button type="button" class="link" @click="open(row.id)">查看详情</button></template>
          </el-table-column>
        </el-table>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentScene } from '../data/store'
import { formatClock, formatNumber } from '../utils/format'
import SectionCard from '../components/SectionCard.vue'
import StatusBadge from '../components/StatusBadge.vue'

const scene = currentScene
const route = useRoute()
const router = useRouter()
const keyword = ref('')
const statuses = ref([])
const zone = ref(route.query.zone || '')
const zones = computed(() => [...new Set(scene.value.inverters.map((item) => item.zone))])

watch(() => route.query.zone, (value) => { zone.value = value || '' })

const rows = computed(() => scene.value.inverters.filter((item) => {
  const text = `${item.name}${item.zone}`.includes(keyword.value.trim())
  const statusOk = !statuses.value.length || statuses.value.includes(item.status)
  const zoneOk = !zone.value || item.zone === zone.value
  return text && statusOk && zoneOk
}))

function num(value, digits = 1) { return formatNumber(value, digits) }
function clock(value) { return formatClock(value) }
function open(id) { router.push(`/pv/devices/${id}`) }
function rowClass({ row }) {
  if (row.status === '离线' || row.alarmStatus === '告警') return 'row-alarm'
  if (row.stale || row.alarmStatus === '提醒') return 'row-stale'
  return ''
}
</script>
