<template>
  <div class="user-manage">
    <el-card>
      <div class="header-action">
        <el-input v-model="queryParams.username" placeholder="用户名" clearable style="width: 150px" />
        <el-input v-model="queryParams.nickname" placeholder="昵称" clearable style="width: 150px" />
        <el-select v-model="queryParams.state" placeholder="状态" clearable style="width: 120px">
          <el-option label="开启" value="开启" />
          <el-option label="停用" value="停用" />
        </el-select>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button type="success" @click="handleAdd">新增用户</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border style="width: 100%; margin-top: 15px;">
        <el-table-column prop="userId" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="nickname" label="用户昵称" />
        <el-table-column prop="roleId" label="角色ID" width="100" align="center" />
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
        <el-table-column prop="expiredTime" label="过期时间" width="180" />
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
          layout="total, prev, pager, next"
        />
      </div>
    </el-card>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="form" ref="formRef" :rules="rules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="roleName">
          <el-select v-model="form.roleName" placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="item in roleList"
              :key="item.roleId"
              :label="item.roleName"
              :value="item.roleName"
            />
          </el-select>
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

const queryParams = reactive({ 
  current: 1, 
  pageSize: 10, 
  username: '', 
  nickname: '', 
  state: '' 
})
const tableData = ref([])
const total = ref(0)
const loading = ref(false)
const roleList = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = reactive({ 
  userId: null, 
  username: '', 
  nickname: '', 
  password: '', 
  roleName: '',
  state: '开启'
})
const formRef = ref(null)
const rules = {
  username: [{ required: true, message: '必填项', trigger: 'blur' }],
  nickname: [{ required: true, message: '必填项', trigger: 'blur' }],
  password: [{ required: true, message: '必填项', trigger: 'blur' }],
  roleName: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const loadRoleList = async () => {
  try {
    const res = await request.post('/role/list', { current: 1, pageSize: 100 })
    roleList.value = res.rows || res.records || res.raws || res.data?.rows || res.data?.records || res.data?.raws || []
  } catch (error) {
    console.error('加载角色列表失败', error)
  }
}

const handleQuery = () => {
  queryParams.current = 1
  fetchData()
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.post('/user/list', queryParams)
    // 适配 ListSoarResult 结构
    const data = res.data || res
    tableData.value = data.rows || data.records || data.raws || []
    total.value = data.total || 0
  } catch (error) {
    console.error('获取用户列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增用户'
  Object.assign(form, { 
    userId: null, 
    username: '', 
    nickname: '', 
    password: '', 
    roleName: '', 
    state: '开启' 
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑用户'
  Object.assign(form, {
    userId: row.userId,
    username: row.username,
    nickname: row.nickname,
    password: row.password || '', 
    roleName: '', 
    state: row.state
  })
  // 尝试匹配角色名
  const role = roleList.value.find(r => r.roleId === row.roleId)
  if (role) {
    form.roleName = role.roleName
  }
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
  loadRoleList()
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
