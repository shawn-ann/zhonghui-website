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
| 右栏图像尺寸 | 照片约占右栏 **2/3**，偏 **右上** 放置（不撑满整栏） |
| 右栏装饰 | 照片 **左下方错开** 一个 **玫红 `#FF007A`** 纯色背景块，露出一块（仿参考站 Pattern 相对照片错开的视觉） |
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
  let inner = `<div class="container banner-grid">
    <div class="banner-text">
      ${c.headline ? `<h1>${esc(c.headline)}</h1>` : ""}
      ${c.sub ? `<p class="sub">${esc(c.sub)}</p>` : ""}
    </div>
    ${img ? `<div class="banner-media">
      <div class="banner-patch"></div>
      <img src="${esc(img)}" alt="${esc(c.headline || '中惠文化')}">
    </div>` : ""}
  </div>`;
  return shell(b, inner).replace("class=\"section", "class=\"banner section");
}
```

> 说明：banner 现在不再依赖 `options.bg` 作背景（白底）。右栏图片由新增的 `options.image` 提供，并配一个玫红装饰块 `.banner-patch`（在图片左下方错开）。无图时不渲染 `.banner-media`。

### 2. Banner 配置（`pageConfig.blocks[0]`）

```js
{ type: "banner",
  data: { headline: "工作、学习、生活三位一体", sub: "专注国际文化交流" },
  options: { image: "img/banner-hero.jpg" } },
```

- `data.headline` → 左栏大标题
- `data.sub` → 左栏副标题
- `options.image` → 右栏图片
- 不再设置 `options.bg`（banner 白底）

### 3. CSS（`.banner*`）

重构 `.banner` 相关规则：

```css
.banner { position: relative; overflow: hidden; background: var(--white); padding: 0; }
.banner-grid { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 48px; min-height: 520px; }
.banner-text h1 { font-size: 48px; font-weight: 700; color: var(--deep-blue); line-height: 1.3; margin-bottom: 20px; }
.banner-text .sub { font-size: 24px; font-weight: 500; color: var(--gray-blue); }
/* 右栏：相对容器，照片约占 2/3 偏右上，玫红包在左下方错开 */
.banner-media { position: relative; }
.banner-patch { position: absolute; inset: auto 0 -26px auto; width: 84%; height: 100%; background: #FF007A; }
.banner-media img { position: relative; display: block; width: 78%; height: auto; margin-left: auto; }
```

- 删除旧 `.banner::before`（点阵背景，白底不需要）
- 删除旧 `.banner .cover*` 规则（不再使用，被 `.banner-text*` 取代）
- 响应式：`@media (max-width: 900px)` 下 `.banner-grid` 改为单列（图片在文本下方），且隐藏 `.banner-patch`（移动端不显示错开装饰块）

## 数据流

配置驱动不变：`pageConfig.blocks[0]` → `renderers.banner` → `shell` → DOM。右栏图路径在 `options.image`，无图时不渲染 `.banner-media`。

## 错误处理 / 边界

- `options.image` 缺失：右栏不渲染，banner 呈现为纯左文本（grid 仍两栏，右栏空）。可接受。
- 图片加载失败：`.banner-media img` 显示浏览器占位（alt 文本）。可接受。

## 验证

- 用 Playwright 打开 `http://127.0.0.1:8321/index.html`：
  - Banner 白底、两栏、左文本右图。
  - `img/banner-hero.jpg` 出现在右侧，约右栏 78% 宽、靠右上方，方形无圆角。
  - 玫红 `#FF007A` 纯色块在照片左下方错开露出（上方与右侧露出一段照片之外的玫红块）。
  - 左栏「工作、学习、生活三位一体」深色大标题 + 副标题。
  - 无 JS 报错。
- 视口 1200px 宽下两栏并排，玫红块可见；缩窄至 ≤900px 时单列堆叠，且玫红块隐藏。
- 其余区块（project-grid 红带、advantage、memory-slider、story）无回归。