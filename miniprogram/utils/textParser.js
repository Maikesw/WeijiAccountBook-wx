// 文本解析工具 - 从原始文本提取信息

// 提取金额
function extractAmount(text) {
  if (!text) return null
  
  // 尝试提取数字金额
  const numMatch = extractNumberAmount(text)
  if (numMatch !== null) return numMatch
  
  // 尝试提取中文金额
  const chineseMatch = extractChineseAmount(text)
  if (chineseMatch !== null) return chineseMatch
  
  return null
}

// 提取数字金额
function extractNumberAmount(text) {
  const pattern = /(\d+(?:\.\d{1,2})?)/g
  const matches = text.match(pattern)
  if (matches && matches.length > 0) {
    // 通常最后一个数字是金额
    return parseFloat(matches[matches.length - 1])
  }
  return null
}

// 提取中文金额
function extractChineseAmount(text) {
  const chineseNumMap = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
    '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '两': 2
  }
  const unitMap = {
    '十': 10, '百': 100, '千': 1000, '万': 10000,
    '元': 1, '块': 1, '毛': 0.1, '角': 0.1
  }
  
  // 匹配中文金额模式
  const pattern = /([零一二三四五六七八九两十百千万]+)(元|块)/g
  const matches = text.match(pattern)
  
  if (matches && matches.length > 0) {
    return chineseToNumber(matches[0])
  }
  return null
}

// 中文数字转阿拉伯数字
function chineseToNumber(chinese) {
  const chineseNumMap = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
    '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '两': 2
  }
  const unitMap = {
    '十': 10, '百': 100, '千': 1000, '万': 10000
  }
  
  let result = 0
  let temp = 0
  let lastUnit = 1
  
  for (let i = 0; i < chinese.length; i++) {
    const char = chinese[i]
    
    if (chineseNumMap[char] !== undefined) {
      temp = chineseNumMap[char]
    } else if (unitMap[char]) {
      if (temp === 0 && char === '十' && result === 0) {
        // 处理"十一"这样的情况
        temp = 1
      }
      result += temp * unitMap[char]
      temp = 0
      lastUnit = unitMap[char]
    }
  }
  
  result += temp
  return result
}

// 提取事件描述
function extractEvent(text, amount) {
  if (!text) return ''
  
  // 移除金额相关的文本
  let event = text
    .replace(/(\d+(?:\.\d{1,2})?)/g, '')
    .replace(/[零一二三四五六七八九十百千万]+[元块]/g, '')
    .replace(/[了花费用的去在]/g, '')
    .trim()
  
  return event || '未知消费'
}

// 提取日期
function extractDate(text) {
  if (!text) return new Date()
  
  const today = new Date()
  
  // 匹配 "昨天"
  if (text.includes('昨天')) {
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday
  }
  
  // 匹配 "前天"
  if (text.includes('前天')) {
    const dayBeforeYesterday = new Date(today)
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2)
    return dayBeforeYesterday
  }
  
  // 匹配 "X月X日"
  const datePattern = /(\d{1,2})月(\d{1,2})[日号]/
  const match = text.match(datePattern)
  if (match) {
    const month = parseInt(match[1]) - 1
    const day = parseInt(match[2])
    const date = new Date(today.getFullYear(), month, day)
    return date
  }
  
  return today
}

// 自动生成标签
function generateTags(text) {
  if (!text) return []
  
  const tags = []
  
  // 常见消费场景关键词
  const keywords = {
    '餐饮': ['吃饭', '餐厅', '食堂', '外卖', '奶茶', '咖啡', '火锅', '烧烤', '聚餐'],
    '交通': ['地铁', '公交', '打车', '滴滴', '出租车', '高铁', '火车', '飞机'],
    '购物': ['买', '超市', '商场', '淘宝', '京东', '拼多多', '衣服', '鞋子'],
    '娱乐': ['电影', '游戏', 'KTV', '唱歌', '网吧', '剧本杀'],
    '学习': ['书', '课程', '培训', '考试', '资料', '打印'],
    '医疗': ['医院', '药店', '看病', '药', '挂号'],
    '住房': ['房租', '水电', '物业', '房租', '住宿']
  }
  
  for (const [category, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (text.includes(word)) {
        if (!tags.includes(category)) {
          tags.push(category)
        }
        if (!tags.includes(word)) {
          tags.push(word)
        }
      }
    }
  }
  
  return tags.slice(0, 5) // 最多返回5个标签
}

// 解析原始文本，返回完整的消费信息
function parseOriginalText(text) {
  const amount = extractAmount(text)
  const event = extractEvent(text, amount)
  const spentAt = extractDate(text)
  const generatedTags = generateTags(text)
  
  return {
    originalText: text,
    amount: amount || 0,
    event: event,
    spentAt: spentAt.toISOString(),
    generatedTags: generatedTags
  }
}

module.exports = {
  extractAmount,
  extractEvent,
  extractDate,
  generateTags,
  parseOriginalText,
  extractNumberAmount,
  extractChineseAmount,
  chineseToNumber
}
