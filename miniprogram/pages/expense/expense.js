// 记账页 - 优化版本
const expenseService = require('../../services/expenseService')
const { formatDate, formatAmount, showToast } = require('../../utils/util')

Page({
  data: {
    // 模式
    isEditMode: false,
    expenseId: null,
    
    // 类型
    type: 'expense', // expense, income
    
    // 金额
    amount: '',
    quickAmounts: ['10', '20', '50', '100', '200', '500'],
    
    // 分类
    selectedCategory: '',
    categories: [],
    
    // 日期
    spentAt: formatDate(new Date()),
    spentAtDisplay: '',
    today: formatDate(new Date()),
    
    // 备注
    remark: '',
    
    // 存钱目标
    linkGoal: false,
    selectedGoal: '',
    savingsGoals: []
  },

  onLoad() {
    this.initCategories()
    this.initSavingsGoals()
    this.updateDateDisplay()
    
    // 检查编辑模式
    const app = getApp()
    if (app.globalData.isEditMode && app.globalData.currentExpense) {
      this.fillEditData(app.globalData.currentExpense)
    }
  },

  // 初始化分类
  initCategories() {
    const expenseCategories = [
      { name: '餐饮', icon: '🍔', bgColor: '#FFF7E8', color: '#FF7D00' },
      { name: '交通', icon: '🚇', bgColor: '#E6F4FF', color: '#1677FF' },
      { name: '购物', icon: '🛍️', bgColor: '#FFECE8', color: '#F53F3F' },
      { name: '娱乐', icon: '🎮', bgColor: '#F5F0FF', color: '#722ED1' },
      { name: '居住', icon: '🏠', bgColor: '#F0F5FF', color: '#165DFF' },
      { name: '医疗', icon: '💊', bgColor: '#FFF0F0', color: '#F53F3F' },
      { name: '教育', icon: '📚', bgColor: '#F0FFF0', color: '#00B42A' },
      { name: '其他', icon: '📦', bgColor: '#F5F7FA', color: '#86909C' }
    ]
    
    const incomeCategories = [
      { name: '工资', icon: '💰', bgColor: '#E8FFEA', color: '#00B42A' },
      { name: '奖金', icon: '🎁', bgColor: '#FFF7E8', color: '#FF7D00' },
      { name: '投资', icon: '📈', bgColor: '#E6F4FF', color: '#1677FF' },
      { name: '兼职', icon: '💻', bgColor: '#F0F5FF', color: '#165DFF' },
      { name: '红包', icon: '🧧', bgColor: '#FFECE8', color: '#F53F3F' },
      { name: '其他', icon: '📦', bgColor: '#F5F7FA', color: '#86909C' }
    ]
    
    this.setData({
      categories: this.data.type === 'income' ? incomeCategories : expenseCategories
    })
  },

  // 初始化存钱目标
  initSavingsGoals() {
    const goals = wx.getStorageSync('savingsGoals') || [
      { name: '旅行基金', target: 10000, current: 4500, progress: 45 },
      { name: '新手机', target: 8000, current: 1600, progress: 20 }
    ]
    this.setData({ savingsGoals: goals })
  },

  // 更新日期显示
  updateDateDisplay() {
    const date = new Date(this.data.spentAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let display = ''
    if (date.toDateString() === today.toDateString()) {
      display = '今天'
    } else if (date.toDateString() === yesterday.toDateString()) {
      display = '昨天'
    } else {
      display = formatDate(date, 'YYYY年MM月DD日')
    }
    
    this.setData({ spentAtDisplay: display })
  },

  // 填充编辑数据
  fillEditData(expense) {
    const spentAt = formatDate(expense.spentAt || new Date(), 'YYYY-MM-DD')
    
    this.setData({
      isEditMode: true,
      expenseId: expense._id,
      type: expense.type || 'expense',
      amount: expense.amount ? formatAmount(expense.amount) : '',
      selectedCategory: expense.focus || expense.tags[0] || '',
      spentAt: spentAt,
      remark: expense.remark || expense.story?.text || '',
      linkGoal: !!expense.goal,
      selectedGoal: expense.goal || ''
    })
    
    // 根据类型更新分类
    this.initCategories()
    this.updateDateDisplay()
  },

  // 金额输入
  onAmountInput(e) {
    let value = e.detail.value
    // 限制两位小数
    if (value.indexOf('.') > -1) {
      const parts = value.split('.')
      if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2)
      }
    }
    this.setData({ amount: value })
  },

  // 快捷金额
  setQuickAmount(e) {
    this.setData({ amount: e.currentTarget.dataset.amount })
  },

  // 切换类型
  switchType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ 
      type: type,
      selectedCategory: '' // 清空分类选择
    })
    this.initCategories()
  },

  // 选择分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ selectedCategory: category.name })
  },

  // 日期选择
  onDateChange(e) {
    this.setData({ spentAt: e.detail.value })
    this.updateDateDisplay()
  },

  // 备注输入
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // 切换关联目标
  toggleLinkGoal(e) {
    this.setData({ 
      linkGoal: e.detail.value,
      selectedGoal: e.detail.value ? this.data.selectedGoal : ''
    })
  },

  // 选择目标
  selectGoal(e) {
    const goal = e.currentTarget.dataset.goal
    this.setData({ selectedGoal: goal.name })
  },

  // 验证
  canSubmit() {
    return this.data.amount && parseFloat(this.data.amount) > 0 && this.data.selectedCategory
  },

  // 提交
  onSubmit() {
    const that = this
    if (!this.canSubmit()) {
      if (!this.data.amount || parseFloat(this.data.amount) <= 0) {
        showToast('请输入有效金额')
      } else if (!this.data.selectedCategory) {
        showToast('请选择分类')
      }
      return
    }

    const expenseData = {
      amount: parseFloat(this.data.amount),
      type: this.data.type,
      focus: this.data.selectedCategory,
      tags: [this.data.selectedCategory],
      spentAt: new Date(this.data.spentAt).toISOString(),
      remark: this.data.remark,
      goal: this.data.linkGoal ? this.data.selectedGoal : null
    }

    const promise = this.data.isEditMode 
      ? expenseService.updateExpense(this.data.expenseId, expenseData)
      : expenseService.createExpense(expenseData)
    
    promise.then(function() {
      showToast(that.data.isEditMode ? '修改成功' : '记账成功', 'success')
      wx.navigateBack()
    }).catch(function(err) {
      showToast(err.message || '操作失败')
    })
  },

  // 删除
  onDelete() {
    const that = this
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      confirmColor: '#F53F3F',
      success: function(res) {
        if (!res.confirm) return
        
        expenseService.deleteExpense(that.data.expenseId).then(function() {
          showToast('删除成功', 'success')
          wx.navigateBack()
        }).catch(function(err) {
          showToast(err.message || '删除失败')
        })
      }
    })
  }
})
