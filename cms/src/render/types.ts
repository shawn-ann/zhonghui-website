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
  image?: string
  pattern?: string
}

export interface HeadingBlock extends BlockBase {
  type: 'heading'
  title: string
  subtitle?: string
  align?: 'center' | 'left'
  padding?: number
}

export interface GridBlock extends BlockBase {
  type: 'grid'
  columns: number
  gap?: string
  children: Block[]
}

export interface TextBlock extends BlockBase {
  type: 'text'
  title?: string
  body: string
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

export interface SectionBlock extends BlockBase {
  type: 'section'
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
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
