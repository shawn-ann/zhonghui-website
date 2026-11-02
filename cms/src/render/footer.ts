import { esc } from './primitives'

export const FOOTER_LOGO = '/assets/brand/footer-logo.png'

export interface FooterInfo {
  label: string
  text: string
}

export const FOOTER_INFO: FooterInfo[] = [
  { label: '📍 地址：', text: '北京东城区绿景馨园东区12号楼' },
  { label: '📞 电话：', text: '010-64159286' },
  { label: '✉ 邮箱：', text: 'info@zhonghui.com' },
  { label: '🌐 中文官网：', text: 'www.chinaaupairs.com' },
  { label: '🌐 英文官网：', text: 'www.aupaircn.com' },
]

export const FOOTER_QR = ['公众号', '咨询微信', '视频号']
export const FOOTER_COPYRIGHT = 'Copyright © 2026 中惠文化　·　京ICP备XXXXXXXX号'

export function renderFooter(): string {
  const info = FOOTER_INFO.map((i) => `<p><span class="label">${esc(i.label)}</span>${esc(i.text)}</p>`).join('')
  const qr = FOOTER_QR.map((q) => `<div class="qr-item"><div class="qr">${esc(q)}<br>二维码</div></div>`).join('')
  return `<footer><div class="footer-grid">
    <div class="footer-brand"><img src="${esc(FOOTER_LOGO)}" alt="中惠文化"></div>
    <div class="footer-info">${info}</div>
    <div class="footer-qr"><div class="qr-box">${qr}</div><a class="foot-contact" href="/contact/">联系我们</a></div>
  </div></footer>`
}
