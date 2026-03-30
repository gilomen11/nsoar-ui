<template>
  <div class="role-manage">
    <el-card>
      <div class="header-action">
        <el-input v-model="queryParams.roleName" placeholder="请输入角色名" clearable style="width: 200px" />
        <el-button type="primary" @click="fetchData">查询</el-button>
        <el-button type="success" @click="handleAdd">新增角色</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border style="width: 100%; margin-top: 15px;">
        <el-table-column prop="roleId" label="ID" width="80" align="center" />
        <el-table-column prop="roleName" label="角色名称" />
        <el-table-column prop="roleSign" label="角色标识" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column label="操作" width="250" align="center">
          <template #default="scope">
            <el-button size="small" type="success" link @click="handleAssign(scope.row)">分配权限</el-button>
            <el-button size="small" type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 角色表单 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="form" ref="formRef" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" />
        </el-form-item>
        <el-form-item label="角色标识" prop="roleSign">
          <el-input v-model="form.roleSign" />
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

    <!-- 分配权限树 -->
    <el-dialog title="分配权限" v-model="assignVisible" width="500px">
      <el-tree
        ref="treeRef"
        :data="menuList"
        show-checkbox
        node-key="id"
        :props="{ label: 'menuName', children: 'children' }"
        :default-checked-keys="checkedKeys"
      />
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const queryParams = reactive({ current: 1, pageSize: 10, roleName: '' })
const tableData = ref([])
const loading = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = reactive({ roleId: null, roleName: '', roleSign: '', remark: '' })

const assignVisible = ref(false)
const menuList = ref([])
const checkedKeys = ref([])
const currentRoleId = ref(null)
const treeRef = ref(null)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.post('/role/list', queryParams)
    tableData.value = res.raws || res.records || res.list || res || []
  } catch(e){} finally { loading.value = false }
}

const handleAdd = () => {
  dialogTitle.value = '新增角色'
  Object.assign(form, { roleId: null, roleName: '', roleSign: '', remark: '' })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑角色'
  Object.assign(form, row)
  dialogVisible.value = true
}

const submitForm = async () => {
  const url = form.roleId ? '/role/update' : '/role/insert'
  try {
    await request.post(url, form)
    ElMessage.success('操作成功')
    dialogVisible.value = false
    fetchData()
  } catch(e){}
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除角色?', '提示').then(async () => {
    await request.post('/role/delete', null, { params: { roleId: row.roleId } })
    ElMessage.success('删除成功')
    fetchData()
  })
}

const fetchMenuTree = async () => {
  try {
    const res = await request.post('/authorityTree/list', {})
    menuList.value = res || []
  } catch(e){}
}

const handleAssign = async (row) => {
  currentRoleId.value = row.roleId
  assignVisible.value = true
  // get existing role menu ids
  try {
    const res = await request.get(`/role/listRoleMenuIds?roleId=${row.roleId}`)
    checkedKeys.value = res || []
  } catch(e){}
}

const submitAssign = async () => {
  const keys = treeRef.value.getCheckedKeys()
  try {
    // 假设更新接口是 /role/update 带着 menuIds
    await request.post('/role/update', { roleId: currentRoleId.value, menuIds: keys })
    ElMessage.success('分配成功')
    assignVisible.value = false
  } catch(e){}
}

onMounted(() => {
  fetchData()
  fetchMenuTree()
})
</script>
