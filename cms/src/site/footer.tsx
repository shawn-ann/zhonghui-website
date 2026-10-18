import { FOOTER_INFO, FOOTER_LOGO, FOOTER_QR } from './assets'

export function SiteFooter() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand"><img src={FOOTER_LOGO} alt="中惠文化" /></div>
        <div className="footer-info">
          {FOOTER_INFO.map((i) => (
            <p key={i.label}><span className="label">{i.label}</span>{i.text}</p>
          ))}
        </div>
        <div className="footer-qr">
          <div className="qr-box">
            {FOOTER_QR.map((q) => (
              <div className="qr-item" key={q}>
                <div className="qr">{q}<br />二维码</div>
              </div>
            ))}
          </div>
          <a className="foot-contact" href="/contact/">联系我们</a>
        </div>
      </div>
    </footer>
  )
}
