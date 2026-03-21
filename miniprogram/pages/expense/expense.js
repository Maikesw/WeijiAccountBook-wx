// pages/expense/expense.js
const expenseService = require('../../services/expenseService')
const textParser = require('../../utils/textParser')
const { formatDate, formatAmount, showToast, showConfirm } = require('../../utils/util')

Page({
  data: {
    // 基础数据
    isEditMode: false,
    expenseId: null,
    
    // 原始文本输入
    originalText: '',
    parsedData: {
      amount: 0,
      event: ''
    },
    
    // 基础信息
    spentAt: formatDate(new Date()),
    spentAtDisplay: '',
    today: formatDate(new Date()),
    event: '',
    amount: '',
    
    // 标签
    tags: [],
    newTag: '',
    suggestedTags: [],
    
    // 关注
    focusList: [],
    focus: '',
    
    // 财记
    showStory: false,
    story: {
      rating: 0,
      emoji: '',
      text: ''
    },
    emojiList: ['😀', '😊', '😐', '😔', '😭', '😡', '😱', '🥰', '😎', '🤔', '👍', '👎', '🎉', '💰', '🍔', '🚗', '🎮', '📚', '💊', '🏠'],
    
    // 代付
    showForWho: false,
    forWho: [],
    newForWho: ''
  },

  onLoad() {
    const app = getApp()
    const isEditMode = app.globalData.isEditMode
    const expense = app.globalData.currentExpense
    
    // 加载关注列表
    const focusList = expenseService.getFocusList()
    
    this.setData({
      focusList,
      spentAtDisplay: this.formatDisplayDate(new Date())
    })
    
    if (isEditMode && expense) {
      // 编辑模式：填充现有数据
      this.fillEditData(expense)
    }
  },

  // 填充编辑数据
  fillEditData(expense) {
    const spentAt = formatDate(expense.spentAt, 'YYYY-MM-DD')
    
    this.setData({
      isEditMode: true,
      expenseId: expense._id,
      originalText: expense.originalText || '',
      spentAt: spentAt,
      spentAtDisplay: this.formatDisplayDate(new Date(expense.spentAt)),
      event: expense.event || '',
      amount: expense.amount ? formatAmount(expense.amount) : '',
      tags: expense.tags || [],
      suggestedTags: expense.generatedTags || [],
      focus: expense.focus || '',
      showStory: !!expense.story,
      story: expense.story || { rating: 0, emoji: '', text: '' },
      showForWho: (expense.forWho && expense.forWho.length > 0),
      forWho: expense.forWho || []
    })
  },

  // 格式化显示日期
  formatDisplayDate(date) {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return '今天'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天'
    } else {
      return formatDate(date, 'YYYY年MM月DD日')
    }
  },

  // ========== 原始文本解析 ==========
  onOriginalTextInput(e) {
    this.setData({
      originalText: e.detail.value
    })
  },

  onOriginalTextBlur(e) {
    const text = e.detail.value
    if (!text) return
    
    const parsed = textParser.parseOriginalText(text)
    
    // 更新解析结果
    this.setData({
      parsedData: {
        amount: parsed.amount,
        event: parsed.event
      },
      // 自动填充基础信息（如果为空）
      event: this.data.event || parsed.event,
      amount: this.data.amount || (parsed.amount > 0 ? formatAmount(parsed.amount) : ''),
      suggestedTags: parsed.generatedTags,
      spentAt: formatDate(parsed.spentAt, 'YYYY-MM-DD')
    })
    
    this.updateSpentAtDisplay()
  },

  // ========== 基础信息 ==========
  onDateChange(e) {
    this.setData({
      spentAt: e.detail.value
    })
    this.updateSpentAtDisplay()
  },

  updateSpentAtDisplay() {
    this.setData({
      spentAtDisplay: this.formatDisplayDate(new Date(this.data.spentAt))
    })
  },

  onEventInput(e) {
    this.setData({ event: e.detail.value })
  },

  onAmountInput(e) {
    this.setData({ amount: e.detail.value })
  },

  // ========== 标签管理 ==========
  onTagInput(e) {
    this.setData({ newTag: e.detail.value })
  },

  onAddTag(e) {
    const tag = e.detail.value.trim()
    if (!tag) return
    
    if (this.data.tags.includes(tag)) {
      showToast('标签已存在')
      return
    }
    
    this.setData({
      tags: [...this.data.tags, tag],
      newTag: ''
    })
  },

  onRemoveTag(e) {
    const tag = e.currentTarget.dataset.tag
    const tags = this.data.tags.filter(t => t !== tag)
    this.setData({ tags })
  },

  onAddSuggestedTag(e) {
    const tag = e.currentTarget.dataset.tag
    if (this.data.tags.includes(tag)) return
    
    this.setData({
      tags: [...this.data.tags, tag]
    })
  },

  // ========== 关注管理 ==========
  onSelectFocus(e) {
    const focus = e.currentTarget.dataset.focus
    this.setData({
      focus: this.data.focus === focus ? '' : focus
    })
  },

  // ========== 财记故事 ==========
  toggleStory(e) {
    this.setData({
      showStory: e.detail.value
    })
  },

  onRate(e) {
    const rate = e.currentTarget.dataset.rate
    this.setData({
      'story.rating': rate
    })
  },

  onEmojiChange(e) {
    const index = e.detail.value
    this.setData({
      'story.emoji': this.data.emojiList[index]
    })
  },

  onStoryTextInput(e) {
    this.setData({
      'story.text': e.detail.value
    })
  },

  // ========== 代付管理 ==========
  toggleForWho(e) {
    this.setData({
      showForWho: e.detail.value
    })
  },

  onForWhoInput(e) {
    this.setData({ newForWho: e.detail.value })
  },

  onAddForWho(e) {
    const name = e.detail.value.trim()
    if (!name) return
    
    if (this.data.forWho.includes(name)) {
      showToast('已添加该对象')
      return
    }
    
    this.setData({
      forWho: [...this.data.forWho, name],
      newForWho: ''
    })
  },

  onRemoveForWho(e) {
    const name = e.currentTarget.dataset.name
    const forWho = this.data.forWho.filter(n => n !== name)
    this.setData({ forWho })
  },

  // ========== 提交操作 ==========
  // 验证是否可以提交
  canSubmit() {
    const { event, amount } = this.data
    return event.trim() && parseFloat(amount) > 0
  },

  // 构建提交数据
  buildExpenseData() {
    const { originalText, spentAt, event, amount, tags, focus, showStory, story, showForWho, forWho } = this.data
    
    const data = {
      originalText: originalText || '',
      spentAt: new Date(spentAt).toISOString(),
      event: event.trim(),
      amount: parseFloat(amount),
      tags: tags,
      generatedTags: this.data.suggestedTags,
      focus: focus || null
    }
    
    // 财记
    if (showStory && (story.rating > 0 || story.emoji || story.text)) {
      data.story = {
        rating: story.rating,
        emoji: story.emoji,
        text: story.text
      }
    }
    
    // 代付
    if (showForWho && forWho.length > 0) {
      data.forWho = forWho
    }
    
    return data
  },

  async onSubmit() {
    if (!this.canSubmit()) {
      if (!this.data.event.trim()) {
        showToast('请输入消费事件')
      } else if (!parseFloat(this.data.amount)) {
        showToast('请输入金额')
      }
      return
    }

    const expenseData = this.buildExpenseData()

    try {
      if (this.data.isEditMode) {
        await expenseService.updateExpense(this.data.expenseId, expenseData)
        showToast('修改成功', 'success')
      } else {
        await expenseService.createExpense(expenseData)
        showToast('记账成功', 'success')
      }
      
      // 返回上一页
      wx.navigateBack()
    } catch (err) {
      showToast(err.message || '操作失败')
    }
  },

  // 删除
  async onDelete() {
    const confirmed = await showConfirm('确认删除', '删除后无法恢复，是否继续？')
    if (!confirmed) return

    try {
      await expenseService.deleteExpense(this.data.expenseId)
      showToast('删除成功', 'success')
      wx.navigateBack()
    } catch (err) {
      showToast(err.message || '删除失败')
    }
  }
})
