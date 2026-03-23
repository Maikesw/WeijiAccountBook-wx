// 统计页 - ES5版本
var expenseService = require('../../services/expenseService')
var util = require('../../utils/util')
var feedback = require('../../utils/feedback')

var formatDate = util.formatDate
var formatAmount = util.formatAmount
var getDaysInMonth = util.getDaysInMonth

Page({
  data: {
    // 时间筛选
    timeTabs: [
      { label: '本月', value: 'month' },
      { label: '本年', value: 'year' },
      { label: '全部', value: 'all' }
    ],
    currentTimeTab: 'month',
    currentDate: '',
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    today: formatDate(new Date()),
    
    // 统计数据
    stats: {
      income: '0.00',
      expense: '0.00',
      balance: '0.00',
      count: 0
    },
    
    // 分类统计
    categoryStats: [],
    
    // 明细列表
    detailList: [],
    hasMore: false,
    loading: false,
    pageSize: 20,
    currentPage: 1
  },

  // 配色方案
  colors: ['#1677FF', '#00B42A', '#F53F3F', '#FF7D00', '#722ED1', '#14C9C9', '#F7BA1E', '#86909C'],

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
    this.loadStats()
    this.loadCategoryStats()
    this.loadDetailList(true)
    this.drawCharts()
  },

  // 加载统计数据
  loadStats: function() {
    var currentTimeTab = this.data.currentTimeTab
    var currentYear = this.data.currentYear
    var currentMonth = this.data.currentMonth
    var expenses = []
    
    if (currentTimeTab === 'month') {
      expenses = expenseService.getExpensesByMonth(currentYear, currentMonth)
    } else if (currentTimeTab === 'year') {
      var allExpenses = expenseService.getLocalExpenses()
      expenses = []
      for (var i = 0; i < allExpenses.length; i++) {
        var date = new Date(allExpenses[i].spentAt)
        if (date.getFullYear() === currentYear) {
          expenses.push(allExpenses[i])
        }
      }
    } else {
      expenses = expenseService.getLocalExpenses()
    }
    
    var income = 0
    var expense = 0
    for (var j = 0; j < expenses.length; j++) {
      if (expenses[j].type === 'income' || expenses[j].focus === '收入') {
        income += expenses[j].amount
      } else {
        expense += expenses[j].amount
      }
    }
    
    this.setData({
      stats: {
        income: formatAmount(income),
        expense: formatAmount(expense),
        balance: formatAmount(income - expense),
        count: expenses.length
      }
    })
  },

  // 加载分类统计
  loadCategoryStats: function() {
    var currentTimeTab = this.data.currentTimeTab
    var currentYear = this.data.currentYear
    var currentMonth = this.data.currentMonth
    var expenses = []
    
    if (currentTimeTab === 'month') {
      expenses = expenseService.getExpensesByMonth(currentYear, currentMonth)
    } else {
      expenses = expenseService.getLocalExpenses()
    }
    
    // 按分类汇总
    var categoryMap = {}
    for (var i = 0; i < expenses.length; i++) {
      var item = expenses[i]
      if (item.type === 'income') continue
      
      var category = item.focus || (item.tags && item.tags[0]) || '其他'
      if (!categoryMap[category]) {
        categoryMap[category] = 0
      }
      categoryMap[category] += item.amount
    }
    
    // 转换为数组并排序
    var total = 0
    for (var key in categoryMap) {
      if (categoryMap.hasOwnProperty(key)) {
        total += categoryMap[key]
      }
    }
    
    var stats = []
    var index = 0
    for (var name in categoryMap) {
      if (categoryMap.hasOwnProperty(name)) {
        var amount = categoryMap[name]
        stats.push({
          name: name,
          amount: formatAmount(amount),
          value: amount,
          percent: total > 0 ? Math.round((amount / total) * 100) : 0,
          color: this.colors[index % this.colors.length]
        })
        index++
      }
    }
    
    stats.sort(function(a, b) { return b.value - a.value })
    stats.splice(6)
    
    this.setData({ categoryStats: stats })
  },

  // 加载明细列表
  loadDetailList: function(reset) {
    if (reset) {
      this.setData({ currentPage: 1, detailList: [] })
    }
    
    var currentTimeTab = this.data.currentTimeTab
    var currentYear = this.data.currentYear
    var currentMonth = this.data.currentMonth
    var pageSize = this.data.pageSize
    var currentPage = this.data.currentPage
    var expenses = []
    
    if (currentTimeTab === 'month') {
      expenses = expenseService.getExpensesByMonth(currentYear, currentMonth)
    } else if (currentTimeTab === 'year') {
      var allExpenses = expenseService.getLocalExpenses()
      for (var i = 0; i < allExpenses.length; i++) {
        var date = new Date(allExpenses[i].spentAt)
        if (date.getFullYear() === currentYear) {
          expenses.push(allExpenses[i])
        }
      }
    } else {
      expenses = expenseService.getLocalExpenses()
    }
    
    // 分页
    var start = (currentPage - 1) * pageSize
    var end = start + pageSize
    var pageData = expenses.slice(start, end)
    
    var formatted = []
    for (var j = 0; j < pageData.length; j++) {
      formatted.push(this.formatDetailItem(pageData[j]))
    }
    
    var newDetailList = reset ? formatted : this.data.detailList.concat(formatted)
    
    this.setData({
      detailList: newDetailList,
      hasMore: end < expenses.length,
      currentPage: currentPage + 1
    })
  },

  // 格式化明细项
  formatDetailItem: function(item) {
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
    var date = new Date(item.spentAt)
    var today = new Date()
    var yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    var displayDate = ''
    if (date.toDateString() === today.toDateString()) {
      displayDate = '今天 ' + formatDate(date, 'HH:mm')
    } else if (date.toDateString() === yesterday.toDateString()) {
      displayDate = '昨天 ' + formatDate(date, 'HH:mm')
    } else {
      displayDate = formatDate(date, 'MM-DD HH:mm')
    }
    
    return {
      _id: item._id,
      event: item.event,
      amount: formatAmount(item.amount),
      category: category,
      icon: categoryIcons[category] || '💰',
      bgColor: categoryColors[category] || '#F5F7FA',
      displayDate: displayDate,
      type: item.type || (item.focus === '收入' ? 'income' : 'expense'),
      spentAt: item.spentAt
    }
  },

  // 绘制图表
  drawCharts: function() {
    var that = this
    setTimeout(function() {
      that.drawTrendChart()
      that.drawPieChart()
    }, 300)
  },

  // 绘制趋势图
  drawTrendChart: function() {
    var that = this
    var query = wx.createSelectorQuery()
    query.select('#trendChart').fields({ node: true, size: true }).exec(function(res) {
      if (!res[0]) return
      
      var canvas = res[0].node
      var ctx = canvas.getContext('2d')
      var dpr = wx.getSystemInfoSync().pixelRatio
      
      canvas.width = res[0].width * dpr
      canvas.height = res[0].height * dpr
      ctx.scale(dpr, dpr)
      
      var width = res[0].width
      var height = res[0].height
      var padding = { top: 40, right: 20, bottom: 40, left: 60 }
      
      // 清空画布
      ctx.clearRect(0, 0, width, height)
      
      // 获取数据
      var currentYear = that.data.currentYear
      var currentMonth = that.data.currentMonth
      var days = getDaysInMonth(currentYear, currentMonth)
      var expenses = expenseService.getExpensesByMonth(currentYear, currentMonth)
      
      // 按天汇总
      var dailyData = {}
      for (var i = 1; i <= days; i++) {
        dailyData[i] = { income: 0, expense: 0 }
      }
      
      for (var j = 0; j < expenses.length; j++) {
        var item = expenses[j]
        var day = new Date(item.spentAt).getDate()
        if (item.type === 'income') {
          dailyData[day].income += item.amount
        } else {
          dailyData[day].expense += item.amount
        }
      }
      
      var dataPoints = []
      for (var day in dailyData) {
        if (dailyData.hasOwnProperty(day)) {
          dataPoints.push({
            day: parseInt(day),
            income: dailyData[day].income,
            expense: dailyData[day].expense
          })
        }
      }
      
      // 计算最大值
      var maxValue = 100
      for (var k = 0; k < dataPoints.length; k++) {
        var maxOfDay = Math.max(dataPoints[k].income, dataPoints[k].expense)
        if (maxOfDay > maxValue) {
          maxValue = maxOfDay
        }
      }
      
      var chartWidth = width - padding.left - padding.right
      var chartHeight = height - padding.top - padding.bottom
      
      // 绘制坐标轴
      ctx.strokeStyle = '#E5E6EB'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padding.left, padding.top)
      ctx.lineTo(padding.left, height - padding.bottom)
      ctx.lineTo(width - padding.right, height - padding.bottom)
      ctx.stroke()
      
      // 绘制网格线
      for (var m = 0; m <= 4; m++) {
        var y = padding.top + (chartHeight / 4) * m
        ctx.beginPath()
        ctx.moveTo(padding.left, y)
        ctx.lineTo(width - padding.right, y)
        ctx.stroke()
        
        // Y轴标签
        ctx.fillStyle = '#86909C'
        ctx.font = '20rpx sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText((maxValue * (1 - m / 4)).toFixed(0), padding.left - 10, y + 6)
      }
      
      // 绘制折线
      var drawLine = function(dataKey, color) {
        ctx.strokeStyle = color
        ctx.lineWidth = 3
        ctx.beginPath()
        
        for (var n = 0; n < dataPoints.length; n++) {
          var point = dataPoints[n]
          var x = padding.left + (chartWidth / (days - 1)) * n
          var y = padding.top + chartHeight - (point[dataKey] / maxValue) * chartHeight
          
          if (n === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        
        ctx.stroke()
        
        // 绘制数据点
        ctx.fillStyle = color
        for (var p = 0; p < dataPoints.length; p++) {
          var pt = dataPoints[p]
          if (pt[dataKey] > 0) {
            var px = padding.left + (chartWidth / (days - 1)) * p
            var py = padding.top + chartHeight - (pt[dataKey] / maxValue) * chartHeight
            ctx.beginPath()
            ctx.arc(px, py, 4, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
      
      drawLine('income', '#00B42A')
      drawLine('expense', '#F53F3F')
      
      // X轴标签
      ctx.fillStyle = '#86909C'
      ctx.font = '20rpx sans-serif'
      ctx.textAlign = 'center'
      var labelInterval = Math.ceil(days / 6)
      for (var q = 0; q < days; q += labelInterval) {
        var lx = padding.left + (chartWidth / (days - 1)) * q
        ctx.fillText((q + 1) + '日', lx, height - padding.bottom + 25)
      }
    })
  },

  // 绘制饼图
  drawPieChart: function() {
    var categoryStats = this.data.categoryStats
    if (categoryStats.length === 0) return

    var query = wx.createSelectorQuery()
    query.select('#pieChart').fields({ node: true, size: true }).exec(function(res) {
      if (!res[0]) return
      
      var canvas = res[0].node
      var ctx = canvas.getContext('2d')
      var dpr = wx.getSystemInfoSync().pixelRatio
      
      canvas.width = res[0].width * dpr
      canvas.height = res[0].height * dpr
      ctx.scale(dpr, dpr)
      
      var centerX = res[0].width / 2
      var centerY = res[0].height / 2
      var radius = Math.min(centerX, centerY) - 30
      var innerRadius = radius * 0.5
      
      var currentAngle = -Math.PI / 2
      
      for (var i = 0; i < categoryStats.length; i++) {
        var item = categoryStats[i]
        var sliceAngle = (item.percent / 100) * Math.PI * 2
        
        // 绘制扇形
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true)
        ctx.closePath()
        ctx.fillStyle = item.color
        ctx.fill()
        
        // 绘制百分比标签
        if (item.percent > 5) {
          var labelAngle = currentAngle + sliceAngle / 2
          var labelX = centerX + Math.cos(labelAngle) * (radius * 0.75)
          var labelY = centerY + Math.sin(labelAngle) * (radius * 0.75)
          
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 22rpx sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(item.percent + '%', labelX, labelY)
        }
        
        currentAngle += sliceAngle
      }
      
      // 中心文字
      ctx.fillStyle = '#1D2129'
      ctx.font = 'bold 32rpx sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('支出', centerX, centerY - 15)
      ctx.font = '24rpx sans-serif'
      ctx.fillStyle = '#86909C'
      ctx.fillText('占比', centerX, centerY + 15)
    })
  },

  // 切换时间标签 - 带反馈
  switchTimeTab: function(e) {
    var tab = e.currentTarget.dataset.tab
    var that = this
    feedback.switchFeedback(this, 'currentTimeTab', tab, function() {
      that.loadData()
    })
  },

  // 日期选择
  onDateChange: function(e) {
    var date = new Date(e.detail.value)
    this.setData({
      currentDate: e.detail.value,
      currentYear: date.getFullYear(),
      currentMonth: date.getMonth() + 1
    })
    this.loadData()
  },

  // 加载更多 - 带反馈
  loadMore: function() {
    var that = this
    feedback.buttonVisual('light')
    this.setData({ loading: true })
    this.loadDetailList(false)
    setTimeout(function() {
      that.setData({ loading: false })
    }, 500)
  },

  // 查看详情 - 带反馈
  viewDetail: function(e) {
    feedback.buttonVisual('light')
    var id = e.currentTarget.dataset.id
    var app = getApp()
    var expense = expenseService.getExpenseById(id)
    
    if (expense) {
      app.globalData.isEditMode = true
      app.globalData.currentExpense = expense
      wx.navigateTo({ url: '/pages/expense/expense' })
    }
  },

  // 去记账 - 带反馈
  goAdd: function() {
    feedback.buttonVisual('light')
    wx.switchTab({ url: '/pages/book/book' })
  }
})
