# 分栏内边距（四向）+ 内容块默认无内边距 设计文档

> 日期：2026-10-17
> 状态：待评审
> 前置：分栏/标题、画布编辑器（分支 `feat/cms-p1`）
> 关联：`docs/superpowers/specs/2026-10-16-editor-structure-tree-design.md`

---

## 1. 背景与目标

当前各处留白混写：分栏只有上下预设（0/32/72/96），左右固定 24（来自 `.container`）；横幅上下写死 60/120；轮播 swiper 写死 24/44；标题下间距 44；且分栏不支持左右、不支持非对称。

目标：**统一为"外层分栏控制留白，内容组件默认无内边距（可选手动加）"**：
- 分栏留白支持**上/下/左/右四向**、可设数值（能还原定版上60/下120）。
- 横幅/轮播改为**纯内容块**，上下留白交给外层 `section`（横幅允许放进 section）。
- **内在间距**保留、不交给 section：轮播 swiper 的 24/44（3D 封面流所需）、标题的底部 44（标题与后续内容的间距）。
- 内容组件可设置可选内边距，**默认 0**。

## 2. 概念划分

| 概念 | 归属 | 示例 |
|---|---|---|
| **外层留白**（分栏 padding） | `section` 四向数值 | 上 72 / 下 72 / 左 0 / 右 0 |
| **内在间距**（组件自身，不可配或后续可配） | 组件 | 轮播 swiper 24/44；标题下 44 |
| **内容内边距**（可选，默认 0） | 内容组件 | 图文卡片内边距 |
| **基础左右留白 24** | `.container`（全站统一） | 内容居中宽度 1200 + 左右 24 |

> 说明：`.container` 已提供左右 24 的基础留白；因此 `section` 的左/右留白是**额外**的（默认 0），仅影响窄视口时的额外内缩，不改变宽屏 1200 居中。

## 3. 分栏（section）四向留白

字段（Payload `section`）：
- `paddingTop`（number，默认 **72**）
- `paddingRight`（number，默认 **0**）
- `paddingBottom`（number，默认 **72**）
- `paddingLeft`（number，默认 **0**）

渲染：`<section class="section" style="padding: {top}px {right}px {bottom}px {left}px">`
- 移除 `sec-pad-*` 类的依赖（保留 CSS 或删除）。
- 关闭 `section` 的既有 `72px 0` 内联覆盖（inline 优先）。

编辑器（属性面板）：四向各一个**数值输入 + 快速预设**（0 / 16 / 24 / 32 / 48 / 60 / 72 / 96）。预设仅辅助填数值。

## 4. 横幅（banner）改为纯内容块

- 渲染器输出由 `<section class="banner ...">` 改为 **`<div class="banner ..." data-bid>`**（不再自带 section 外壳）。
- 移除 `.banner--split .banner-grid` 的 `padding: 60px 0 120px`（改由外层 section 提供）。
- `.banner--centered` 的 `min-height`（420）保留（内容自身高度）。
- `renderTop`：**SELF_WRAPPED 只保留 `section`**；banner 顶层时与其他内容块一样被自动包一层 `.section`（默认 72），放进 section 时则由该 section 提供留白。
- 允许 `banner` 作为 `section` 的子项（放开 `sectionChildren`）。

定版还原：首页 banner 包进 section，设 `paddingTop=60, paddingBottom=120, paddingLeft=0, paddingRight=0`。

## 5. 轮播（slider）与标题（heading）的内在间距

- **slider**：`.memory-slider .swiper { padding: 24px 0 44px }` **保留**（封面流放大/裁切所需），不纳入 section 留白。
- **heading**：`.section-heading { margin-bottom: 44px }` **保留**（标题与后续内容的间距）。

## 6. 内容组件可选内边距（默认 0）

- 为内容组件增加可选 `padding`（number，px，默认 **0**）。
- 渲染时若 `padding > 0`，在其**内容元素**上加内边距（如 `.text-block` / `.image-block` / `.image-text` / `.button-block` / `.gallery` / `.richtext` / `.section-heading`），**不影响 `.container` 的居中与 24 留白**。
- 属性面板：内容组件显示"内边距"数值输入（默认 0）。

## 7. 数据模型改动

- `SectionBlock`：`padding?: { top:number; right:number; bottom:number; left:number }`（渲染模型）；Payload 用四个 number 字段（或 group）。
- 内容块（`text/image/imageText/button/gallery/richtext/heading`）：`padding?: number`。
- `banner`：从"自包装"改为内容块；渲染模型不变（仍是 BannerBlock），只是输出 `div`。
- 映射/序列化：透传 padding；section 四向；banner 无外层 section。
- `sectionChildren` 增加 `banner`。

## 8. 首页重配置（seed）

```
section(padding: top60/right0/bottom120/left0, children=[ banner(split, ...) ])
section(padding: top72/right0/bottom72/left0, bg=bg2, children=[ heading(项目一览), grid(3列, children=9×imageText) ])
section(padding: top72/right0/bottom72/left0, bg=#FFF1F6, children=[ heading(中惠优势), grid(4列, children=8×text) ])
section(padding: top72/right0/bottom72/left0, bg=yinji-bg, children=[ heading(中惠印记), slider ])
```

## 9. 测试与验收

- 单测：section 四向 padding 输出 inline style；banner 输出 `div`（无外层 section）且被 `renderTop` 包裹；内容块 `padding>0` 时生效、默认不输出。
- 序列化/映射：section padding 四向往返；banner 结构不变。
- 端到端：首页生成后 banner 上 60 / 下 120（计算样式）；轮播封面流正常（24/44 保留）；标题下 44。
- `npm test` + `tsc` 绿。

## 10. 范围外

- 内容块的"四向"内边距（本期为统一单值）。
- 间距令牌系统（未来可演进）。
- 菜单/主题配置化、汉化、集合（父设既有阶段）。
