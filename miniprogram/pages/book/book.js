// 账本页 - ES5版本
var expenseService = require('../../services/expenseService')
var util = require('../../utils/util')
var feedback = require('../../utils/feedback')

var formatDate = util.formatDate
var formatAmount = util.formatAmount

Page({
  data: {
    // 日期
    currentDate: '',
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    today: formatDate(new Date()),
    
    // 统计数据
    monthStats: {
      total: '0.00',
      income: '0.00',
      expense: '0.00',
      count: 0
    },
    
    // 预算数据
    monthlyBudget: 5000,
    budgetSpent: 0,
    budgetRemaining: '0.00',
    budgetPercent: 0,
    
    // 常用分类
    quickCategories: [
      { name: '餐饮', icon: '🍔', type: 'expense', bgColor: '#FFF7E8', color: '#FF7D00' },
      { name: '交通', icon: '🚇', type: 'expense', bgColor: '#E6F4FF', color: '#1677FF' },
      { name: '工资', icon: '💰', type: 'income', bgColor: '#E8FFEA', color: '#00B42A' },
      { name: '购物', icon: '🛍️', type: 'expense', bgColor: '#FFECE8', color: '#F53F3F' },
      { name: '娱乐', icon: '🎮', type: 'expense', bgColor: '#F5F0FF', color: '#165DFF' }
    ],
    
    // 最近账单
    recentExpenses: [],
    
    // 刷新状态
    refreshing: false
  },

  onLoad: function() {
    var now = new Date()
    this.setData({
      currentDate: formatDate(now, 'YYYY-MM')
    })
    this.loadData()
  },

  onShow: function() {
    this.loadData()
  },

  // 加载所有数据
  loadData: function() {
    this.loadMonthStats()
    this.loadBudget()
    this.loadRecentExpenses()
  },

  // 加载月度统计
  loadMonthStats: function() {
    var currentYear = this.data.currentYear
    var currentMonth = this.data.currentMonth
    var expenses = expenseService.getExpensesByMonth(currentYear, currentMonth)
    
    var income = 0
    var expense = 0
    
    for (var i = 0; i < expenses.length; i++) {
      var item = expenses[i]
      if (item.amount > 0) {
        if (item.type === 'income' || item.focus === '收入') {
          income += item.amount
        } else {
          expense += item.amount
        }
      }
    }
    
    var total = income - expense
    
    this.setData({
      'monthStats.total': formatAmount(total),
      'monthStats.income': formatAmount(income),
      'monthStats.expense': formatAmount(expense),
      'monthStats.count': expenses.length
    })
  },

  // 加载预算数据
  loadBudget: function() {
    var budget = wx.getStorageSync('monthlyBudget') || 5000
    var currentYear = this.data.currentYear
    var currentMonth = this.data.currentMonth
    var expenses = expenseService.getExpensesByMonth(currentYear, currentMonth)
    
    var spent = 0
    for (var i = 0; i < expenses.length; i++) {
      if (expenses[i].amount > 0 && expenses[i].type !== 'income') {
        spent += expenses[i].amount
      }
    }
    
    var remaining = budget - spent
    var percent = Math.min(100, Math.round((spent / budget) * 100))
    
    this.setData({
      monthlyBudget: budget,
      budgetSpent: spent,
      budgetRemaining: formatAmount(remaining),
      budgetPercent: percent
    })
  },

  // 加载最近账单
  loadRecentExpenses: function() {
    var currentYear = this.data.currentYear
    var currentMonth = this.data.currentMonth
    var expenses = expenseService.getExpensesByMonth(currentYear, currentMonth)
    
    var recent = []
    var sliceData = expenses.slice(0, 5)
    for (var i = 0; i < sliceData.length; i++) {
      recent.push(this.formatExpenseItem(sliceData[i]))
    }
    
    this.setData({ recentExpenses: recent })
  },

  // 格式化账单项
  formatExpenseItem: function(item) {
    var categoryIcons = {
      '餐饮': '🍔', '交通': '🚇', '房租': '🏠', '购物': '🛍️',
      '娱乐': '🎮', '医疗': '💊', '教育': '📚', '工资': '💰',
      '理财': '📈', '其他': '📦'
    }
    
    var categoryColors = {
      '餐饮': '#FFF7E8', '交通': '#E6F4FF', '房租': '#F0F5FF',
      '购物': '#FFECE8', '娱乐': '#F5F0FF', '医疗': '#FFF0F0',
      '教育': '#F0FFF0', '工资': '#E8FFEA', '理财': '#FFF7E8'
    }
    
    var category = item.focus || (item.tags && item.tags[0]) || '其他'
    
    return {
      _id: item._id,
      event: item.event,
      amount: formatAmount(item.amount),
      displayDate: this.formatDisplayDate(item.spentAt),
      category: category,
      icon: categoryIcons[category] || '💰',
      bgColor: categoryColors[category] || '#F5F7FA',
      type: item.type || (item.amount > 0 && item.focus === '收入' ? 'income' : 'expense'),
      spentAt: item.spentAt,
      focus: item.focus
    }
  },

  // 格式化显示日期
  formatDisplayDate: function(dateStr) {
    var date = new Date(dateStr)
    var today = new Date()
    var yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return '今天'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天'
    } else {
      return formatDate(date, 'MM-DD')
    }
  },

  // 日期选择变化
  onDateChange: function(e) {
    var date = new Date(e.detail.value)
    this.setData({
      currentDate: e.detail.value,
      currentYear: date.getFullYear(),
      currentMonth: date.getMonth() + 1
    })
    this.loadData()
  },

  // 下拉刷新
  onRefresh: function() {
    var that = this
    this.setData({ refreshing: true })
    this.loadData()
    setTimeout(function() {
      that.setData({ refreshing: false })
    }, 500)
  },

  // 添加支出 - FAB按钮
  onAddExpense: function() {
    feedback.buttonVisual('light')
    var app = getApp()
    app.globalData.isEditMode = false
    app.globalData.currentExpense = null
    
    wx.navigateTo({ url: '/pages/expense/expense' })
  },

  // 快捷分类记账 - 带反馈
  quickAddByCategory: function(e) {
    feedback.buttonVisual('light')
    var category = e.currentTarget.dataset.category
    var app = getApp()
    
    app.globalData.isEditMode = false
    app.globalData.currentExpense = {
      focus: category.name,
      type: category.type
    }
    
    wx.navigateTo({ url: '/pages/expense/expense' })
  },

  // 编辑账单
  onEditExpense: function(e) {
    feedback.buttonVisual('light')
    var id = e.currentTarget.dataset.id
    var expense = expenseService.getExpenseById(id)
    
    if (!expense) {
      util.showToast('未找到该记录')
      return
    }
    
    var app = getApp()
    app.globalData.isEditMode = true
    app.globalData.currentExpense = expense
    
    wx.navigateTo({ url: '/pages/expense/expense' })
  },

  // 查看更多 - 带反馈
  viewAllExpenses: function() {
    feedback.buttonVisual('light')
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  // 跳转到统计页
  goToReport: function() {
    feedback.buttonVisual('light')
    wx.switchTab({ url: '/pages/report/report' })
  },

  // 跳转到预算管理
  goToBudget: function() {
    feedback.buttonVisual('light')
    wx.navigateTo({ url: '/pages/budget/budget' })
  },

  // 跳转到存钱目标
  goToGoal: function() {
    feedback.buttonVisual('light')
    wx.navigateTo({ url: '/pages/goal/goal' })
  }
})
