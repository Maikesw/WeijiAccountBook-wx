// pages/book/book.js
const expenseService = require('../../services/expenseService')
const { formatDate, formatAmount, showLoading, hideLoading } = require('../../utils/util')

Page({
  data: {
    currentDate: '',
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    today: formatDate(new Date()),
    groupedExpenses: [],
    monthStats: {
      total: '0.0',
      count: 0
    },
    refreshing: false
  },

  onLoad() {
    const now = new Date()
    this.setData({
      currentDate: formatDate(now, 'YYYY-MM'),
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    })
    this.loadExpenses()
  },

  onShow() {
    // 从其他页面返回时刷新数据
    this.loadExpenses()
  },

  // 加载支出数据
  loadExpenses() {
    const { currentYear, currentMonth } = this.data
    const expenses = expenseService.getExpensesByMonth(currentYear, currentMonth)
    
    // 按日期分组
    const grouped = this.groupExpensesByDate(expenses)
    
    // 计算月度统计
    const stats = this.calculateMonthStats(expenses)
    
    this.setData({
      groupedExpenses: grouped,
      monthStats: stats
    })
  },

  // 按日期分组
  groupExpensesByDate(expenses) {
    const groups = {}
    
    expenses.forEach(expense => {
      const date = new Date(expense.spentAt)
      const dateKey = formatDate(date, 'YYYY-MM-DD')
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          displayDate: this.formatDisplayDate(date),
          expenses: [],
          dayTotal: 0
        }
      }
      
      groups[dateKey].expenses.push({
        ...expense,
        amount: formatAmount(expense.amount)
      })
      groups[dateKey].dayTotal += expense.amount
    })
    
    // 转换为数组并排序
    return Object.values(groups)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(group => ({
        ...group,
        dayTotal: formatAmount(group.dayTotal)
      }))
  },

  // 格式化显示日期
  formatDisplayDate(date) {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return '今天'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天'
    } else {
      return formatDate(date, 'MM月DD日')
    }
  },

  // 计算月度统计
  calculateMonthStats(expenses) {
    const total = expenses.reduce((sum, item) => sum + item.amount, 0)
    return {
      total: formatAmount(total),
      count: expenses.length
    }
  },

  // 日期选择变化
  onDateChange(e) {
    const date = new Date(e.detail.value)
    this.setData({
      currentDate: e.detail.value,
      currentYear: date.getFullYear(),
      currentMonth: date.getMonth() + 1
    })
    this.loadExpenses()
  },

  // 下拉刷新
  onRefresh() {
    this.setData({ refreshing: true })
    this.loadExpenses()
    setTimeout(() => {
      this.setData({ refreshing: false })
    }, 500)
  },

  // 添加支出
  onAddExpense() {
    // 清除编辑状态
    const app = getApp()
    app.globalData.isEditMode = false
    app.globalData.currentExpense = null
    
    wx.navigateTo({
      url: '/pages/expense/expense'
    })
  },

  // 编辑支出
  onEditExpense(e) {
    const id = e.currentTarget.dataset.id
    const expense = expenseService.getExpenseById(id)
    
    if (!expense) {
      wx.showToast({ title: '未找到该记录', icon: 'none' })
      return
    }
    
    const app = getApp()
    app.globalData.isEditMode = true
    app.globalData.currentExpense = expense
    
    wx.navigateTo({
      url: '/pages/expense/expense'
    })
  }
})
