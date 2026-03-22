// 个人中心 - 优化按钮交互版本
const expenseService = require('../../services/expenseService')
const { showToast, formatAmount } = require('../../utils/util')
const feedback = require('../../utils/feedback')

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
    this.setData({ fontSizeLabel: label })
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

  // 切换深色模式 - 带反馈
  toggleDarkMode(e) {
    feedback.buttonVisual('light')
    const darkMode = e.detail.value
    this.setData({ darkMode })
    
    const settings = wx.getStorageSync('appSettings') || {}
    settings.darkMode = darkMode
    wx.setStorageSync('appSettings', settings)
    
    showToast(darkMode ? '已开启深色模式' : '已关闭深色模式')
  },

  // 显示字体选择 - 带反馈
  adjustFontSize() {
    feedback.buttonVisual('light')
    this.setData({ showFontModal: true })
  },

  // 隐藏字体选择
  hideFontModal() {
    this.setData({ showFontModal: false })
  },

  stopPropagation() {},

  // 设置字体大小 - 带反馈
  setFontSize(e) {
    feedback.buttonVisual('light')
    const size = e.currentTarget.dataset.size
    this.setData({ fontSize: size })
    this.updateFontLabel()
    
    const settings = wx.getStorageSync('appSettings') || {}
    settings.fontSize = size
    wx.setStorageSync('appSettings', settings)
    
    this.hideFontModal()
    showToast('字体大小已调整')
  },

  // 清理缓存 - 带二次确认
  clearCache() {
    feedback.confirmAction({
      title: '清理缓存',
      content: '清理后需要重新登录，确定继续吗？',
      confirmText: '清理',
      confirmColor: '#FF7D00',
      onConfirm: function() {
        wx.clearStorage()
        feedback.showSuccess('缓存已清理', function() {
          wx.reLaunch({ url: '/pages/book/book' })
        })
      }
    })
  },

  // 清空所有数据 - 带二次确认和危险震动
  clearAllData() {
    const that = this
    
    feedback.confirmAction({
      title: '危险操作',
      content: '此操作将删除所有账单数据，且无法恢复！确定继续吗？',
      confirmText: '删除',
      confirmColor: '#F53F3F',
      vibrateType: 'heavy',
      onConfirm: function() {
        // 二次确认
        feedback.confirmAction({
          title: '再次确认',
          content: '数据删除后无法找回，请谨慎操作',
          confirmText: '确认删除',
          confirmColor: '#F53F3F',
          vibrateType: 'heavy',
          onConfirm: function() {
            expenseService.clearAll()
            feedback.showSuccess('数据已清空', function() {
              that.loadUserStats()
            })
          }
        })
      }
    })
  },

  // 导航功能 - 带反馈
  goToSecurity() {
    feedback.buttonVisual('light')
    showToast('安全中心开发中')
  },

  goToGoals() {
    feedback.buttonVisual('light')
    showToast('存钱目标开发中')
  },

  goToBudget() {
    feedback.buttonVisual('light')
    showToast('预算设置开发中')
  },

  goToCategories() {
    feedback.buttonVisual('light')
    showToast('分类管理开发中')
  },

  backupData() {
    feedback.buttonVisual('light')
    wx.showActionSheet({
      itemList: ['导出为Excel', '导出为图片', '同步到云端'],
      success: function(res) {
        const actions = ['导出Excel开发中', '导出图片开发中', '同步开发中']
        showToast(actions[res.tapIndex])
      }
    })
  },

  goToNotification() {
    feedback.buttonVisual('light')
    showToast('通知设置开发中')
  },

  showHelp() {
    feedback.buttonVisual('light')
    wx.navigateTo({ url: '/pages/help/help' })
  },

  feedback() {
    feedback.buttonVisual('light')
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
    feedback.buttonVisual('light')
    wx.showModal({
      title: '关于理财日记',
      content: '理财日记 v1.0.0\n\n一款简洁高效的记账工具\n帮助您轻松管理日常收支\n\n© 2024 理财日记',
      showCancel: false
    })
  },

  showPrivacy() {
    feedback.buttonVisual('light')
    wx.navigateTo({ url: '/pages/privacy/privacy' })
  },

  showAgreement() {
    feedback.buttonVisual('light')
    wx.navigateTo({ url: '/pages/agreement/agreement' })
  }
})
