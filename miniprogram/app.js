// app.js
App({
  onLaunch: function () {
    this.globalData = {
      // env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会请求到哪个云环境的资源
      env: "cloud1-7gnwrsiebb56e121",
      openid: null,
      isLogin: false
    };
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }

    // 自动登录获取openid
    this.autoLogin();
  },

  // 自动登录
  autoLogin: function() {
    var that = this
    var openid = wx.getStorageSync('openid')
    if (openid) {
      that.globalData.openid = openid
      that.globalData.isLogin = true
      return
    }

    wx.cloud.callFunction({
      name: 'login',
      success: function(res) {
        if (res.result && res.result.success) {
          var openid = res.result.openid
          that.globalData.openid = openid
          that.globalData.isLogin = true
          wx.setStorageSync('openid', openid)
          console.log('登录成功，openid:', openid)

          // 新用户或老用户登录后，尝试从云端同步数据到本地
          if (!res.result.isNewUser) {
            that.syncFromCloud()
          }
        } else {
          console.error('登录失败:', res.result)
        }
      },
      fail: function(err) {
        console.error('调用登录云函数失败:', err)
      }
    })
  },

  // 从云端同步数据到本地
  syncFromCloud: function(callback) {
    var that = this
    wx.cloud.callFunction({
      name: 'getUserData',
      success: function(res) {
        if (res.result.success && res.result.hasData) {
          var data = res.result.data
          if (data.expenses) wx.setStorageSync('expenses', data.expenses)
          if (data.budgets) wx.setStorageSync('racoon_budgets', data.budgets)
          if (data.goals) wx.setStorageSync('racoon_goals', data.goals)
          if (data.goalRecords) wx.setStorageSync('racoon_goal_records', data.goalRecords)
          if (data.settings) wx.setStorageSync('appSettings', data.settings)
          if (data.focusList) wx.setStorageSync('focusList', data.focusList)
          console.log('从云端同步数据成功')
        }
        if (typeof callback === 'function') {
          callback(res.result)
        }
      },
      fail: function(err) {
        console.error('从云端同步数据失败:', err)
        if (typeof callback === 'function') {
          callback({ success: false, error: err })
        }
      }
    })
  },

  // 同步本地数据到云端
  syncToCloud: function(callback) {
    var that = this
    var expenses = wx.getStorageSync('expenses') || []
    var budgets = wx.getStorageSync('racoon_budgets') || {}
    var goals = wx.getStorageSync('racoon_goals') || []
    var goalRecords = wx.getStorageSync('racoon_goal_records') || {}
    var settings = wx.getStorageSync('appSettings') || {}
    var focusList = wx.getStorageSync('focusList') || []

    wx.cloud.callFunction({
      name: 'syncUserData',
      data: {
        expenses: expenses,
        budgets: budgets,
        goals: goals,
        goalRecords: goalRecords,
        settings: settings,
        focusList: focusList
      },
      success: function(res) {
        console.log('同步到云端成功:', res.result)
        if (typeof callback === 'function') {
          callback(res.result)
        }
      },
      fail: function(err) {
        console.error('同步到云端失败:', err)
        if (typeof callback === 'function') {
          callback({ success: false, error: err })
        }
      }
    })
  }
});
