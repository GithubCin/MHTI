/**
 * 生成分享图片 — 纯 Canvas 绘制，无外部依赖
 */

const LEVEL_NUM = { L: 1, M: 2, H: 3 }
const LEVEL_LABEL = { L: '低', M: '中', H: '高' }

// 获取基础路径 - 从当前页面获取
function getBasePath() {
  if (typeof window === 'undefined') return './'
  const path = window.location.pathname
  // 如果路径以 / 结尾，直接使用；否则去掉最后一部分
  return path.endsWith('/') ? path : path.substring(0, path.lastIndexOf('/') + 1)
}

/**
 * 生成分享卡片并下载
 */
export async function generateShareImage(primary, userLevels, dimOrder, dimDefs, mode) {
  const dpr = 2
  const W = 720
  const H = 1280
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // 背景
  ctx.fillStyle = '#f0f4f1'
  ctx.fillRect(0, 0, W, H)

  // 卡片白底
  const cardX = 32, cardY = 32, cardW = W - 64, cardH = H - 64
  roundRect(ctx, cardX, cardY, cardW, cardH, 20)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.shadowColor = 'transparent'

  let y = cardY + 48

  // Kicker
  ctx.textAlign = 'center'
  ctx.font = '400 22px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#6b7b6e'
  const kickerText = mode === 'drunk' ? '隐藏人格已激活' : mode === 'fallback' ? '系统强制兜底' : '你的主类型'
  ctx.fillText(kickerText, W / 2, y)
  y += 56

  // 类型代码
  ctx.font = '900 72px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#4c6752'
  ctx.fillText(primary.code, W / 2, y)
  y += 40

  // 中文名
  ctx.font = '600 32px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#2c3e2d'
  ctx.fillText(primary.cn, W / 2, y)
  y += 36

  // 匹配度徽章
  const badgeText = `匹配度 ${primary.similarity}%` + (primary.exact != null ? ` · 精准命中 ${primary.exact}/15 维` : '')
  ctx.font = '500 20px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  const badgeW = ctx.measureText(badgeText).width + 40
  roundRect(ctx, (W - badgeW) / 2, y - 16, badgeW, 36, 18)
  ctx.fillStyle = '#e8f0ea'
  ctx.fill()
  ctx.fillStyle = '#4c6752'
  ctx.fillText(badgeText, W / 2, y + 6)
  y += 44

  // Intro
  ctx.font = 'italic 600 22px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#2c3e2d'
  const introLines = wrapText(ctx, primary.intro || '', cardW - 80)
  for (const line of introLines) {
    ctx.fillText(line, W / 2, y)
    y += 30
  }
  y += 32

  // 绘制怪物图片（如果有）
  if (primary.image) {
    // 处理图片路径 - 将 ./images/xxx.jpg 转换为正确的路径
    let imgSrc = primary.image
    if (imgSrc.startsWith('./')) {
      // 去掉 ./ 前缀，变成 images/xxx.jpg
      imgSrc = imgSrc.substring(2)
    }
    // 使用当前页面路径 + 图片相对路径
    const basePath = getBasePath()
    // 确保 basePath 以 / 结尾，imgSrc 不以 / 开头
    const finalSrc = basePath.replace(/\/$/, '') + '/' + imgSrc
    console.log('分享图图片路径:', finalSrc)
    await drawMonsterImage(ctx, finalSrc, W / 2, y, 280)
    y += 300
  }

  // 描述文字（截取前 150 字）
  ctx.font = '400 16px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#6b7b6e'
  const descText = (primary.desc || '').substring(0, 150) + '...'
  const descLines = wrapText(ctx, descText, cardW - 80)
  for (const line of descLines) {
    ctx.fillText(line, W / 2, y)
    y += 24
  }

  y += 32

  // 最佳匹配 TOP 5
  ctx.font = '600 20px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#2c3e2d'
  ctx.fillText('最佳匹配 TOP 5', W / 2, y)
  y += 32

  ctx.textAlign = 'left'
  const topX = cardX + 60
  const topItemH = 36
  // 使用 rankings 数据，如果没有则使用空数组
  const top5 = (primary.rankings || []).slice(0, 5)
  
  if (top5.length > 0) {
    top5.forEach((t, i) => {
      ctx.font = '600 16px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillStyle = '#2c3e2d'
      ctx.fillText(`#${i + 1}`, topX, y + 4)
      
      ctx.font = '500 16px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillStyle = '#4c6752'
      ctx.fillText(t.code, topX + 40, y + 4)
      
      ctx.font = '400 14px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillStyle = '#6b7b6e'
      ctx.fillText(t.cn, topX + 100, y + 4)
      
      ctx.textAlign = 'right'
      ctx.font = '500 16px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillStyle = '#4c6752'
      ctx.fillText(`${t.similarity}%`, cardW - topX, y + 4)
      ctx.textAlign = 'left'
      
      y += topItemH
    })
  } else {
    // 如果没有 rankings 数据，显示提示信息
    ctx.font = '400 14px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#aab8ac'
    ctx.fillText('暂无匹配数据', W / 2, y + 4)
    y += topItemH
  }

  y += 16

  // 底部水印
  ctx.textAlign = 'center'
  ctx.font = '400 18px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#aab8ac'
  ctx.fillText('MHTI 人格测试 · 仅供娱乐', W / 2, H - cardY - 24)

  // 下载
  const link = document.createElement('a')
  link.download = `MHTI-${primary.code}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

/**
 * 绘制怪物图片
 */
async function drawMonsterImage(ctx, imageUrl, cx, cy, size) {
  return new Promise((resolve) => {
    console.log('加载分享图图片:', imageUrl)
    const img = new Image()
    
    const timeout = setTimeout(() => {
      // 图片加载超时，绘制占位符
      console.log('图片加载超时:', imageUrl)
      drawPlaceholder(ctx, cx, cy, size)
      resolve()
    }, 5000)
    
    img.onload = () => {
      clearTimeout(timeout)
      console.log('图片加载成功:', imageUrl, img.width, 'x', img.height)
      // 计算绘制区域（保持比例）
      const aspect = img.width / img.height
      let drawW = size
      let drawH = size / aspect
      if (drawH > size) {
        drawH = size
        drawW = size * aspect
      }
      
      const x = cx - drawW / 2
      const y = cy - drawH / 2
      
      // 绘制白色背景
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x - 10, y - 10, drawW + 20, drawH + 20)
      
      // 绘制边框
      ctx.strokeStyle = '#4c6752'
      ctx.lineWidth = 2
      roundRect(ctx, x - 10, y - 10, drawW + 20, drawH + 20, 10)
      ctx.stroke()
      
      // 绘制图片
      ctx.drawImage(img, x, y, drawW, drawH)
      resolve()
    }
    
    img.onerror = (e) => {
      clearTimeout(timeout)
      // 如果图片加载失败，绘制一个占位符
      console.log('图片加载失败:', imageUrl, e)
      drawPlaceholder(ctx, cx, cy, size)
      resolve()
    }
    
    img.src = imageUrl
  })
}

/**
 * 绘制占位符
 */
function drawPlaceholder(ctx, cx, cy, size) {
  ctx.fillStyle = '#e8f0ea'
  ctx.beginPath()
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#4c6752'
  ctx.font = '400 24px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🐉', cx, cy)
}

/**
 * 圆角矩形
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * 文字自动换行
 */
function wrapText(ctx, text, maxWidth) {
  if (!text) return []
  const lines = []
  let line = ''
  for (const char of text) {
    const test = line + char
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = char
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}
