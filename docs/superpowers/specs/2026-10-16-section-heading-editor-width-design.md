# 分栏容器(section) + 标题组件(heading) + 画布宽度 设计文档

> 日期：2026-10-16
> 状态：待评审
> 父设计：`docs/superpowers/specs/2026-10-16-visual-editor-design.md`、`2026-10-14-cms-design.md`
> 前置：P2 区块系统、E2 画布编辑器（分支 `feat/cms-editor`）

---

## 1. 背景与目标

配置首页后暴露三个问题：
1. Banner 与定版不一致（缺装饰图案：SVG 无法进媒体库）。
2. 各分栏缺**标题**；图片高低不齐；希望有**通用"分栏包裹"**结构（背景 + 标题 + 列表）。
3. 画布/预览宽度过窄，触发手机布局。

目标：给编辑器加**通用分栏能力**并修正上述问题。

## 2. 已定决策

| 议题 | 结论 |
|---|---|
| 图案 | **转 PNG** 进媒体库（不放宽 SVG 上传） |
| 分栏结构 | **通用方案**：`section` 容器 + `heading` 组件 |
| section | 可设背景色/图/渐变 + **内边距预设**（`sm/md/lg` = 32/72/96px）；**不允许嵌套 section** |
| heading | 主标题 + 副标题 + 对齐；**副标题默认为空，为空不渲染**；在背景图 section 内**默认白字** |
| 画布宽度 | iframe 按**桌面宽度**（默认 1280）渲染 + CSS **缩放适配** + 顶栏**设备预设**（桌面/平板/手机） |

---

## 3. 架构：内容块 vs 容器块 + 包装规则

**问题**：当前每个区块（grid/text/banner…）自带 `<section class="section">` 外壳。若再引入 `section` 容器去"包一层背景"，会容器套容器、padding 翻倍。

**规则（本阶段引入）**：
- **区块渲染器只产出"内部内容"**（不再自带 `<section>`）。
  - 内容块（`heading/text/image/imageText/button/richtext/gallery`）→ 输出 `.container` + 内容。
  - 容器块：
    - `grid` → 输出 `.container` + `.grid`（内部递归子组件，同样只输出内部内容）。
    - `slider` → 输出 `.container` + swiper 结构。
    - `section` → **唯一自带外壳的块**：输出 `<section class="section ...">` + 背景 + 内边距 + 子内容。
- **页面层自动包装**：`renderDocument` 对**顶层**区块逐个处理：
  - 若顶层块是 `section` → 直接用其外壳，不再额外包。
  - 否则 → 包一层 `<section class="section" style=bg() [class section-alt]>`（沿用旧 `shell` 语义），块的 `bg/alt` 生效。
- **容器内子块**：不包装（由容器提供背景/间距）；子块的 `bg/alt` 忽略。
- **banner**：本来自带复杂外壳（`.banner--split`），保留其专用外壳；作为顶层使用时等价于一个自带布局的 section（可视为特例，不再被外层透明包裹——即 banner 顶层同样"用其自身外壳"）。

> 结果：顶层观感与现状一致；`section > [heading, grid]` 可把标题与列表放进同一背景。

---

## 4. section 容器规格

字段：
- `bg`（text）：背景图路径/颜色/渐变（复用 `bgStyle`）。
- `padding`（select）：`none` / `sm` / `md`(默认) / `lg`（上下内边距预设，映射到 CSS `--sec-pad-*`）。
- `children`（blocks）：可放 `heading / text / image / imageText / button / richtext / gallery / grid / slider`（**不含 section/banner**，防无限嵌套）。

渲染：`<section class="section sec-pad-md" style=bg>` + 子内容（纵向堆叠）。背景图区块标题用白字（见 §6）。

---

## 5. heading 组件规格

字段：
- `title`（text）
- `subtitle`（text，**可选；为空不渲染**）
- `align`（select：`center`(默认) / `left`）

渲染：`.container` 内 `.section-heading`，居中/左对齐的 `h2` + （非空时）`p.subtitle`。
- 位于**背景图** section 内时，标题**默认白字**（见 §6）。

---

## 6. 渲染改动

- 各区块渲染器去掉自带 `<section>`（改输出内部内容），包装交由页面层/容器层（见 §3）。
- 新增 `heading`、`section` 渲染器。
- **背景感知标题**：当 `section` 使用背景图时，其子树内的标题（heading 的 h2、text 的 h2 等）用白字——通过渲染时为子树传入上下文（如 section 渲染器给子块包裹 `.on-image` 容器，或在包内加类），可先用 `.on-image .section-heading h2{color:#fff}` 之类的 CSS 规则实现。
- 现有 `title-on-image` 逻辑（generator 里 grid/slider 用白字标题）随新结构收敛。

---

## 7. 画布桌面宽度 + 设备预设

- 画布 iframe 逻辑宽度 = 设备预设：`desktop=1280`（默认）/ `tablet=768` / `mobile=390`。
- 面板宽度不足时用 CSS `transform: scale(k)`（`k = 可用宽 / 预设宽`，`transform-origin: top left`）缩放显示；容器高度按 `预设高 * k` 占位。
- 顶栏加**设备预设切换**（桌面/平板/手机）。
- 目的：画布所见贴近真实电脑端布局，同时不挤占面板。

---

## 8. 图案转 PNG

- 把 `img/pattern-box-5.svg` 转为 PNG（如 `pattern-box-5.png`），加入 `src/static/` 与媒体库（上传），供 banner `pattern` 选用。
- 转换方式：构建期用一次性命令（如 `rsvg-convert`/`sharp`）生成 PNG 并入库；仓库提交 PNG。

---

## 9. 首页重配置（更新 seed）

按新结构重建首页：
```
[
  banner(split, title, sub, image=hero, pattern=pattern-png),
  section(bg=bg2, padding=md, children=[
    heading(标题="项目一览"),
    grid(3列, cells=[imageText ×9])
  ]),
  section(bg=null?/light-pink via alt?, children=[
    heading("中惠优势"),
    grid(4列, cells=[text ×8])   // 图标仍留 P3
  ]),
  section(bg=yinji-bg, children=[
    heading("中惠印记"),
    slider(images=10)
  ])
]
```
（中惠优势的浅粉底：section 支持"纯色背景"或沿用 `alt`；此处用 section 背景色 `#FFF1F6`。）

---

## 10. 测试与验收

- 渲染单测：`heading`/`section` 输出；**包装规则**（顶层自动包 vs 容器内不包）；嵌套 `section→grid→imageText`。
- 序列化/映射：`section`(children)、`heading` 往返；编辑器属性面板/组件库含新块。
- 画布：设备预设改变 iframe 宽度与缩放；不触发手机布局（desktop 下）。
- 端到端：重建首页 → 生成 → 观感与定版一致（标题、背景、图案、图片等高）。
- `npm test` + `tsc` 绿。

## 11. 范围外

- 中惠优势的**图标**（留 P3）。
- 嵌套 section（不支持）。
- 集合/学生分享（P3）。
- 菜单/主题后台可配（延后）。

## 12. 已解决问题

1. `section` 也用于纯文本/图文等其它分栏（默认允许，`children` 已开放这些类型）。
2. `section` 内边距预设：`sm/md/lg = 32/72/96px`。
3. 背景图 section 的标题：**默认白字**；`heading.subtitle` 为空时不渲染副标题。
