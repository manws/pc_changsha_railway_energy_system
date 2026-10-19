<template>
  <div class="page scroll">
    <SectionCard title="策略与约束" :desc="editable ? '管理员编辑仅保存在本机演示，不会下发' : '当前为只读'">
      <template #extra>
        <el-button v-if="!isLeader" @click="editable = !editable">{{ editable ? '结束编辑' : '编辑' }}</el-button>
        <el-button v-if="editable" type="primary" @click="save">保存</el-button>
      </template>
      <el-form label-width="140px" class="form" :disabled="!editable">
        <el-form-item label="SOC 下限 %"><el-input-number v-model="form.socMin" :min="5" :max="40" /></el-form-item>
        <el-form-item label="SOC 上限 %"><el-input-number v-model="form.socMax" :min="60" :max="100" /></el-form-item>
        <el-form-item label="功率上限 MW"><el-input-number v-model="form.power" :min="0.5" :max="2" :step="0.1" /></el-form-item>
        <el-form-item label="需量限额 MW"><el-input-number v-model="form.demand" :min="4" :max="12" :step="0.1" /></el-form-item>
        <el-form-item label="备用电量 MWh"><el-input-number v-model="form.reserve" :min="0.2" :max="2" :step="0.1" /></el-form-item>
        <el-form-item label="充电满足率 %"><el-input-number v-model="form.charge" :min="80" :max="100" /></el-form-item>
      </el-form>
      <div class="dark-table">
        <el-table :data="hits" size="small">
          <el-table-column prop="name" label="约束" />
          <el-table-column prop="value" label="当前限值" />
          <el-table-column label="状态">
            <template #default="{ row }"><StatusBadge :text="row.hit ? '提醒' : '正常'" /></template>
          </el-table-column>
        </el-table>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { currentScene, isLeader } from '../data/store'
import SectionCard from '../components/SectionCard.vue'
import StatusBadge from '../components/StatusBadge.vue'

const scene = currentScene
const editable = ref(false)
const form = reactive({ socMin: 15, socMax: 90, power: 2, demand: 8, reserve: 1, charge: 97.6 })
const hits = computed(() => [
  { name: 'SOC 范围', value: `${form.socMin}% – ${form.socMax}%`, hit: scene.value.snapshot.soc <= form.socMin + 2 },
  { name: '储能功率', value: `±${form.power.toFixed(2)} MW`, hit: Math.abs(scene.value.snapshot.essNet) >= form.power },
  { name: '需量限额', value: `${form.demand.toFixed(2)} MW`, hit: scene.value.snapshot.load >= form.demand * 0.8 },
  { name: '备用电量', value: `${form.reserve.toFixed(2)} MWh`, hit: false },
  { name: '充电预约', value: `满足率 ${form.charge}%`, hit: false },
  { name: '设备可用性', value: 'PCS、BMS 正常', hit: scene.value.id === 'alarm' },
])

function save() {
  editable.value = false
  ElMessage.success('已保存为演示配置，不会下发到现场设备')
}
</script>

<style scoped>
.form { max-width: 520px; margin-bottom: 12px; }
</style>
