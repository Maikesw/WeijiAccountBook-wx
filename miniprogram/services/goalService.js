/**
 * 存钱目标服务
 * 目标数据结构与业务逻辑
 */

var STORAGE_KEY = 'racoon_goals'
var RECORDS_KEY = 'racoon_goal_records'

module.exports = {
  // 获取所有目标
  getGoals: function() {
    var goals = wx.getStorageSync(STORAGE_KEY) || []
    return goals
  },

  // 根据ID获取目标
  getGoalById: function(id) {
    var goals = this.getGoals()
    for (var i = 0; i < goals.length; i++) {
      if (goals[i].id === id) {
        return goals[i]
      }
    }
    return null
  },

  // 添加目标
  addGoal: function(goal) {
    var goals = this.getGoals()
    var newGoal = {
      id: Date.now(),
      icon: goal.icon || '🏠',
      name: goal.name,
      target: goal.target,
      saved: 0,
      description: goal.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    goals.push(newGoal)
    wx.setStorageSync(STORAGE_KEY, goals)
    return newGoal
  },

  // 更新目标
  updateGoal: function(id, updates) {
    var goals = this.getGoals()
    for (var i = 0; i < goals.length; i++) {
      if (goals[i].id === id) {
        for (var key in updates) {
          if (updates.hasOwnProperty(key)) {
            goals[i][key] = updates[key]
          }
        }
        goals[i].updatedAt = new Date().toISOString()
        wx.setStorageSync(STORAGE_KEY, goals)
        return goals[i]
      }
    }
    return null
  },

  // 删除目标
  deleteGoal: function(id) {
    var goals = this.getGoals()
    var filtered = []
    for (var i = 0; i < goals.length; i++) {
      if (goals[i].id !== id) {
        filtered.push(goals[i])
      }
    }
    wx.setStorageSync(STORAGE_KEY, filtered)
    // 同时删除记录
    this.deleteRecords(id)
    return true
  },

  // 存入金额
  saveMoney: function(goalId, amount, remark) {
    var goal = this.getGoalById(goalId)
    if (!goal) return false
    
    // 更新目标金额
    var newSaved = goal.saved + amount
    this.updateGoal(goalId, { saved: newSaved })
    
    // 添加记录
    var records = wx.getStorageSync(RECORDS_KEY) || {}
    if (!records[goalId]) {
      records[goalId] = []
    }
    records[goalId].unshift({
      amount: amount,
      remark: remark || '',
      date: new Date().toISOString(),
      timestamp: Date.now()
    })
    wx.setStorageSync(RECORDS_KEY, records)
    
    return true
  },

  // 获取记录
  getRecords: function(goalId) {
    var records = wx.getStorageSync(RECORDS_KEY) || {}
    var goalRecords = records[goalId] || []
    
    // 格式化日期
    var formatted = []
    for (var i = 0; i < goalRecords.length; i++) {
      var r = goalRecords[i]
      var date = new Date(r.date)
      var dateStr = (date.getMonth() + 1) + '月' + date.getDate() + '日'
      formatted.push({
        amount: r.amount.toFixed(2),
        remark: r.remark,
        date: dateStr,
        timestamp: r.timestamp
      })
    }
    return formatted
  },

  // 删除记录
  deleteRecords: function(goalId) {
    var records = wx.getStorageSync(RECORDS_KEY) || {}
    delete records[goalId]
    wx.setStorageSync(RECORDS_KEY, records)
  },

  // 获取统计数据
  getStats: function() {
    var goals = this.getGoals()
    var stats = {
      totalGoals: goals.length,
      completedGoals: 0,
      totalSaved: 0,
      totalTarget: 0
    }
    
    for (var i = 0; i < goals.length; i++) {
      var g = goals[i]
      stats.totalSaved += g.saved
      stats.totalTarget += g.target
      if (g.saved >= g.target) {
        stats.completedGoals++
      }
    }
    
    return stats
  }
}
