const feedback = require('../../utils/feedback')
const budgetService = require('../../services/budgetService')
const expenseService = require('../../services/expenseService')

Page({
  data: {
    currentMonth: '',
    totalBudget: '¥0.00',
    spentAmount: '¥0.00',
    remainingBudget: '¥0.00',
    dailyBudget: '¥0.00',
    daysLeft: 0,
    usedPercent: 0,
    remainingClass: '',
    budgetStatus: 'normal',
    budgetStatusText: '预算充足',
    ringColor: '#1677FF',
    categoryBudgets: [],
    trendData: [],
    showBudgetModal: false,
    expenseCategories: [
      { id: 'food', name: '餐饮', icon: '🍔', color: '#FF7D00' },
      { id: 'transport', name: '交通', icon: '🚌', color: '#1677FF' },
      { id: 'shopping', name: '购物', icon: '🛍️', color: '#F53F3F' },
      { id: 'entertainment', name: '娱乐', icon: '🎮', color: '#722ED1' },
      { id: 'housing', name: '居住', icon: '🏠', color: '#00B42A' },
      { id: 'medical', name: '医疗', icon: '💊', color: '#F53F3F' },
      { id: 'education', name: '学习', icon: '📚', color: '#165DFF' },
      { id: 'other', name: '其他', icon: '📦', color: '#86909C' }
    ],
    selectedCategory: '',
    budgetAmount: '',
    canSave: false
  },

  onLoad: function() {
    this.initPage()
  },

  onShow: function() {
    this.loadBudgetData()
  },

  initPage: function() {
    var now = new Date()
    var monthStr = (now.getMonth() + 1) + '月预算'
    this.setData({ currentMonth: monthStr })
  },

  loadBudgetData: function() {
    var now = new Date()
    var year = now.getFullYear()
    var month = now.getMonth()
    var daysInMonth = new Date(year, month + 1, 0).getDate()
    var currentDay = now.getDate()
    var daysLeft = daysInMonth - currentDay + 1
    
    // 获取预算和支出
    var budgets = budgetService.getMonthBudgets(year, month)
    var expenses = expenseService.getMonthExpenses(year, month)
    
    // 计算总支出
    var totalSpent = 0
    for (var i = 0; i < expenses.length; i++) {
      if (expenses[i].type === 'expense') {
        totalSpent += expenses[i].amount
      }
    }
    
    // 计算总预算
    var totalBudget = 0
    for (var cat in budgets) {
      if (budgets.hasOwnProperty(cat)) {
        totalBudget += budgets[cat]
      }
    }
    
    var remaining = totalBudget - totalSpent
    var usedPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
    var dailyBudget = daysLeft > 0 ? Math.max(0, remaining / daysLeft) : 0
    
    // 状态判断
    var status = 'normal'
    var statusText = '预算充足'
    var remainingClass = ''
    var ringColor = '#1677FF'
    
    if (usedPercent >= 100) {
      status = 'danger'
      statusText = '已超支'
      remainingClass = 'danger'
      ringColor = '#F53F3F'
    } else if (usedPercent >= 80) {
      status = 'warning'
      statusText = '预算紧张'
      remainingClass = 'warning'
      ringColor = '#FF7D00'
    }
    
    this.setData({
      totalBudget: '¥' + totalBudget.toFixed(2),
      spentAmount: '¥' + totalSpent.toFixed(2),
      remainingBudget: '¥' + remaining.toFixed(2),
      dailyBudget: '¥' + dailyBudget.toFixed(2),
      daysLeft: daysLeft,
      usedPercent: usedPercent,
      remainingClass: remainingClass,
      budgetStatus: status,
      budgetStatusText: statusText,
      ringColor: ringColor
    })
    
    this.loadCategoryBudgets(budgets, expenses)
    this.loadTrendData(year, month, currentDay)
  },

  loadCategoryBudgets: function(budgets, expenses) {
    var categoryData = []
    var cats = this.data.expenseCategories
    
    for (var i = 0; i < cats.length; i++) {
      var cat = cats[i]
      var budget = budgets[cat.id] || 0
      if (budget === 0) continue
      
      var spent = 0
      for (var j = 0; j < expenses.length; j++) {
        var e = expenses[j]
        if (e.type === 'expense' && e.category === cat.id) {
          spent += e.amount
        }
      }
      
      var percent = budget > 0 ? Math.round((spent / budget) * 100) : 0
      var remaining = budget - spent
      var status = 'normal'
      if (percent >= 100) status = 'danger'
      else if (percent >= 80) status = 'warning'
      
      categoryData.push({
        category: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        budget: budget.toFixed(0),
        spent: spent.toFixed(0),
        remaining: remaining,
        remainingText: Math.abs(remaining).toFixed(0),
        overText: Math.abs(remaining).toFixed(0),
        percent: percent,
        status: status
      })
    }
    
    this.setData({ categoryBudgets: categoryData })
  },

  loadTrendData: function(year, month, currentDay) {
    var trendData = []
    var expenses = expenseService.getMonthExpenses(year, month)
    
    // 近7天数据
    for (var i = 6; i >= 0; i--) {
      var day = currentDay - i
      if (day < 1) continue
      
      var dayAmount = 0
      for (var j = 0; j < expenses.length; j++) {
        var e = expenses[j]
        var eDate = new Date(e.date)
        if (e.type === 'expense' && eDate.getDate() === day) {
          dayAmount += e.amount
        }
      }
      
      var maxAmount = 500
      var height = Math.min((dayAmount / maxAmount) * 100, 100)
      
      trendData.push({
        date: day,
        label: i === 0 ? '今天' : day + '日',
        amount: dayAmount.toFixed(0),
        height: height,
        isToday: i === 0
      })
    }
    
    this.setData({ trendData: trendData })
  },

  // 显示设置弹窗
  showAddModal: function() {
    this.setData({
      showBudgetModal: true,
      selectedCategory: '',
      budgetAmount: ''
    })
  },

  hideModal: function() {
    this.setData({ showBudgetModal: false })
  },

  // 选择分类
  selectCategory: function(e) {
    var id = e.currentTarget.dataset.id
    this.setData({
      selectedCategory: id,
      canSave: this.validateSave()
    })
  },

  // 输入金额
  onAmountInput: function(e) {
    this.setData({
      budgetAmount: e.detail.value,
      canSave: this.validateSave()
    })
  },

  // 快捷金额
  setQuickAmount: function(e) {
    this.setData({
      budgetAmount: e.currentTarget.dataset.amount.toString(),
      canSave: this.validateSave()
    })
  },

  // 验证
  validateSave: function() {
    return this.data.selectedCategory && parseFloat(this.data.budgetAmount) > 0
  },

  // 保存预算
  saveBudget: function() {
    if (!this.validateSave()) return
    
    var now = new Date()
    budgetService.setBudget(now.getFullYear(), now.getMonth(), {
      category: this.data.selectedCategory,
      amount: parseFloat(this.data.budgetAmount)
    })
    
    this.hideModal()
    this.loadBudgetData()
    wx.showToast({ title: '设置成功', icon: 'success' })
  },

  // 编辑预算
  editBudget: function(e) {
    var item = e.currentTarget.dataset.item
    wx.showActionSheet({
      itemList: ['修改预算', '删除预算'],
      success: function(res) {
        if (res.tapIndex === 0) {
          this.setData({
            showBudgetModal: true,
            selectedCategory: item.category,
            budgetAmount: item.budget,
            canSave: true
          })
        } else if (res.tapIndex === 1) {
          this.deleteBudget(item.category)
        }
      }.bind(this)
    })
  },

  deleteBudget: function(category) {
    wx.showModal({
      title: '确认删除',
      content: '删除后该分类预算将重置',
      success: function(res) {
        if (res.confirm) {
          var now = new Date()
          budgetService.deleteBudget(now.getFullYear(), now.getMonth(), category)
          this.loadBudgetData()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }.bind(this)
    })
  },

  stopPropagation: function() {}
})
