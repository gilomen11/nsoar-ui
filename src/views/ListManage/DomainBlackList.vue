<template>
  <div class="list-manage">
    <el-card shadow="never" class="list-card">
      <!-- 搜索栏 -->
      <div class="header-action">
        <el-input 
          v-model="queryParams.domainName" 
          placeholder="请输入域名" 
          clearable 
          style="width: 200px" 
          @keyup.enter="fetchData"
        />
        <el-input 
          v-model="queryParams.domainDesc" 
          placeholder="请输入备注" 
          clearable 
          style="width: 200px" 
          @keyup.enter="fetchData"
        />
        <el-select v-model="queryParams.enable" placeholder="启用状态" clearable style="width: 120px">
          <el-option label="全部" :value="undefined" />
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        
        <!-- 时间范围选择器 -->
        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 360px"
          @change="handleTimeChange"
        />

        <div class="button-group">
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="success" @click="handleAdd">新增</el-button>
          <el-button 
            type="danger" 
            :disabled="!selectedRows.length" 
            @click="handleBatchDelete"
          >批量删除</el-button>
        </div>
      </div>

      <!-- 表格区域 -->
      <el-table 
        :data="tableData" 
        @selection-change="handleSelectionChange" 
        v-loading="loading" 
        border 
        stripe
        style="width: 100%; margin-top: 15px;"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="domainName" label="域名" min-width="160" show-overflow-tooltip />
        <el-table-column prop="domainDesc" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="enable" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.enable === 1 ? 'success' : 'info'" size="small">
              {{ scope.row.enable === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" align="center" />
        <el-table-column prop="updateTime" label="更新时间" width="170" align="center" />
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-tooltip content="删除该域名" placement="top">
              <el-button size="small" type="danger" link @click="handleDelete(scope.row)">删除</el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.current"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="fetchData"
          @current-change="fetchData"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px" destroy-on-close>
      <el-form :model="form" ref="formRef" :rules="rules" label-width="100px">
        <el-form-item label="域名" prop="domainName">
          <el-input v-model="form.domainName" placeholder="示例: example.com" />
        </el-form-item>
        <el-form-item label="备注" prop="domainDesc">
          <el-input 
            v-model="form.domainDesc" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入规则描述信息" 
          />
        </el-form-item>
        <el-form-item label="状态" prop="enable">
          <el-radio-group v-model="form.enable">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
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

const targetApi = '/blackDomain'

// 空表单模板，确保数据结构清晰
const emptyForm = () => ({
  id: null,
  domainName: '',
  domainDesc: '',
  enable: 1
})

const queryParams = reactive({ 
  current: 1, 
  pageSize: 10, 
  domainName: '', 
  domainDesc: '', 
  enable: undefined,
  startTime: '',
  endTime: ''
})

const timeRange = ref([])
const tableData = ref([])
const total = ref(0)
const loading = ref(false)
const selectedRows = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = reactive(emptyForm())
const formRef = ref(null)

const rules = { 
  domainName: [
    { required: true, message: '请输入域名', trigger: 'blur' },
    { pattern: /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/, message: '域名格式不正确', trigger: 'blur' }
  ]
}

// 处理时间范围变化
const handleTimeChange = (val) => {
  if (val) {
    queryParams.startTime = val[0]
    queryParams.endTime = val[1]
  } else {
    queryParams.startTime = ''
    queryParams.endTime = ''
  }
}

// 重置查询
const resetQuery = () => {
  Object.assign(queryParams, {
    current: 1,
    domainName: '',
    domainDesc: '',
    enable: undefined,
    startTime: '',
    endTime: ''
  })
  timeRange.value = []
  fetchData()
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request({ 
      method: 'get', 
      url: `${targetApi}/list`, 
      params: queryParams 
    })
    // 适配后端 ListResult 结构 (raws, total)
    tableData.value = res.raws || []
    total.value = res.total || 0
  } catch(e){
    console.error('Fetch data failed:', e)
  } finally { 
    loading.value = false 
  }
}

const handleSelectionChange = (val) => { selectedRows.value = val }

const handleAdd = () => {
  dialogTitle.value = '新增域名黑名单'
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑域名黑名单'
  // 仅复制 DTO 关注的字段，避免传入多余字段
  Object.assign(form, emptyForm(), row)
  dialogVisible.value = true
}

const submitForm = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    
    // 参数清洗：解构排除前端 VO/多余字段，仅保留 DTO 所需字段
    const { id, createTime, updateTime, ...submitData } = form
    
    try {
      if (form.id) {
        // 更新接口：传递补回 ID 后的 DTO 对象
        await request.put(`${targetApi}/update`, { id: form.id, ...submitData })
      } else {
        // 新增接口：传递不含 ID 的 DTO 列表（批量插入接口）
        await request.post(`${targetApi}/batch-insert`, [submitData])
      }
      ElMessage.success('操作成功')
      dialogVisible.value = false
      fetchData()
    } catch(e){
      console.error('Submit failed:', e)
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认彻底删除该域名记录?', '警告', { 
    type: 'error',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    confirmButtonClass: 'el-button--danger'
  }).then(async () => {
    try {
      await request.delete(`${targetApi}/delete/${row.id}`)
      ElMessage.success('删除成功')
      fetchData()
    }catch(e){}
  })
}

const handleBatchDelete = () => {
  if (!selectedRows.value.length) return
  ElMessageBox.confirm(`确认批量删除选中的 ${selectedRows.value.length} 条域名记录?`, '警告', { 
    type: 'error',
    confirmButtonText: '全部删除',
    cancelButtonText: '取消',
    confirmButtonClass: 'el-button--danger'
  }).then(async () => {
    const ids = selectedRows.value.map(item => item.id)
    try {
      // 后端目前仅支持单个删除，前端循环调用保持交互一致
      const deletePromises = ids.map(id => request.delete(`${targetApi}/delete/${id}`))
      await Promise.all(deletePromises)
      ElMessage.success('批量删除成功')
      fetchData()
    }catch(e){}
  })
}

onMounted(() => fetchData())
</script>

<style scoped>
.list-manage { padding: 5px; }
.header-action { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 5px; align-items: center; }
.button-group { margin-left: auto; display: flex; gap: 10px; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
.list-card { border-radius: 8px; }
</style>
