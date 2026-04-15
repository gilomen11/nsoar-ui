<template>
  <div class="list-manage">
    <el-card>
      <div class="header-action">
        <el-input v-model="queryParams.ip" placeholder="IP地址" clearable style="width: 150px" />
        <el-select v-model="queryParams.riskLevel" placeholder="风险等级" clearable style="width: 120px">
          <el-option label="低危" value="LOW" />
          <el-option label="中危" value="MEDIUM" />
          <el-option label="高危" value="HIGH" />
          <el-option label="严重" value="CRITICAL" />
        </el-select>
        <el-input v-model="queryParams.triggerReason" placeholder="触发原因" clearable style="width: 150px" />
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 350px"
        />
        <el-button type="primary" @click="fetchData">查询</el-button>
        <el-button type="success" @click="handleAdd">新增模拟数据</el-button>
        <el-button type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">批量删除</el-button>
        <el-button type="warning" @click="handleExport">导出 Excel</el-button>
      </div>

      <el-table :data="tableData" @selection-change="handleSelectionChange" v-loading="loading" border style="width: 100%; margin-top: 15px;">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="ip" label="来访IP" width="130" />
        <el-table-column prop="requestPath" label="访问路径" show-overflow-tooltip min-width="150" />
        <el-table-column prop="frequency" label="频次" width="80" align="center" />
        <el-table-column prop="riskLevel" label="风险等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRiskLevelType(row.riskLevel)">{{ getRiskLevelLabel(row.riskLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="triggerReason" label="触发原因" show-overflow-tooltip min-width="150" />
        <el-table-column prop="userAgent" label="UserAgent" show-overflow-tooltip min-width="150" />
        <el-table-column label="告警时间" width="180" align="center">
          <template #default="{ row }">
            {{ parseTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :total="total"
          @current-change="fetchData"
          @size-change="fetchData"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
        />
      </div>
    </el-card>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="form" ref="formRef" :rules="rules" label-width="100px">
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="form.ip" placeholder="请输入IP地址" />
        </el-form-item>
        <el-form-item label="访问路径" prop="requestPath">
          <el-input v-model="form.requestPath" placeholder="例如: /api/login" />
        </el-form-item>
        <el-form-item label="访问频次" prop="frequency">
          <el-input-number v-model="form.frequency" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="风险等级" prop="riskLevel">
          <el-select v-model="form.riskLevel" style="width: 100%">
            <el-option label="低危" value="LOW" />
            <el-option label="中危" value="MEDIUM" />
            <el-option label="高危" value="HIGH" />
            <el-option label="严重" value="CRITICAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发原因" prop="triggerReason">
          <el-input v-model="form.triggerReason" placeholder="请输入触发原因" />
        </el-form-item>
        <el-form-item label="UserAgent" prop="userAgent">
          <el-input v-model="form.userAgent" type="textarea" :rows="2" placeholder="浏览器标识" />
        </el-form-item>
        <el-form-item label="详细内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="告警Payload详情" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import axios from 'axios'

const targetApi = '/alertRecord'

const queryParams = reactive({
  page: 1,
  size: 10,
  ip: '',
  riskLevel: '',
  triggerReason: '',
  startTime: '',
  endTime: ''
})

const dateRange = ref([])
watch(dateRange, (val) => {
  if (val && val.length === 2) {
    queryParams.startTime = val[0]
    queryParams.endTime = val[1]
  } else {
    queryParams.startTime = ''
    queryParams.endTime = ''
  }
})

const tableData = ref([])
const total = ref(0)
const loading = ref(false)
const selectedRows = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = reactive({
  id: null,
  ip: '',
  requestPath: '',
  frequency: 1,
  riskLevel: 'LOW',
  triggerReason: '',
  userAgent: '',
  content: ''
})
const formRef = ref(null)
const rules = {
  ip: [{ required: true, message: '请输入IP地址', trigger: 'blur' }],
  requestPath: [{ required: true, message: '请输入访问路径', trigger: 'blur' }],
  riskLevel: [{ required: true, message: '请选择风险等级', trigger: 'change' }]
}

const getRiskLevelType = (level) => {
  const map = { LOW: 'info', MEDIUM: 'warning', HIGH: 'danger', CRITICAL: 'danger' }
  return map[level] || 'info'
}

const getRiskLevelLabel = (level) => {
  const map = { LOW: '低危', MEDIUM: '中危', HIGH: '高危', CRITICAL: '严重' }
  return map[level] || level
}

const parseTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  const h = date.getHours().toString().padStart(2, '0')
  const i = date.getMinutes().toString().padStart(2, '0')
  const s = date.getSeconds().toString().padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${i}:${s}`
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.get(`${targetApi}/page`, { params: queryParams })
    tableData.value = res.records || res.list || []
    total.value = res.total || 0
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (val) => {
  selectedRows.value = val
}

const handleAdd = () => {
  dialogTitle.value = '新增模拟告警'
  Object.assign(form, {
    id: null,
    ip: '',
    requestPath: '',
    frequency: 1,
    riskLevel: 'LOW',
    triggerReason: '',
    userAgent: '',
    content: ''
  })
  if (formRef.value) formRef.value.clearValidate()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑告警记录'
  Object.assign(form, row)
  if (formRef.value) formRef.value.clearValidate()
  dialogVisible.value = true
}

const submitForm = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    try {
      await request.post(`${targetApi}/addOrUpdate`, form)
      ElMessage.success('操作成功')
      dialogVisible.value = false
      fetchData()
    } catch (e) {}
  })
}

// 注意这里显式处理参数序列化，确保 ids=1&ids=2 格式
const doDelete = async (ids) => {
  try {
    const params = new URLSearchParams()
    ids.forEach(id => params.append('ids', id))
    await request.delete(`${targetApi}/removeByIdsList`, { params })
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {}
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该记录?', '提示', { type: 'warning' }).then(() => {
    doDelete([row.id])
  })
}

const handleBatchDelete = () => {
  if (!selectedRows.value.length) return
  ElMessageBox.confirm('确认批量删除选中的记录?', '提示', { type: 'warning' }).then(() => {
    const ids = selectedRows.value.map(item => item.id)
    doDelete(ids)
  })
}

const handleExport = async () => {
  ElMessage.info('正在导出，请稍候...')
  try {
    const baseURL = request.defaults.baseURL
    const token = localStorage.getItem('token') || ''
    
    // axios blob download
    const res = await axios.get(baseURL + `${targetApi}/export`, {
      params: queryParams,
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const blob = new Blob([res.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 从响应头获取文件名或采用默认
    let fileName = '风险告警导出.xlsx'
    const dispos = res.headers['content-disposition']
    if (dispos && dispos.indexOf('filename*=utf-8\'\'') > -1) {
      fileName = decodeURI(dispos.split('filename*=utf-8\'\'')[1])
    }
    
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

onMounted(() => fetchData())
</script>

<style scoped>
.header-action { display: flex; gap: 10px; flex-wrap: wrap; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
