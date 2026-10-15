export type TextBlockData = {
  type: 'text'
  title?: string
  body: string
  align?: 'left' | 'center'
  bg?: string
  alt?: boolean
}

export type ImageBlockData = {
  type: 'image'
  media: string
  altText?: string
  link?: string
  bg?: string
  alt?: boolean
}

export type Block = TextBlockData | ImageBlockData

export interface PageDoc {
  title: string
  route: string
  blocks: Block[]
  seo?: { title?: string; description?: string }
}

export interface SiteData {
  pages: PageDoc[]
}
