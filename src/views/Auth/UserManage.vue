<template>
  <div class="user-manage">
    <el-card>
      <div class="header-action">
        <el-input v-model="queryParams.username" placeholder="请输入用户名" clearable style="width: 200px" />
        <el-button type="primary" @click="fetchData">查询</el-button>
        <el-button type="success" @click="handleAdd">新增用户</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border style="width: 100%; margin-top: 15px;">
        <el-table-column prop="userId" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="realName" label="真实姓名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="state" label="状态" width="100" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.state"
              active-value="开启"
              inactive-value="停用"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" align="center">
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
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!form.userId">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const queryParams = reactive({ current: 1, pageSize: 10, username: '' })
const tableData = ref([])
const total = ref(0)
const loading = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = reactive({ userId: null, username: '', realName: '', password: '', email: '' })
const formRef = ref(null)
const rules = {
  username: [{ required: true, message: '必填项', trigger: 'blur' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.post('/user/list', queryParams)
    tableData.value = res.raws || res.records || res.list || res || []
    total.value = res.total || tableData.value.length
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增用户'
  Object.assign(form, { userId: null, username: '', realName: '', password: '', email: '' })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑用户'
  Object.assign(form, row)
  dialogVisible.value = true
}

const submitForm = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    const url = form.userId ? '/user/update' : '/user/insert'
    try {
      await request.post(url, form)
      ElMessage.success('操作成功')
      dialogVisible.value = false
      fetchData()
    } catch (e) {}
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该用户吗?', '提示', { type: 'warning' }).then(async () => {
    try {
      await request.post('/user/delete', null, { params: { userId: row.userId } })
      ElMessage.success('删除成功')
      fetchData()
    } catch(e){}
  })
}

const handleStatusChange = async (row) => {
  try {
    await request.post('/user/update/enable', { userId: row.userId, state: row.state })
    ElMessage.success('状态更新成功')
  } catch (e) {
    row.state = row.state === "开启" ? "停用" : "开启" // revert
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.header-action {
  display: flex;
  gap: 10px;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
