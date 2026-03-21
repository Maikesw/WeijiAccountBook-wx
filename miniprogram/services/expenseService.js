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
    return expenses.find(item => item._id === id)
  }

  // 获取某月支出
  getExpensesByMonth(year, month) {
    const expenses = this.getLocalExpenses()
    return expenses.filter(item => {
      const date = new Date(item.spentAt)
      return date.getFullYear() === year && date.getMonth() + 1 === month
    })
  }

  // 获取某天支出
  getExpensesByDate(dateStr) {
    const expenses = this.getLocalExpenses()
    return expenses.filter(item => {
      const itemDate = new Date(item.spentAt)
      const targetDate = new Date(dateStr)
      return itemDate.toDateString() === targetDate.toDateString()
    })
  }

  // 创建支出
  createExpense(expenseData) {
    return new Promise((resolve, reject) => {
      const expenses = this.getLocalExpenses()
      const newExpense = {
        _id: this.generateId(),
        ...expenseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      expenses.unshift(newExpense)
      this.saveLocalExpenses(expenses)
      resolve(newExpense)
    })
  }

  // 更新支出
  updateExpense(id, updateData) {
    return new Promise((resolve, reject) => {
      const expenses = this.getLocalExpenses()
      const index = expenses.findIndex(item => item._id === id)
      if (index === -1) {
        reject(new Error('未找到该支出记录'))
        return
      }
      expenses[index] = {
        ...expenses[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      }
      this.saveLocalExpenses(expenses)
      resolve(expenses[index])
    })
  }

  // 删除支出
  deleteExpense(id) {
    return new Promise((resolve, reject) => {
      const expenses = this.getLocalExpenses()
      const index = expenses.findIndex(item => item._id === id)
      if (index === -1) {
        reject(new Error('未找到该支出记录'))
        return
      }
      expenses.splice(index, 1)
      this.saveLocalExpenses(expenses)
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
      expenses.forEach(expense => {
        if (expense.focus === oldName) {
          expense.focus = newName
        }
      })
      this.saveLocalExpenses(expenses)
    }
    return focusList
  }

  // ========== 统计功能 ==========

  // 获取月度统计
  getMonthStats(year, month) {
    const expenses = this.getExpensesByMonth(year, month)
    const total = expenses.reduce((sum, item) => sum + item.amount, 0)
    
    // 按focus分组
    const byFocus = {}
    expenses.forEach(item => {
      const focus = item.focus || '未分类'
      if (!byFocus[focus]) {
        byFocus[focus] = { amount: 0, count: 0 }
      }
      byFocus[focus].amount += item.amount
      byFocus[focus].count += 1
    })

    return {
      total,
      count: expenses.length,
      byFocus
    }
  }

  // 获取有财记的支出
  getExpensesWithStory() {
    const expenses = this.getLocalExpenses()
    return expenses.filter(item => item.story && (item.story.text || item.story.emoji))
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
