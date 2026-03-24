// 云函数：批量删除超过30天的软删除记录
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

  // 计算30天前的时间
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  try {
    // 查询需要删除的记录（已软删除且超过30天）
    const { data: oldRecords } = await db.collection('expenses')
      .where({
        _openid: openid,
        deletedAt: db.command.lt(thirtyDaysAgo.toISOString())
      })
      .get()

    if (oldRecords.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        message: '没有需要清理的记录'
      }
    }

    // 批量删除
    const deleteTasks = oldRecords.map(item => {
      return db.collection('expenses').doc(item._id).remove()
    })

    const results = await Promise.allSettled(deleteTasks)

    let successCount = 0
    let failCount = 0

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        successCount++
      } else {
        failCount++
        console.error('删除失败:', result.reason)
      }
    })

    return {
      success: true,
      deletedCount: successCount,
      failedCount: failCount,
      message: `成功清理 ${successCount} 条记录${failCount > 0 ? `，${failCount} 条失败` : ''}`
    }

  } catch (err) {
    console.error('清理云端记录失败:', err)
    return {
      success: false,
      message: err.message
    }
  }
}
