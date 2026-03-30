<template>
  <div class="system-setting">
    <el-tabs v-model="activeName">
      <el-tab-pane label="基础设置" name="basic">
        <el-card>
          <el-form label-width="150px" v-loading="loadingBasic">
            <el-form-item v-for="item in basicConfigs" :key="item.id" :label="item.name">
              <el-input v-model="item.value" style="width: 300px" />
              <el-button type="primary" style="margin-left: 10px;" @click="updateBasicItem(item)">保存</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="ElasticSearch 配置" name="es">
        <el-card>
          <el-form :model="esForm" label-width="150px" v-loading="loadingEs">
            <el-form-item label="主节点IP">
              <el-input v-model="esForm.ip" style="width: 300px" />
            </el-form-item>
            <el-form-item label="端口">
              <el-input v-model="esForm.port" style="width: 300px" />
            </el-form-item>
            <el-form-item label="用户名">
              <el-input v-model="esForm.username" style="width: 300px" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="esForm.password" style="width: 300px" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveEsConfig">保存ES配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const activeName = ref('basic')
const basicConfigs = ref([])
const loadingBasic = ref(false)

const esForm = reactive({ ip: '', port: '', username: '', password: '' })
const loadingEs = ref(false)

const loadBasic = async () => {
  loadingBasic.value = true
  try {
    const res = await request.get('/config/list')
    basicConfigs.value = res || []
  } catch(e){} finally { loadingBasic.value = false }
}

const updateBasicItem = async (item) => {
  try {
    await request.post('/config/update', { id: item.id, value: item.value })
    ElMessage.success('配置更新成功')
  } catch(e){}
}

const loadEs = async () => {
  loadingEs.value = true
  try {
    const res = await request.get('/config/list/esConfig')
    Object.assign(esForm, res || {})
  } catch(e){} finally { loadingEs.value = false }
}

const saveEsConfig = async () => {
  try {
    await request.post('/config/update/esConfig', esForm)
    ElMessage.success('ES配置保存成功')
  } catch(e){}
}

onMounted(() => {
  loadBasic()
  loadEs()
})
</script>
