// 统计页 - 优化版本
const expenseService = require('../../services/expenseService')
const { formatDate, formatAmount, getDaysInMonth } = require('../../utils/util')

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

  onLoad() {
    const now = new Date()
    this.setData({
      currentDate: formatDate(now, 'YYYY-MM')
    })
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  // 加载所有数据
  loadData() {
    this.loadStats()
    this.loadCategoryStats()
    this.loadDetailList(true)
    this.drawCharts()
  },

  // 加载统计数据
  loadStats() {
    const { currentTimeTab, currentYear, currentMonth } = this.data
    let expenses = []
    
    if (currentTimeTab === 'month') {
      expenses = expenseService.getExpensesByMonth(currentYear, currentMonth)
    } else if (currentTimeTab === 'year') {
      // 获取全年数据
      const allExpenses = expenseService.getLocalExpenses()
      expenses = []
      for (let i = 0; i < allExpenses.length; i++) {
        const date = new Date(allExpenses[i].spentAt)
        if (date.getFullYear() === currentYear) {
          expenses.push(allExpenses[i])
        }
      }
    } else {
      expenses = expenseService.getLocalExpenses()
    }
    
    let income = 0, expense = 0
    for (let i = 0; i < expenses.length; i++) {
      if (expenses[i].type === 'income' || expenses[i].focus === '收入') {
        income += expenses[i].amount
      } else {
        expense += expenses[i].amount
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
  loadCategoryStats() {
    const { currentTimeTab, currentYear, currentMonth } = this.data
    let expenses = []
    
    if (currentTimeTab === 'month') {
      expenses = expenseService.getExpensesByMonth(currentYear, currentMonth)
    } else {
      expenses = expenseService.getLocalExpenses()
    }
    
    // 按分类汇总
    const categoryMap = {}
    for (let i = 0; i < expenses.length; i++) {
      const item = expenses[i]
      if (item.type === 'income') continue // 只统计支出
      
      const category = item.focus || (item.tags && item.tags[0]) || '其他'
      if (!categoryMap[category]) {
        categoryMap[category] = 0
      }
      categoryMap[category] += item.amount
    }
    
    // 转换为数组并排序
    let total = 0
    for (let key in categoryMap) {
      total += categoryMap[key]
    }
    
    const stats = []
    let index = 0
    for (let name in categoryMap) {
      const amount = categoryMap[name]
      stats.push({
        name: name,
        amount: formatAmount(amount),
        value: amount,
        percent: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: this.colors[index % this.colors.length]
      })
      index++
    }
    
    stats.sort(function(a, b) { return b.value - a.value })
    stats.splice(6) // 只显示前6个
    
    this.setData({ categoryStats: stats })
  },

  // 加载明细列表
  loadDetailList(reset = false) {
    if (reset) {
      this.setData({ currentPage: 1, detailList: [] })
    }
    
    const { currentTimeTab, currentYear, currentMonth, pageSize, currentPage } = this.data
    let expenses = []
    
    if (currentTimeTab === 'month') {
      expenses = expenseService.getExpensesByMonth(currentYear, currentMonth)
    } else if (currentTimeTab === 'year') {
      const allExpenses = expenseService.getLocalExpenses()
      expenses = []
      for (let i = 0; i < allExpenses.length; i++) {
        const date = new Date(allExpenses[i].spentAt)
        if (date.getFullYear() === currentYear) {
          expenses.push(allExpenses[i])
        }
      }
    } else {
      expenses = expenseService.getLocalExpenses()
    }
    
    // 分页
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    const pageData = expenses.slice(start, end)
    
    const formatted = []
    for (let i = 0; i < pageData.length; i++) {
      formatted.push(this.formatDetailItem(pageData[i]))
    }
    
    const newDetailList = reset ? formatted : this.data.detailList.concat(formatted)
    
    this.setData({
      detailList: newDetailList,
      hasMore: end < expenses.length,
      currentPage: currentPage + 1
    })
  },

  // 格式化明细项
  formatDetailItem(item) {
    const categoryIcons = {
      '餐饮': '🍔', '交通': '🚇', '房租': '🏠', '购物': '🛍️',
      '娱乐': '🎮', '医疗': '💊', '教育': '📚', '工资': '💰',
      '理财': '📈', '其他': '📦'
    }
    
    const categoryColors = {
      '餐饮': '#FFF7E8', '交通': '#E6F4FF', '房租': '#F0F5FF',
      '购物': '#FFECE8', '娱乐': '#F5F0FF', '医疗': '#FFF0F0',
      '教育': '#F0FFF0', '工资': '#E8FFEA', '理财': '#FFF7E8'
    }
    
    const category = item.focus || (item.tags && item.tags[0]) || '其他'
    const date = new Date(item.spentAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let displayDate = ''
    if (date.toDateString() === today.toDateString()) {
      displayDate = '今天 ' + formatDate(date, 'HH:mm')
    } else if (date.toDateString() === yesterday.toDateString()) {
      displayDate = '昨天 ' + formatDate(date, 'HH:mm')
    } else {
      displayDate = formatDate(date, 'MM-DD HH:mm')
    }
    
    const result = {
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
    return result
  },

  // 绘制图表
  drawCharts() {
    setTimeout(() => {
      this.drawTrendChart()
      this.drawPieChart()
    }, 300)
  },

  // 绘制趋势图
  drawTrendChart() {
    const query = wx.createSelectorQuery()
    query.select('#trendChart').fields({ node: true, size: true }).exec((res) => {
      if (!res[0]) return
      
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = wx.getSystemInfoSync().pixelRatio
      
      canvas.width = res[0].width * dpr
      canvas.height = res[0].height * dpr
      ctx.scale(dpr, dpr)
      
      const width = res[0].width
      const height = res[0].height
      const padding = { top: 40, right: 20, bottom: 40, left: 60 }
      
      // 清空画布
      ctx.clearRect(0, 0, width, height)
      
      // 获取数据
      const { currentYear, currentMonth } = this.data
      const days = getDaysInMonth(currentYear, currentMonth)
      const expenses = expenseService.getExpensesByMonth(currentYear, currentMonth)
      
      // 按天汇总
      const dailyData = {}
      for (let i = 1; i <= days; i++) {
        dailyData[i] = { income: 0, expense: 0 }
      }
      
      for (let i = 0; i < expenses.length; i++) {
        const item = expenses[i]
        const day = new Date(item.spentAt).getDate()
        if (item.type === 'income') {
          dailyData[day].income += item.amount
        } else {
          dailyData[day].expense += item.amount
        }
      }
      
      const dataPoints = []
      for (let day in dailyData) {
        dataPoints.push({
          day: parseInt(day),
          income: dailyData[day].income,
          expense: dailyData[day].expense
        })
      }
      
      // 计算最大值
      let maxValue = 100
      for (let i = 0; i < dataPoints.length; i++) {
        const maxOfDay = Math.max(dataPoints[i].income, dataPoints[i].expense)
        if (maxOfDay > maxValue) {
          maxValue = maxOfDay
        }
      }
      
      const chartWidth = width - padding.left - padding.right
      const chartHeight = height - padding.top - padding.bottom
      
      // 绘制坐标轴
      ctx.strokeStyle = '#E5E6EB'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padding.left, padding.top)
      ctx.lineTo(padding.left, height - padding.bottom)
      ctx.lineTo(width - padding.right, height - padding.bottom)
      ctx.stroke()
      
      // 绘制网格线
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i
        ctx.beginPath()
        ctx.moveTo(padding.left, y)
        ctx.lineTo(width - padding.right, y)
        ctx.stroke()
        
        // Y轴标签
        ctx.fillStyle = '#86909C'
        ctx.font = '20rpx sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText((maxValue * (1 - i / 4)).toFixed(0), padding.left - 10, y + 6)
      }
      
      // 绘制折线
      const drawLine = function(dataKey, color) {
        ctx.strokeStyle = color
        ctx.lineWidth = 3
        ctx.beginPath()
        
        for (let i = 0; i < dataPoints.length; i++) {
          const point = dataPoints[i]
          const x = padding.left + (chartWidth / (days - 1)) * i
          const y = padding.top + chartHeight - (point[dataKey] / maxValue) * chartHeight
          
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        
        ctx.stroke()
        
        // 绘制数据点
        ctx.fillStyle = color
        for (let i = 0; i < dataPoints.length; i++) {
          const point = dataPoints[i]
          if (point[dataKey] > 0) {
            const x = padding.left + (chartWidth / (days - 1)) * i
            const y = padding.top + chartHeight - (point[dataKey] / maxValue) * chartHeight
            ctx.beginPath()
            ctx.arc(x, y, 4, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
      
      drawLine('income', '#00B42A')
      drawLine('expense', '#F53F3F')
      
      // X轴标签（只显示部分日期）
      ctx.fillStyle = '#86909C'
      ctx.font = '20rpx sans-serif'
      ctx.textAlign = 'center'
      const labelInterval = Math.ceil(days / 6)
      for (let i = 0; i < days; i += labelInterval) {
        const x = padding.left + (chartWidth / (days - 1)) * i
        ctx.fillText(`${i + 1}日`, x, height - padding.bottom + 25)
      }
    })
  },

  // 绘制饼图
  drawPieChart() {
    const { categoryStats } = this.data
    if (categoryStats.length === 0) return

    const query = wx.createSelectorQuery()
    query.select('#pieChart').fields({ node: true, size: true }).exec((res) => {
      if (!res[0]) return
      
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = wx.getSystemInfoSync().pixelRatio
      
      canvas.width = res[0].width * dpr
      canvas.height = res[0].height * dpr
      ctx.scale(dpr, dpr)
      
      const centerX = res[0].width / 2
      const centerY = res[0].height / 2
      const radius = Math.min(centerX, centerY) - 30
      const innerRadius = radius * 0.5 // 环形图内半径
      
      let currentAngle = -Math.PI / 2
      
      for (let i = 0; i < categoryStats.length; i++) {
        const item = categoryStats[i]
        const sliceAngle = (item.percent / 100) * Math.PI * 2
        
        // 绘制扇形
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true)
        ctx.closePath()
        ctx.fillStyle = item.color
        ctx.fill()
        
        // 绘制百分比标签（大于5%才显示）
        if (item.percent > 5) {
          const labelAngle = currentAngle + sliceAngle / 2
          const labelX = centerX + Math.cos(labelAngle) * (radius * 0.75)
          const labelY = centerY + Math.sin(labelAngle) * (radius * 0.75)
          
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

  // 切换时间标签
  switchTimeTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTimeTab: tab })
    this.loadData()
  },

  // 日期选择
  onDateChange(e) {
    const date = new Date(e.detail.value)
    this.setData({
      currentDate: e.detail.value,
      currentYear: date.getFullYear(),
      currentMonth: date.getMonth() + 1
    })
    this.loadData()
  },

  // 加载更多
  loadMore() {
    this.loadDetailList(false)
  },

  // 查看详情
  viewDetail(e) {
    const id = e.currentTarget.dataset.id
    const app = getApp()
    const expense = expenseService.getExpenseById(id)
    
    if (expense) {
      app.globalData.isEditMode = true
      app.globalData.currentExpense = expense
      wx.navigateTo({ url: '/pages/expense/expense' })
    }
  },

  // 去记账
  goAdd() {
    wx.switchTab({ url: '/pages/book/book' })
  }
})
