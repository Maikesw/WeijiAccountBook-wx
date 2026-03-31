// 个人中心 - ES5版本
var expenseService = require('../../services/expenseService')
var util = require('../../utils/util')
var feedback = require('../../utils/feedback')

Page({
  data: {
    // 用户信息
    userInfo: {},
    isLogin: false,
    openid: '',
    
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
    ],

    // 同步状态
    syncing: false
  },

  onLoad: function() {
    this.checkLoginStatus()
    this.loadUserInfo()
    this.loadUserStats()
    this.loadSettings()
    this.calculateCache()
  },

  onShow: function() {
    this.checkLoginStatus()
    this.loadUserStats()
  },

  // 检查登录状态
  checkLoginStatus: function() {
    var app = getApp()
    var openid = wx.getStorageSync('openid')
    this.setData({
      isLogin: !!(app.globalData.isLogin || openid),
      openid: app.globalData.openid || openid || ''
    })
  },

  // 微信登录
  onLogin: function() {
    var that = this
    feedback.showLoading('登录中...')
    var app = getApp()
    
    wx.cloud.callFunction({
      name: 'login',
      success: function(res) {
        feedback.hideLoading()
        if (res.result && res.result.success) {
          var openid = res.result.openid
          app.globalData.openid = openid
          app.globalData.isLogin = true
          wx.setStorageSync('openid', openid)
          that.setData({ isLogin: true, openid: openid })
          util.showToast('登录成功')

          // 老用户自动拉取云端数据
          if (!res.result.isNewUser) {
            that.syncFromCloud()
          }
        } else {
          util.showToast('登录失败')
        }
      },
      fail: function(err) {
        feedback.hideLoading()
        console.error('登录失败:', err)
        util.showToast('登录失败')
      }
    })
  },

  // 同步数据到云端
  syncToCloud: function() {
    var that = this
    if (!this.data.isLogin) {
      util.showToast('请先登录')
      return
    }

    feedback.confirmAction({
      title: '同步到云端',
      content: '将本地数据备份到云端，是否继续？',
      confirmText: '同步',
      onConfirm: function() {
        that.setData({ syncing: true })
        feedback.showLoading('同步中...')
        var app = getApp()
        app.syncToCloud(function(result) {
          feedback.hideLoading()
          that.setData({ syncing: false })
          if (result.success) {
            feedback.showSuccess('同步成功')
          } else {
            feedback.showError('同步失败')
          }
        })
      }
    })
  },

  // 从云端恢复数据
  syncFromCloud: function() {
    var that = this
    if (!this.data.isLogin) {
      util.showToast('请先登录')
      return
    }

    feedback.confirmAction({
      title: '从云端恢复',
      content: '云端数据将覆盖本地数据，是否继续？',
      confirmText: '恢复',
      onConfirm: function() {
        that.setData({ syncing: true })
        feedback.showLoading('恢复中...')
        var app = getApp()
        app.syncFromCloud(function(result) {
          feedback.hideLoading()
          that.setData({ syncing: false })
          if (result.success) {
            that.loadUserStats()
            that.loadSettings()
            if (result.hasData) {
              feedback.showSuccess('恢复成功')
            } else {
              util.showToast('云端暂无数据')
            }
          } else {
            feedback.showError('恢复失败')
          }
        })
      }
    })
  },

  // 加载用户信息
  loadUserInfo: function() {
    var userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({ userInfo: userInfo })
  },

  // 加载用户统计
  loadUserStats: function() {
    var expenses = expenseService.getLocalExpenses()
    var stories = expenseService.getExpensesWithStory()
    
    // 计算记账天数
    var dates = {}
    for (var i = 0; i < expenses.length; i++) {
      var date = new Date(expenses[i].createdAt || expenses[i].spentAt).toDateString()
      dates[date] = true
    }
    
    // 计算对象keys数量
    var daysCount = 0
    for (var key in dates) {
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
  loadSettings: function() {
    var settings = wx.getStorageSync('appSettings') || {}
    this.setData({
      darkMode: settings.darkMode || false,
      fontSize: settings.fontSize || 'normal'
    })
    this.updateFontLabel()
  },

  // 更新字体标签
  updateFontLabel: function() {
    var label = '标准'
    for (var i = 0; i < this.data.fontOptions.length; i++) {
      if (this.data.fontOptions[i].value === this.data.fontSize) {
        label = this.data.fontOptions[i].label
        break
      }
    }
    this.setData({ fontSizeLabel: label })
  },

  // 计算缓存大小
  calculateCache: function() {
    try {
      var info = wx.getStorageInfoSync()
      var size = info.currentSize
      var sizeStr = ''
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
  toggleDarkMode: function(e) {
    feedback.buttonVisual('light')
    var darkMode = e.detail.value
    this.setData({ darkMode: darkMode })
    
    var settings = wx.getStorageSync('appSettings') || {}
    settings.darkMode = darkMode
    wx.setStorageSync('appSettings', settings)
    
    util.showToast(darkMode ? '已开启深色模式' : '已关闭深色模式')
  },

  // 显示字体选择 - 带反馈
  adjustFontSize: function() {
    feedback.buttonVisual('light')
    this.setData({ showFontModal: true })
  },

  // 隐藏字体选择
  hideFontModal: function() {
    this.setData({ showFontModal: false })
  },

  stopPropagation: function() {},

  // 设置字体大小 - 带反馈
  setFontSize: function(e) {
    feedback.buttonVisual('light')
    var size = e.currentTarget.dataset.size
    this.setData({ fontSize: size })
    this.updateFontLabel()
    
    var settings = wx.getStorageSync('appSettings') || {}
    settings.fontSize = size
    wx.setStorageSync('appSettings', settings)
    
    this.hideFontModal()
    util.showToast('字体大小已调整')
  },

  // 清理缓存 - 带二次确认
  clearCache: function() {
    var that = this
    feedback.confirmAction({
      title: '清理缓存',
      content: '清理后需要重新登录，确定继续吗？',
      confirmText: '清理',
      confirmColor: '#FF7D00',
      onConfirm: function() {
        wx.clearStorage()
        util.showToast('缓存已清理')
        setTimeout(function() {
          wx.reLaunch({ url: '/pages/book/book' })
        }, 500)
      }
    })
  },

  // 清空所有数据 - 带二次确认
  clearAllData: function() {
    var that = this
    
    feedback.confirmAction({
      title: '危险操作',
      content: '此操作将删除所有账单数据，且无法恢复！确定继续吗？',
      confirmText: '删除',
      confirmColor: '#F53F3F',
      onConfirm: function() {
        // 二次确认
        feedback.confirmAction({
          title: '再次确认',
          content: '数据删除后无法找回，请谨慎操作',
          confirmText: '确认删除',
          confirmColor: '#F53F3F',
          onConfirm: function() {
            expenseService.clearAll()
            util.showToast('数据已清空')
            that.loadUserStats()
          }
        })
      }
    })
  },

  // 导航功能 - 带反馈
  goToSecurity: function() {
    feedback.buttonVisual('light')
    util.showToast('安全中心开发中')
  },

  goToGoals: function() {
    feedback.buttonVisual('light')
    wx.navigateTo({ url: '/pages/goal/goal' })
  },

  goToBudget: function() {
    feedback.buttonVisual('light')
    wx.navigateTo({ url: '/pages/budget/budget' })
  },

  goToCategories: function() {
    feedback.buttonVisual('light')
    util.showToast('分类管理开发中')
  },

  backupData: function() {
    feedback.buttonVisual('light')
    wx.showActionSheet({
      itemList: ['导出为Excel', '导出为图片', '同步到云端'],
      success: function(res) {
        var actions = ['导出Excel开发中', '导出图片开发中', '同步开发中']
        util.showToast(actions[res.tapIndex])
      }
    })
  },

  goToNotification: function() {
    feedback.buttonVisual('light')
    util.showToast('通知设置开发中')
  },

  showHelp: function() {
    feedback.buttonVisual('light')
    wx.navigateTo({ url: '/pages/help/help' })
  },

  feedback: function() {
    feedback.buttonVisual('light')
    wx.showModal({
      title: '意见反馈',
      editable: true,
      placeholderText: '请输入您的意见或建议...',
      success: function(res) {
        if (res.confirm && res.content) {
          util.showToast('感谢您的反馈')
        }
      }
    })
  },

  showAbout: function() {
    feedback.buttonVisual('light')
    wx.showModal({
      title: '关于微记财本',
      content: '微记财本 v1.0.0\n\n一款简洁高效的记账工具\n帮助您轻松管理日常收支\n\n 2024 微记财本',
      showCancel: false
    })
  },

  showPrivacy: function() {
    feedback.buttonVisual('light')
    wx.navigateTo({ url: '/pages/privacy/privacy' })
  },

  showAgreement: function() {
    feedback.buttonVisual('light')
    wx.navigateTo({ url: '/pages/agreement/agreement' })
  }
})
