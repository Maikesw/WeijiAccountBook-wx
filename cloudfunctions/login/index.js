const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { success: false, message: '获取openid失败' }
  }

  try {
    // 查询用户是否已存在
    const userRes = await db.collection('users').where({ _openid: openid }).get()

    const now = db.serverDate()

    if (userRes.data.length === 0) {
      // 新用户，创建记录
      await db.collection('users').add({
        data: {
          _openid: openid,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now
        }
      })
    } else {
      // 老用户，更新最后登录时间
      await db.collection('users').where({ _openid: openid }).update({
        data: {
          lastLoginAt: now,
          updatedAt: now
        }
      })
    }

    return {
      success: true,
      openid: openid,
      isNewUser: userRes.data.length === 0
    }
  } catch (err) {
    console.error('登录云函数错误:', err)
    return { success: false, message: err.message }
  }
}
