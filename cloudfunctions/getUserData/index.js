const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { success: false, message: '未获取到用户身份' }
  }

  try {
    const res = await db.collection('user_data').where({ _openid: openid }).get()

    if (res.data.length === 0) {
      return {
        success: true,
        hasData: false,
        data: null,
        message: '云端暂无数据'
      }
    }

    return {
      success: true,
      hasData: true,
      data: res.data[0],
      message: '获取成功'
    }
  } catch (err) {
    console.error('获取云端数据失败:', err)
    return { success: false, message: err.message }
  }
}
