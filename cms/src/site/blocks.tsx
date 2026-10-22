import { Fragment, type CSSProperties } from 'react'
import { safeUrl } from '../render/primitives'
import type {
  BannerBlock, Block, ButtonBlock, GalleryBlock, GridBlock, HeadingBlock, IconCardBlock,
  ImageBlock, ImageTextBlock, RichTextBlock, SectionBlock, SliderBlock, TextBlock,
} from '../render/types'
import { bgCss, bgImageCss } from './bg'

const PAD: Record<string, number> = { none: 0, sm: 32, md: 72, lg: 96 }
const padStyle = (padding?: number) => (padding && padding > 0 ? { padding: `${padding}px` } : undefined)

function textColorVars(title?: string, sub?: string): CSSProperties {
  return {
    ...(title ? { '--title-color': title } : {}),
    ...(sub ? { '--sub-color': sub } : {}),
  } as CSSProperties
}

function richTextEmpty(html?: string): boolean {
  if (!html) return true
  if (/<(img|video|iframe|svg)\b/i.test(html)) return false
  return !html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

/** 编辑器空状态占位（静态/预览不渲染）。 */
function EmptyEditorBlock({
  b, label, tip, variant,
}: {
  b: Block
  label: string
  tip: string
  variant?: 'card' | 'wide' | 'pill' | 'heading'
}) {
  return (
    <div className="container" data-bid={b._id}>
      <div className={`ed-empty-block${variant ? ` ed-empty-${variant}` : ''}`}>
        <span className="ed-empty-label">{label}</span>
        <span className="ed-empty-tip">{tip}</span>
      </div>
    </div>
  )
}

function lines(text: string) {
  return text.split('\n').map((line, i) => (
    <Fragment key={i}>{i > 0 ? <br /> : null}{line}</Fragment>
  ))
}

export function SectionView({ b, editor = false }: { b: SectionBlock; editor?: boolean }) {
  const band = b.bgHeight && b.bgHeight > 0 ? b.bgHeight : 0
  const gradient = b.bgGradient?.trim()
  let background: CSSProperties = {}
  if (band) {
    const image = gradient
      || (b.bgImage ? `url('${b.bgImage}')` : '')
      || (b.bgColor ? `linear-gradient(${b.bgColor}, ${b.bgColor})` : '')
    if (image) {
      background = {
        backgroundImage: image,
        backgroundSize: `100% ${band}px`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top center',
        backgroundColor: '#fff',
      }
    }
  } else if (gradient) {
    background = { backgroundImage: gradient }
  } else if (b.bgImage) {
    background = { ...(b.bgColor ? { backgroundColor: b.bgColor } : {}), ...bgImageCss(b.bgImage) }
  } else if (b.bgColor) {
    background = { backgroundColor: b.bgColor }
  }
  const style = { padding: `${PAD[b.paddingY || 'md'] ?? 72}px 0`, ...background }
  return (
    <section className={`section${!band && b.bgImage && !gradient ? ' on-image' : ''}`} data-bid={b._id} style={style}>
      {(b.children || []).map((c, i) => (
        <Fragment key={c._id ?? i}>{blockNode(c, editor)}</Fragment>
      ))}
    </section>
  )
}

export function GridView({ b, editor = false }: { b: GridBlock; editor?: boolean }) {
  const cols = Math.min(4, Math.max(1, b.columns || 3))
  const gap = b.gap && /^(sm|md|lg)$/.test(b.gap) ? b.gap : 'md'
  const style = {
    ...(b.bgColor ? { backgroundColor: b.bgColor } : {}),
    ...bgImageCss(b.bgImage),
  }
  const children = b.children || []
  // 编辑器里把最后一行补满：空网格显示一整行，非空时只补当前行剩余空位。
  const placeholders = !editor
    ? 0
    : children.length === 0
      ? cols
      : (cols - (children.length % cols)) % cols
  return (
    <div className="container" data-bid={b._id} style={style}>
      <div className={`grid grid-cols-${cols} grid-gap-${gap}`}>
        {children.map((c, i) => (
          <div className="grid-cell" key={c._id ?? i}>{blockNode(c, editor)}</div>
        ))}
        {Array.from({ length: placeholders }, (_, i) => (
          <div className="ed-grid-empty-cell" key={`placeholder-${i}`}>
            <span className="ed-grid-plus">＋</span>
            <span>单元格</span>
          </div>
        ))}
      </div>
      {editor ? (
        <div className="ed-grid-hint">
          <span>网格 · {cols} 列{children.length ? '' : ' · 暂无组件'}</span>
          <span className="ed-grid-tip">从右侧添加组件</span>
        </div>
      ) : null}
    </div>
  )
}

export function BannerView({ b, editor = false }: { b: BannerBlock; editor?: boolean }) {
  if (editor && !b.title && !b.sub && !b.image && !b.pattern) {
    return <EmptyEditorBlock b={b} label="横幅" tip="添加标题、副标题或配图" variant="wide" />
  }
  if (b.variant === 'centered') {
    return (
      <div
        className={`banner banner--centered ${b.alt ? 'section-alt' : ''}`}
        style={{ ...(bgCss(b.image) ?? bgCss(b.bg)), ...textColorVars(b.titleColor, b.subColor) }}
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
    <div
      className={`banner banner--split ${b.alt ? 'section-alt' : ''}`}
      style={{ ...bgCss(b.bg), ...textColorVars(b.titleColor, b.subColor) }}
    >
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

export function HeadingView({ b, editor = false }: { b: HeadingBlock; editor?: boolean }) {
  if (editor && !b.title && !b.subtitle) {
    return <EmptyEditorBlock b={b} label="标题" tip="在右侧填写标题" variant="heading" />
  }
  return (
    <div className="container" data-bid={b._id} style={textColorVars(b.titleColor, b.subtitleColor)}>
      <div className="section-heading" style={{ textAlign: b.align === 'left' ? 'left' : 'center', ...padStyle(b.padding) }}>
        {b.title ? <h2>{b.title}</h2> : null}
        {b.subtitle ? <p className="subtitle">{b.subtitle}</p> : null}
      </div>
    </div>
  )
}

export function TextView({ b, editor = false }: { b: TextBlock; editor?: boolean }) {
  if (editor && !b.title && !b.body) {
    return <EmptyEditorBlock b={b} label="文本" tip="在右侧填写正文" />
  }
  return (
    <div className="container" data-bid={b._id} style={textColorVars(b.titleColor, b.bodyColor)}>
      <div className="text-block" style={{ textAlign: b.align === 'center' ? 'center' : 'left', ...padStyle(b.padding) }}>
        {b.title ? <h2 data-field="title">{b.title}</h2> : null}
        <p data-field="body">{b.body}</p>
      </div>
    </div>
  )
}

export function ImageView({ b, editor = false }: { b: ImageBlock; editor?: boolean }) {
  const src = safeUrl(b.media)
  if (editor && !src) {
    return <EmptyEditorBlock b={b} label="图片" tip="在右侧选择图片" />
  }
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

export function ImageTextView({ b, editor = false }: { b: ImageTextBlock; editor?: boolean }) {
  const src = safeUrl(b.media)
  if (editor && !src && !b.title && !b.desc) {
    return <EmptyEditorBlock b={b} label="图文卡片" tip="添加图片与文字" variant="card" />
  }
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
    <div className="container" data-bid={b._id} style={textColorVars(b.titleColor, b.descColor)}>
      {href ? <a className="it-link" href={href}>{card}</a> : card}
    </div>
  )
}

export function IconCardView({ b, editor = false }: { b: IconCardBlock; editor?: boolean }) {
  const icon = safeUrl(b.icon)
  if (editor && !icon && !b.title && !b.desc) {
    return <EmptyEditorBlock b={b} label="图标卡片" tip="添加图标与文字" variant="card" />
  }
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
  return (
    <div className="container" style={textColorVars(b.titleColor, b.descColor)}>
      {href ? <a href={href} style={{ color: 'inherit' }}>{card}</a> : card}
    </div>
  )
}

export function ButtonView({ b, editor = false }: { b: ButtonBlock; editor?: boolean }) {
  if (editor && !b.label) {
    return <EmptyEditorBlock b={b} label="按钮" tip="在右侧填写文字" variant="pill" />
  }
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

export function RichTextView({ b, editor = false }: { b: RichTextBlock; editor?: boolean }) {
  if (editor && richTextEmpty(b.html)) {
    return <EmptyEditorBlock b={b} label="富文本" tip="在右侧编辑内容" variant="wide" />
  }
  return (
    <div className="container" data-bid={b._id}>
      <div className="richtext" style={padStyle(b.padding)} dangerouslySetInnerHTML={{ __html: b.html || '' }} />
    </div>
  )
}

export function GalleryView({ b, editor = false }: { b: GalleryBlock; editor?: boolean }) {
  const cols = Math.min(4, Math.max(1, b.columns || 3))
  const imgs = (b.images || []).map((src) => safeUrl(src)).filter(Boolean)
  if (editor && imgs.length === 0) {
    return <EmptyEditorBlock b={b} label="图集" tip="在右侧添加图片" variant="wide" />
  }
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

export function blockNode(b: Block, editor = false): React.ReactNode {
  switch (b.type) {
    case 'section': return <SectionView b={b} editor={editor} />
    case 'grid': return <GridView b={b} editor={editor} />
    case 'banner': return <BannerView b={b} editor={editor} />
    case 'heading': return <HeadingView b={b} editor={editor} />
    case 'text': return <TextView b={b} editor={editor} />
    case 'image': return <ImageView b={b} editor={editor} />
    case 'imageText': return <ImageTextView b={b} editor={editor} />
    case 'iconCard': return <IconCardView b={b} editor={editor} />
    case 'button': return <ButtonView b={b} editor={editor} />
    case 'richtext': return <RichTextView b={b} editor={editor} />
    case 'gallery': return <GalleryView b={b} editor={editor} />
    case 'slider': return <SliderView b={b} editor={editor} />
    default: return null
  }
}

/** 顶层区块：section 用自己的外壳，其余包一层 .section（沿用 bg/alt 语义）。 */
export function TopBlock({ b, editor = false }: { b: Block; editor?: boolean }) {
  if (b.type === 'section') return <SectionView b={b} editor={editor} />
  const style = bgCss(b.bg)
  const cls = ['section']
  if (!style && b.alt) cls.push('section-alt')
  return <section className={cls.join(' ')} style={style}>{blockNode(b, editor)}</section>
}

export function SliderView({ b, editor = false }: { b: SliderBlock; editor?: boolean }) {
  const imgs = (b.images || []).map((src) => safeUrl(src)).filter(Boolean)
  if (editor && imgs.length === 0) {
    return <EmptyEditorBlock b={b} label="轮播" tip="在右侧添加图片" variant="wide" />
  }
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
