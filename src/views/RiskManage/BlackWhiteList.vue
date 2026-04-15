<template>
  <div class="list-manage">
    <el-card>
      <div class="header-action">
        <el-input v-model="queryParams.ip" placeholder="IP地址" clearable style="width: 150px" />
        <el-select v-model="queryParams.type" placeholder="名单类型" clearable style="width: 120px">
          <el-option label="白名单" :value="1" />
          <el-option label="黑名单" :value="0" />
        </el-select>
        <el-select v-model="queryParams.riskLevel" placeholder="风险等级" clearable style="width: 120px">
          <el-option label="低危" value="LOW" />
          <el-option label="中危" value="MEDIUM" />
          <el-option label="高危" value="HIGH" />
          <el-option label="严重" value="CRITICAL" />
        </el-select>
        
        <el-button type="primary" @click="fetchData">查询</el-button>
        <el-button type="success" @click="handleAdd">新增策略</el-button>
        <el-button type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">批量解封/删除</el-button>
        <el-button type="warning" @click="handleExport">导出 Excel</el-button>
      </div>

      <el-table :data="tableData" @selection-change="handleSelectionChange" v-loading="loading" border style="width: 100%; margin-top: 15px;">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="ip" label="受控IP" width="130" />
        <el-table-column prop="type" label="名单类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'success' : 'danger'">
              {{ row.type === 1 ? '白名单' : '黑名单' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="riskLevel" label="最高风险" width="100" align="center" />
        <el-table-column prop="tags" label="原因标签" show-overflow-tooltip />
        <el-table-column prop="createTime" label="录入时间" width="170" align="center">
          <template #default="{ row }">
            {{ parseTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="170" align="center">
          <template #default="{ row }">
            {{ parseTime(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">拉出/解封</el-button>
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
        <el-form-item label="管控IP" prop="ip">
          <el-input v-model="form.ip" />
        </el-form-item>
        <el-form-item label="策略类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio :label="1">白名单</el-radio>
            <el-radio :label="0">黑名单</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="风险等级" prop="riskLevel">
          <el-select v-model="form.riskLevel" placeholder="选择风险等级" style="width: 100%">
            <el-option label="低危" value="LOW" />
            <el-option label="中危" value="MEDIUM" />
            <el-option label="高危" value="HIGH" />
            <el-option label="严重" value="CRITICAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="限制原因" prop="tags">
          <el-input v-model="form.tags" type="textarea" :rows="3" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import axios from 'axios'
import { parseTime } from '@/utils/format'

const targetApi = '/blackWhiteList'

const queryParams = reactive({
  page: 1,
  size: 10,
  ip: '',
  type: null,
  riskLevel: ''
})

const tableData = ref([])
const total = ref(0)
const loading = ref(false)
const selectedRows = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = reactive({ id: null, ip: '', type: 0, riskLevel: 'LOW', tags: '' })
const formRef = ref(null)
const rules = {
  ip: [{ required: true, message: '请输入受控IP', trigger: 'blur' }],
  type: [{ required: true, message: '请选择策略类型', trigger: 'change' }],
  riskLevel: [{ required: true, message: '请选择风险等级', trigger: 'change' }]
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
  dialogTitle.value = '新增管控策略'
  Object.assign(form, { id: null, ip: '', type: 0, riskLevel: 'LOW', tags: '' })
  if (formRef.value) formRef.value.clearValidate()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑管控策略'
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

// 注意这里使用 params 参数处理 @RequestParam List<Integer> ids
const doDelete = async (ids) => {
  try {
    await request.delete(`${targetApi}/removeByIdsList`, {
      params: { ids: ids.join(',') }
    })
    ElMessage.success('移除成功')
    fetchData()
  } catch (e) {}
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认移除该名单设置?', '提示', { type: 'warning' }).then(() => {
    doDelete([row.id])
  })
}

const handleBatchDelete = () => {
  if (!selectedRows.value.length) return
  ElMessageBox.confirm('确认批量移除选中的名单设置?', '提示', { type: 'warning' }).then(() => {
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
    
    let fileName = '黑白名单.xlsx'
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
