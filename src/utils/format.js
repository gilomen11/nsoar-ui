/**
 * 将后端返回的 LocalDateTime 数组格式化为 yyyy-MM-dd HH:mm:ss
 * @param {Array} dateArr [year, month, day, hour, minute, second]
 * @returns {string} 格式化后的日期字符串
 */
export function formatDateArray(dateArr) {
  if (!dateArr || !Array.isArray(dateArr) || dateArr.length < 3) {
    return dateArr || ''
  }

  // 解构赋值，并设置默认值
  const [year, month, day, hour = 0, minute = 0, second = 0] = dateArr

  /**
   * 数字补零
   * @param {number} num 
   * @returns {string}
   */
  const pad = (num) => String(num).padStart(2, '0')

  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`
}

/**
 * 将时间戳、日期对象或数组格式化为 yyyy-MM-dd HH:mm:ss
 * @param {number|string|Array|Date} time 
 * @returns {string} 格式化后的字符串
 */
export function parseTime(time) {
  if (!time) return ''

  // 处理数组格式 (LocalDateTime)
  if (Array.isArray(time)) {
    return formatDateArray(time)
  }

  const date = new Date(time)
  if (isNaN(date.getTime())) return time

  const pad = (num) => String(num).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  const second = pad(date.getSeconds())

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}
