export interface BlockBase {
  bg?: string
  alt?: boolean
  /** editor-stable id, ignored by generation */
  _id?: string
  /** original Payload block, kept so serialization can preserve non-render fields (e.g. richtext content) */
  _raw?: unknown
}

export interface BannerBlock extends BlockBase {
  type: 'banner'
  variant: 'split' | 'centered'
  title?: string
  sub?: string
  titleColor?: string
  subColor?: string
  image?: string
  pattern?: string
}

export interface HeadingBlock extends BlockBase {
  type: 'heading'
  title: string
  subtitle?: string
  titleColor?: string
  subtitleColor?: string
  align?: 'center' | 'left'
  padding?: number
}

export interface GridBlock extends BlockBase {
  type: 'grid'
  /** flow：子块自动换行；rows：子块为 gridRow，行内是显式格子 */
  layout?: 'flow' | 'rows'
  columns: number
  gap?: string
  columnRatio?: string
  alignItems?: 'stretch' | 'start' | 'center' | 'end'
  /** 背景图片 URL（可与背景色叠加） */
  bgImage?: string
  /** 背景颜色（CSS 颜色值） */
  bgColor?: string
  children: Block[]
}

export interface GridRowBlock extends BlockBase {
  type: 'gridRow'
  columns: number
  gap?: string
  columnRatio?: string
  children: Block[]
}

export interface GridCellBlock extends BlockBase {
  type: 'gridCell'
  children: Block[]
}

export interface TextBlock extends BlockBase {
  type: 'text'
  title?: string
  body: string
  titleColor?: string
  bodyColor?: string
  align?: 'left' | 'center'
  padding?: number
  fontSize?: number
  fontWeight?: '400' | '600' | '700'
  maxWidth?: number
  marginTop?: number
}

export interface ImageBlock extends BlockBase {
  type: 'image'
  media: string
  altText?: string
  link?: string
  linkType?: 'none' | 'internal' | 'external'
  internalPageId?: string | number
  internalRoute?: string
  externalUrl?: string
  aspectRatio?: 'auto' | '1:1' | '4:3' | '3:4' | '16:9'
  fit?: 'cover' | 'contain'
  padding?: number
}

export interface ImageTextBlock extends BlockBase {
  type: 'imageText'
  media: string
  imageFit?: 'cover' | 'contain'
  variant?: 'default' | 'qr'
  title?: string
  subtitle?: string
  subtitleColor?: string
  desc?: string
  titleColor?: string
  descColor?: string
  imageRatio?: 'auto' | '1:1' | '4:3' | '3:4' | '16:9'
  link?: string
  linkType?: 'none' | 'internal' | 'external'
  internalPageId?: string | number
  internalRoute?: string
  externalUrl?: string
  padding?: number
}

export interface ButtonBlock extends BlockBase {
  type: 'button'
  label: string
  link: string
  linkType?: 'none' | 'internal' | 'external'
  internalPageId?: string | number
  internalRoute?: string
  externalUrl?: string
  style?: 'primary' | 'outline'
  padding?: number
}

export interface RichTextBlock extends BlockBase {
  type: 'richtext'
  /**
   * Pre-sanitized HTML produced by the Lexical serializer (see `src/render/richText.ts`).
   * Trusted editor content only — NEVER assign raw user input here.
   */
  html: string
  /** Lexical editor state used by the visual editor. */
  content?: unknown
  padding?: number
}

export interface GalleryBlock extends BlockBase {
  type: 'gallery'
  images: string[]
  columns?: number
  padding?: number
}

export interface SliderBlock extends BlockBase {
  type: 'slider'
  images: string[]
}

export interface IconCardBlock extends BlockBase {
  type: 'iconCard'
  icon: string
  title?: string
  desc?: string
  titleColor?: string
  descColor?: string
  link?: string
  linkType?: 'none' | 'internal' | 'external'
  internalPageId?: string | number
  internalRoute?: string
  externalUrl?: string
  /** 卡片背景图片（可与背景色叠加） */
  bgImage?: string
  /** 卡片背景颜色 */
  bgColor?: string
  /** 图标颜色；设置后以 mask 方式给 SVG 上色 */
  iconColor?: string
  iconFrame?: 'circle' | 'none'
  iconSize?: number
  variant?: 'default' | 'compact'
}

export interface InfoListBlock extends BlockBase {
  type: 'infoList'
  title?: string
  titleAlign?: 'left' | 'center'
  items: { label?: string; desc: string }[]
  showDots: boolean
}

export interface IconListBlock extends BlockBase {
  type: 'iconList'
  items: { icon: string; title: string; desc?: string }[]
  iconPosition: 'left' | 'right' | 'alternate'
  iconColor?: string
}

export interface FaqBlock extends BlockBase {
  type: 'faq'
  title?: string
  collapsible?: boolean
  items: { q: string; a: string }[]
}

export interface HscrollBlock extends BlockBase {
  type: 'hscroll'
  timeline: boolean
  children: Block[]
}

export interface StackBlock extends BlockBase {
  type: 'stack'
  gap: 'sm' | 'md' | 'lg'
  bgImage?: string
  bgColor?: string
  padding?: number
  children: Block[]
}

export interface SectionBlock extends BlockBase {
  type: 'section'
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** 分栏直接子项之间的统一间距(px) */
  contentGap?: number
  /** 自定义上下内边距(px)，大于0时覆盖 paddingY */
  paddingCustom?: number
  /** 背景图片 URL（可与背景色叠加） */
  bgImage?: string
  /** 背景颜色（CSS 颜色值） */
  bgColor?: string
  /** 背景渐变（CSS linear-gradient/radial-gradient） */
  bgGradient?: string
  /** 背景带高度(px)；0/空为铺满 */
  bgHeight?: number
  children: Block[]
}

export type Block =
  | BannerBlock
  | HeadingBlock
  | GridBlock
  | GridRowBlock
  | GridCellBlock
  | TextBlock
  | ImageBlock
  | ImageTextBlock
  | ButtonBlock
  | RichTextBlock
  | GalleryBlock
  | SliderBlock
  | IconCardBlock
  | InfoListBlock
  | IconListBlock
  | FaqBlock
  | HscrollBlock
  | StackBlock
  | SectionBlock

export interface CaseCategory {
  id: string | number
  title: string
  slug: string
  banner?: string
  subtitle?: string
  pageSize: number
  seoTitle?: string
  seoDescription?: string
}

export interface CaseItem {
  id: string | number
  title: string
  slug: string
  categoryId: string | number
  categorySlug: string
  categoryTitle: string
  cover: string
  publishedAt: string
  createdAt?: string
  body: unknown
  seoTitle?: string
  seoDescription?: string
}

export interface CaseListTemplate {
  kind: 'caseList'
  category?: CaseCategory
  items: CaseItem[]
  page: number
  pageCount: number
  pageSize: number
  basePath: string
  title: string
  subtitle?: string
  banner?: string
}

export interface CaseDetailTemplate {
  kind: 'caseDetail'
  item: CaseItem
  category: CaseCategory
}

export interface PageDoc {
  title: string
  route: string
  blocks: Block[]
  template?: CaseListTemplate | CaseDetailTemplate
  seo?: { title?: string; description?: string }
}

export interface MenuNode {
  label: string
  link: string
  children?: MenuNode[]
}

export interface FooterQr {
  label: string
  image?: string
}

export interface SiteSettings {
  logo: string
  footerLogo: string
  footerInfo: { label: string; text: string }[]
  footerQr: FooterQr[]
  footerContact?: { label: string; link: string }
  copyright: string
  langCurrentLabel: string
  langOtherLabel: string
  langOtherUrl?: string
}

export interface SiteConfig {
  menu: MenuNode[]
  settings: SiteSettings
}

export interface SiteData {
  pages: PageDoc[]
  site?: SiteConfig
  redirects?: { from: string; to: string }[]
}
