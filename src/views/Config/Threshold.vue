<template>
  <div class="threshold-container">
    <el-row :gutter="24">
      <!-- 攻击频率板块 -->
      <el-col :xs="24" :sm="24" :md="8">
        <el-card class="threshold-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Timer /></el-icon>
              <span>攻击频率配置</span>
            </div>
          </template>
          <el-form label-position="top" v-loading="loading">
            <el-form-item v-for="item in configs.frequency" :key="item.id" :label="item.thresholdName">
              <div class="input-group">
                <el-input-number 
                  v-model="item.thresholdValue" 
                  :min="0" 
                  controls-position="right"
                  :class="getColorClass(item.configKey)"
                />
                <el-button 
                  type="primary" 
                  size="small" 
                  icon="Check"
                  :loading="item.loading"
                  @click="saveConfig(item)"
                >保存</el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- DDOS 告警板块 -->
      <el-col :xs="24" :sm="24" :md="8">
        <el-card class="threshold-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Warning /></el-icon>
              <span>DDOS 告警阈值</span>
            </div>
          </template>
          <el-form label-position="top" v-loading="loading">
            <el-form-item v-for="item in configs.ddos" :key="item.id" :label="item.thresholdName">
              <div class="input-group">
                <el-input-number 
                  v-model="item.thresholdValue" 
                  :min="0" 
                  controls-position="right"
                  :class="getColorClass(item.configKey)"
                />
                <el-button 
                  type="primary" 
                  size="small" 
                  icon="Check"
                  :loading="item.loading"
                  @click="saveConfig(item)"
                >保存</el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 攻击对象板块 -->
      <el-col :xs="24" :sm="24" :md="8">
        <el-card class="threshold-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Aim /></el-icon>
              <span>攻击对象阈值</span>
            </div>
          </template>
          <el-form label-position="top" v-loading="loading">
            <el-form-item v-for="item in configs.object" :key="item.id" :label="item.thresholdName">
              <div class="input-group">
                <el-input-number 
                  v-model="item.thresholdValue" 
                  :min="0" 
                  controls-position="right"
                  :class="getColorClass(item.configKey)"
                />
                <el-button 
                  type="primary" 
                  size="small" 
                  icon="Check"
                  :loading="item.loading"
                  @click="saveConfig(item)"
                >保存</el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Timer, Warning, Aim, Check } from '@element-plus/icons-vue'
import request from '@/utils/request'

const loading = ref(false)
const configs = reactive({
  frequency: [],
  ddos: [],
  object: []
})

// 根据 configKey 后缀返回不同的色彩类名
const getColorClass = (key) => {
  if (key.endsWith('_high')) return 'color-danger'
  if (key.endsWith('_middle')) return 'color-warning'
  if (key.endsWith('_low')) return 'color-info'
  if (key.endsWith('_time')) return 'color-secondary'
  if (key === 'ddos_threshold') return 'color-danger'
  return ''
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/threshold/list')
    // 适配后端 res.data[0].thresholdList 或直接 res 结构
    const rawList = (res?.data && res.data[0]?.thresholdList) || res || []
    
    // 清空现有数据
    configs.frequency = []
    configs.ddos = []
    configs.object = []

    rawList.forEach(item => {
      const formattedItem = {
        ...item,
        thresholdValue: Number(item.thresholdValue),
        loading: false
      }

      if (item.configKey.startsWith('attack_frequency_')) {
        configs.frequency.push(formattedItem)
      } else if (item.configKey.startsWith('ddos_')) {
        configs.ddos.push(formattedItem)
      } else if (item.configKey.startsWith('attack_object_')) {
        configs.object.push(formattedItem)
      }
    })

    // 组内排序逻辑：窗口时间置顶 -> 高 -> 中 -> 低
    const order = ['_time', '_high', '_middle', '_low', 'ddos_threshold']
    const sortFn = (a, b) => {
      let aIdx = order.findIndex(o => a.configKey.endsWith(o))
      let bIdx = order.findIndex(o => b.configKey.endsWith(o))
      if (a.configKey === 'ddos_threshold') aIdx = 4
      if (b.configKey === 'ddos_threshold') bIdx = 4
      return aIdx - bIdx
    }
    configs.frequency.sort(sortFn)
    configs.ddos.sort(sortFn)
    configs.object.sort(sortFn)

  } catch (error) {
    console.error('加载阈值失败:', error)
  } finally {
    loading.value = false
  }
}

const saveConfig = async (item) => {
  item.loading = true
  try {
    // 调用更新接口
    await request.post(`/threshold/update/Threshold/${item.id}/${item.thresholdValue}`)
    ElMessage.success(`${item.thresholdName} 更新成功`)
  } catch (error) {
    ElMessage.error('更新失败')
  } finally {
    item.loading = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.threshold-container {
  padding: 24px;
  background-color: #f8fafc;
  min-height: calc(100vh - 84px);
}

.threshold-card {
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 24px;
}

.threshold-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  font-size: 16px;
  color: #1e293b;
}

.card-header .el-icon {
  font-size: 18px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 8px;
  border-radius: 8px;
}

.input-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input-group :deep(.el-input-number) {
  flex: 1;
}

/* 增强微交互动效 */
:deep(.el-input-number .el-input__wrapper) {
  transition: all 0.2s ease;
}

/* 高阈值：危险红 */
.color-danger :deep(.el-input__wrapper) {
  border-left: 4px solid #ef4444;
}
.color-danger :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #fee2e2 inset, 0 0 0 1px #ef4444 !important;
}

/* 中阈值：警示橙 */
.color-warning :deep(.el-input__wrapper) {
  border-left: 4px solid #f59e0b;
}
.color-warning :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #fef3c7 inset, 0 0 0 1px #f59e0b !important;
}

/* 低阈值：平衡蓝 */
.color-info :deep(.el-input__wrapper) {
  border-left: 4px solid #3b82f6;
}
.color-info :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #dbeafe inset, 0 0 0 1px #3b82f6 !important;
}

/* 窗口时间：中性灰 */
.color-secondary :deep(.el-input__wrapper) {
  border-left: 4px solid #64748b;
}
.color-secondary :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #f1f5f9 inset, 0 0 0 1px #64748b !important;
}

/* 复写 Form Item 样式 */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #64748b;
  margin-bottom: 4px !important;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style>
