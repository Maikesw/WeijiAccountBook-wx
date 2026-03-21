// pages/story/story.js
const expenseService = require('../../services/expenseService')
const { formatAmount, formatDate } = require('../../utils/util')

Page({
  data: {
    stories: []
  },

  onLoad() {
    this.loadStories()
  },

  onShow() {
    this.loadStories()
  },

  // 加载有故事的支出
  loadStories() {
    const stories = expenseService.getExpensesWithStory()
    
    // 格式化数据
    const formattedStories = stories.map(item => ({
      ...item,
      amount: formatAmount(item.amount),
      displayDate: this.formatStoryDate(item.spentAt)
    }))
    
    this.setData({ stories: formattedStories })
  },

  // 格式化故事日期
  formatStoryDate(dateStr) {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return '今天 ' + formatDate(date, 'HH:mm')
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天 ' + formatDate(date, 'HH:mm')
    } else {
      return formatDate(date, 'YYYY年MM月DD日')
    }
  },

  // 查看详情
  onViewDetail(e) {
    const id = e.currentTarget.dataset.id
    const app = getApp()
    const expense = expenseService.getExpenseById(id)
    
    if (expense) {
      app.globalData.isEditMode = true
      app.globalData.currentExpense = expense
      
      wx.navigateTo({
        url: '/pages/expense/expense'
      })
    }
  }
})
