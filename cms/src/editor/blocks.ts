import type { Block } from './types'
import { newId } from './state'

export interface RepeaterItemField {
  key: string
  label: string
  control: 'text' | 'textarea' | 'media'
}

export interface FieldDef {
  key: string
  label: string
  control: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'media' | 'mediaList' | 'link' | 'pageLink' | 'bg' | 'color' | 'textColor' | 'gradient' | 'repeater' | 'richtext' | 'ratio'
  options?: { label: string; value: string }[]
  itemFields?: RepeaterItemField[]
  addLabel?: string
  titleKey?: string
  subtitleKey?: string
  mediaKey?: string
}
export interface BlockMeta { type: Block['type']; label: string; defaults: () => Block; fields: FieldDef[] }

export const BLOCKS: Record<string, BlockMeta> = {
  banner: { type: 'banner', label: '横幅', defaults: () => ({ type: 'banner', variant: 'split' }), fields: [
    { key: 'title', label: '标题', control: 'text' }, { key: 'sub', label: '副标题', control: 'text' },
    { key: 'titleColor', label: '标题颜色', control: 'textColor' },
    { key: 'subColor', label: '副标题颜色', control: 'textColor' },
    { key: 'variant', label: '布局变体', control: 'select', options: [{ label: '左右', value: 'split' }, { label: '整图', value: 'centered' }] },
    { key: 'image', label: '配图', control: 'media' }, { key: 'pattern', label: '装饰图', control: 'media' },
  ] },
  image: { type: 'image', label: '图片', defaults: () => ({ type: 'image', media: '', aspectRatio: 'auto', fit: 'cover' }), fields: [
    { key: 'media', label: '图片', control: 'media' }, { key: 'altText', label: '替代文本', control: 'text' },
    { key: 'link', label: '链接', control: 'pageLink' },
    { key: 'aspectRatio', label: '图片比例', control: 'select', options: [{ label: '自动', value: 'auto' }, { label: '1:1', value: '1:1' }, { label: '4:3', value: '4:3' }, { label: '3:4', value: '3:4' }, { label: '16:9', value: '16:9' }] },
    { key: 'fit', label: '填充方式', control: 'select', options: [{ label: '裁剪填充', value: 'cover' }, { label: '完整显示', value: 'contain' }] },
  ] },
  imageText: { type: 'imageText', label: '图文卡片', defaults: () => ({ type: 'imageText', media: '' }), fields: [
    { key: 'media', label: '图片', control: 'media' }, { key: 'title', label: '标题', control: 'text' },
    { key: 'subtitle', label: '副标题', control: 'text' },
    { key: 'subtitleColor', label: '副标题颜色', control: 'textColor' },
    { key: 'desc', label: '描述', control: 'textarea' },
    { key: 'imageRatio', label: '图片比例', control: 'select', options: [{ label: '自动', value: 'auto' }, { label: '1:1', value: '1:1' }, { label: '4:3', value: '4:3' }, { label: '3:4', value: '3:4' }, { label: '16:9', value: '16:9' }] },
    { key: 'imageFit', label: '图片填充', control: 'select', options: [{ label: '裁剪填充', value: 'cover' }, { label: '完整显示', value: 'contain' }] },
    { key: 'variant', label: '卡片样式', control: 'select', options: [{ label: '标准卡片', value: 'default' }, { label: '二维码（白框 + 背景文字）', value: 'qr' }] },
    { key: 'link', label: '链接', control: 'pageLink' },
    { key: 'titleColor', label: '标题颜色', control: 'textColor' },
    { key: 'descColor', label: '描述颜色', control: 'textColor' },
  ] },
  iconCard: { type: 'iconCard', label: '图标卡片', defaults: () => ({ type: 'iconCard', icon: '' }), fields: [
    { key: 'icon', label: '图标', control: 'media' },
    { key: 'iconColor', label: '图标颜色', control: 'color' },
    { key: 'iconFrame', label: '图标边框', control: 'select', options: [{ label: '圆形边框', value: 'circle' }, { label: '无边框', value: 'none' }] },
    { key: 'iconSize', label: '图标尺寸(px)', control: 'number' },
    { key: 'title', label: '标题', control: 'text' },
    { key: 'desc', label: '描述', control: 'textarea' },
    { key: 'titleColor', label: '标题颜色', control: 'textColor' },
    { key: 'descColor', label: '描述颜色', control: 'textColor' },
    { key: 'link', label: '链接', control: 'pageLink' },
    { key: 'bgImage', label: '背景图片', control: 'media' },
    { key: 'bgColor', label: '背景颜色', control: 'color' },
    { key: 'variant', label: '卡片样式', control: 'select', options: [{ label: '标准', value: 'default' }, { label: '紧凑', value: 'compact' }] },
  ] },
  button: { type: 'button', label: '按钮', defaults: () => ({ type: 'button', label: '', link: '' }), fields: [
    { key: 'label', label: '文字', control: 'text' }, { key: 'link', label: '链接', control: 'pageLink' },
    { key: 'style', label: '样式', control: 'select', options: [{ label: '实心', value: 'primary' }, { label: '描边', value: 'outline' }] },
  ] },
  richtext: { type: 'richtext', label: '富文本', defaults: () => ({ type: 'richtext', html: '' }), fields: [
    { key: 'content', label: '正文', control: 'richtext' },
  ] },
  gallery: { type: 'gallery', label: '图集', defaults: () => ({ type: 'gallery', images: [] }), fields: [
    { key: 'columns', label: '列数', control: 'number' },
    { key: 'images', label: '图片', control: 'mediaList' },
  ] },
  slider: { type: 'slider', label: '轮播', defaults: () => ({ type: 'slider', images: [] }), fields: [
    { key: 'images', label: '轮播图片', control: 'mediaList' },
  ] },
  grid: { type: 'grid', label: '网格', defaults: () => ({ type: 'grid', layout: 'flow', columns: 3, gap: 'md', columnRatio: '1:1:1', children: [] }), fields: [
    { key: 'layout', label: '布局方式', control: 'select', options: [{ label: '流式（自动换行）', value: 'flow' }, { label: '按行（显式格子）', value: 'rows' }] },
    { key: 'columns', label: '列数', control: 'number' }, { key: 'gap', label: '间距', control: 'select', options: [{ label: '紧凑', value: 'sm' }, { label: '标准', value: 'md' }, { label: '宽松', value: 'lg' }] },
    { key: 'columnRatio', label: '列宽比例', control: 'ratio' },
    { key: 'alignItems', label: '垂直对齐', control: 'select', options: [{ label: '拉伸等高', value: 'stretch' }, { label: '顶部对齐', value: 'start' }, { label: '居中', value: 'center' }, { label: '底部对齐', value: 'end' }] },
    { key: 'bgImage', label: '背景图片', control: 'media' },
    { key: 'bgColor', label: '背景颜色', control: 'color' },
    { key: 'padding', label: '内容内边距(px)', control: 'number' },
  ] },
  gridRow: { type: 'gridRow', label: '行', defaults: () => ({
    type: 'gridRow', columns: 3, gap: 'md', columnRatio: '1:1:1',
    children: Array.from({ length: 3 }, () => ({ type: 'gridCell' as const, _id: newId(), children: [] })),
  }), fields: [
    { key: 'columns', label: '列数', control: 'number' },
    { key: 'gap', label: '间距', control: 'select', options: [{ label: '紧凑', value: 'sm' }, { label: '标准', value: 'md' }, { label: '宽松', value: 'lg' }] },
    { key: 'columnRatio', label: '列宽比例', control: 'ratio' },
  ] },
  gridCell: { type: 'gridCell', label: '格子', defaults: () => ({ type: 'gridCell', children: [] }), fields: [] },
  heading: { type: 'heading', label: '标题', defaults: () => ({ type: 'heading', title: '标题' }), fields: [
    { key: 'title', label: '标题', control: 'text' }, { key: 'subtitle', label: '副标题', control: 'text' },
    { key: 'titleColor', label: '标题颜色', control: 'textColor' },
    { key: 'subtitleColor', label: '副标题颜色', control: 'textColor' },
    { key: 'align', label: '对齐', control: 'select', options: [{ label: '居中', value: 'center' }, { label: '左对齐', value: 'left' }] },
  ] },
  infoList: { type: 'infoList', label: '信息列表', defaults: () => ({ type: 'infoList', showDots: true, titleAlign: 'left', items: [{ label: '标签', desc: '说明' }] }), fields: [
    { key: 'title', label: '标题（可选）', control: 'text' },
    { key: 'titleAlign', label: '标题对齐', control: 'select', options: [{ label: '左对齐', value: 'left' }, { label: '居中', value: 'center' }] },
    { key: 'items', label: '条目', control: 'repeater', addLabel: '添加条目', titleKey: 'label', subtitleKey: 'desc', itemFields: [
      { key: 'label', label: '标签（可选）', control: 'text' },
      { key: 'desc', label: '说明', control: 'textarea' },
    ] },
    { key: 'showDots', label: '显示圆点', control: 'boolean' },
  ] },
  steps: { type: 'steps', label: '流程步骤', defaults: () => ({ type: 'steps', start: 1, connector: true, steps: [{ title: '第一步' }] }), fields: [
    { key: 'title', label: '标题（可选）', control: 'text' },
    { key: 'start', label: '起始编号', control: 'number' },
    { key: 'connector', label: '显示虚线分隔', control: 'boolean' },
    { key: 'steps', label: '步骤', control: 'repeater', addLabel: '添加步骤', titleKey: 'title', subtitleKey: 'desc', itemFields: [
      { key: 'title', label: '步骤', control: 'text' },
      { key: 'desc', label: '说明（可选）', control: 'textarea' },
    ] },
  ] },
  zigzag: { type: 'zigzag', label: '交替图文', defaults: () => ({ type: 'zigzag', showLine: true, items: [{ text: '第一条' }, { text: '第二条' }] }), fields: [
    { key: 'title', label: '标题（可选）', control: 'text' },
    { key: 'showLine', label: '显示中轴线', control: 'boolean' },
    { key: 'items', label: '条目', control: 'repeater', addLabel: '添加条目', titleKey: 'text', itemFields: [
      { key: 'icon', label: '图标（可选）', control: 'media' },
      { key: 'text', label: '文本', control: 'textarea' },
    ] },
  ] },
  entries: { type: 'entries', label: '文本条目', defaults: () => ({ type: 'entries', collapsible: false, items: [{ label: '标签', text: '正文' }] }), fields: [
    { key: 'title', label: '标题（可选）', control: 'text' },
    { key: 'collapsible', label: '折叠显示', control: 'boolean' },
    { key: 'items', label: '条目', control: 'repeater', addLabel: '添加条目', titleKey: 'label', subtitleKey: 'text', itemFields: [
      { key: 'label', label: '标签', control: 'text' },
      { key: 'text', label: '正文', control: 'textarea' },
    ] },
  ] },
  iconList: { type: 'iconList', label: '图标列表', defaults: () => ({ type: 'iconList', iconPosition: 'left', items: [{ icon: '', title: '标题', desc: '说明' }] }), fields: [
    { key: 'items', label: '条目', control: 'repeater', addLabel: '添加条目', titleKey: 'title', subtitleKey: 'desc', mediaKey: 'icon', itemFields: [
      { key: 'icon', label: '图标', control: 'media' },
      { key: 'title', label: '标题', control: 'text' },
      { key: 'desc', label: '说明', control: 'textarea' },
    ] },
    { key: 'iconPosition', label: '图标位置', control: 'select', options: [{ label: '居左', value: 'left' }, { label: '居右', value: 'right' }, { label: '左右交替', value: 'alternate' }] },
    { key: 'iconColor', label: '图标颜色', control: 'color' },
  ] },
  hscroll: { type: 'hscroll', label: '横向滚动', defaults: () => ({ type: 'hscroll', timeline: false, children: [] }), fields: [
    { key: 'timeline', label: '时间轴连接线', control: 'boolean' },
  ] },
  stack: { type: 'stack', label: '纵向容器', defaults: () => ({ type: 'stack', gap: 'md', children: [] }), fields: [
    { key: 'gap', label: '垂直间距', control: 'select', options: [{ label: '紧凑', value: 'sm' }, { label: '标准', value: 'md' }, { label: '宽松', value: 'lg' }] },
    { key: 'bgImage', label: '背景图片', control: 'media' },
    { key: 'bgColor', label: '背景颜色', control: 'color' },
    { key: 'padding', label: '内边距', control: 'number' },
  ] },
  section: { type: 'section', label: '分栏', defaults: () => ({ type: 'section', paddingY: 'md', children: [
    { type: 'heading', title: '新分栏', align: 'center', _id: newId() },
  ] }), fields: [
    { key: 'bgImage', label: '背景图片', control: 'media' },
    { key: 'bgColor', label: '背景颜色', control: 'color' },
    { key: 'bgGradient', label: '背景渐变', control: 'gradient' },
    { key: 'bgHeight', label: '背景高度(px)', control: 'number' },
    { key: 'paddingY', label: '垂直内边距', control: 'select', options: [{ label: '无', value: 'none' }, { label: '紧凑', value: 'sm' }, { label: '标准', value: 'md' }, { label: '宽松', value: 'lg' }, { label: '超宽松', value: 'xl' }, { label: '超大', value: '2xl' }] },
    { key: 'paddingCustom', label: '自定义上下内边距', control: 'number' },
    { key: 'contentGap', label: '子项间距', control: 'number' },
  ] },
}

export interface DefaultMedia {
  image?: string
  images?: string[]
  icon?: string
}

/** 新增组件时的默认内容；媒体由调用方从媒体库提供。 */
export function makeDefaultBlock(type: Block['type'], media: DefaultMedia = {}): Block {
  const meta = BLOCKS[type]
  if (!meta) throw new Error(`组件已停用：${type}`)
  const base = meta.defaults() as any
  switch (type) {
    case 'image':
      return { ...base, media: media.image || '' }
    case 'imageText':
      return {
        ...base,
        media: media.image || '',
        title: '图文卡片',
        desc: '在这里填写描述',
        titleColor: '#8A0E4B',
        descColor: '#000000',
      }
    case 'iconCard':
      return {
        ...base,
        icon: media.icon || '',
        title: '图标卡片',
        desc: '在这里填写描述',
        titleColor: '#8A0E4B',
        descColor: '#000000',
      }
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
      return {
        ...base,
        title: '横幅标题',
        sub: '在这里填写副标题',
        titleColor: '#8A0E4B',
        subColor: '#000000',
      }
    case 'heading':
      return { ...base, titleColor: '#8A0E4B', subtitleColor: '#000000' }
    default:
      return base
  }
}

export const LAYOUT_TYPES = ['section', 'grid', 'gridRow', 'gridCell', 'hscroll', 'stack'] as const

/** 分栏：版面级内容。 */
export const SECTION_CHILD_TYPES: Block['type'][] = ['heading', 'grid', 'gallery', 'banner', 'slider', 'richtext', 'infoList', 'entries', 'zigzag', 'steps', 'iconList', 'hscroll', 'stack']
/** 网格：卡片/文本级内容。 */
export const GRID_CHILD_TYPES: Block['type'][] = ['heading', 'image', 'imageText', 'iconCard', 'button', 'stack', 'steps']

export function isLayout(type: Block['type']): boolean {
  return (LAYOUT_TYPES as readonly string[]).includes(type)
}

/** 依据放置规则返回某容器允许的子组件类型。 */
export function allowedChildTypes(parent: Block['type'], layout?: string): Block['type'][] {
  if (parent === 'section') return [...SECTION_CHILD_TYPES]
  if (parent === 'grid') return layout === 'rows' ? ['gridRow'] : [...GRID_CHILD_TYPES]
  if (parent === 'gridRow') return ['gridCell']
  if (parent === 'gridCell') return [...GRID_CHILD_TYPES]
  if (parent === 'hscroll') return ['imageText']
  if (parent === 'stack') return ['heading', 'image', 'imageText', 'iconCard', 'button', 'gallery', 'richtext']
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
    case 'grid': return `网格 · ${b.layout === 'rows' ? '按行' : `${b.columns} 列`}`
    case 'gridRow': return `行 · ${b.columns} 格`
    case 'gridCell': return b.children?.length ? blockSummary(b.children[0]) : '空格子'
    case 'section': {
      const first = (b.children || [])[0]
      const titled = first && (first.type === 'heading' || first.type === 'text') ? (first as { title?: string }).title : ''
      return titled || '分栏'
    }
    case 'banner': return b.title || '横幅'
    case 'richtext': return '富文本'
    case 'infoList': return `信息列表 · ${b.items.length} 条`
    case 'entries': return `文本条目 · ${b.items.length} 条`
    case 'zigzag': return `交替图文 · ${b.items.length} 条`
    case 'steps': return `流程 · ${b.steps.length} 步`
    case 'iconList': return `图标列表 · ${b.items.length} 条`
    case 'hscroll': return `横向滚动 · ${b.children?.length || 0} 张`
    case 'stack': return `纵向容器 · ${b.children?.length || 0} 项`
    default: return (b as { type: string }).type
  }
}

