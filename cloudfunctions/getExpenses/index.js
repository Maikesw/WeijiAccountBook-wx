// 云函数：从云端获取支出数据
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  if (!openid) {
    return {
      success: false,
      message: '未获取到用户身份'
    }
  }

  try {
    const { limit = 1000, skip = 0 } = event
    
    const result = await db.collection('expenses')
      .where({
        _openid: openid
      })
      .orderBy('spentAt', 'desc')
      .skip(skip)
      .limit(limit)
      .get()
    
    return {
      success: true,
      data: result.data
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
}
