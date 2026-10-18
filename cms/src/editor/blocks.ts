import type { Block } from './types'
import { newId } from './state'

export interface FieldDef {
  key: string
  label: string
  control: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'media' | 'mediaList' | 'link' | 'bg' | 'color'
  options?: { label: string; value: string }[]
}
export interface BlockMeta { type: Block['type']; label: string; defaults: () => Block; fields: FieldDef[] }

const common: FieldDef[] = [
  { key: 'bg', label: '背景', control: 'bg' },
  { key: 'alt', label: '浅粉底', control: 'boolean' },
]

export const BLOCKS: Record<Block['type'], BlockMeta> = {
  banner: { type: 'banner', label: '横幅', defaults: () => ({ type: 'banner', variant: 'split' }), fields: [
    { key: 'title', label: '标题', control: 'text' }, { key: 'sub', label: '副标题', control: 'text' },
    { key: 'variant', label: '布局变体', control: 'select', options: [{ label: '左右', value: 'split' }, { label: '整图', value: 'centered' }] },
    { key: 'image', label: '配图', control: 'media' }, { key: 'pattern', label: '装饰图', control: 'media' }, ...common,
  ] },
  text: { type: 'text', label: '文本', defaults: () => ({ type: 'text', body: '' }), fields: [
    { key: 'title', label: '标题', control: 'text' }, { key: 'body', label: '正文', control: 'textarea' },
    { key: 'align', label: '对齐', control: 'select', options: [{ label: '左', value: 'left' }, { label: '居中', value: 'center' }] },
    { key: 'padding', label: '内边距', control: 'number' },
  ] },
  image: { type: 'image', label: '图片', defaults: () => ({ type: 'image', media: '' }), fields: [
    { key: 'media', label: '图片', control: 'media' }, { key: 'altText', label: '替代文本', control: 'text' },
    { key: 'link', label: '链接', control: 'link' }, { key: 'padding', label: '内边距', control: 'number' },
  ] },
  imageText: { type: 'imageText', label: '图文卡片', defaults: () => ({ type: 'imageText', media: '' }), fields: [
    { key: 'media', label: '图片', control: 'media' }, { key: 'title', label: '标题', control: 'text' },
    { key: 'desc', label: '描述', control: 'textarea' }, { key: 'link', label: '链接', control: 'link' },
    { key: 'padding', label: '内边距', control: 'number' },
  ] },
  iconCard: { type: 'iconCard', label: '图标卡片', defaults: () => ({ type: 'iconCard', icon: '' }), fields: [
    { key: 'icon', label: '图标', control: 'media' },
    { key: 'iconColor', label: '图标颜色', control: 'color' },
    { key: 'title', label: '标题', control: 'text' },
    { key: 'desc', label: '描述', control: 'textarea' },
    { key: 'link', label: '链接', control: 'link' },
    { key: 'bgImage', label: '背景图片', control: 'media' },
    { key: 'bgColor', label: '背景颜色', control: 'color' },
  ] },
  button: { type: 'button', label: '按钮', defaults: () => ({ type: 'button', label: '', link: '' }), fields: [
    { key: 'label', label: '文字', control: 'text' }, { key: 'link', label: '链接', control: 'link' },
    { key: 'style', label: '样式', control: 'select', options: [{ label: '实心', value: 'primary' }, { label: '描边', value: 'outline' }] },
    { key: 'padding', label: '内边距', control: 'number' },
  ] },
  richtext: { type: 'richtext', label: '富文本', defaults: () => ({ type: 'richtext', html: '' }), fields: [
    { key: 'padding', label: '内边距', control: 'number' },
  ] },
  gallery: { type: 'gallery', label: '图集', defaults: () => ({ type: 'gallery', images: [] }), fields: [
    { key: 'columns', label: '列数', control: 'number' },
    { key: 'images', label: '图片', control: 'mediaList' },
    { key: 'padding', label: '内边距', control: 'number' },
  ] },
  slider: { type: 'slider', label: '轮播', defaults: () => ({ type: 'slider', images: [] }), fields: [
    { key: 'images', label: '轮播图片', control: 'mediaList' },
  ] },
  grid: { type: 'grid', label: '网格', defaults: () => ({ type: 'grid', columns: 3, gap: 'md', children: [] }), fields: [
    { key: 'columns', label: '列数', control: 'number' }, { key: 'gap', label: '间距', control: 'select', options: [{ label: '紧凑', value: 'sm' }, { label: '标准', value: 'md' }, { label: '宽松', value: 'lg' }] },
    { key: 'bgImage', label: '背景图片', control: 'media' },
    { key: 'bgColor', label: '背景颜色', control: 'color' },
  ] },
  heading: { type: 'heading', label: '标题', defaults: () => ({ type: 'heading', title: '标题' }), fields: [
    { key: 'title', label: '标题', control: 'text' }, { key: 'subtitle', label: '副标题', control: 'text' },
    { key: 'align', label: '对齐', control: 'select', options: [{ label: '居中', value: 'center' }, { label: '左对齐', value: 'left' }] },
    { key: 'padding', label: '内边距', control: 'number' },
  ] },
  section: { type: 'section', label: '分栏', defaults: () => ({ type: 'section', paddingY: 'md', children: [
    { type: 'heading', title: '新分栏', align: 'center', _id: newId() },
  ] }), fields: [
    { key: 'bgImage', label: '背景图片', control: 'media' },
    { key: 'bgColor', label: '背景颜色', control: 'color' },
    { key: 'paddingY', label: '垂直内边距', control: 'select', options: [{ label: '无', value: 'none' }, { label: '紧凑', value: 'sm' }, { label: '标准', value: 'md' }, { label: '宽松', value: 'lg' }] },
  ] },
}

export interface DefaultMedia {
  image?: string
  images?: string[]
  icon?: string
}

/** 新增组件时的默认内容；媒体由调用方从媒体库提供。 */
export function makeDefaultBlock(type: Block['type'], media: DefaultMedia = {}): Block {
  const base = BLOCKS[type].defaults() as any
  switch (type) {
    case 'text':
      return { ...base, body: '在这里填写正文内容。' }
    case 'image':
      return { ...base, media: media.image || '' }
    case 'imageText':
      return { ...base, media: media.image || '', title: '图文卡片', desc: '在这里填写描述' }
    case 'iconCard':
      return { ...base, icon: media.icon || '', title: '图标卡片', desc: '在这里填写描述' }
    case 'button':
      return { ...base, label: '按钮' }
    case 'richtext':
      return { ...base, html: '<p>在这里编辑富文本内容。</p>' }
    case 'gallery':
    case 'slider': {
      const first = media.images?.[0] || media.image
      return { ...base, images: first ? [first] : [] }
    }
    case 'banner':
      return { ...base, title: '横幅标题', sub: '在这里填写副标题' }
    default:
      return base
  }
}

export const LAYOUT_TYPES = ['section', 'grid'] as const

/** 分栏：版面级内容。 */
export const SECTION_CHILD_TYPES: Block['type'][] = ['heading', 'grid', 'gallery', 'banner', 'slider', 'richtext']
/** 网格：卡片/文本级内容。 */
export const GRID_CHILD_TYPES: Block['type'][] = ['heading', 'text', 'image', 'imageText', 'iconCard', 'button']

export function isLayout(type: Block['type']): boolean {
  return (LAYOUT_TYPES as readonly string[]).includes(type)
}

/** 依据放置规则返回某容器允许的子组件类型。 */
export function allowedChildTypes(parent: Block['type']): Block['type'][] {
  if (parent === 'section') return [...SECTION_CHILD_TYPES]
  if (parent === 'grid') return [...GRID_CHILD_TYPES]
  return []
}

/** 结构树节点摘要。 */
export function blockSummary(b: Block): string {
  switch (b.type) {
    case 'heading': return b.title || '标题'
    case 'text': return b.title || b.body || '文本'
    case 'image': return b.altText || '图片'
    case 'imageText': return b.title || '图文卡片'
    case 'iconCard': return b.title || '图标卡片'
    case 'button': return b.label || '按钮'
    case 'gallery': return `图集 · ${b.images.length} 张`
    case 'slider': return `轮播 · ${b.images.length} 张`
    case 'grid': return `网格 · ${b.columns} 列`
    case 'section': {
      const first = (b.children || [])[0]
      const titled = first && (first.type === 'heading' || first.type === 'text') ? (first as { title?: string }).title : ''
      return titled || '分栏'
    }
    case 'banner': return b.title || '横幅'
    case 'richtext': return '富文本'
    default: return (b as { type: string }).type
  }
}

