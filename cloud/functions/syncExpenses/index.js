// 云函数：同步支出数据到云端
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  console.log('收到数据:', event)
  
  if (!openid) {
    return {
      success: false,
      message: '未获取到用户身份'
    }
  }

  try {
    const expenses = event.expenses || []
    
    if (!Array.isArray(expenses) || expenses.length === 0) {
      return {
        success: false,
        message: '没有要同步的数据'
      }
    }
    
    let successCount = 0
    let failCount = 0
    
    // 逐条处理，避免批量失败
    for (const expense of expenses) {
      try {
        // 删除 _openid 字段（由系统自动设置）
        const data = { ...expense }
        delete data._openid
        
        data.updatedAt = db.serverDate()
        
        if (expense._id) {
          // 更新现有记录
          await db.collection('expenses').doc(expense._id).update({
            data: data
          })
        } else {
          // 插入新记录
          data._openid = openid
          data.createdAt = db.serverDate()
          await db.collection('expenses').add({
            data: data
          })
        }
        successCount++
      } catch (itemErr) {
        console.error('单条处理失败:', itemErr, expense)
        failCount++
      }
    }
    
    return {
      success: true,
      message: `同步完成，成功${successCount}条，失败${failCount}条`,
      syncedCount: successCount,
      failCount: failCount
    }
  } catch (err) {
    console.error('同步失败:', err)
    return {
      success: false,
      message: err.message || '未知错误'
    }
  }
}
