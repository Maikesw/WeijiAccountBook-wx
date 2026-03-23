const feedback = require('../../utils/feedback')
const goalService = require('../../services/goalService')

Page({
  data: {
    goals: [],
    totalSaved: '¥0.00',
    totalTarget: '¥0.00',
    showAddGoal: false,
    showSaveMoney: false,
    showRecords: false,
    iconOptions: ['🏠', '🚗', '✈️', '💻', '📱', '👗', '🎮', '📚', '🏥', '🎁'],
    newGoal: {
      icon: '🏠',
      name: '',
      target: '',
      description: ''
    },
    selectedGoal: null,
    saveAmount: '',
    saveRemark: '',
    recordGoal: null,
    records: []
  },

  onLoad: function() {
    this.loadGoals()
  },

  onShow: function() {
    this.loadGoals()
  },

  loadGoals: function() {
    var goals = goalService.getGoals()
    var processedGoals = goals.map(function(goal) {
      var progress = goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0
      var days = Math.ceil((Date.now() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      var remaining = goal.target - goal.saved
      var colors = ['#1677FF', '#00B42A', '#F77234', '#F53F3F', '#722ED1', '#F7BA1E']
      var color = colors[goal.id % colors.length]
      return {
        ...goal,
        progress: progress,
        days: days,
        remaining: remaining.toFixed(2),
        color: color
      }
    })
    
    var totalSaved = goals.reduce(function(sum, g) { return sum + g.saved }, 0)
    var totalTarget = goals.reduce(function(sum, g) { return sum + g.target }, 0)
    
    this.setData({
      goals: processedGoals,
      totalSaved: '¥' + totalSaved.toFixed(2),
      totalTarget: '¥' + totalTarget.toFixed(2)
    })
  },

  // 显示添加弹窗
  showAddModal: function() {
    this.setData({
      showAddGoal: true,
      newGoal: { icon: '🏠', name: '', target: '', description: '' }
    })
  },

  hideAddModal: function() {
    this.setData({ showAddGoal: false })
  },

  // 图标选择
  selectIcon: function(e) {
    this.setData({ 'newGoal.icon': e.currentTarget.dataset.icon })
  },

  // 输入处理
  onNameInput: function(e) {
    this.setData({ 'newGoal.name': e.detail.value })
  },

  onTargetInput: function(e) {
    this.setData({ 'newGoal.target': e.detail.value })
  },

  onDescInput: function(e) {
    this.setData({ 'newGoal.description': e.detail.value })
  },

  // 计算是否可以添加
  canAddGoal: function() {
    return this.data.newGoal.name && parseFloat(this.data.newGoal.target) > 0
  },

  // 添加目标
  addGoal: function() {
    if (!this.canAddGoal()) return
    
    var goal = {
      icon: this.data.newGoal.icon,
      name: this.data.newGoal.name,
      target: parseFloat(this.data.newGoal.target),
      description: this.data.newGoal.description
    }
    
    goalService.addGoal(goal)
    this.hideAddModal()
    this.loadGoals()
    wx.showToast({ title: '创建成功', icon: 'success' })
  },

  // 显示存入弹窗
  showSaveModal: function(e) {
    var id = parseInt(e.currentTarget.dataset.id)
    var goal = this.data.goals.find(function(g) { return g.id === id })
    
    this.setData({
      showSaveMoney: true,
      selectedGoal: goal,
      saveAmount: '',
      saveRemark: ''
    })
  },

  hideSaveModal: function() {
    this.setData({ showSaveMoney: false })
  },

  // 快捷金额
  setQuickSave: function(e) {
    this.setData({ saveAmount: e.currentTarget.dataset.amount.toString() })
  },

  onSaveAmountInput: function(e) {
    this.setData({ saveAmount: e.detail.value })
  },

  onSaveRemarkInput: function(e) {
    this.setData({ saveRemark: e.detail.value })
  },

  // 存入
  saveMoney: function() {
    var amount = parseFloat(this.data.saveAmount)
    if (!amount || amount <= 0) return
    
    goalService.saveMoney(this.data.selectedGoal.id, amount, this.data.saveRemark)
    this.hideSaveModal()
    this.loadGoals()
    wx.showToast({ title: '存入成功', icon: 'success' })
  },

  // 查看记录
  viewRecords: function(e) {
    var id = parseInt(e.currentTarget.dataset.id)
    var goal = this.data.goals.find(function(g) { return g.id === id })
    var records = goalService.getRecords(id)
    
    this.setData({
      showRecords: true,
      recordGoal: goal,
      records: records
    })
  },

  hideRecordsModal: function() {
    this.setData({ showRecords: false })
  },

  // 菜单
  showMenu: function(e) {
    var id = parseInt(e.currentTarget.dataset.id)
    wx.showActionSheet({
      itemList: ['删除目标'],
      itemColor: '#F53F3F',
      success: function(res) {
        if (res.tapIndex === 0) {
          this.confirmDelete(id)
        }
      }.bind(this)
    })
  },

  confirmDelete: function(id) {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，已存金额不会退回',
      confirmColor: '#F53F3F',
      success: function(res) {
        if (res.confirm) {
          goalService.deleteGoal(id)
          this.loadGoals()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }.bind(this)
    })
  },

  // 目标详情
  showGoalDetail: function(e) {
    var id = parseInt(e.currentTarget.dataset.id)
    wx.navigateTo({
      url: '/pages/goal-detail/goal-detail?id=' + id
    })
  },

  stopPropagation: function() {}
})
