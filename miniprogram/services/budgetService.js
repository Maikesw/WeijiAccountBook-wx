/**
 * 预算管理服务
 * 月度预算设置与监控
 */

var STORAGE_KEY = 'racoon_budgets'

module.exports = {
  // 获取月度预算
  getMonthBudgets: function(year, month) {
    var key = year + '-' + (month + 1)
    var allBudgets = wx.getStorageSync(STORAGE_KEY) || {}
    return allBudgets[key] || {}
  },

  // 设置分类预算
  setBudget: function(year, month, data) {
    var key = year + '-' + (month + 1)
    var allBudgets = wx.getStorageSync(STORAGE_KEY) || {}
    
    if (!allBudgets[key]) {
      allBudgets[key] = {}
    }
    
    allBudgets[key][data.category] = data.amount
    wx.setStorageSync(STORAGE_KEY, allBudgets)
    return true
  },

  // 删除分类预算
  deleteBudget: function(year, month, category) {
    var key = year + '-' + (month + 1)
    var allBudgets = wx.getStorageSync(STORAGE_KEY) || {}
    
    if (allBudgets[key]) {
      delete allBudgets[key][category]
      wx.setStorageSync(STORAGE_KEY, allBudgets)
    }
    return true
  },

  // 获取总预算
  getTotalBudget: function(year, month) {
    var budgets = this.getMonthBudgets(year, month)
    var total = 0
    for (var cat in budgets) {
      if (budgets.hasOwnProperty(cat)) {
        total += budgets[cat]
      }
    }
    return total
  },

  // 获取预算使用率
  getBudgetUsage: function(year, month, category, spent) {
    var budgets = this.getMonthBudgets(year, month)
    var budget = budgets[category] || 0
    
    if (budget === 0) return { percent: 0, remaining: 0 }
    
    var percent = (spent / budget) * 100
    var remaining = budget - spent
    
    return {
      percent: Math.round(percent),
      remaining: remaining,
      status: percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : 'normal'
    }
  },

  // 获取预算提醒
  getBudgetAlerts: function(year, month, expenses) {
    var budgets = this.getMonthBudgets(year, month)
    var alerts = []
    
    // 计算各分类支出
    var categorySpent = {}
    for (var i = 0; i < expenses.length; i++) {
      var e = expenses[i]
      if (e.type === 'expense') {
        if (!categorySpent[e.category]) {
          categorySpent[e.category] = 0
        }
        categorySpent[e.category] += e.amount
      }
    }
    
    // 检查超支或接近预算
    for (var cat in budgets) {
      if (budgets.hasOwnProperty(cat) && categorySpent[cat]) {
        var budget = budgets[cat]
        var spent = categorySpent[cat]
        var percent = (spent / budget) * 100
        
        if (percent >= 100) {
          alerts.push({
            category: cat,
            type: 'over',
            message: cat + '预算已超支',
            percent: Math.round(percent)
          })
        } else if (percent >= 80) {
          alerts.push({
            category: cat,
            type: 'warning',
            message: cat + '预算即将用完',
            percent: Math.round(percent)
          })
        }
      }
    }
    
    return alerts
  }
}
