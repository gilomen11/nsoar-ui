import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 过滤普通对象中的空值(null, undefined, '')
const filterEmptyParams = (obj) => {
  if (Object.prototype.toString.call(obj) !== '[object Object]') {
    return obj;
  }
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== null && value !== undefined && value !== '') {
        result[key] = value;
      }
    }
  }
  return result;
}

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    // 过滤请求参数中的空字段
    if (config.params) {
      config.params = filterEmptyParams(config.params)
    }
    if (config.data) {
      config.data = filterEmptyParams(config.data)
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    // 依据 ApiResult 结构, 我们假设通常200为成功
    if (res.code && res.code !== 200) {
      ElMessage.error(res.msg || 'Error')
      if (res.code === 401) {
         localStorage.removeItem('token')
         window.location.href = '/login'
      }
      return Promise.reject(new Error(res.msg || 'Error'))
    }
    // 有些接口直接返回实体或无明确code，就兼容处理
    return res.data !== undefined ? res.data : res
  },
  error => {
    ElMessage.error(error.message || '网络异常')
    return Promise.reject(error)
  }
)

export default request
