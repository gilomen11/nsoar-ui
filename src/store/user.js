import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null,
    menus: []
  }),
  actions: {
    setToken(val) {
      this.token = val
      localStorage.setItem('token', val)
    },
    logout() {
      this.token = ''
      localStorage.removeItem('token')
      this.userInfo = null
      this.menus = []
    }
  }
})
