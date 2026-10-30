import type { SiteSettings } from '../render/types'

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand"><img src={settings.footerLogo} alt="中惠文化" /></div>
        <div className="footer-info">
          {settings.footerInfo.map((i) => (
            <p key={`${i.label}-${i.text}`}><span className="label">{i.label}</span>{i.text}</p>
          ))}
        </div>
        <div className="footer-qr">
          {settings.footerQr.length ? (
            <div className="qr-box">
              {settings.footerQr.map((q, i) => (
                <div className="qr-item" key={`${q.label}-${i}`}>
                  {q.image
                    ? <img className="qr-img" src={q.image} alt={q.label} />
                    : <div className="qr">{q.label ? <>{q.label}<br />二维码</> : '二维码'}</div>}
                </div>
              ))}
            </div>
          ) : null}
          {settings.footerContact
            ? <a className="foot-contact" href={settings.footerContact.link}>{settings.footerContact.label}</a>
            : null}
        </div>
      </div>
      {settings.copyright.trim() ? <div className="footer-copy">{settings.copyright}</div> : null}
    </footer>
  )
}
