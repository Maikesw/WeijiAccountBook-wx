// 通用工具函数 - ES5版本

// 格式化日期
function formatDate(date, format) {
  format = format || 'YYYY-MM-DD'
  var d = new Date(date)
  var year = d.getFullYear()
  var month = (d.getMonth() + 1).toString()
  if (month.length < 2) month = '0' + month
  var day = d.getDate().toString()
  if (day.length < 2) day = '0' + day
  var hour = d.getHours().toString()
  if (hour.length < 2) hour = '0' + hour
  var minute = d.getMinutes().toString()
  if (minute.length < 2) minute = '0' + minute

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
}

// 格式化金额
function formatAmount(amount, decimals) {
  decimals = decimals === undefined ? 1 : decimals
  return parseFloat(amount).toFixed(decimals)
}

// 获取月份天数
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

// 获取月份所有日期
function getDatesInMonth(year, month) {
  var days = getDaysInMonth(year, month)
  var dates = []
  var mStr = month.toString()
  if (mStr.length < 2) mStr = '0' + mStr
  for (var i = 1; i <= days; i++) {
    var dStr = i.toString()
    if (dStr.length < 2) dStr = '0' + dStr
    dates.push(year + '-' + mStr + '-' + dStr)
  }
  return dates
}

// 防抖函数
function debounce(fn, delay) {
  delay = delay || 300
  var timer = null
  return function () {
    var args = arguments
    var that = this
    if (timer) clearTimeout(timer)
    timer = setTimeout(function() {
      fn.apply(that, args)
    }, delay)
  }
}

// 节流函数
function throttle(fn, interval) {
  interval = interval || 300
  var last = 0
  return function () {
    var args = arguments
    var that = this
    var now = Date.now()
    if (now - last >= interval) {
      last = now
      fn.apply(that, args)
    }
  }
}

// 显示提示
function showToast(title, icon) {
  icon = icon || 'none'
  wx.showToast({
    title: title,
    icon: icon,
    duration: 2000
  })
}

// 显示加载
function showLoading(title) {
  title = title || '加载中...'
  wx.showLoading({
    title: title,
    mask: true
  })
}

// 隐藏加载
function hideLoading() {
  wx.hideLoading()
}

// 确认对话框
function showConfirm(title, content, callback) {
  wx.showModal({
    title: title,
    content: content,
    success: function(res) {
      if (callback) callback(res.confirm)
    }
  })
}

module.exports = {
  formatDate: formatDate,
  formatAmount: formatAmount,
  getDaysInMonth: getDaysInMonth,
  getDatesInMonth: getDatesInMonth,
  debounce: debounce,
  throttle: throttle,
  showToast: showToast,
  showLoading: showLoading,
  hideLoading: hideLoading,
  showConfirm: showConfirm
}
