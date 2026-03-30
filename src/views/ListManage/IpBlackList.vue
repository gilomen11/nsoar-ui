<template>
  <div class="list-manage">
    <el-card>
      <div class="header-action">
        <el-input v-model="queryParams.ip" placeholder="请输入IP地址" clearable style="width: 200px" />
        <el-button type="primary" @click="fetchData">查询</el-button>
        <el-button type="success" @click="handleAdd">新增</el-button>
        <el-button type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">批量删除</el-button>
      </div>

      <el-table :data="tableData" @selection-change="handleSelectionChange" v-loading="loading" border style="width: 100%; margin-top: 15px;">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="ip" label="IP地址" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" align="center">
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

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="form" ref="formRef" :rules="rules" label-width="100px">
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="form.ip" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" />
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

const targetApi = '/ipBlack'

const queryParams = reactive({ current: 1, pageSize: 10, ip: '' })
const tableData = ref([])
const total = ref(0)
const loading = ref(false)
const selectedRows = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = reactive({ id: null, ip: '', remark: '' })
const formRef = ref(null)
const rules = { ip: [{ required: true, message: '必填项', trigger: 'blur' }] }

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.post(`${targetApi}/list`, queryParams)
    tableData.value = res.raws || res.records || res.list || res || []
    total.value = res.total || tableData.value.length
  } catch(e){} finally { loading.value = false }
}

const handleSelectionChange = (val) => { selectedRows.value = val }

const handleAdd = () => {
  dialogTitle.value = '新增IP黑名单'
  Object.assign(form, { id: null, ip: '', remark: '' })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑IP黑名单'
  Object.assign(form, row)
  dialogVisible.value = true
}

const submitForm = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    const url = form.id ? `${targetApi}/update` : `${targetApi}/insert`
    try {
      await request.post(url, form)
      ElMessage.success('操作成功')
      dialogVisible.value = false
      fetchData()
    } catch(e){}
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除?', '提示', { type: 'warning' }).then(async () => {
    try {
      await request.post(`${targetApi}/delete`, [row.id])
      ElMessage.success('删除成功')
      fetchData()
    }catch(e){}
  })
}

const handleBatchDelete = () => {
  if (!selectedRows.value.length) return
  ElMessageBox.confirm('确认批量删除选中的记录?', '提示', { type: 'warning' }).then(async () => {
    const ids = selectedRows.value.map(item => item.id)
    try {
      await request.post(`${targetApi}/delete`, ids)
      ElMessage.success('批量删除成功')
      fetchData()
    }catch(e){}
  })
}

onMounted(() => fetchData())
</script>

<style scoped>
.header-action { display: flex; gap: 10px; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
