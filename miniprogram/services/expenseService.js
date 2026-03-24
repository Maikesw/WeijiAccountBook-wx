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
  
  // 获取所有支出（本地，默认过滤已软删除的）
  getLocalExpenses(includeDeleted = false) {
    const expenses = wx.getStorageSync(this.EXPENSES_KEY) || []
    if (includeDeleted) {
      return expenses
    }
    // 过滤掉已软删除的记录
    return expenses.filter(item => !item.deletedAt)
  }

  // 获取所有支出（包含已删除的，用于同步）
  getAllLocalExpenses() {
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
      // 使用 getAllLocalExpenses 获取完整数据
      const expenses = that.getAllLocalExpenses()
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
      // 检查记录是否已被删除
      if (expenses[index].deletedAt) {
        reject(new Error('该记录已被删除，无法更新'))
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

  // 删除支出（软删除，标记 deletedAt 用于同步）
  deleteExpense(id) {
    const that = this
    return new Promise(function(resolve, reject) {
      // 使用 getAllLocalExpenses 获取完整数据（包含已删除的）
      const expenses = that.getAllLocalExpenses()
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
      // 软删除：标记 deletedAt，而不是真正删除
      expenses[index].deletedAt = new Date().toISOString()
      expenses[index].updatedAt = new Date().toISOString()
      that.saveLocalExpenses(expenses)
      resolve(true)
    })
  }

  // 彻底删除支出（清理已软删除的数据，谨慎使用）
  permanentlyDeleteExpense(id) {
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

  // 同步到云端（自动清理超过30天的软删除记录）
  async syncToCloud() {
    try {
      // 先清理超过30天的软删除记录（本地+云端）
      const cleanResult = await this.cleanOldDeletedExpenses()
      if (cleanResult.localCount > 0 || cleanResult.cloudCount > 0) {
        console.log(`自动清理完成：本地 ${cleanResult.localCount} 条，云端 ${cleanResult.cloudCount} 条`)
      }

      // 获取清理后的数据（包含软删除标记的，用于同步到云端）
      const expenses = this.getAllLocalExpenses()
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

  // 清理超过30天的软删除记录（本地+云端）
  async cleanOldDeletedExpenses() {
    const result = { localCount: 0, cloudCount: 0 }

    // 1. 先清理云端（返回删除的数量）
    try {
      const { result: cloudResult } = await wx.cloud.callFunction({
        name: 'deleteOldExpenses'
      })
      if (cloudResult.success) {
        result.cloudCount = cloudResult.deletedCount || 0
      }
    } catch (err) {
      console.error('清理云端记录失败:', err)
      // 云端清理失败不影响本地清理
    }

    // 2. 再清理本地
    const expenses = this.getAllLocalExpenses()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thresholdTime = thirtyDaysAgo.getTime()

    const remainingExpenses = []
    let localCleanedCount = 0

    for (let i = 0; i < expenses.length; i++) {
      const item = expenses[i]
      if (item.deletedAt) {
        const deletedTime = new Date(item.deletedAt).getTime()
        if (deletedTime < thresholdTime) {
          // 超过30天，彻底删除
          localCleanedCount++
          continue
        }
      }
      remainingExpenses.push(item)
    }

    if (localCleanedCount > 0) {
      this.saveLocalExpenses(remainingExpenses)
      result.localCount = localCleanedCount
    }

    return result
  }

  // 从云端同步（合并策略：按时间戳取最新，处理软删除）
  async syncFromCloud() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getExpenses'
      })
      if (!result.data || result.data.length === 0) {
        return []
      }

      const cloudExpenses = result.data
      // 获取包含软删除的所有本地数据
      const localExpenses = this.getAllLocalExpenses()

      // 构建本地数据 Map，方便查找
      const localMap = new Map()
      for (let i = 0; i < localExpenses.length; i++) {
        localMap.set(localExpenses[i]._id, localExpenses[i])
      }

      // 合并结果
      const mergedExpenses = []
      const processedIds = new Set()

      // 处理云端数据
      for (let i = 0; i < cloudExpenses.length; i++) {
        const cloudItem = cloudExpenses[i]
        const localItem = localMap.get(cloudItem._id)

        if (localItem) {
          // 两边都有，比较 updatedAt 取最新
          const cloudTime = new Date(cloudItem.updatedAt).getTime()
          const localTime = new Date(localItem.updatedAt).getTime()

          if (cloudTime > localTime) {
            // 云端更新：如果云端标记了删除，使用云端版本
            mergedExpenses.push(cloudItem)
          } else {
            // 本地更新或相同：保留本地版本
            mergedExpenses.push(localItem)
          }
        } else {
          // 云端有、本地没有，新增到本地（但如果云端已删除，也保留删除标记）
          mergedExpenses.push(cloudItem)
        }
        processedIds.add(cloudItem._id)
      }

      // 处理本地独有的数据（云端没有的）
      for (let i = 0; i < localExpenses.length; i++) {
        const localItem = localExpenses[i]
        if (!processedIds.has(localItem._id)) {
          mergedExpenses.push(localItem)
        }
      }

      // 保存合并后的数据（包含软删除标记的）
      this.saveLocalExpenses(mergedExpenses)

      console.log('云端同步完成:', {
        cloudCount: cloudExpenses.length,
        localCount: localExpenses.length,
        mergedCount: mergedExpenses.length,
        deletedCount: mergedExpenses.filter(item => item.deletedAt).length
      })

      return mergedExpenses
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
