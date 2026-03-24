// 云函数：同步支出数据到云端
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  console.log('收到数据:', JSON.stringify(event))
  console.log('用户openid:', openid)
  
  if (!openid) {
    return {
      success: false,
      message: '未获取到用户身份'
    }
  }

  const expenses = event.expenses || []
  
  console.log('需要同步的数据条数:', expenses.length)
  
  if (!Array.isArray(expenses) || expenses.length === 0) {
    return {
      success: false,
      message: '没有要同步的数据'
    }
  }
  
  let successCount = 0
  const errors = []
  
  // 逐条处理
  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i]
    
    console.log(`处理第${i + 1}条数据`)
    
    // 构建数据（不清理字段，保留原始数据）
    const data = { ...expense }
    
    // 保留本地 _id，确保数据一致性
    // 删除 _openid 后重新设置（确保是当前用户的）
    delete data._openid
    
    // 设置时间
    data.updatedAt = db.serverDate()
    data.createdAt = db.serverDate()
    data._openid = openid
    
    console.log('准备插入:', JSON.stringify(data))
    
    try {
      // 使用 _id 作为自定义 ID，实现幂等性（同一笔记录多次同步不会重复）
      const docId = data._id
      delete data._id
      
      const result = await db.collection('expenses').doc(docId).set({
        data: data
      })
      console.log('插入成功:', result)
      successCount++
    } catch (err) {
      console.error('插入失败:', err)
      errors.push({
        index: i,
        error: err.message
      })
    }
  }
  
  console.log('处理完成:', { successCount, errors: errors.length })
  
  if (errors.length > 0) {
    return {
      success: false,
      message: `${errors.length}条数据写入失败`,
      errors: errors
    }
  }
  
  return {
    success: true,
    message: `成功同步${successCount}条数据`,
    syncedCount: successCount
  }
}
