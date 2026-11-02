# 首页 Banner 改为「左文本 / 右图片」白底两栏 Hero

> **For agentic workers:** This is a design spec. Implementation follows via the writing-plans skill.

## Goal

将首页 `index.html` 的 Banner 从「居中文本 + 全幅图片背景」改为参考站 allianceabroad.com/programs/ 菜单下方的 hero 展示方式：**白底、两栏、左侧文本、右侧图片**、高度较高。

## 参考

参考站 hero 结构（allianceabroad.com/programs/ 菜单下方）：
- 一块白底两栏区域
- 左栏：大标题 (H2) + 副标题（span）
- 右栏：一张大图（旁边叠有绝对定位装饰图案，本设计不做装饰）

## 设计决策（已与用户确认）

| 项 | 决策 |
|---|---|
| 布局 | 白底两栏：左侧文本 / 右侧图片 |
| 背景 | 白色（不再用图片背景） |
| 左栏大标题 | 「工作、学习、生活三位一体」 |
| 左栏副标题 | 「专注国际文化交流」 |
| 右栏图片 | `img/banner-hero.jpg`（已下载至本地，597×546，正式使用） |
| 右栏图像尺寸 | 主图照片 **较大**，偏 **左下** 放置 |
| 右栏装饰 | 一个背景装饰块 **偏右上**，用 **`<img>` 引入 `img/pattern-box-5.svg`**（571×550，玫红 `#F35D5D` 底 + 图案，参考站同款），尺寸比主图**略小** |
| 布局 | 背景块右上、主图左下，**对角错开** |
| 装饰块响应式 | 仅桌面（>900px）显示，移动端单列时隐藏 |
| 高度 | 较高（min-height 520px，占更大 hero 区域） |

## 架构与组件

沿用现有 `shell(b, innerHtml)` + `banner(b)` 渲染器的配置驱动架构，仅改造 banner 渲染器与相应 CSS，不动其它区块。

### 1. Banner 渲染器（`renderers.banner`）

从「居中 cover」改为「container 内两栏 grid」：

```js
banner(b) {
  const c = b.data;
  const img = b.options.image || "";
  const pattern = b.options.pattern || "";
  let inner = `<div class="container banner-grid">
    <div class="banner-text">
      ${c.headline ? `<h1>${esc(c.headline)}</h1>` : ""}
      ${c.sub ? `<p class="sub">${esc(c.sub)}</p>` : ""}
    </div>
    ${img ? `<div class="banner-media">
      ${pattern ? `<img class="banner-pattern" src="${esc(pattern)}" alt="">` : ""}
      <img class="banner-photo" src="${esc(img)}" alt="${esc(c.headline || '中惠文化')}">
    </div>` : ""}
  </div>`;
  return shell(b, inner).replace("class=\"section", "class=\"banner section");
}
```

> 说明：banner 现在不再依赖 `options.bg` 作背景（白底）。右栏主图由 `options.image` 提供，背景装饰 SVG 由新增 `options.pattern` 提供（偏右上）。无图时不渲染 `.banner-media`；无 pattern 时只显示主图。

### 2. Banner 配置（`pageConfig.blocks[0]`）

```js
{ type: "banner",
  data: { headline: "工作、学习、生活三位一体", sub: "专注国际文化交流" },
  options: { image: "img/banner-hero.jpg", pattern: "img/pattern-box-5.svg" } },
```

- `data.headline` → 左栏大标题
- `data.sub` → 左栏副标题
- `options.image` → 右栏主图（左下）
- `options.pattern` → 右栏背景装饰 SVG（右上）
- 不再设置 `options.bg`（banner 白底）

### 3. CSS（`.banner*`）

重构 `.banner` 相关规则：

```css
.banner { position: relative; overflow: hidden; background: var(--white); padding: 0; }
.banner-grid { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 48px; min-height: 520px; }
.banner-text h1 { font-size: 48px; font-weight: 700; color: var(--deep-blue); line-height: 1.3; margin-bottom: 20px; }
.banner-text .sub { font-size: 24px; font-weight: 500; color: var(--gray-blue); }
/* 右栏：背景装饰块右上、主图左下，对角错开 */
.banner-media { position: relative; height: 520px; }
.banner-pattern { position: absolute; top: 0; right: 0; width: 60%; height: auto; display: block; }
.banner-photo { position: absolute; left: 0; bottom: 0; width: 78%; height: auto; display: block; }
```

- 删除旧 `.banner::before`（点阵背景，白底不需要）
- 删除旧 `.banner .cover*` 规则（不再使用，被 `.banner-text*` 取代）
- 响应式：`@media (max-width: 900px)` 下 `.banner-grid` 改为单列（图片在文本下方），且隐藏 `.banner-pattern`（移动端不显示装饰块）
- 布局方向：背景块 `top:0; right:0`（右上），主图 `left:0; bottom:0`（左下），对角错开

## 数据流

配置驱动不变：`pageConfig.blocks[0]` → `renderers.banner` → `shell` → DOM。右栏图路径在 `options.image`，无图时不渲染 `.banner-media`。

## 错误处理 / 边界

- `options.image` 缺失：右栏不渲染，banner 呈现为纯左文本（grid 仍两栏，右栏空）。可接受。
- 图片加载失败：`.banner-media img` 显示浏览器占位（alt 文本）。可接受。

## 验证

- 用 Playwright 打开 `http://127.0.0.1:8321/index.html`：
  - Banner 白底、两栏、左文本右图。
  - 右栏：背景装饰 SVG（`img/pattern-box-5.svg`）偏**右上**（略小），主图（`img/banner-hero.jpg`）偏**左下**（较大），对角错开。
  - 左栏「工作、学习、生活三位一体」深色大标题 + 副标题。
  - 无 JS 报错。
- 视口 1200px 宽下两栏并排、装饰块可见；缩窄至 ≤900px 时单列堆叠，且背景装饰块隐藏。
- 其余区块（project-grid 红带、advantage、memory-slider、story）无回归。