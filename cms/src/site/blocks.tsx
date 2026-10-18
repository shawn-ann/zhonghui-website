import { Fragment } from 'react'
import { safeUrl } from '../render/primitives'
import type {
  BannerBlock, Block, ButtonBlock, GalleryBlock, GridBlock, HeadingBlock, IconCardBlock,
  ImageBlock, ImageTextBlock, RichTextBlock, SectionBlock, SliderBlock, TextBlock,
} from '../render/types'
import { bgCss, bgImageCss } from './bg'

const PAD: Record<string, number> = { none: 0, sm: 32, md: 72, lg: 96 }
const padStyle = (padding?: number) => (padding && padding > 0 ? { padding: `${padding}px` } : undefined)

function lines(text: string) {
  return text.split('\n').map((line, i) => (
    <Fragment key={i}>{i > 0 ? <br /> : null}{line}</Fragment>
  ))
}

export function SectionView({ b }: { b: SectionBlock }) {
  const style = {
    padding: `${PAD[b.paddingY || 'md'] ?? 72}px 0`,
    ...(b.bgColor ? { backgroundColor: b.bgColor } : {}),
    ...bgImageCss(b.bgImage),
  }
  return (
    <section className={`section${b.bgImage ? ' on-image' : ''}`} data-bid={b._id} style={style}>
      {(b.children || []).map((c, i) => <Fragment key={c._id ?? i}>{blockNode(c)}</Fragment>)}
    </section>
  )
}

export function GridView({ b }: { b: GridBlock }) {
  const cols = Math.min(4, Math.max(1, b.columns || 3))
  const gap = b.gap && /^(sm|md|lg)$/.test(b.gap) ? b.gap : 'md'
  const style = {
    ...(b.bgColor ? { backgroundColor: b.bgColor } : {}),
    ...bgImageCss(b.bgImage),
  }
  return (
    <div className="container" data-bid={b._id} style={style}>
      <div className={`grid grid-cols-${cols} grid-gap-${gap}`}>
        {(b.children || []).map((c, i) => (
          <div className="grid-cell" key={c._id ?? i}>{blockNode(c)}</div>
        ))}
      </div>
    </div>
  )
}

export function BannerView({ b }: { b: BannerBlock }) {
  if (b.variant === 'centered') {
    return (
      <div
        className={`banner banner--centered ${b.alt ? 'section-alt' : ''}`}
        style={bgCss(b.image) ?? bgCss(b.bg)}
      >
        <div className="container cover" data-bid={b._id}>
          {b.title ? <h1 data-field="title">{b.title}</h1> : null}
          {b.sub ? <div className="sub" data-field="sub">{b.sub}</div> : null}
        </div>
      </div>
    )
  }
  const img = safeUrl(b.image)
  const pattern = b.pattern ? safeUrl(b.pattern) : ''
  return (
    <div className={`banner banner--split ${b.alt ? 'section-alt' : ''}`} style={bgCss(b.bg)}>
      <div className="container banner-grid" data-bid={b._id}>
        <div className="banner-text">
          {b.title ? <h1 data-field="title">{b.title}</h1> : null}
          {b.sub ? <p className="sub" data-field="sub">{b.sub}</p> : null}
        </div>
        {img ? (
          <div className="banner-media">
            {pattern ? <img className="banner-pattern" src={pattern} alt="" /> : null}
            <img className="banner-photo" src={img} alt={b.title || '中惠文化'} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function HeadingView({ b }: { b: HeadingBlock }) {
  return (
    <div className="container" data-bid={b._id}>
      <div className="section-heading" style={{ textAlign: b.align === 'left' ? 'left' : 'center', ...padStyle(b.padding) }}>
        {b.title ? <h2>{b.title}</h2> : null}
        {b.subtitle ? <p className="subtitle">{b.subtitle}</p> : null}
      </div>
    </div>
  )
}

export function TextView({ b }: { b: TextBlock }) {
  return (
    <div className="container" data-bid={b._id}>
      <div className="text-block" style={{ textAlign: b.align === 'center' ? 'center' : 'left', ...padStyle(b.padding) }}>
        {b.title ? <h2 data-field="title">{b.title}</h2> : null}
        <p data-field="body">{b.body}</p>
      </div>
    </div>
  )
}

export function ImageView({ b }: { b: ImageBlock }) {
  const src = safeUrl(b.media)
  const href = b.link ? safeUrl(b.link) : ''
  const img = src ? <img src={src} alt={b.altText || ''} /> : null
  return (
    <div className="container" data-bid={b._id}>
      <div className="image-block" style={padStyle(b.padding)}>
        {href && img ? <a href={href}>{img}</a> : img}
      </div>
    </div>
  )
}

export function ImageTextView({ b }: { b: ImageTextBlock }) {
  const src = safeUrl(b.media)
  const href = b.link ? safeUrl(b.link) : ''
  const card = (
    <div className="image-text" style={padStyle(b.padding)}>
      {src ? <div className="it-img"><img src={src} alt={b.title || ''} /></div> : null}
      <div className="it-body">
        {b.title ? <h3 data-field="title">{b.title}</h3> : null}
        {b.desc ? <p data-field="desc">{b.desc}</p> : null}
      </div>
    </div>
  )
  return (
    <div className="container" data-bid={b._id}>
      {href ? <a className="it-link" href={href}>{card}</a> : card}
    </div>
  )
}

export function IconCardView({ b }: { b: IconCardBlock }) {
  const icon = safeUrl(b.icon)
  const href = b.link ? safeUrl(b.link) : ''
  const card = (
    <div
      className="adv-card"
      data-bid={b._id}
      style={{ ...(b.bgColor ? { backgroundColor: b.bgColor } : {}), ...bgImageCss(b.bgImage) }}
    >
      {icon ? (
        <div className="icon" style={b.iconColor ? { borderColor: b.iconColor } : undefined}>
          {b.iconColor ? (
            <span
              className="icon-glyph"
              style={{
                backgroundColor: b.iconColor,
                WebkitMaskImage: `url('${icon}')`,
                maskImage: `url('${icon}')`,
              }}
            />
          ) : <img src={icon} alt={b.title || ''} />}
        </div>
      ) : null}
      {b.title ? <h3 data-field="title">{b.title}</h3> : null}
      {b.desc ? <p data-field="desc">{lines(b.desc)}</p> : null}
    </div>
  )
  return <div className="container">{href ? <a href={href} style={{ color: 'inherit' }}>{card}</a> : card}</div>
}

export function ButtonView({ b }: { b: ButtonBlock }) {
  const href = safeUrl(b.link)
  const style = b.style === 'outline' ? 'outline' : 'primary'
  return (
    <div className="container" data-bid={b._id}>
      <div className="button-block" style={padStyle(b.padding)}>
        {href
          ? <a className={`btn btn--${style}`} href={href} data-field="label">{b.label}</a>
          : <span className={`btn btn--${style}`} data-field="label">{b.label}</span>}
      </div>
    </div>
  )
}

export function RichTextView({ b }: { b: RichTextBlock }) {
  return (
    <div className="container" data-bid={b._id}>
      <div className="richtext" style={padStyle(b.padding)} dangerouslySetInnerHTML={{ __html: b.html || '' }} />
    </div>
  )
}

export function GalleryView({ b }: { b: GalleryBlock }) {
  const cols = Math.min(4, Math.max(1, b.columns || 3))
  const imgs = (b.images || []).map((src) => safeUrl(src)).filter(Boolean)
  return (
    <div className="container" data-bid={b._id}>
      <div className={`gallery gallery-cols-${cols}`} style={padStyle(b.padding)}>
        {imgs.map((src, i) => (
          <figure className="gallery-item" key={`${src}-${i}`}><img src={src} alt="" /></figure>
        ))}
      </div>
    </div>
  )
}

export function blockNode(b: Block): React.ReactNode {
  switch (b.type) {
    case 'section': return <SectionView b={b} />
    case 'grid': return <GridView b={b} />
    case 'banner': return <BannerView b={b} />
    case 'heading': return <HeadingView b={b} />
    case 'text': return <TextView b={b} />
    case 'image': return <ImageView b={b} />
    case 'imageText': return <ImageTextView b={b} />
    case 'iconCard': return <IconCardView b={b} />
    case 'button': return <ButtonView b={b} />
    case 'richtext': return <RichTextView b={b} />
    case 'gallery': return <GalleryView b={b} />
    case 'slider': return <SliderView b={b} />
    default: return null
  }
}

/** 顶层区块：section 用自己的外壳，其余包一层 .section（沿用 bg/alt 语义）。 */
export function TopBlock({ b }: { b: Block }) {
  if (b.type === 'section') return <SectionView b={b} />
  const style = bgCss(b.bg)
  const cls = ['section']
  if (!style && b.alt) cls.push('section-alt')
  return <section className={cls.join(' ')} style={style}>{blockNode(b)}</section>
}

export function SliderView({ b }: { b: SliderBlock }) {
  const imgs = (b.images || []).map((src) => safeUrl(src)).filter(Boolean)
  return (
    <div className="memory-slider">
      <div className="container" data-bid={b._id}>
        <div className="swiper memory-swiper" key={imgs.join('|')}>
          <div className="swiper-wrapper">
            {imgs.map((src, i) => (
              <div className="swiper-slide" key={`${src}-${i}`}>
                <div className="slide-inner"><img src={src} alt="" /></div>
              </div>
            ))}
          </div>
          <span className="memory-arrow prev">
            <svg viewBox="0 0 27 44"><path d="M22,0l4.2,4.2L8.4,22l17.8,17.8L22,44L0,22L22,0z" fill="#fff" /></svg>
          </span>
          <span className="memory-arrow next">
            <svg viewBox="0 0 27 44"><path d="M22,0l4.2,4.2L8.4,22l17.8,17.8L22,44L0,22L22,0z" transform="rotate(180 13.5 22)" fill="#fff" /></svg>
          </span>
        </div>
      </div>
    </div>
  )
}
