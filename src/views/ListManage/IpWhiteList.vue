<template>
  <div class="list-manage">
    <el-card>
      <div class="header-action">
        <el-input v-model="queryParams.srcIp" placeholder="请输入源IP地址" clearable style="width: 200px" />
        <el-select v-model="queryParams.type" placeholder="类型" clearable style="width: 130px">
          <el-option label="原始数据" :value="0" />
          <el-option label="告警" :value="1" />
          <el-option label="DNS" :value="2" />
          <el-option label="编排" :value="3" />
        </el-select>
        <el-select v-model="queryParams.enable" placeholder="状态" clearable style="width: 100px">
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
        <el-button type="primary" @click="fetchData">查询</el-button>
        <el-button type="success" @click="handleAdd">新增</el-button>
        <el-button type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">批量删除</el-button>
      </div>

      <el-table :data="tableData" @selection-change="handleSelectionChange" v-loading="loading" border style="width: 100%; margin-top: 15px;">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="srcIp" label="源IP" min-width="130" />
        <el-table-column prop="srcPort" label="源端口" width="90" align="center" />
        <el-table-column prop="dstIp" label="目的IP" min-width="130" />
        <el-table-column prop="dstPort" label="目的端口" width="90" align="center" />
        <el-table-column prop="dateType" label="协议类型" width="100" align="center" />
        <el-table-column prop="type" label="类型" width="90" align="center">
          <template #default="scope">
            <el-tag :type="typeTagMap[scope.row.type]?.tag || 'info'" size="small">
              {{ typeTagMap[scope.row.type]?.label ?? '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enable" label="状态" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.enable === 1 ? 'success' : 'danger'" size="small">
              {{ scope.row.enable === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="120" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="更新时间" width="175">
          <template #default="scope">
            {{ formatDateArray(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.current"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          @current-change="fetchData"
          layout="prev, pager, next"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="540px" destroy-on-close>
      <el-form :model="form" ref="formRef" :rules="rules" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="源IP" prop="srcIp">
              <el-input v-model="form.srcIp" placeholder="如 192.168.1.1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="源端口" prop="srcPort">
              <el-input-number v-model="form.srcPort" :min="0" :max="65535" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目的IP" prop="dstIp">
              <el-input v-model="form.dstIp" placeholder="如 10.0.0.1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目的端口" prop="dstPort">
              <el-input-number v-model="form.dstPort" :min="0" :max="65535" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="协议类型" prop="dateType">
              <el-input v-model="form.dateType" placeholder="如 TCP / UDP" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择" style="width:100%">
                <el-option label="原始数据" :value="0" />
                <el-option label="告警" :value="1" />
                <el-option label="DNS" :value="2" />
                <el-option label="编排" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="enable">
              <el-select v-model="form.enable" placeholder="请选择" style="width:100%">
                <el-option label="启用" :value="1" />
                <el-option label="停用" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
        </el-row>
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
import { formatDateArray } from '@/utils/format'

const targetApi = '/ipWhite'

// 类型标签映射
const typeTagMap = {
  0: { label: '原始数据', tag: '' },
  1: { label: '告警', tag: 'danger' },
  2: { label: 'DNS', tag: 'warning' },
  3: { label: '编排', tag: 'success' },
}

// 空表单模板
const emptyForm = () => ({
  id: null,
  srcIp: '',
  srcPort: null,
  dstIp: '',
  dstPort: null,
  dateType: '',
  type: null,
  enable: 1,
  description: '',
})

const queryParams = reactive({ current: 1, pageSize: 10, srcIp: '', type: null, enable: null })
const tableData = ref([])
const total = ref(0)
const loading = ref(false)
const selectedRows = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = reactive(emptyForm())
const formRef = ref(null)

const rules = {
  srcIp: [{ required: true, message: '源IP为必填项', trigger: 'blur' }],
  type:  [{ required: true, message: '类型为必填项', trigger: 'change' }],
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.post(`${targetApi}/list`, queryParams)
    // 兼容后端 Page 结构
    const page = res?.data ?? res ?? {}
    tableData.value = page.records ?? page.list ?? page.raws ?? []
    total.value = page.total ?? tableData.value.length
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (val) => {
  selectedRows.value = val
}

const handleAdd = () => {
  dialogTitle.value = '新增IP白名单'
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑IP白名单'
  Object.assign(form, emptyForm(), row)
  dialogVisible.value = true
}

// 格式化当前时间为 yyyy-MM-dd HH:mm:ss
const nowFormatted = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    const url = form.id ? `${targetApi}/update` : `${targetApi}/insert`

    // 解构排除后端不识别的时间字段，避免 Jackson 反序列化报错
    const { createTime, updateTime, ...submitData } = form

    try {
      await request.post(url, submitData)
      ElMessage.success('操作成功')
      dialogVisible.value = false
      fetchData()
    } catch (e) {
      console.error(e)
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该条记录?', '提示', { type: 'warning' }).then(async () => {
    try {
      await request.post(`${targetApi}/delete`, [row.id])
      ElMessage.success('删除成功')
      fetchData()
    } catch (e) {
      console.error(e)
    }
  })
}

const handleBatchDelete = () => {
  if (!selectedRows.value.length) return
  ElMessageBox.confirm(`确认批量删除选中的 ${selectedRows.value.length} 条记录?`, '提示', { type: 'warning' }).then(async () => {
    const ids = selectedRows.value.map((item) => item.id)
    try {
      await request.post(`${targetApi}/delete`, ids)
      ElMessage.success('批量删除成功')
      fetchData()
    } catch (e) {
      console.error(e)
    }
  })
}

onMounted(() => fetchData())
</script>

<style scoped>
.header-action { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
