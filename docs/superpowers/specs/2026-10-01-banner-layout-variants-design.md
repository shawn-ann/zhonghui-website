# Banner 预制布局模板（layout 变体）设计

> **For agentic workers:** This is a design spec. Implementation follows via the writing-plans skill.

## Goal

给首页 banner 块引入「预制布局模板」配置：通过 `options.layout` 选择一套预设计好的布局变体，而非开放裸像素参数。后端/内容运营只选风格（`split` / `centered`），不调像素，安全且好维护。本次只做 banner 一个块，机制跑通后再推广到其它块。

## 背景

当前 banner 已由 `pageConfig.blocks[0]` + `renderers.banner` + `shell` 完全内容驱动，但**布局参数写死在 CSS**（如 `.banner-photo{width:88%}`、`.banner-pattern{top:-45px}`、`.banner-grid{padding:60px 0 120px}`）。本设计把「长什么样」也变成配置——但采用**预制变体**而非裸参数（程度 B 的路线 2）。

## 设计决策

| 项 | 决策 |
|---|---|
| 范围 | 仅 `banner` 块；其它块保持现状 |
| 变体 | 两套：`split`（左文右图 + 装饰偏移）、`centered`（居中文本 + 全幅背景） |
| `layout` 字段 | **必填**，永远显式指定，无未设置情况；不做回退 |
| 分派 | 渲染器按 `options.layout` 选择变体函数 |
| 字段 | `split` 读 `image`+`pattern`；`centered` 读 `bg` |

## 1. 配置形态

```js
// 变体 split：左文右图 + 图案偏移
{ type: "banner",
  data: { headline: "工作、学习、生活三位一体", sub: "专注国际文化交流" },
  options: { layout: "split", image: "img/banner-hero.jpg", pattern: "img/pattern-box-5.svg" } }

// 变体 centered：居中文本 + 全幅背景
{ type: "banner",
  data: { headline: "...", sub: "..." },
  options: { layout: "centered", bg: "img/brand.png" } }
```

- `options.layout`: `"split"` | `"centered"`（必填）
- `split` → `options.image`（主图）、`options.pattern`（装饰 SVG）
- `centered` → `options.bg`（沿用 `bgStyle`，支持图片 / 渐变 / 纯色）
- `data.headline` / `data.sub` 两者共用

## 2. 渲染器结构

`renderers.banner` 按 `layout` 分派到变体函数：

```js
const bannerLayouts = {
  split(b) {
    const c = b.data, img = b.options.image || "", pattern = b.options.pattern || "";
    const inner = `<div class="container banner-grid">
      <div class="banner-text">
        ${c.headline ? `<h1>${esc(c.headline)}</h1>` : ""}
        ${c.sub ? `<p class="sub">${esc(c.sub)}</p>` : ""}
      </div>
      ${img ? `<div class="banner-media">
        ${pattern ? `<img class="banner-pattern" src="${esc(pattern)}" alt="">` : ""}
        <img class="banner-photo" src="${esc(img)}" alt="${esc(c.headline || '中惠文化')}">
      </div>` : ""}
    </div>`;
    return shell(b, inner).replace('class="section', 'class="banner banner--split section');
  },
  centered(b) {
    const c = b.data;
    const inner = `<div class="cover">
      ${c.headline ? `<h1>${esc(c.headline)}</h1>` : ""}
      ${c.sub ? `<div class="sub">${esc(c.sub)}</div>` : ""}
    </div>`;
    return shell(b, inner).replace('class="section', 'class="banner banner--centered section');
  }
};

renderers.banner = (b) => (bannerLayouts[b.options.layout] || bannerLayouts.split)(b);
```

要点：
- 每个变体产出自己的 `inner`，用 `.replace` 给外壳加 `banner banner--<layout>` 类。
- `centered` 的背景由 `bgStyle(b.options.bg)` 注入（复用现有工具，支持图/渐变/纯色）。
- **无回退逻辑**：`layout` 永远显式指定。（实现里的 `|| bannerLayouts.split` 仅作防御，正常配置不会触发。）

## 3. CSS 组织

CSS 按变体作用域拆分：

```css
/* 通用 */
.banner { position: relative; overflow: hidden; background: var(--white); padding: 0; }

/* 变体 split（左文右图）— 现有规则加 .banner--split 前缀，行为不变 */
.banner--split .banner-grid { display: flex; flex-direction: row; align-items: stretch; gap: 20px; padding: 60px 0 120px; }
.banner--split .banner-text { display: flex; flex-direction: column; justify-content: center; gap: 20px; flex: 1.25; padding-top: 20px; }
.banner--split .banner-text h1 { font-size: 48px; font-weight: 700; color: var(--deep-blue); line-height: 1.3; margin-bottom: 0; }
.banner--split .banner-text .sub { font-size: 24px; font-weight: 500; color: var(--gray-blue); }
.banner--split .banner-media { position: relative; flex: 1; min-height: 340px; }
.banner--split .banner-pattern { position: absolute; top: -45px; right: -10px; bottom: 17px; left: -10px; width: 80%; height: auto; display: block; z-index: 0; margin-left: auto; }
.banner--split .banner-photo { position: absolute; top: 0; left: 0; width: 88%; height: auto; display: block; z-index: 1; border-radius: 0; }

/* 变体 centered（居中 + 全幅背景）— 恢复历史版本样式 */
.banner--centered { min-height: 420px; display: flex; align-items: center; justify-content: center; background-size: cover; background-position: center; }
.banner--centered .cover { position: relative; z-index: 1; text-align: center; color: #fff; padding: 0 24px; }
.banner--centered .cover h1 { font-size: 52px; font-weight: 700; letter-spacing: 4px; text-shadow: 0 2px 16px rgba(0,0,0,0.45); }
.banner--centered .cover .sub { font-size: 40px; font-weight: 500; margin-top: 12px; letter-spacing: 2px; }
```

- 现有 `.banner-grid/.banner-text/.banner-photo/.banner-pattern` 全部加 `.banner--split` 前缀（选择器加限定，行为不变）。
- 新增 `.banner--centered` 及 `.cover` 样式（取历史居中版的数值：高度 420px、居中、白字、标题 52px/副标题 40px）。
- 现有 `@media (max-width:900px)` 内的 banner 规则同样按变体限定：
  ```css
  @media (max-width: 900px) {
    .banner--split .banner-grid { flex-direction: column; padding: 40px 0 60px; }
    .banner--split .banner-text { justify-content: flex-start; padding-top: 0; }
    .banner--split .banner-media { min-height: 0; position: relative; }
    .banner--split .banner-photo { position: static; width: 100%; margin-top: 24px; }
    .banner--split .banner-pattern { display: none; }
  }
  ```

## 数据流

不变：`pageConfig.blocks[0]` → `renderers.banner`（按 `layout` 分派）→ 变体函数 → `shell` → DOM。

## 边界

- `options.layout` 永远显式，无未设置情况（用户确认）。
- `split` 缺 `image`：右栏不渲染，仅左文本。
- `centered` 缺 `bg`：白底 + 居中文本（无背景图）。

## 验证

- Playwright 打开 `http://127.0.0.1:8321/index.html`：
  - 当前配置（`layout:"split"`）视觉与改动前完全一致（左文右图 + 图案偏移、88% 照片、行 padding 60/120）。
  - 临时把 `layout` 改成 `"centered"` + 加 `bg`，刷新确认切换为居中文本 + 全幅背景；验完还原。
  - 无 JS 报错。
- 移动端 ≤900px：`split` 单列堆叠、隐藏 pattern；`centered` 正常。
- 其它区块（project-grid/advantage/memory-slider/story）无回归。