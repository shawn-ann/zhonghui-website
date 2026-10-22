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
  columns: number
  gap?: string
  /** 背景图片 URL（可与背景色叠加） */
  bgImage?: string
  /** 背景颜色（CSS 颜色值） */
  bgColor?: string
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
}

export interface ImageBlock extends BlockBase {
  type: 'image'
  media: string
  altText?: string
  link?: string
  padding?: number
}

export interface ImageTextBlock extends BlockBase {
  type: 'imageText'
  media: string
  title?: string
  desc?: string
  titleColor?: string
  descColor?: string
  link?: string
  padding?: number
}

export interface ButtonBlock extends BlockBase {
  type: 'button'
  label: string
  link: string
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
  /** 卡片背景图片（可与背景色叠加） */
  bgImage?: string
  /** 卡片背景颜色 */
  bgColor?: string
  /** 图标颜色；设置后以 mask 方式给 SVG 上色 */
  iconColor?: string
}

export interface SectionBlock extends BlockBase {
  type: 'section'
  paddingY?: 'none' | 'sm' | 'md' | 'lg'
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
  | TextBlock
  | ImageBlock
  | ImageTextBlock
  | ButtonBlock
  | RichTextBlock
  | GalleryBlock
  | SliderBlock
  | IconCardBlock
  | SectionBlock

export interface PageDoc {
  title: string
  route: string
  blocks: Block[]
  seo?: { title?: string; description?: string }
}

export interface SiteData {
  pages: PageDoc[]
}
