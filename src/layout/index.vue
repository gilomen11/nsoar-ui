<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
      <div class="logo">
        <span v-show="!isCollapse">NSOAR Admin</span>
      </div>
      <el-menu
        :default-active="route.path"
        background-color="#191a23"
        text-color="#fff"
        active-text-color="#409eff"
        :collapse="isCollapse"
        router
      >
        <template v-for="item in userStore.menus" :key="item.path">
          <!-- 父菜单，有子节点 -->
          <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.path">
            <template #title>
              <el-icon>
                <component :is="getIcon(item.path)" />
              </el-icon>
              <span>{{ item.name }}</span>
            </template>
            <el-menu-item 
              v-for="sub in item.children" 
              :key="sub.path" 
              :index="sub.path"
            >
              {{ sub.name }}
            </el-menu-item>
          </el-sub-menu>
          
          <!-- 一级菜单，无子节点 -->
          <el-menu-item v-else :index="item.path">
            <el-icon>
              <component :is="getIcon(item.path)" />
            </el-icon>
            <template #title>{{ item.name }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button text @click="isCollapse = !isCollapse">
            <el-icon><fold v-if="!isCollapse" /><expand v-else /></el-icon>
          </el-button>
          <h2>安全分析与响应平台</h2>
        </div>
        <div class="header-right">
          <el-button text @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import {
  User, Setting, Tools, List, Fold, Expand, Menu
} from '@element-plus/icons-vue'

const getIcon = (path) => {
  if (!path) return 'Menu'
  if (path.includes('/user')) return 'User'
  if (path.includes('/role')) return 'Setting'
  if (path.includes('/config')) return 'Tools'
  if (path.includes('/list')) return 'List'
  return 'Menu'
}

const isCollapse = ref(false)
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  background-color: #f0f2f5;
}
.aside {
  background-color: #191a23;
  transition: width 0.3s;
  overflow: hidden;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background-color: #101117;
}
.el-menu {
  border-right: none;
}
.header {
  height: 60px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.header-left h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}
.main {
  background-color: #f0f2f5;
  padding: 20px;
  box-sizing: border-box;
}
</style>
