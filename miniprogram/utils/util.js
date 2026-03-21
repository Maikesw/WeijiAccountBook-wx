// 通用工具函数

// 格式化日期
function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hour = d.getHours().toString().padStart(2, '0')
  const minute = d.getMinutes().toString().padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
}

// 格式化金额
function formatAmount(amount, decimals = 1) {
  return parseFloat(amount).toFixed(decimals)
}

// 获取月份天数
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

// 获取月份所有日期
function getDatesInMonth(year, month) {
  const days = getDaysInMonth(year, month)
  const dates = []
  for (let i = 1; i <= days; i++) {
    dates.push(`${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`)
  }
  return dates
}

// 防抖函数
function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 节流函数
function throttle(fn, interval = 300) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= interval) {
      last = now
      fn.apply(this, args)
    }
  }
}

// 显示提示
function showToast(title, icon = 'none') {
  wx.showToast({
    title,
    icon,
    duration: 2000
  })
}

// 显示加载
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  })
}

// 隐藏加载
function hideLoading() {
  wx.hideLoading()
}

// 确认对话框
function showConfirm(title, content) {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

module.exports = {
  formatDate,
  formatAmount,
  getDaysInMonth,
  getDatesInMonth,
  debounce,
  throttle,
  showToast,
  showLoading,
  hideLoading,
  showConfirm
}
