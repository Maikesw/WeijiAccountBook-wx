// 云函数：同步支出数据到云端
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
    const { expenses } = event
    
    // 批量更新/插入数据
    const batch = []
    for (const expense of expenses) {
      const data = {
        ...expense,
        _openid: openid,
        updatedAt: db.serverDate()
      }
      
      // 如果有_id则更新，否则插入
      if (expense._id) {
        batch.push(
          db.collection('expenses').doc(expense._id).update({
            data: data
          })
        )
      } else {
        batch.push(
          db.collection('expenses').add({
            data: {
              ...data,
              createdAt: db.serverDate()
            }
          })
        )
      }
    }
    
    await Promise.all(batch)
    
    return {
      success: true,
      message: '同步成功',
      syncedCount: expenses.length
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
}
