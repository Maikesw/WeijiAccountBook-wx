// 支出数据服务层 - ES5版本
var db = wx.cloud.database()
var expensesCollection = db.collection('expenses')
var focusCollection = db.collection('focus')

function ExpenseService() {
  this.EXPENSES_KEY = 'expenses'
  this.FOCUS_KEY = 'focusList'
}

// ========== 本地存储操作 ==========

// 获取所有支出（本地）
ExpenseService.prototype.getLocalExpenses = function() {
  return wx.getStorageSync(this.EXPENSES_KEY) || []
}

// 保存所有支出到本地
ExpenseService.prototype.saveLocalExpenses = function(expenses) {
  wx.setStorageSync(this.EXPENSES_KEY, expenses)
}

// 根据ID获取支出
ExpenseService.prototype.getExpenseById = function(id) {
  var expenses = this.getLocalExpenses()
  for (var i = 0; i < expenses.length; i++) {
    if (expenses[i]._id === id) {
      return expenses[i]
    }
  }
  return null
}

// 获取某月支出
ExpenseService.prototype.getExpensesByMonth = function(year, month) {
  var expenses = this.getLocalExpenses()
  var result = []
  for (var i = 0; i < expenses.length; i++) {
    var date = new Date(expenses[i].spentAt)
    if (date.getFullYear() === year && date.getMonth() + 1 === month) {
      result.push(expenses[i])
    }
  }
  return result
}

// 获取某天支出
ExpenseService.prototype.getExpensesByDate = function(dateStr) {
  var expenses = this.getLocalExpenses()
  var result = []
  var targetDate = new Date(dateStr)
  for (var i = 0; i < expenses.length; i++) {
    var itemDate = new Date(expenses[i].spentAt)
    if (itemDate.toDateString() === targetDate.toDateString()) {
      result.push(expenses[i])
    }
  }
  return result
}

// 创建支出
ExpenseService.prototype.createExpense = function(expenseData) {
  var that = this
  return new Promise(function(resolve, reject) {
    var expenses = that.getLocalExpenses()
    var newExpense = {
      _id: that.generateId(),
      amount: expenseData.amount,
      type: expenseData.type,
      category: expenseData.category,
      focus: expenseData.focus,
      tags: expenseData.tags,
      spentAt: expenseData.spentAt,
      remark: expenseData.remark,
      goal: expenseData.goal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    expenses.unshift(newExpense)
    that.saveLocalExpenses(expenses)
    resolve(newExpense)
  })
}

// 更新支出
ExpenseService.prototype.updateExpense = function(id, updateData) {
  var that = this
  return new Promise(function(resolve, reject) {
    var expenses = that.getLocalExpenses()
    var index = -1
    for (var i = 0; i < expenses.length; i++) {
      if (expenses[i]._id === id) {
        index = i
        break
      }
    }
    if (index === -1) {
      reject(new Error('未找到该支出记录'))
      return
    }
    // 合并更新数据
    for (var key in updateData) {
      if (updateData.hasOwnProperty(key)) {
        expenses[index][key] = updateData[key]
      }
    }
    expenses[index].updatedAt = new Date().toISOString()
    that.saveLocalExpenses(expenses)
    resolve(expenses[index])
  })
}

// 删除支出
ExpenseService.prototype.deleteExpense = function(id) {
  var that = this
  return new Promise(function(resolve, reject) {
    var expenses = that.getLocalExpenses()
    var index = -1
    for (var i = 0; i < expenses.length; i++) {
      if (expenses[i]._id === id) {
        index = i
        break
      }
    }
    if (index === -1) {
      reject(new Error('未找到该支出记录'))
      return
    }
    expenses.splice(index, 1)
    that.saveLocalExpenses(expenses)
    resolve(true)
  })
}

// ========== 关注(Focus)操作 ==========

// 获取所有关注
ExpenseService.prototype.getFocusList = function() {
  return wx.getStorageSync(this.FOCUS_KEY) || []
}

// 添加关注
ExpenseService.prototype.addFocus = function(name) {
  var focusList = this.getFocusList()
  var found = false
  for (var i = 0; i < focusList.length; i++) {
    if (focusList[i] === name) {
      found = true
      break
    }
  }
  if (!found) {
    focusList.push(name)
    wx.setStorageSync(this.FOCUS_KEY, focusList)
  }
  return focusList
}

// 删除关注
ExpenseService.prototype.removeFocus = function(name) {
  var focusList = this.getFocusList()
  var index = -1
  for (var i = 0; i < focusList.length; i++) {
    if (focusList[i] === name) {
      index = i
      break
    }
  }
  if (index > -1) {
    focusList.splice(index, 1)
    wx.setStorageSync(this.FOCUS_KEY, focusList)
  }
  return focusList
}

// 更新关注
ExpenseService.prototype.updateFocus = function(oldName, newName) {
  var focusList = this.getFocusList()
  var index = -1
  for (var i = 0; i < focusList.length; i++) {
    if (focusList[i] === oldName) {
      index = i
      break
    }
  }
  if (index > -1) {
    focusList[index] = newName
    wx.setStorageSync(this.FOCUS_KEY, focusList)
    
    // 同步更新所有支出的focus字段
    var expenses = this.getLocalExpenses()
    for (var j = 0; j < expenses.length; j++) {
      if (expenses[j].focus === oldName) {
        expenses[j].focus = newName
      }
    }
    this.saveLocalExpenses(expenses)
  }
  return focusList
}

// ========== 统计功能 ==========

// 获取月度统计
ExpenseService.prototype.getMonthStats = function(year, month) {
  var expenses = this.getExpensesByMonth(year, month)
  var total = 0
  for (var i = 0; i < expenses.length; i++) {
    total += expenses[i].amount
  }
  
  // 按focus分组
  var byFocus = {}
  for (var j = 0; j < expenses.length; j++) {
    var item = expenses[j]
    var focus = item.focus || '未分类'
    if (!byFocus[focus]) {
      byFocus[focus] = { amount: 0, count: 0 }
    }
    byFocus[focus].amount += item.amount
    byFocus[focus].count += 1
  }

  return {
    total: total,
    count: expenses.length,
    byFocus: byFocus
  }
}

// 获取月度支出（用于预算）
ExpenseService.prototype.getMonthExpenses = function(year, month) {
  var expenses = this.getLocalExpenses()
  var result = []
  for (var i = 0; i < expenses.length; i++) {
    var date = new Date(expenses[i].spentAt || expenses[i].createdAt)
    if (date.getFullYear() === year && date.getMonth() === month) {
      result.push(expenses[i])
    }
  }
  return result
}

// 获取有财记的支出
ExpenseService.prototype.getExpensesWithStory = function() {
  var expenses = this.getLocalExpenses()
  var result = []
  for (var i = 0; i < expenses.length; i++) {
    if (expenses[i].story && (expenses[i].story.text || expenses[i].story.emoji)) {
      result.push(expenses[i])
    }
  }
  return result
}

// ========== 云同步功能 ==========

// 同步到云端
ExpenseService.prototype.syncToCloud = function() {
  var that = this
  return new Promise(function(resolve, reject) {
    var expenses = that.getLocalExpenses()
    wx.cloud.callFunction({
      name: 'syncExpenses',
      data: { expenses: expenses },
      success: function(res) {
        resolve(res.result)
      },
      fail: function(err) {
        console.error('同步到云端失败:', err)
        reject(err)
      }
    })
  })
}

// 从云端同步
ExpenseService.prototype.syncFromCloud = function() {
  var that = this
  return new Promise(function(resolve, reject) {
    wx.cloud.callFunction({
      name: 'getExpenses',
      success: function(res) {
        if (res.result.data) {
          that.saveLocalExpenses(res.result.data)
        }
        resolve(res.result.data)
      },
      fail: function(err) {
        console.error('从云端同步失败:', err)
        reject(err)
      }
    })
  })
}

// ========== 辅助方法 ==========

// 生成唯一ID
ExpenseService.prototype.generateId = function() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 清空所有数据
ExpenseService.prototype.clearAll = function() {
  wx.removeStorageSync(this.EXPENSES_KEY)
  wx.removeStorageSync(this.FOCUS_KEY)
}

module.exports = new ExpenseService()
