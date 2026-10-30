# 内容组件扩展与两页迁移设计

日期：2026-10-27
状态：已确认，待实现
范围：新增内容组件、扩展现有组件、编辑器重复项控制、嵌套横向滚动容器，以及「关于中惠」「美国互惠生」两页迁移

## 1. 背景

旧站 `about.html`、`aupair-usa.html` 使用独立的 `pageConfig` 和专用渲染器，包含若干当前 CMS 不支持的内容形态：

- 标签 + 说明的规格列表
- 图标 + 标题 + 说明的列表
- 图片 + 年份 + 多条事件的横向卡片
- 左图右文 + 正文 + 副块
- 创始人卡片 + 师资条目列表
- 居中陈述 + 高亮句

当前 CMS 已有 `banner`、`heading`、`text`、`image`、`imageText`、`iconCard`、`grid`、`section`、`gallery`、`slider`、`richtext`、`button`，但：

- 列表类内容无法结构化编辑；
- 编辑器没有数组/重复项控件；
- 网格只支持等宽列；
- 文本不支持字号、字重、阅读宽度；
- 图文卡片没有副标题；
- 没有横向滚动容器。

本设计遵循：**能复用就扩展，不能表达才新增**。

## 2. 目标

- 用少量通用组件覆盖两张旧页面的结构和内容。
- 组件按内容形态命名，不绑定“历程、团队、待遇”等具体业务。
- 编辑器中可以增删、排序、编辑列表条目和图片。
- 横向卡片复用现有图文卡片，不为“年份”等业务字段新增专用组件。
- 两页内容迁入 CMS，可由编辑器继续维护。
- 保持现有首页、页面编辑器、发布流程不受影响。

## 3. 非目标

- 不追求旧页面像素级复刻；视觉适配当前玫红设计系统。
- 不新增通用富文本编辑能力。
- 不改发布流程、静态生成结构或站点菜单。
- 不自动发布迁移页面；迁移后保持草稿，人工预览后再发布。
- 不重做页面编辑器的整体布局。

## 4. 组件命名

| 显示名称 | 技术名 | 类型 | 本次用途 |
|---|---|---|---|
| 信息列表 | `infoList` | 新增内容组件 | 项目待遇、项目要求、师资列表 |
| 图标列表 | `iconList` | 新增内容组件 | 核心优势、申请流程 |
| 横向滚动 | `hscroll` | 新增布局容器 | 中惠历程 |
| 纵向容器 | `stack` | 新增布局容器 | 公司介绍右列 |
| 网格 | `grid` | 扩展现有 | 公司介绍、创始团队 |
| 文本 | `text` | 扩展现有 | 中惠理念 |
| 图文卡片 | `imageText` | 扩展现有 | 创始团队、横向滚动子项 |

## 5. 组件设计

### 5.1 信息列表 `infoList`

**字段**

```ts
items: {
  label: string      // 可选，标签/年份/姓名
  desc: string       // 说明，必填
}[]
showDots: boolean   // 默认 true
```

**渲染**

- 白色卡片承托，条目之间使用细虚线分隔。
- `showDots=true`：玫红圆点 + 标签 + 说明。
- `showDots=false`：不显示圆点；标签为空时只渲染说明。
- 标签存在时使用品牌深玫红强调，说明使用正文色。
- 标题由同级 `heading` 组件提供。

**用途**

- 项目待遇、项目要求：显示圆点，标签为“食宿/薪水/年龄”等。
- 师资列表：关闭圆点，标签留空，仅显示每条说明。

### 5.2 图标列表 `iconList`

**字段**

```ts
items: {
  icon: string       // 媒体 URL / ID
  title: string
  desc: string
}[]
iconPosition: 'left' | 'right' | 'alternate'
iconColor?: string   // 可选，用于单色蒙版着色
```

**渲染**

- 每个条目为一行卡片：圆形图标节点 + 标题 + 说明。
- `iconPosition=left/right` 控制图标方向；`alternate` 按条目奇偶交替。
- 图标使用媒体库上传；设置 `iconColor` 时用 CSS mask 着色，与现有图标卡片一致。
- 移动端始终图标在左，避免窄屏左右交替造成阅读跳动。
- 标题由同级 `heading` 组件提供。

### 5.3 横向滚动 `hscroll`

**定位**

布局容器，不是内容组件。只负责横向浏览和卡片排列，内部直接使用现有 `imageText`。

**字段**

```ts
timeline: boolean // 默认 false，是否显示连接线
```

**子组件**

- 首版只允许 `imageText`。
- 编辑器结构：`section → hscroll → imageText ×N`。
- 不新增“年份、事件”等业务字段；年份使用图文卡片的标题，事件使用正文。

**渲染**

- 横向可滚动区域，鼠标按住拖动、触摸滑动、键盘方向键可滚动。
- 卡片固定宽度约 260px，图片高度固定，保证连接线对齐。
- `timeline=true` 时在图片下缘显示一条玫红到浅粉的渐变连接线。
- 卡片容器重置 `imageText` 外层 `.container` 的宽度和 padding。
- 移动端卡片宽度缩小，仍保持横向滚动。

### 5.4 纵向容器 `stack`

**定位**

布局容器，用于在一个网格单元格内纵向连续排列多个组件。网格负责列，`stack` 负责列内流。

**字段**

```ts
gap: 'sm' | 'md' | 'lg'
bgImage?: string
bgColor?: string
padding?: number
```

**子组件**

- 标题、文本、图片、图文卡片、图标卡片、按钮
- 不允许再嵌套布局容器

**渲染**

- `display:flex; flex-direction:column`；间距按 `gap`。
- 支持背景图片、背景色、内边距和 12px 圆角。
- 内部组件的 `.container` 重置为满宽、无额外 padding。
- 只允许放在 `grid` 单元格内。

### 5.5 网格 `grid` 扩展

**新增字段**

```ts
columnRatio: 'equal' | 'leftNarrow' | 'leftWide'
alignItems: 'stretch' | 'start' | 'center' | 'end'
```

- `alignItems` 默认 `stretch`，兼容现有页面；公司介绍使用 `start`。
- 列宽比例仅当 `columns=2` 时生效。
- `equal`：`1fr 1fr`（默认，兼容现有页面）。
- `leftNarrow`：左窄右宽，约 `0.9fr 1.4fr`。
- `leftWide`：左宽右窄，约 `1.4fr 0.9fr`。
- 其它列数忽略该字段。

### 5.6 文本 `text` 扩展

**新增字段**

```ts
fontSize?: number     // px，0/留空使用主题默认
fontWeight?: '400' | '600' | '700'
maxWidth?: number     // px，0/留空不限制
marginTop?: number    // px，段落/分组上间距
```

- 字号、字重作用于正文。
- 新内容采用“单段文本块”：只填正文，用字号/字重/颜色区分层级；`title` 字段保留兼容历史数据，新布局不再使用。
- 正文中的换行按实际换行渲染（`\n` → `<br/>`），用于调整段落高度。
- `maxWidth` 作用于整个文本块，配合居中实现窄版陈述。
- 不增加列表模式：师资列表改用 `infoList`。
- 理念区由两个连续文本实现：正文 + 高亮句（高亮句设置字重 600/700、品牌色、相同最大宽度）。

### 5.7 图片 `image` 扩展

```ts
aspectRatio: 'auto' | '1:1' | '4:3' | '3:4' | '16:9'
fit: 'cover' | 'contain'
```

- 用比例而不是固定高度控制图片，配合 `object-fit` 裁剪或完整显示。
- 参考 WordPress Media & Text 的裁剪/填充思路，避免为每张图片写死像素高度。
- 公司介绍图片使用 `4:3` + `cover`。

### 5.8 图文卡片 `imageText` 扩展

**新增字段**

```ts
subtitle?: string
subtitleColor?: string
```

- 渲染在标题和正文之间。
- 团队卡片：标题=姓名，副标题=职位，正文=简介。
- 留空时完全保持现有首页图文卡片效果。

## 6. 编辑器设计

### 6.1 通用重复项控件

`FieldDef.control` 新增 `'repeater'`：

```ts
interface RepeaterFieldDef {
  key: string
  label: string
  control: 'repeater'
  itemFields: Array<{
    key: string
    label: string
    control: 'text' | 'textarea' | 'media'
  }>
  addLabel?: string
}
```

**交互**

- 属性面板显示条目列表，每条为一个可展开/收起的小卡片。
- 支持新增、删除、上移、下移。
- 每条内嵌文本、多行文本或图片选择。
- 图片选择复用现有 `MediaModal`。
- 空列表显示提示和“添加第一条”。
- 条目字段不要求通用递归，只覆盖本次需要的三种控件。

**使用范围**

- `infoList.items`
- `iconList.items`

`hscroll` 不使用重复项控件，它使用子组件。

### 6.2 嵌套容器支持

把 `hscroll` 加入布局类型：

- `LAYOUT_TYPES = ['section', 'grid', 'hscroll']`
- `SECTION_CHILD_TYPES` 增加 `hscroll`
- `allowedChildTypes('hscroll') = ['imageText']`
- `allowedChildTypes('stack') = ['heading', 'text', 'image', 'imageText', 'iconCard', 'button']`
- `GRID_CHILD_TYPES` 增加 `stack`
- `isLayout`、`blockChildren`、路径查找/更新/删除/插入、`withIds`、`mapBlock` 都支持 `hscroll.children`。
- 结构树展示：分栏 → 横向滚动 → 图文卡片。

## 7. 两页拼装方案

### 7.1 关于中惠

| 顺序 | 分栏背景 | 内容 |
|---|---|---|
| 1 | 默认 | `banner` |
| 2 | 背景图 `bg2.jpg`，铺满整个分栏（bgHeight=0） | `heading` 公司介绍（白字） + `grid`（2 列，左窄右宽，顶部对齐：图片 4:3 + `stack`（白底、内边距 20、6 个单段文本）） |
| 3 | 默认 | `heading` 中惠历程 + `hscroll`（timeline=true，内部 14 个图文卡片） |
| 4 | 浅粉 | `heading` 中惠理念 + 两个连续 `text`（正文 + 高亮句） |
| 5 | 默认 | `heading` 创始团队 + `grid`（3 列：3 个图文卡片，副标题为职位） + `heading` 专业师资团队 + `infoList`（无圆点） |
| 6 | 浅粉 | `heading` 核心优势 + `iconList`（alternate） |

说明：公司介绍右列使用 `stack` 纵向容器；公司名称、介绍正文、两个小标题及说明均为单段 `text`，通过字号、字重、颜色和上间距形成层级。

### 7.2 美国互惠生

| 顺序 | 分栏背景 | 内容 |
|---|---|---|
| 1 | 默认 | `banner` |
| 2 | 背景图 | `heading` 项目待遇 + `infoList`（圆点开启） |
| 3 | 浅粉 | `heading` 项目要求 + `infoList`（圆点开启） |
| 4 | 浅粉 | `heading` 申请流程 + `iconList`（图标居左） |

## 8. 数据与迁移

### 8.1 页面

- 路由：`/about/`、`/aupair-usa/`
- 标题：关于中惠、美国互惠生
- 状态：`draft`，迁移后人工预览再发布
- 若页面已存在：按路由匹配并更新，脚本需幂等，避免重复创建

### 8.2 图片

- 迁移脚本按文件名匹配媒体库；缺失时从仓库 `img/` 上传。
- 需要的图片包括 `about-hero.jpg`、`company.jpg`、`founder-1/2/3.jpg`、`yinji-bg.jpg`、`bg2.jpg` 及历程用 `memory-*.{jpg,png}`。
- 图标列表使用媒体库 SVG；需要为申请流程补充 `compass/mic/contract/folder/home/check/passport/stamp/plane`，为核心优势补充 `layers/star`（其余复用现有 `badge/globe/network/safety`）。
- 上传以文件名为唯一匹配，重复执行不重复上传。

### 8.3 迁移脚本

新增 `cms/scripts/migrate-about-aupair.ts`：

- 通过 Payload Local API 读取/创建页面与媒体。
- 组装本设计的 block JSON。
- 保留旧页面文案，除排版微调外不改内容。
- 输出创建/更新结果；可重复执行。
- 不修改菜单，不自动发布，不触发构建。

## 9. 集成点

新增组件需要同时更新：

- `cms/src/blocks/`：Payload 字段定义、`index.ts` 注册
- `cms/src/render/types.ts`：Block 类型
- `cms/src/generate/loadSiteData.ts`：`mapBlock` 映射
- `cms/src/editor/blocks.ts`：编辑器元数据、默认值、子组件约束、摘要
- `cms/src/editor/AddChildPicker.tsx`：缩略图与名称
- `cms/src/editor/PropertyPanel.tsx`、`RepeaterControl.tsx`：重复项控件
- `cms/src/blocks/Stack.ts`：纵向容器
- `cms/src/editor/map.ts`：序列化
- `cms/src/editor/types.ts`：布局类型
- `cms/src/editor/state.ts`：嵌套容器路径
- `cms/src/site/blocks.tsx`：React 渲染
- `cms/src/render/styles/base.css`：组件样式
- `cms/src/render/styles/main.js`：横向拖动脚本
- 测试与迁移脚本

## 10. 验收标准

### 组件

- 信息列表可开/关圆点，标签留空时只显示说明。
- 图标列表支持左/右/交替；移动端回到图标居左。
- 横向滚动可鼠标拖动、触摸滑动、键盘滚动；内部图文卡片尺寸一致。
- 网格列宽比例只影响两列网格，旧页面保持等宽。
- 文本字号/字重/最大宽度生效；两个连续文本可组成理念区。
- 图文卡片副标题生效，旧卡片不填副标题时无变化。

### 编辑器

- 信息列表、图标列表可增删/排序条目，编辑图片。
- 可创建 `分栏 → 网格 → 纵向容器 → 文本 ×N` 结构，结构树、选中、删除、排序正常。
- 可创建 `分栏 → 横向滚动 → 图文卡片` 结构，结构树、选中、删除、排序正常。
- 保存后重新打开，条目和嵌套结构不丢失。

### 页面迁移

- `/about/`、`/aupair-usa/` 生成草稿页面，内容完整。
- 两页预览可正常渲染，移动端无横向溢出。
- 迁移脚本重复执行不产生重复页面或媒体。
- 不修改菜单、不自动发布。

### 质量

- `npx tsc --noEmit` 通过。
- 现有测试全部通过，并新增映射、渲染、编辑器控件测试。
- `npm run generate:importmap` 在注册新组件后执行。
- 生产构建验证通过。
