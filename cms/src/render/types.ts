export interface BlockBase {
  bg?: string
  alt?: boolean
}

export interface BannerBlock extends BlockBase {
  type: 'banner'
  variant: 'split' | 'centered'
  title?: string
  sub?: string
  image?: string
  pattern?: string
}

export interface GridCell {
  components: Block[]
}

export interface GridBlock extends BlockBase {
  type: 'grid'
  columns: number
  gap?: string
  cells: GridCell[]
}

export interface TextBlock extends BlockBase {
  type: 'text'
  title?: string
  body: string
  align?: 'left' | 'center'
}

export interface ImageBlock extends BlockBase {
  type: 'image'
  media: string
  altText?: string
  link?: string
}

export interface ImageTextBlock extends BlockBase {
  type: 'imageText'
  media: string
  title?: string
  desc?: string
  link?: string
}

export interface ButtonBlock extends BlockBase {
  type: 'button'
  label: string
  link: string
  style?: 'primary' | 'outline'
}

export interface RichTextBlock extends BlockBase {
  type: 'richtext'
  html: string
}

export interface GalleryBlock extends BlockBase {
  type: 'gallery'
  images: string[]
  columns?: number
}

export interface SliderBlock extends BlockBase {
  type: 'slider'
  images: string[]
}

export type Block =
  | BannerBlock
  | GridBlock
  | TextBlock
  | ImageBlock
  | ImageTextBlock
  | ButtonBlock
  | RichTextBlock
  | GalleryBlock
  | SliderBlock

export interface PageDoc {
  title: string
  route: string
  blocks: Block[]
  seo?: { title?: string; description?: string }
}

export interface SiteData {
  pages: PageDoc[]
}
