// 支出数据服务层
const db = wx.cloud.database()
const expensesCollection = db.collection('expenses')
const focusCollection = db.collection('focus')

class ExpenseService {
  constructor() {
    this.EXPENSES_KEY = 'expenses'
    this.FOCUS_KEY = 'focusList'
  }

  // ========== 本地存储操作 ==========
  
  // 获取所有支出（本地）
  getLocalExpenses() {
    return wx.getStorageSync(this.EXPENSES_KEY) || []
  }

  // 保存所有支出到本地
  saveLocalExpenses(expenses) {
    wx.setStorageSync(this.EXPENSES_KEY, expenses)
  }

  // 根据ID获取支出
  getExpenseById(id) {
    const expenses = this.getLocalExpenses()
    for (let i = 0; i < expenses.length; i++) {
      if (expenses[i]._id === id) {
        return expenses[i]
      }
    }
    return null
  }

  // 获取某月支出
  getExpensesByMonth(year, month) {
    const expenses = this.getLocalExpenses()
    const result = []
    for (let i = 0; i < expenses.length; i++) {
      const date = new Date(expenses[i].spentAt)
      if (date.getFullYear() === year && date.getMonth() + 1 === month) {
        result.push(expenses[i])
      }
    }
    return result
  }

  // 获取某天支出
  getExpensesByDate(dateStr) {
    const expenses = this.getLocalExpenses()
    const result = []
    const targetDate = new Date(dateStr)
    for (let i = 0; i < expenses.length; i++) {
      const itemDate = new Date(expenses[i].spentAt)
      if (itemDate.toDateString() === targetDate.toDateString()) {
        result.push(expenses[i])
      }
    }
    return result
  }

  // 创建支出
  createExpense(expenseData) {
    const that = this
    return new Promise(function(resolve, reject) {
      const expenses = that.getLocalExpenses()
      const newExpense = {
        _id: that.generateId(),
        amount: expenseData.amount,
        type: expenseData.type,
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
  updateExpense(id, updateData) {
    const that = this
    return new Promise(function(resolve, reject) {
      const expenses = that.getLocalExpenses()
      let index = -1
      for (let i = 0; i < expenses.length; i++) {
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
      for (let key in updateData) {
        expenses[index][key] = updateData[key]
      }
      expenses[index].updatedAt = new Date().toISOString()
      that.saveLocalExpenses(expenses)
      resolve(expenses[index])
    })
  }

  // 删除支出
  deleteExpense(id) {
    const that = this
    return new Promise(function(resolve, reject) {
      const expenses = that.getLocalExpenses()
      let index = -1
      for (let i = 0; i < expenses.length; i++) {
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
  getFocusList() {
    return wx.getStorageSync(this.FOCUS_KEY) || []
  }

  // 添加关注
  addFocus(name) {
    const focusList = this.getFocusList()
    if (!focusList.includes(name)) {
      focusList.push(name)
      wx.setStorageSync(this.FOCUS_KEY, focusList)
    }
    return focusList
  }

  // 删除关注
  removeFocus(name) {
    const focusList = this.getFocusList()
    const index = focusList.indexOf(name)
    if (index > -1) {
      focusList.splice(index, 1)
      wx.setStorageSync(this.FOCUS_KEY, focusList)
    }
    return focusList
  }

  // 更新关注
  updateFocus(oldName, newName) {
    const focusList = this.getFocusList()
    const index = focusList.indexOf(oldName)
    if (index > -1) {
      focusList[index] = newName
      wx.setStorageSync(this.FOCUS_KEY, focusList)
      
      // 同步更新所有支出的focus字段
      const expenses = this.getLocalExpenses()
      for (let i = 0; i < expenses.length; i++) {
        if (expenses[i].focus === oldName) {
          expenses[i].focus = newName
        }
      }
      this.saveLocalExpenses(expenses)
    }
    return focusList
  }

  // ========== 统计功能 ==========

  // 获取月度统计
  getMonthStats(year, month) {
    const expenses = this.getExpensesByMonth(year, month)
    let total = 0
    for (let i = 0; i < expenses.length; i++) {
      total += expenses[i].amount
    }
    
    // 按focus分组
    const byFocus = {}
    for (let i = 0; i < expenses.length; i++) {
      const item = expenses[i]
      const focus = item.focus || '未分类'
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

  // 获取有财记的支出
  getExpensesWithStory() {
    const expenses = this.getLocalExpenses()
    const result = []
    for (let i = 0; i < expenses.length; i++) {
      if (expenses[i].story && (expenses[i].story.text || expenses[i].story.emoji)) {
        result.push(expenses[i])
      }
    }
    return result
  }

  // ========== 云同步功能 ==========

  // 同步到云端
  async syncToCloud() {
    try {
      const expenses = this.getLocalExpenses()
      const { result } = await wx.cloud.callFunction({
        name: 'syncExpenses',
        data: { expenses }
      })
      return result
    } catch (err) {
      console.error('同步到云端失败:', err)
      throw err
    }
  }

  // 从云端同步
  async syncFromCloud() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getExpenses'
      })
      if (result.data) {
        this.saveLocalExpenses(result.data)
      }
      return result.data
    } catch (err) {
      console.error('从云端同步失败:', err)
      throw err
    }
  }

  // ========== 辅助方法 ==========

  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 清空所有数据
  clearAll() {
    wx.removeStorageSync(this.EXPENSES_KEY)
    wx.removeStorageSync(this.FOCUS_KEY)
  }
}

module.exports = new ExpenseService()
