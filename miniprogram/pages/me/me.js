// 个人中心 - 优化版本
const expenseService = require('../../services/expenseService')
const { showToast, formatAmount } = require('../../utils/util')

Page({
  data: {
    // 用户信息
    userInfo: {},
    
    // 用户统计
    userStats: {
      totalDays: 0,
      totalRecords: 0,
      totalStories: 0
    },
    
    // 设置
    darkMode: false,
    fontSize: 'normal',
    fontSizeLabel: '标准',
    cacheSize: '0KB',
    
    // 字体选项
    showFontModal: false,
    fontOptions: [
      { value: 'small', label: '小', previewSize: 28 },
      { value: 'normal', label: '标准', previewSize: 32 },
      { value: 'large', label: '大', previewSize: 38 },
      { value: 'xlarge', label: '超大', previewSize: 44 }
    ]
  },

  onLoad() {
    this.loadUserInfo()
    this.loadUserStats()
    this.loadSettings()
    this.calculateCache()
  },

  onShow() {
    this.loadUserStats()
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({ userInfo })
  },

  // 加载用户统计
  loadUserStats() {
    const expenses = expenseService.getLocalExpenses()
    const stories = expenseService.getExpensesWithStory()
    
    // 计算记账天数
    const dates = {}
    for (let i = 0; i < expenses.length; i++) {
      const date = new Date(expenses[i].createdAt || expenses[i].spentAt).toDateString()
      dates[date] = true
    }
    
    // 计算对象keys数量
    let daysCount = 0
    for (let key in dates) {
      if (dates.hasOwnProperty(key)) {
        daysCount++
      }
    }
    
    this.setData({
      'userStats.totalDays': daysCount,
      'userStats.totalRecords': expenses.length,
      'userStats.totalStories': stories.length
    })
  },

  // 加载设置
  loadSettings() {
    const settings = wx.getStorageSync('appSettings') || {}
    this.setData({
      darkMode: settings.darkMode || false,
      fontSize: settings.fontSize || 'normal'
    })
    this.updateFontLabel()
  },

  // 更新字体标签
  updateFontLabel() {
    let label = '标准'
    for (let i = 0; i < this.data.fontOptions.length; i++) {
      if (this.data.fontOptions[i].value === this.data.fontSize) {
        label = this.data.fontOptions[i].label
        break
      }
    }
    this.setData({
      fontSizeLabel: label
    })
  },

  // 计算缓存大小
  calculateCache() {
    try {
      const info = wx.getStorageInfoSync()
      const size = info.currentSize
      let sizeStr = ''
      if (size < 1024) {
        sizeStr = size + 'KB'
      } else {
        sizeStr = (size / 1024).toFixed(1) + 'MB'
      }
      this.setData({ cacheSize: sizeStr })
    } catch (e) {
      this.setData({ cacheSize: '0KB' })
    }
  },

  // 切换深色模式
  toggleDarkMode(e) {
    const darkMode = e.detail.value
    this.setData({ darkMode })
    
    const settings = wx.getStorageSync('appSettings') || {}
    settings.darkMode = darkMode
    wx.setStorageSync('appSettings', settings)
    
    showToast(darkMode ? '已开启深色模式' : '已关闭深色模式')
  },

  // 显示字体选择
  adjustFontSize() {
    this.setData({ showFontModal: true })
  },

  // 隐藏字体选择
  hideFontModal() {
    this.setData({ showFontModal: false })
  },

  stopPropagation() {},

  // 设置字体大小
  setFontSize(e) {
    const size = e.currentTarget.dataset.size
    this.setData({ fontSize: size })
    this.updateFontLabel()
    
    const settings = wx.getStorageSync('appSettings') || {}
    settings.fontSize = size
    wx.setStorageSync('appSettings', settings)
    
    // 应用到页面
    this.applyFontSize(size)
    
    this.hideFontModal()
    showToast('字体大小已调整')
  },

  // 应用字体大小
  applyFontSize(size) {
    const scaleMap = {
      small: 0.9,
      normal: 1,
      large: 1.15,
      xlarge: 1.3
    }
    
    // 通过设置页面根字体大小来实现
    // 实际项目中可以通过 CSS 变量或 class 切换实现
  },

  // 清理缓存
  clearCache() {
    wx.showModal({
      title: '清理缓存',
      content: '清理后需要重新登录，确定继续吗？',
      success: function(res) {
        if (res.confirm) {
          wx.clearStorage()
          showToast('缓存已清理')
          setTimeout(function() {
            wx.reLaunch({ url: '/pages/book/book' })
          }, 1000)
        }
      }
    })
  },

  // 清空所有数据
  clearAllData() {
    const that = this
    wx.showModal({
      title: '危险操作',
      content: '此操作将删除所有账单数据，且无法恢复！确定继续吗？',
      confirmColor: '#F53F3F',
      success: function(res) {
        if (res.confirm) {
          wx.showModal({
            title: '再次确认',
            content: '数据删除后无法找回，请谨慎操作',
            confirmColor: '#F53F3F',
            success: function(res2) {
              if (res2.confirm) {
                expenseService.clearAll()
                showToast('数据已清空')
                that.loadUserStats()
              }
            }
          })
        }
      }
    })
  },

  // 导航功能
  goToSecurity() {
    showToast('安全中心开发中')
  },

  goToGoals() {
    showToast('存钱目标开发中')
  },

  goToBudget() {
    showToast('预算设置开发中')
  },

  goToCategories() {
    showToast('分类管理开发中')
  },

  backupData() {
    wx.showActionSheet({
      itemList: ['导出为Excel', '导出为图片', '同步到云端'],
      success: function(res) {
        const actions = ['导出Excel开发中', '导出图片开发中', '同步开发中']
        showToast(actions[res.tapIndex])
      }
    })
  },

  goToNotification() {
    showToast('通知设置开发中')
  },

  showHelp() {
    wx.navigateTo({ url: '/pages/help/help' })
  },

  feedback() {
    wx.showModal({
      title: '意见反馈',
      editable: true,
      placeholderText: '请输入您的意见或建议...',
      success: function(res) {
        if (res.confirm && res.content) {
          showToast('感谢您的反馈')
        }
      }
    })
  },

  showAbout() {
    wx.showModal({
      title: '关于理财日记',
      content: '理财日记 v1.0.0\n\n一款简洁高效的记账工具\n帮助您轻松管理日常收支\n\n© 2024 理财日记',
      showCancel: false
    })
  },

  showPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' })
  },

  showAgreement() {
    wx.navigateTo({ url: '/pages/agreement/agreement' })
  }
})
