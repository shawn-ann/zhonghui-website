# 内容组件规则

本文档是 CMS 页面区块的唯一规则说明。新增组件、重构现有组件或编排页面时，必须遵循这里的结构、放置规则和渲染约定。

相关文档：

- 设计令牌与配色：`docs/design-system.md`
- 页面架构：`中惠门户网站架构文档.md`
- 管理后台视觉：`docs/superpowers/specs/2026-10-24-admin-shell-redesign-design.md`
- 内容组件设计：`docs/superpowers/specs/2026-10-27-content-components-design.md`

## 1. 核心原则

1. **分栏优先**：新页面使用 `section` 作为区块外壳，背景、垂直内边距和子项间距配置在分栏上。
2. **内容组件不负责页面背景**：内容组件只渲染自身内容，不带旧的 `bg` / `alt` 字段。
3. **结构性组件与内容组件分离**：布局容器负责排列，内容组件负责内容与排版。
4. **响应式优先于固定尺寸**：图片用比例 + `object-fit`，不写死高度；卡片高度由布局统一控制。
5. **编辑体验优先**：列表使用重复项手风琴控件；图片使用媒体库；链接使用内部页面/外部链接选择器。
6. **默认值可兼容**：新增字段必须有安全默认值，历史页面不配置时保持原样。
7. **组件命名通用**：按内容形态/布局命名，不使用 `milestone`、`team` 等业务专用名称。

## 2. 组件分类

### 2.1 布局容器

| 类型 | 显示名 | 作用 |
|---|---|---|
| `section` | 分栏 | 页面区块外壳，负责背景、垂直内边距、子项间距 |
| `grid` | 网格 | 2–4 列二维布局，负责列宽、列间距、垂直对齐 |
| `hscroll` | 横向滚动 | 横向拖动的卡片轨道，内部只放图文卡片 |
| `stack` | 纵向容器 | 纵向连续排列多个内容组件，可带背景/内边距 |

### 2.2 内容组件

| 类型 | 显示名 | 主要用途 |
|---|---|---|
| `banner` | 横幅 | 页面顶部主视觉 |
| `heading` | 标题 | 区块标题/副标题 |
| `text` | 文本 | 单段正文、段落组、陈述句 |
| `image` | 图片 | 独立图片，可设比例和链接 |
| `imageText` | 图文卡片 | 图片 + 标题/副标题/描述 + 链接 |
| `iconCard` | 图标卡片 | 图标 + 标题 + 描述卡片 |
| `button` | 按钮 | 独立行动按钮 |
| `richtext` | 富文本 | Lexical 富文本内容 |
| `gallery` | 图集 | 图片网格 |
| `slider` | 轮播 | 图片轮播 |
| `infoList` | 信息列表 | 标签/说明条目列表 |
| `iconList` | 图标列表 | 图标/标题/说明列表 |

## 3. 放置规则

### 3.1 分栏 `section`

允许的直接子组件：

```text
heading, text, grid, gallery, banner, slider, richtext,
infoList, iconList, hscroll, stack
```

规则：

- 新页面优先使用 `section` 包裹所有区块。
- 背景、垂直内边距、子项间距只能配置在分栏上。
- 一个分栏通常包含一个标题 + 一个主要内容组件。
- 需要多个内容组连续排列时，使用 `contentGap` 统一间距。

### 3.2 网格 `grid`

允许的子组件：

```text
heading, text, image, imageText, iconCard, button, stack
```

- `columns` 范围 1–4，默认 3。
- `columnRatio` 仅在 `columns=2` 时生效：`equal` / `leftNarrow` / `leftWide`。
- `alignItems`：`stretch`（默认）/ `start` / `center` / `end`。
- 网格单元格内的视觉卡片由子组件自己负责，网格不设置卡片高度。

### 3.3 横向滚动 `hscroll`

允许的子组件：

```text
imageText
```

- 只负责横向轨道、拖动和可选时间轴连接线。
- 卡片内容全部由 `imageText` 提供，不新增年份、事件等专用字段。
- 卡片宽度固定，由 CSS 统一；图片高度固定，卡片使用 flex stretch 等高。
- 时间轴连接线位于图片下缘。

### 3.4 纵向容器 `stack`

允许的子组件：

```text
heading, text, image, imageText, iconCard, button, gallery, richtext
```

- 可用于分栏直接子项，也可用于网格单元格。
- 不再嵌套布局容器（不允许 stack 内放 grid/section/hscroll/stack）。
- `gap`：`sm` / `md` / `lg`。
- 支持背景图片、背景颜色、内边距，固定 12px 圆角。
- 外层必须使用 `.container.stack-shell`；网格内由 CSS 重置该外壳的宽度和 padding，避免双重内边距。

### 3.5 顶层

`pageBlocks` 允许所有组件作为顶层，但这主要用于历史数据兼容。

新页面必须使用：

```text
分栏（section）
```

不要直接添加顶层内容组件绕过分栏。

## 4. 通用字段规则

### 4.1 背景与间距

- 分栏背景字段：`bgImage`、`bgColor`、`bgGradient`。
- `bgHeight > 0`：背景只铺顶部固定高度，形成色带；`0`/空：铺满分栏。
- `paddingY`预设：`none=0`、`sm=32`、`md=72`、`lg=96`、`xl=128`、`2xl=160`。
- `paddingCustom > 0` 时覆盖 `paddingY`。
- `contentGap > 0` 时，分栏直接子项使用纵向 flex gap；首个标题的默认下边距归零，避免叠加。
- 内容组件不再配置页面级背景；旧的 `bg`/`alt` 字段仅为历史兼容，隐藏且不渲染。

### 4.2 文本

- 新内容使用“单段文本块”：`body` 只放一段文字。
- 标题层级优先使用字号、字重、颜色、`marginTop`，不要滥用 `title`。
- `title` 字段保留历史兼容；新布局通常留空。
- `body` 中的 `\n` 渲染为 `<br/>`。
- 字段：`fontSize`、`fontWeight`（400/600/700）、`maxWidth`、`marginTop`、`align`、`bodyColor`。
- 正文默认继承文本块字号/字重，颜色使用 `--sub-color` 变量。

### 4.3 图片

- 内容图片通过媒体库上传；背景图片统一保存为媒体 URL 字符串。
- 独立图片 `image`：
  - `aspectRatio`：`auto` / `1:1` / `4:3` / `3:4` / `16:9`
  - `fit`：`cover` / `contain`
- 图文卡片 `imageText`：`imageRatio` 同上；默认沿用 CSS 的 4:3。
- 不在组件里写死固定像素高度；需要裁剪时使用比例 + `cover`。
- 媒体 URL 由 `mapBlock` 的 `resolveMedia` 解析。

### 4.4 链接

两种链接模型：

所有内容链接统一使用页面关系模型：

- `linkType`：`none` / `internal` / `external`
- `internalPage`：页面关系，静态生成时解析为页面 `route`
- `externalUrl`：外链
- 隐藏字段 `link` 仅用于兼容旧数据

适用于 `image`、`imageText`、`iconCard`、`button`。

规则：站内链接必须保存页面 ID，不能把 `.html` 路由写进内容。

### 4.5 颜色

- 组件颜色优先使用主题变量：
  - `--deep-blue`（标题）
  - `--bright-blue`（链接/强调）
  - `--accent`（图标/装饰）
  - `--dark-text` / `--gray-blue`（正文/次要文字）
- 组件可选颜色字段只覆盖局部内容，不改变全局主题。
- 不要在组件里写死与设计系统不一致的颜色。

### 4.6 图标

- 中惠优势等图标使用媒体库 SVG，支持 `iconColor` 时用 CSS mask 着色。
- 图标组件不要依赖硬编码 SVG key；新增内容通过媒体库上传。
- 迁移脚本可批量生成/上传 SVG，但仍以媒体库为最终来源。

## 5. 组件字段清单

### 5.1 分栏 `section`

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `bgImage` | text | 空 | 背景图 URL |
| `bgColor` | text | 空 | 背景色 |
| `bgGradient` | text | 空 | CSS 渐变 |
| `bgHeight` | number | 0 | 背景带高度；0 为铺满 |
| `paddingY` | select | `md` | none/sm/md/lg/xl/2xl |
| `paddingCustom` | number | 0 | 自定义上下内边距，覆盖预设 |
| `contentGap` | number | 0 | 直接子项统一间距 |
| `children` | blocks | — | 见 3.1 |

### 5.2 网格 `grid`

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `columns` | number | 3 | 1–4 |
| `gap` | select | `md` | sm/md/lg |
| `columnRatio` | select | `equal` | 仅两列；equal/leftNarrow/leftWide |
| `alignItems` | select | `stretch` | stretch/start/center/end |
| `bgImage` | text | 空 | 网格背景图 |
| `bgColor` | text | 空 | 网格背景色 |
| `children` | blocks | — | 见 3.2 |

### 5.3 横向滚动 `hscroll`

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `timeline` | boolean | false | 时间轴连接线 |
| `children` | blocks | — | 仅 imageText |

### 5.4 纵向容器 `stack`

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `gap` | select | `md` | sm/md/lg |
| `bgImage` | text | 空 | 背景图 URL（媒体选择器写入） |
| `bgColor` | text | 空 | 背景色 |
| `padding` | number | 0 | 内边距 |
| `children` | blocks | — | 见 3.4 |

### 5.5 横幅 `banner`

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `variant` | select | `split` | split/centered |
| `title` / `sub` | text | 空 | 标题/副标题 |
| `titleColor` / `subColor` | text | 空 | 文字颜色 |
| `image` | upload | 空 | 配图 |
| `pattern` | upload | 空 | 装饰图 |

### 5.6 标题 `heading`

`title`、`subtitle`、`titleColor`、`subtitleColor`、`align`（center/left）。历史 `padding` 保留渲染兼容，不再出现在编辑器。

### 5.7 文本 `text`

`body`、`bodyColor`、`align`、`fontSize`、`fontWeight`、`maxWidth`、`marginTop`。历史 `title`/`titleColor` 不再出现在编辑器中，仅保留渲染兼容。

### 5.8 图片 `image`

`media`、`altText`、`linkType`/`internalPage`/`externalUrl`、`aspectRatio`、`fit`。

### 5.9 图文卡片 `imageText`

`media`、`title`、`subtitle`、`subtitleColor`、`desc`、`imageRatio`、`titleColor`、`descColor`、`linkType`/`internalPage`/`externalUrl`。历史 `padding` 保留渲染兼容。

### 5.10 图标卡片 `iconCard`

`icon`、`iconColor`、`title`、`desc`、`titleColor`、`descColor`、`bgImage`、`bgColor`、`linkType`/`internalPage`/`externalUrl`。

### 5.11 信息列表 `infoList`

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `title` | text | 空 | 可选卡片内标题 |
| `titleAlign` | select | left | left/center |
| `items` | repeater | — | label + desc |
| `showDots` | boolean | true | 显示圆点 |

### 5.12 图标列表 `iconList`

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `items` | repeater | — | icon + title + desc |
| `iconPosition` | select | left | left/right/alternate |
| `iconColor` | text | 空 | 单色蒙版颜色 |

### 5.13 其它

- `button`：`label`、`linkType`/`internalPage`/`externalUrl`、`style`
- `richtext`：`content`（Lexical JSON），通过编辑器弹窗编辑；历史 `padding` 保留兼容
- `gallery`：`images`、`columns`；历史 `padding` 保留兼容
- `slider`：`images`
- `gridInner`：历史兼容，编辑器不提供；序列化仍保留

## 6. 编辑器约定

### 6.1 重复项

`infoList` / `iconList` 使用统一手风琴控件：

- 默认只展开当前条目，其余折叠为摘要
- 行头：拖拽手柄、序号/缩略图、主标题、说明摘要、复制、删除、展开箭头
- 拖拽排序
- 删除前 `window.confirm`
- 新增后自动展开
- 底部显示条目总数
- 图片选择复用 `MediaModal`

实现文件：`cms/src/editor/RepeaterControl.tsx`。

### 6.2 属性面板

- 字段元数据集中定义在 `cms/src/editor/blocks.ts` 的 `BLOCKS`。
- 新控件必须同时实现：
  - `FieldDef.control` 类型
  - `PropertyPanel` 分支
  - 控件组件
  - 编辑器样式
- 图片字段统一走 `MediaControl` / `MediaModal`。
- 页面链接统一走 `PageLinkControl`，不要新增独立下拉。

### 6.3 结构树

- 布局容器通过 `isLayout` 判定。
- 所有布局容器必须出现在 `cms/src/editor/state.ts` 的：
  - `isContainer`
  - `withKids`
  - 路径插入/删除/更新逻辑
- 嵌套容器的 `children` 必须在 `map.ts` 的 `withIds` 中递归处理。

## 7. 数据流与渲染

```text
Payload block
  → mapBlock() 生成 PageDoc Block
  → blockNode() 渲染 React
  → renderDocument() 输出静态 HTML
```

新组件必须同时更新：

1. `cms/src/render/types.ts`：Block 类型
2. `cms/src/blocks/<Name>.ts`：Payload 字段
3. `cms/src/blocks/index.ts`：注册到 `pageBlocks` 和父容器
4. `cms/src/generate/loadSiteData.ts`：`mapBlock` 分支
5. `cms/src/editor/blocks.ts`：`BLOCKS` 元数据、默认值、`allowedChildTypes`、`blockSummary`
6. `cms/src/editor/map.ts`：`serializeBlock` 与递归
7. `cms/src/editor/state.ts`：若是布局容器，加入 `isContainer`
8. `cms/src/editor/AddChildPicker.tsx`：缩略图
9. `cms/src/site/blocks.tsx`：渲染组件与 `blockNode` 分支
10. `cms/src/render/styles/base.css`：组件样式
11. 测试：渲染、映射、编辑器元数据/控件
12. 执行 `npm run generate:types`，生产环境同步数据库 schema

## 8. 新增组件检查清单

- [ ] 组件名通用，不绑定单一业务
- [ ] 明确是布局容器还是内容组件
- [ ] 明确允许的父容器和子组件
- [ ] 所有字段有安全默认值
- [ ] 旧页面不配置新字段时行为不变
- [ ] 图片有比例/填充规则，不写死高度
- [ ] 文本换行可渲染
- [ ] 链接使用页面关系或简单链接的正确模型
- [ ] 添加编辑器缩略图和默认内容
- [ ] 添加结构树摘要
- [ ] 添加渲染测试、映射测试、编辑器测试
- [ ] `npx tsc --noEmit` 通过
- [ ] `npm test -- --run` 通过
- [ ] 在 1280px / 390px 预览
- [ ] 更新本文档

## 9. 重构规则

- 先确认现有页面是否依赖组件的 DOM/CSS，优先新增可选字段而不是改变默认行为。
- 不删除历史字段；用隐藏字段或兼容分支保留数据。
- 不直接改 `payload-types.ts`、`importMap.js` 等生成文件；通过命令生成。
- 涉及数据库 schema 的变更必须说明生产迁移方式。
- 组件 CSS 使用设计令牌；不要新增散落的硬编码颜色。
- 布局变化优先在 `section` / `grid` / `stack` 层解决，不要用空白单元格或负 margin 硬凑。
- 不要用 `!important` 解决局部布局问题，除非是覆盖 Payload 默认样式且已限定作用域。

## 10. 页面编排示例

### 关于中惠

```text
section(banner)
section(bgImage=bg2, bgHeight=0)
  heading(公司介绍, 白字)
  grid(2列, leftNarrow, start)
    image(4:3)
    stack(白底, padding=20)
      text(公司名称, 22/700)
      text(正文, 15)
      text(小标题, 17/600, marginTop=14)
      text(正文, 15)
      text(小标题, 17/600, marginTop=14)
      text(正文, 15)
section
  heading(中惠历程)
  hscroll(timeline=true)
    imageText ×14
section(bgColor=light-pink, paddingY=2xl)
  heading(中惠理念)
  text(正文, 16, maxWidth=760)
  text(高亮句, 16/600, maxWidth=760)
section(bgImage=yinji, contentGap=32)
  heading(创始团队)
  grid(3列, imageText ×3)
  infoList(无圆点, title=专业师资团队)
section(bgColor=light-pink)
  heading(核心优势)
  iconList(alternate)
```

### 美国互惠生

```text
section(banner)
section(bgImage=yinji) > heading + infoList
section(bgColor=light-pink) > heading + infoList
section(bgColor=light-pink) > heading + iconList(left)
```

### 海外留学

```text
section(banner)
section(bgImage=yinji)
  heading(白字)
  stack(白底, padding=40)
    text(小标题, 20/700, 无竖线)
    text(正文, 15)
    ...
section(bgColor=light-pink)
  heading(热门留学目的地)
  grid(3列, imageText, imageRatio=16:9 ×5)
```

### 新西兰留学

```text
section(banner)
section(bgColor=light-pink)
  stack(白底, padding=40)
    richtext(标题 + 介绍段落)
    gallery(3列, nz-1/2/3)
    richtext(三个小标题 + 段落)
    gallery(3列, nz-4/5/6)
    richtext(两个小标题 + 段落)
```

富文本编辑器以弹窗形式打开，支持粗体、斜体、下划线、H2/H3、正文、有序/无序列表、链接、撤销/重做。

## 11. 常见错误

- 在 `section` 里直接放旧式 `bg` 内容块：旧字段隐藏，不会生效。
- 用空白 grid 单元格承载多个元素：不会形成容器，内容会进入下一行。
- 给 stack 再套一个 stack：不允许。
- 在 hscroll 里放非 imageText：会被丢弃。
- 把站点路由写成 `.html`：静态站使用干净路由。
- 用固定高度图片替代比例：移动端会变形或溢出。
- 在组件里写死背景/颜色：破坏设计令牌。
- 修改生成文件而不是源文件：下次生成会丢失。
