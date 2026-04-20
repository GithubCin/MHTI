import { generateShareImage } from './share.js'

const LEVEL_LABEL = { L: '低', M: '中', H: '高' }
const LEVEL_CLASS = { L: 'level-low', M: 'level-mid', H: 'level-high' }

// 获取基础路径
const BASE_URL = import.meta.env.BASE_URL || './'

/**
 * 渲染测试结果
 */
export function renderResult(result, userLevels, dimOrder, dimDefs, config) {
  const { primary, secondary, rankings, mode } = result

  // Kicker
  const kicker = document.getElementById('result-kicker')
  if (mode === 'drunk') kicker.textContent = '隐藏人格已激活'
  else if (mode === 'fallback') kicker.textContent = '系统强制兜底'
  else kicker.textContent = '你的主类型'

  // 主类型
  document.getElementById('result-code').textContent = primary.code
  document.getElementById('result-name').textContent = primary.cn

  // 匹配度
  document.getElementById('result-badge').textContent =
    `匹配度 ${primary.similarity}%` + (primary.exact != null ? ` · 精准命中 ${primary.exact}/15 维` : '')

  // Intro & 描述
  document.getElementById('result-intro').textContent = primary.intro || ''
  document.getElementById('result-desc').textContent = primary.desc || ''

  // 怪物图片 - 处理路径
  const imgContainer = document.getElementById('result-image-container')
  const imgEl = document.getElementById('result-image')
  if (primary.image) {
    // 处理图片路径，确保在开发和构建时都能正常工作
    let imgSrc = primary.image
    if (imgSrc.startsWith('./')) {
      imgSrc = BASE_URL + imgSrc.substring(2)
    } else if (imgSrc.startsWith('/')) {
      imgSrc = BASE_URL + imgSrc.substring(1)
    }
    imgEl.src = imgSrc
    imgEl.onload = () => {
      imgContainer.style.display = 'block'
    }
    imgEl.onerror = () => {
      console.log('图片加载失败:', imgSrc)
      imgContainer.style.display = 'none'
    }
  } else {
    imgContainer.style.display = 'none'
  }

  // 次要匹配
  const secEl = document.getElementById('result-secondary')
  if (secondary && (mode === 'drunk' || mode === 'fallback')) {
    secEl.style.display = ''
    document.getElementById('secondary-info').textContent =
      `${secondary.code}（${secondary.cn}）· 匹配度 ${secondary.similarity}%`
  } else {
    secEl.style.display = 'none'
  }

  // TOP 5
  const topEl = document.getElementById('top-list')
  topEl.innerHTML = ''
  const top5 = rankings.slice(0, 5)
  top5.forEach((t, i) => {
    const item = document.createElement('div')
    item.className = 'top-item'
    item.innerHTML = `
      <span class="top-rank">#${i + 1}</span>
      <span class="top-code">${t.code}</span>
      <span class="top-name">${t.cn}</span>
      <span class="top-sim">${t.similarity}%</span>
    `
    topEl.appendChild(item)
  })

  // 免责声明
  document.getElementById('disclaimer').textContent =
    mode === 'normal' ? config.display.funNote : config.display.funNoteSpecial

  // 下载分享图
  const btnDownload = document.getElementById('btn-download')
  btnDownload.onclick = () => {
    // 传递 rankings 数据给分享图生成函数
    const primaryWithRankings = { ...primary, rankings }
    console.log('生成分享图，图片路径:', primary.image)
    generateShareImage(primaryWithRankings, userLevels, dimOrder, dimDefs, mode)
  }
  
}
