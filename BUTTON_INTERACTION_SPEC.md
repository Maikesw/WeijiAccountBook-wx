# 理财日记小程序 - 按钮交互规范（悬浮仿真版）

> 按钮悬浮仿真效果：立体阴影 + 轻微上浮 + 点击下沉反馈

---

## 一、交互反馈系统

### 1.1 视觉反馈机制

采用**纯视觉反馈**（无震动）：

| 状态 | 效果 | 实现方式 |
|-----|------|---------|
| **默认状态** | 轻微上浮 + 立体阴影 | `translateY(-2rpx)` + 多层阴影 |
| **Hover状态** | 进一步上浮 + 阴影增强 | `translateY(-4rpx)` + 扩散阴影 |
| **点击状态** | 下沉 + 内阴影 | `translateY(2rpx)` + `inset`阴影 |
| **恢复状态** | 平滑回到默认 | 100ms过渡动画 |

### 1.2 阴影层级设计

```css
/* 默认状态 - 基础悬浮 */
box-shadow: 
  0 4rpx 8rpx rgba(0, 0, 0, 0.1),    /* 底层阴影 */
  0 8rpx 16rpx rgba(0, 0, 0, 0.08),  /* 中层阴影 */
  0 2rpx 4rpx rgba(0, 0, 0, 0.04);   /* 顶层高光 */

/* Hover状态 - 增强悬浮 */
box-shadow:
  0 8rpx 16rpx rgba(0, 0, 0, 0.12),
  0 12rpx 24rpx rgba(0, 0, 0, 0.08),
  0 4rpx 8rpx rgba(0, 0, 0, 0.04);

/* 点击状态 - 下沉效果 */
box-shadow:
  0 2rpx 4rpx rgba(0, 0, 0, 0.1),
  0 4rpx 8rpx rgba(0, 0, 0, 0.06),
  inset 0 1rpx 2rpx rgba(0, 0, 0, 0.1);  /* 内阴影 */
```

---

## 二、按钮状态规范

### 2.1 四种核心状态

| 状态 | 视觉表现 | 阴影效果 |
|-----|---------|---------|
| **正常状态** | 轻微上浮(-2rpx) + 立体阴影 | 外阴影三层 |
| **Hover状态** | 进一步上浮(-4rpx) + 阴影扩散 | 外阴影增强 |
| **禁用状态** | 无上浮 + 无阴影 + 60%透明度 | 无阴影 |
| **点击状态** | 下沉(+2rpx) + 内阴影 | 外阴影减弱 + 内阴影 |

### 2.2 状态样式代码

```css
/* 基础按钮 */
.btn {
  transform: translateY(-2rpx);
  box-shadow: 
    0 4rpx 8rpx rgba(0, 0, 0, 0.1),
    0 8rpx 16rpx rgba(0, 0, 0, 0.08),
    0 2rpx 4rpx rgba(0, 0, 0, 0.04);
  transition: transform 100ms ease, box-shadow 100ms ease;
}

/* Hover状态 */
.btn:hover {
  transform: translateY(-4rpx);
  box-shadow: 
    0 8rpx 16rpx rgba(0, 0, 0, 0.12),
    0 12rpx 24rpx rgba(0, 0, 0, 0.08);
}

/* 点击状态 */
.btn:active {
  transform: translateY(2rpx);
  box-shadow: 
    0 2rpx 4rpx rgba(0, 0, 0, 0.1),
    inset 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
}

/* 禁用状态 */
.btn[disabled] {
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}
```

---

## 三、按钮尺寸规范

### 3.1 按钮分级

| 按钮类型 | 最小尺寸 | 上浮高度 | 阴影强度 |
|---------|---------|---------|---------|
| **核心操作按钮** | ≥96×96dp | -4rpx / +2rpx | 强阴影（主色） |
| **普通功能按钮** | 80×80dp | -2rpx / +2rpx | 中等阴影 |
| **图标按钮** | 80×80dp | -2rpx / +2rpx | 轻阴影 |
| **文字按钮** | 64×64dp | -2rpx / +1rpx | 极简阴影 |

### 3.2 核心按钮示例

```css
/* 核心主按钮 - 强烈悬浮效果 */
.btn-primary {
  min-height: 96rpx;
  background: linear-gradient(135deg, #1677FF 0%, #4096FF 100%);
  transform: translateY(-2rpx);
  box-shadow: 
    0 6rpx 12rpx rgba(22, 119, 255, 0.25),
    0 10rpx 20rpx rgba(22, 119, 255, 0.15);
}

.btn-primary:hover {
  transform: translateY(-4rpx);
  box-shadow: 
    0 10rpx 20rpx rgba(22, 119, 255, 0.3),
    0 16rpx 32rpx rgba(22, 119, 255, 0.2);
}

.btn-primary:active {
  transform: translateY(2rpx);
  box-shadow: 
    0 2rpx 6rpx rgba(22, 119, 255, 0.2),
    inset 0 2rpx 4rpx rgba(0, 0, 0, 0.15);
}
```

---

## 四、特殊按钮交互

### 4.1 浮动按钮（FAB）

```css
.fab {
  /* 更强的悬浮效果 */
  transform: translateY(-4rpx);
  box-shadow: 
    0 8rpx 16rpx rgba(22, 119, 255, 0.3),
    0 12rpx 24rpx rgba(22, 119, 255, 0.2),
    0 4rpx 8rpx rgba(0, 0, 0, 0.15);
}

.fab:hover {
  transform: translateY(-8rpx);
  box-shadow: 
    0 12rpx 24rpx rgba(22, 119, 255, 0.35),
    0 20rpx 40rpx rgba(22, 119, 255, 0.25);
}

.fab:active {
  transform: translateY(2rpx);
  box-shadow: 
    0 4rpx 8rpx rgba(22, 119, 255, 0.2),
    inset 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}
```

### 4.2 网格卡片

```css
.grid-item {
  transform: translateY(-2rpx);
  box-shadow: 
    0 4rpx 8rpx rgba(0, 0, 0, 0.08),
    0 6rpx 12rpx rgba(0, 0, 0, 0.04);
}

.grid-item:hover {
  transform: translateY(-4rpx);
  box-shadow: 
    0 8rpx 16rpx rgba(0, 0, 0, 0.1),
    0 12rpx 24rpx rgba(0, 0, 0, 0.06);
}

.grid-item:active {
  transform: translateY(2rpx);
  box-shadow: 
    0 2rpx 4rpx rgba(0, 0, 0, 0.06),
    inset 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
}
```

### 4.3 确认类按钮

二次确认弹窗（无震动）：

```javascript
feedback.confirmAction({
  title: '确认删除',
  content: '删除后无法恢复，是否继续？',
  confirmText: '删除',
  confirmColor: '#F53F3F',
  onConfirm: function() {
    // 执行删除操作
  }
})
```

### 4.4 切换类按钮

```javascript
feedback.switchFeedback(this, 'type', value, function() {
  // 切换后回调
})
```

---

## 五、一致性要求

### 5.1 全局统一

- 所有按钮使用统一的悬浮阴影公式
- 上浮高度统一：默认-2rpx，Hover-4rpx，点击+2rpx
- 过渡时长统一：100ms ease
- 禁用状态统一：无阴影、无上浮、60%透明度

### 5.2 明暗模式适配

```css
/* 亮色模式（默认） */
.btn-primary {
  box-shadow: 0 4rpx 8rpx rgba(22, 119, 255, 0.25);
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .btn-primary {
    box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.3);
  }
}
```

---

## 六、工具函数使用指南

### 6.1 引入反馈工具

```javascript
const feedback = require('../../utils/feedback')
```

### 6.2 常用API

```javascript
// 1. 普通按钮点击（纯视觉反馈）
feedback.buttonFeedback('light', function() {
  // 执行操作
})

// 2. 二次确认
feedback.confirmAction({
  title: '确认标题',
  content: '确认内容',
  onConfirm: function() { /* 确认回调 */ }
})

// 3. 切换反馈
feedback.switchFeedback(this, 'dataKey', value, callback)

// 4. 加载状态
feedback.showLoading('加载中...')
feedback.hideLoading()

// 5. 成功/错误提示
feedback.showSuccess('保存成功', callback)
feedback.showError('保存失败')
```

---

## 七、设计原理

### 7.1 为什么选择下沉反馈？

| 反馈类型 | 优点 | 适用场景 |
|---------|------|---------|
| **缩放反馈** | 明显、直观 | 普通按钮 |
| **下沉反馈** | 贴合真实物理按压感 | 悬浮按钮、卡片 |
| **颜色反馈** | 简单、不干扰 | 文字按钮 |

下沉反馈模拟真实世界中"按下"物体的物理感受：
- 未按压时：物体浮起，底部有阴影
- 按压时：物体下沉，阴影收缩，顶部出现内阴影

### 7.2 阴影层级原理

```
Hover状态（最高）
  │
  │  translateY(-4rpx)
  │  阴影扩散范围最大
  ▼
默认状态
  │
  │  translateY(-2rpx)
  │  阴影适中
  ▼
点击状态（最低）
     
  translateY(+2rpx)
  阴影收缩 + 内阴影
```

---

**规范版本：** v2.0（悬浮仿真版）  
**更新日期：** 2026年1月  
**适用范围：** 全小程序所有按钮交互
