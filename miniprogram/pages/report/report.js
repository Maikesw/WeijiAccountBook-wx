// pages/report/report.js
const expenseService = require('../../services/expenseService')
const { formatDate, formatAmount, getDaysInMonth } = require('../../utils/util')

Page({
  data: {
    currentTab: 'focus', // focus, report, story
    currentDate: '',
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    today: formatDate(new Date()),
    
    // 统计数据
    monthStats: {
      total: '0.0',
      count: 0
    },
    focusStats: [],
    dailyAverage: '0.0',
    maxAmount: '0.0',
    topFocus: {},
    storyTimeline: []
  },

  // 配色方案
  colors: ['#07c160', '#10aeff', '#ff9600', '#fa5151', '#c87ff2', '#7f5cff', '#ff6b6b', '#4ecdc4'],

  onLoad() {
    const now = new Date()
    this.setData({
      currentDate: formatDate(now, 'YYYY-MM')
    })
    this.loadReportData()
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    if (tab === 'focus') {
      this.drawPieChart()
    }
  },

  // 日期变化
  onDateChange(e) {
    const date = new Date(e.detail.value)
    this.setData({
      currentDate: e.detail.value,
      currentYear: date.getFullYear(),
      currentMonth: date.getMonth() + 1
    })
    this.loadReportData()
  },

  // 加载报表数据
  loadReportData() {
    const { currentYear, currentMonth } = this.data
    const expenses = expenseService.getExpensesByMonth(currentYear, currentMonth)
    
    // 基础统计
    const total = expenses.reduce((sum, item) => sum + item.amount, 0)
    const monthStats = {
      total: formatAmount(total),
      count: expenses.length
    }
    
    // 按关注分组统计
    const focusMap = {}
    let maxAmount = 0
    expenses.forEach(item => {
      if (item.amount > maxAmount) maxAmount = item.amount
      
      const focus = item.focus || '未分类'
      if (!focusMap[focus]) {
        focusMap[focus] = { amount: 0, count: 0 }
      }
      focusMap[focus].amount += item.amount
      focusMap[focus].count += 1
    })
    
    // 转换为数组并排序
    const focusStats = Object.entries(focusMap)
      .map(([name, data], index) => ({
        name,
        amount: formatAmount(data.amount),
        count: data.count,
        percent: total > 0 ? Math.round((data.amount / total) * 100) : 0,
        color: this.colors[index % this.colors.length]
      }))
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    
    // 日均消费
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const dailyAverage = expenses.length > 0 ? formatAmount(total / daysInMonth) : '0.0'
    
    // 最大支出项
    const topFocus = focusStats.length > 0 ? focusStats[0] : {}
    
    // 财记时间线
    const storiesWithDate = expenses
      .filter(item => item.story && (item.story.text || item.story.emoji))
      .map(item => ({
        ...item,
        amount: formatAmount(item.amount),
        displayDate: formatDate(item.spentAt, 'MM月DD日')
      }))
      .sort((a, b) => new Date(b.spentAt) - new Date(a.spentAt))
    
    this.setData({
      monthStats,
      focusStats,
      dailyAverage,
      maxAmount: formatAmount(maxAmount),
      topFocus,
      storyTimeline: storiesWithDate
    })
    
    // 绘制饼图
    if (this.data.currentTab === 'focus') {
      setTimeout(() => this.drawPieChart(), 100)
    }
  },

  // 绘制饼图
  drawPieChart() {
    const { focusStats } = this.data
    if (focusStats.length === 0) return

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
      const radius = Math.min(centerX, centerY) - 20
      
      let currentAngle = -Math.PI / 2
      
      focusStats.forEach(item => {
        const sliceAngle = (item.percent / 100) * Math.PI * 2
        
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
        ctx.closePath()
        ctx.fillStyle = item.color
        ctx.fill()
        
        currentAngle += sliceAngle
      })
      
      // 绘制中心圆（环形效果）
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
    })
  }
})
