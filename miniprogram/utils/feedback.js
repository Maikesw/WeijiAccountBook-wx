// 交互反馈工具 - 视觉反馈（无震动）

/**
 * 触发按钮视觉反馈
 * @param {String} type - 反馈类型：light(轻微)、medium(中等)
 */
function buttonVisual(type) {
  // 纯视觉反馈，无震动
  type = type || 'light'
  
  // 可根据类型调整视觉效果强度
  // light: 轻微下沉
  // medium: 明显下沉
}

/**
 * 按钮点击反馈组合
 * 纯视觉反馈（下沉效果）
 * @param {String} visualType - 视觉反馈类型
 * @param {Function} callback - 反馈后的回调
 * @param {Number} delay - 延迟时间（ms）
 */
function buttonFeedback(visualType, callback, delay) {
  // 触发视觉反馈
  buttonVisual(visualType || 'light')
  
  // 执行回调
  if (typeof callback === 'function') {
    if (delay) {
      setTimeout(callback, delay)
    } else {
      callback()
    }
  }
}

/**
 * 带确认的操作反馈
 * 用于删除、清空等危险操作
 * @param {Object} options - 配置项
 * @param {String} options.title - 标题
 * @param {String} options.content - 内容
 * @param {String} options.confirmText - 确认按钮文字
 * @param {String} options.confirmColor - 确认按钮颜色
 * @param {Function} options.onConfirm - 确认回调
 * @param {Function} options.onCancel - 取消回调
 */
function confirmAction(options) {
  options = options || {}
  
  wx.showModal({
    title: options.title || '确认操作',
    content: options.content || '确定要执行此操作吗？',
    confirmText: options.confirmText || '确定',
    confirmColor: options.confirmColor || '#1677FF',
    cancelText: options.cancelText || '取消',
    success: function(res) {
      if (res.confirm) {
        if (typeof options.onConfirm === 'function') {
          options.onConfirm()
        }
      } else if (res.cancel) {
        if (typeof options.onCancel === 'function') {
          options.onCancel()
        }
      }
    }
  })
}

/**
 * 切换按钮反馈
 * 用于收支类型切换、明暗模式切换等
 * @param {Object} that - 页面this
 * @param {String} key - data中的key
 * @param {String} value - 切换后的值
 * @param {Function} callback - 切换后回调
 */
function switchFeedback(that, key, value, callback) {
  // 视觉反馈（下沉效果）
  buttonVisual('light')
  
  // 更新数据
  const data = {}
  data[key] = value
  that.setData(data)
  
  // 执行回调
  if (typeof callback === 'function') {
    callback(value)
  }
}

/**
 * 显示加载状态
 * @param {String} title - 加载文字
 */
function showLoading(title) {
  wx.showLoading({
    title: title || '加载中...',
    mask: true
  })
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
  wx.hideLoading()
}

/**
 * 显示成功提示
 * @param {String} title - 提示文字
 * @param {Function} callback - 提示后回调
 */
function showSuccess(title, callback) {
  wx.showToast({
    title: title || '成功',
    icon: 'success',
    duration: 1500,
    success: function() {
      if (typeof callback === 'function') {
        setTimeout(callback, 1500)
      }
    }
  })
}

/**
 * 显示错误提示
 * @param {String} title - 提示文字
 */
function showError(title) {
  wx.showToast({
    title: title || '失败',
    icon: 'error',
    duration: 2000
  })
}

module.exports = {
  buttonVisual: buttonVisual,
  buttonFeedback: buttonFeedback,
  confirmAction: confirmAction,
  switchFeedback: switchFeedback,
  showLoading: showLoading,
  hideLoading: hideLoading,
  showSuccess: showSuccess,
  showError: showError
}
