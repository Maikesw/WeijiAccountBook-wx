// pages/me/me.js
const expenseService = require('../../services/expenseService')
const { showToast, showConfirm, showLoading, hideLoading } = require('../../utils/util')

Page({
  data: {
    openid: '',
    totalExpenses: 0,
    totalStories: 0,
    focusCount: 0,
    
    // 关注管理弹窗
    showFocusModal: false,
    focusList: [],
    newFocus: ''
  },

  onLoad() {
    this.loadUserStats()
    this.loadFocusList()
  },

  onShow() {
    this.loadUserStats()
  },

  // 加载用户统计
  loadUserStats() {
    const expenses = expenseService.getLocalExpenses()
    const stories = expenseService.getExpensesWithStory()
    const focusList = expenseService.getFocusList()
    
    this.setData({
      totalExpenses: expenses.length,
      totalStories: stories.length,
      focusCount: focusList.length
    })
  },

  // 加载关注列表
  loadFocusList() {
    const focusList = expenseService.getFocusList()
    this.setData({ focusList })
  },

  // ========== 菜单功能 ==========

  // 关注管理
  goToFocusManage() {
    this.setData({ showFocusModal: true })
  },

  // 数据同步
  async syncData() {
    try {
      showLoading('正在同步...')
      await expenseService.syncToCloud()
      hideLoading()
      showToast('同步成功', 'success')
    } catch (err) {
      hideLoading()
      showToast('同步失败: ' + err.message)
    }
  },

  // 关于
  showAbout() {
    wx.showModal({
      title: '关于浣熊财记',
 content: '浣熊财记是一款专为大学生和年轻人设计的记账应用。

功能特点：
• 快速记账，一句话记录
• 智能标签，自动分类
• 财记故事，记录生活
• 数据统计，清晰明了

© 2024 Racoon Account Book',
      showCancel: false
    })
  },

  // 清空数据
  async clearAllData() {
    const confirmed = await showConfirm('确认清空', '此操作将删除所有本地数据，且无法恢复！')
    if (!confirmed) return

    expenseService.clearAll()
    showToast('数据已清空', 'success')
    this.loadUserStats()
  },

  // ========== 关注管理弹窗 ==========

  hideFocusModal() {
    this.setData({ showFocusModal: false })
  },

  stopPropagation() {
    // 阻止冒泡
  },

  onNewFocusInput(e) {
    this.setData({ newFocus: e.detail.value })
  },

  addFocus() {
    const name = this.data.newFocus.trim()
    if (!name) {
      showToast('请输入关注名称')
      return
    }

    if (this.data.focusList.includes(name)) {
      showToast('该关注已存在')
      return
    }

    expenseService.addFocus(name)
    this.setData({
      focusList: expenseService.getFocusList(),
      newFocus: ''
    })
    this.loadUserStats()
    showToast('添加成功')
  },

  editFocus(e) {
    const oldName = e.currentTarget.dataset.name
    wx.showModal({
      title: '编辑关注',
      editable: true,
      placeholderText: oldName,
      success: (res) => {
        if (res.confirm && res.content) {
          expenseService.updateFocus(oldName, res.content)
          this.setData({
            focusList: expenseService.getFocusList()
          })
          showToast('修改成功')
        }
      }
    })
  },

  deleteFocus(e) {
    const name = e.currentTarget.dataset.name
    wx.showModal({
      title: '确认删除',
      content: `确定删除关注"${name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          expenseService.removeFocus(name)
          this.setData({
            focusList: expenseService.getFocusList()
          })
          this.loadUserStats()
          showToast('删除成功')
        }
      }
    })
  }
})
