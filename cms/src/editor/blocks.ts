import type { Block } from './types'

export interface FieldDef {
  key: string
  label: string
  control: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'media' | 'link' | 'bg'
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
    { key: 'align', label: '对齐', control: 'select', options: [{ label: '左', value: 'left' }, { label: '居中', value: 'center' }] }, ...common,
  ] },
  image: { type: 'image', label: '图片', defaults: () => ({ type: 'image', media: '' }), fields: [
    { key: 'media', label: '图片', control: 'media' }, { key: 'altText', label: '替代文本', control: 'text' },
    { key: 'link', label: '链接', control: 'link' }, ...common,
  ] },
  imageText: { type: 'imageText', label: '图文卡片', defaults: () => ({ type: 'imageText', media: '' }), fields: [
    { key: 'media', label: '图片', control: 'media' }, { key: 'title', label: '标题', control: 'text' },
    { key: 'desc', label: '描述', control: 'textarea' }, { key: 'link', label: '链接', control: 'link' }, ...common,
  ] },
  button: { type: 'button', label: '按钮', defaults: () => ({ type: 'button', label: '', link: '' }), fields: [
    { key: 'label', label: '文字', control: 'text' }, { key: 'link', label: '链接', control: 'link' },
    { key: 'style', label: '样式', control: 'select', options: [{ label: '实心', value: 'primary' }, { label: '描边', value: 'outline' }] }, ...common,
  ] },
  richtext: { type: 'richtext', label: '富文本', defaults: () => ({ type: 'richtext', html: '' }), fields: [...common] },
  gallery: { type: 'gallery', label: '图集', defaults: () => ({ type: 'gallery', images: [] }), fields: [
    { key: 'columns', label: '列数', control: 'number' }, ...common,
  ] },
  slider: { type: 'slider', label: '轮播', defaults: () => ({ type: 'slider', images: [] }), fields: [
    { key: 'bg', label: '背景', control: 'bg' },
  ] },
  grid: { type: 'grid', label: '网格', defaults: () => ({ type: 'grid', columns: 3, gap: 'md', cells: [{ components: [] }] }), fields: [
    { key: 'columns', label: '列数', control: 'number' }, { key: 'gap', label: '间距', control: 'select', options: [{ label: '紧凑', value: 'sm' }, { label: '标准', value: 'md' }, { label: '宽松', value: 'lg' }] }, ...common,
  ] },
  heading: { type: 'heading', label: '标题', defaults: () => ({ type: 'heading', title: '标题' }), fields: [
    { key: 'title', label: '标题', control: 'text' }, { key: 'subtitle', label: '副标题', control: 'text' },
    { key: 'align', label: '对齐', control: 'select', options: [{ label: '居中', value: 'center' }, { label: '左对齐', value: 'left' }] },
  ] },
  section: { type: 'section', label: '分栏', defaults: () => ({ type: 'section', padding: 'md', children: [] }), fields: [
    { key: 'bg', label: '背景', control: 'bg' },
    { key: 'padding', label: '内边距', control: 'select', options: [{ label: '无', value: 'none' }, { label: '小', value: 'sm' }, { label: '中', value: 'md' }, { label: '大', value: 'lg' }] },
  ] },
}

// 'grid' is intentionally omitted: it cannot receive children yet, so the palette
// must not offer it. The 'grid' entry stays in BLOCKS for type completeness; nested
// editing returns in phase 2.
export const PAGE_BLOCKS: Block['type'][] = ['section', 'heading', 'banner', 'text', 'image', 'imageText', 'button', 'richtext', 'gallery', 'slider']
