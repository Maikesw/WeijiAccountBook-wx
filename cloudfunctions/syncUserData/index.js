const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { success: false, message: '未获取到用户身份' }
  }

  const { expenses, budgets, goals, goalRecords, settings, focusList } = event
  const now = db.serverDate()

  try {
    // 查询是否已有数据记录
    const existRes = await db.collection('user_data').where({ _openid: openid }).get()

    const data = {
      _openid: openid,
      expenses: expenses || [],
      budgets: budgets || {},
      goals: goals || [],
      goalRecords: goalRecords || {},
      settings: settings || {},
      focusList: focusList || [],
      updatedAt: now
    }

    if (existRes.data.length === 0) {
      data.createdAt = now
      await db.collection('user_data').add({ data })
    } else {
      await db.collection('user_data').doc(existRes.data[0]._id).update({
        data: {
          expenses: data.expenses,
          budgets: data.budgets,
          goals: data.goals,
          goalRecords: data.goalRecords,
          settings: data.settings,
          focusList: data.focusList,
          updatedAt: now
        }
      })
    }

    return { success: true, message: '同步成功' }
  } catch (err) {
    console.error('同步数据失败:', err)
    return { success: false, message: err.message }
  }
}
