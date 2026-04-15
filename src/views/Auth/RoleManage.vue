<template>
  <div class="role-manage">
    <el-card>
      <div class="header-action">
        <el-input
          v-model="queryParams.roleName"
          placeholder="请输入角色名"
          clearable
          style="width: 200px; margin-right: 10px"
          @clear="fetchData"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button type="success" @click="handleAdd">+ 新增角色</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border style="width: 100%; margin-top: 15px;">
        <el-table-column prop="roleId" label="ID" width="80" align="center" />
        <el-table-column prop="roleName" label="角色名称" />
        <el-table-column prop="createTime" label="创建时间" width="200" align="center">
          <template #default="scope">
            {{ formatDateArray(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="200" align="center">
          <template #default="scope">
            {{ formatDateArray(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" align="center">
          <template #default="scope">
            <el-button size="small" type="success" link @click="handleAssign(scope.row)">分配权限</el-button>
            <el-button size="small" type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryParams.current"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 15px; justify-content: flex-end; display: flex;"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </el-card>

    <!-- 新增/编辑角色对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="420px" @close="resetForm">
      <el-form :model="form" ref="formRef" label-width="90px" :rules="formRules">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配权限对话框 -->
    <el-dialog title="分配权限" v-model="assignVisible" width="500px" @close="assignVisible = false">
      <div v-loading="treeLoading" style="min-height: 200px;">
        <el-tree
          v-if="menuList.length > 0"
          ref="treeRef"
          :data="menuList"
          show-checkbox
          node-key="id"
          :props="{ label: 'name', children: 'routes' }"
        />
        <el-empty v-else-if="!treeLoading" description="暂无权限数据" />
      </div>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" :loading="assignLoading" @click="submitAssign">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { formatDateArray } from '@/utils/format'

// ==================== 列表相关 ====================
const queryParams = reactive({ current: 1, pageSize: 10, roleName: '' })
const tableData = ref([])
const total = ref(0)
const loading = ref(false)

/**
 * 获取角色列表
 * POST /role/list  body: { current, pageSize }
 * 响应拦截器解包后: { total, records }
 */
const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.post('/role/list', {
      current: queryParams.current,
      pageSize: queryParams.pageSize
    })
    tableData.value = res?.raws ?? []
    total.value = res?.total ?? 0
  } catch (e) {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 按角色名查询角色
 * POST /role/findById?roleName=xxx
 * 响应拦截器解包后: { total, raws }
 */
const handleSearch = async () => {
  if (!queryParams.roleName) {
    fetchData()
    return
  }
  loading.value = true
  try {
    const res = await request.post('/role/findById', null, {
      params: { roleName: queryParams.roleName }
    })
    tableData.value = res?.raws ?? []
    total.value = res?.total ?? tableData.value.length
  } catch (e) {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// ==================== 新增/编辑相关 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const formRef = ref(null)
const form = reactive({ roleId: null, roleName: '' })

const formRules = {
  roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }]
}

const resetForm = () => {
  form.roleId = null
  form.roleName = ''
  formRef.value?.clearValidate()
}

const handleAdd = () => {
  dialogTitle.value = '新增角色'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑角色'
  form.roleId = row.roleId
  form.roleName = row.roleName
  dialogVisible.value = true
}

/**
 * 提交新增/编辑
 * 新增: POST /role/insert  body: { roleName }
 * 编辑: POST /role/update  body: { roleId, roleName }
 */
const submitForm = async () => {
  await formRef.value?.validate()
  submitLoading.value = true
  try {
    const url = form.roleId ? '/role/update' : '/role/insert'
    const payload = form.roleId
      ? { roleId: form.roleId, roleName: form.roleName }
      : { roleName: form.roleName }
    await request.post(url, payload)
    ElMessage.success('操作成功')
    dialogVisible.value = false
    fetchData()
  } catch (e) {
    // 错误已由拦截器统一提示
  } finally {
    submitLoading.value = false
  }
}

/**
 * 删除角色
 * POST /role/delete?roleId=xxx
 */
const handleDelete = (row) => {
  ElMessageBox.confirm(`确认删除角色「${row.roleName}」？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.post('/role/delete', null, { params: { roleId: row.roleId } })
      ElMessage.success('删除成功')
      // 如果删除的是当前页最后一条，自动回到上一页
      if (tableData.value.length === 1 && queryParams.current > 1) {
        queryParams.current--
      }
      fetchData()
    } catch (e) {}
  }).catch(() => {})
}

// ==================== 分配权限相关 ====================
const assignVisible = ref(false)
const treeLoading = ref(false)
const assignLoading = ref(false)
const menuList = ref([])
const checkedKeys = ref([])
const currentRoleId = ref(null)
const treeRef = ref(null)

/**
 * 点击"分配权限"按钮
 * 1. GET /role/listAllMenu          -> 全量权限树 (List<MenuVO>，子节点字段 routes，key: id)
 * 2. GET /role/listRoleMenuIds?roleId=xxx -> 已分配的 menuIds (RoleMenuVO.menuIds)
 */
const handleAssign = async (row) => {
  currentRoleId.value = row.roleId
  menuList.value = []
  checkedKeys.value = []
  assignVisible.value = true
  treeLoading.value = true

  try {
    // 并行请求，提升速度
    const [allMenus, roleMenuVO] = await Promise.all([
      request.get('/role/listAllMenu'),
      request.get('/role/listRoleMenuIds', { params: { roleId: row.roleId } })
    ])
    menuList.value = Array.isArray(allMenus) ? allMenus : []
    const ids = Array.isArray(roleMenuVO?.menuIds) ? roleMenuVO.menuIds : []
    checkedKeys.value = ids
    // 等 el-tree 渲染完成后，主动设置选中状态（default-checked-keys 仅初始化一次，不可靠）
    await nextTick()
    treeRef.value?.setCheckedKeys(ids)
  } catch (e) {
    menuList.value = []
    checkedKeys.value = []
  } finally {
    treeLoading.value = false
  }
}

/**
 * 保存权限分配
 * POST /role/updateRoleMenu  body: { roleId: int, menuId: List<Integer> }
 */
const submitAssign = async () => {
  if (!treeRef.value) return
  assignLoading.value = true
  try {
    const checkedKeys = treeRef.value.getCheckedKeys()
    const halfCheckedKeys = treeRef.value.getHalfCheckedKeys()
    // 同时提交半选中节点（父级），确保路由层级完整
    const menuId = [...new Set([...checkedKeys, ...halfCheckedKeys])]
    await request.post('/role/updateRoleMenu', {
      roleId: currentRoleId.value,
      menuId
    })
    ElMessage.success('权限分配成功')
    assignVisible.value = false
  } catch (e) {
    // 错误已由拦截器统一提示
  } finally {
    assignLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
