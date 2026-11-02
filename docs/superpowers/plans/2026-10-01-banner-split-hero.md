# 首页 Banner 左文本/右图片白底两栏 Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把首页 `index.html` 的 Banner 从「居中文本 + 全幅图片背景」改为白底两栏 hero——左栏文本（大标题+副标题），右栏方形图片，高度较高。

**Architecture:** 完全沿用现有 `shell(b, innerHtml)` 配置驱动架构。只改 3 处：`renderers.banner`（产出 container 内两栏 grid）、`pageConfig.blocks[0]` 配置（`data.sub` + `options.image`，去掉 `options.bg`）、`.banner*` CSS（白底两栏，删除旧 cover/点阵背景）。图片 `img/banner-hero.jpg` 已下载，需随实现一起提交入库。

**Tech Stack:** 原生 HTML + 内联 CSS + 原生 JS（无框架/无测试运行器）。验证用本地 http 服务 + Playwright（opencode.json 已配 `@playwright/mcp`）。改动全部落在 `index.html`，另提交 1 张图片。

**Spec Reference:** `docs/superpowers/specs/2026-10-01-banner-split-hero-design.md`

---

## 文件结构

唯一被修改代码的文件：`index.html`。涉及三处：
1. CSS 段 `.banner*`（当前行 80–94）+ 响应式 `@media`（行 230）
2. `pageConfig.blocks[0]` Banner 配置（行 303–305）
3. `renderers.banner`（行 386–394）

另需新增提交：`img/banner-hero.jpg`（已存在于工作区，597×546，82KB，未入库）。

---

### Task 1: 重构 banner 渲染器与配置为两栏结构

**Files:**
- Modify: `index.html:303-305`（配置）
- Modify: `index.html:386-394`（渲染器）

- [ ] **Step 1: 改 Banner 配置——加副标题与右栏图，去掉 `options.bg`**

把 `pageConfig.blocks[0]`（行 303–305）从：
```js
      { type: "banner",
        data: { headline: "工作、学习、生活三位一体" },
        options: { bg: "img/brand.png" } },
```
改为：
```js
      { type: "banner",
        data: { headline: "工作、学习、生活三位一体", sub: "专注国际文化交流" },
        options: { image: "img/banner-hero.jpg" } },
```

- [ ] **Step 2: 重写 `renderers.banner` 产出两栏 grid**

把 `renderers.banner`（行 386–394）从：
```js
    banner(b) {
      const c = b.data;
      let inner = `<div class="cover">
        ${c.headline ? `<h1>${esc(c.headline)}</h1>` : ""}
        ${c.sub ? `<div class="sub">${esc(c.sub)}</div>` : ""}
        ${c.intro ? `<div class="intro">${esc(c.intro)}</div>` : ""}
      </div>`;
      return shell(b, inner).replace("class=\"section", "class=\"banner section");
    },
```
改为：
```js
    banner(b) {
      const c = b.data;
      const img = b.options.image || "";
      let inner = `<div class="container banner-grid">
        <div class="banner-text">
          ${c.headline ? `<h1>${esc(c.headline)}</h1>` : ""}
          ${c.sub ? `<p class="sub">${esc(c.sub)}</p>` : ""}
        </div>
        ${img ? `<div class="banner-media"><img src="${esc(img)}" alt="${esc(c.headline || '中惠文化')}"></div>` : ""}
      </div>`;
      return shell(b, inner).replace("class=\"section", "class=\"banner section");
    },
```
> 说明：banner 现在不依赖 `options.bg`（白底）。右栏图由 `options.image` 提供，无图时右栏不渲染。这与 spec 的边界处理一致。

- [ ] **Step 3: 验证**

启动本地服务 `python3 -m http.server 8321 --bind 127.0.0.1`。用 Playwright 打开 `http://127.0.0.1:8321/index.html`，执行：
```js
() => {
  const banner = document.querySelector('.banner');
  const text = document.querySelector('.banner-text');
  const media = document.querySelector('.banner-media');
  const img = document.querySelector('.banner-media img');
  return {
    bannerBg: getComputedStyle(banner).backgroundColor,
    hasText: !!text, textH1: text ? text.querySelector('h1').textContent : null,
    textSub: text ? text.querySelector('.sub').textContent : null,
    hasMedia: !!media, imgSrc: img ? img.getAttribute('src') : null
  };
}
```
Expected: `bannerBg` = `rgb(255, 255, 255)`（白底）、`hasText: true`、`textH1` = 「工作、学习、生活三位一体」、`textSub` = 「专注国际文化交流」、`hasMedia: true`、`imgSrc` = `img/banner-hero.jpg`。
另确认控制台 0 报错。

> 注意：此刻 CSS 尚未改（Task 2），两栏可能暂未成形，但结构/DOM 应正确。Task 2 完成后一并视觉验证。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(index): banner renderer/config → split two-column hero (text + image)"
```

---

### Task 2: 重写 banner CSS 为白底两栏，更新响应式

**Files:**
- Modify: `index.html:80-94`（banner CSS）
- Modify: `index.html:230`（响应式）

- [ ] **Step 1: 替换 `.banner*` 规则**

把行 80–94 整个 banner CSS 段：
```css
    .banner {
      height: 420px;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
      background-size: cover; background-position: center;
    }
    .banner::before {
      content: ""; position: absolute; inset: 0;
      background-image: radial-gradient(#ffffff22 1px, transparent 1px);
      background-size: 28px 28px;
    }
    .banner .cover { position: relative; z-index: 1; text-align: center; color: #fff; padding: 0 24px; }
    .banner .cover h1 { font-size: 52px; font-weight: 700; letter-spacing: 4px; text-shadow: 0 2px 16px rgba(0,0,0,0.45); }
    .banner .cover .sub { font-size: 40px; font-weight: 500; margin-top: 12px; letter-spacing: 2px; }
    .banner .cover .intro { font-size: 18px; margin-top: 24px; opacity: .9; }
```
替换为：
```css
    .banner { position: relative; overflow: hidden; background: var(--white); padding: 0; }
    .banner-grid { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 48px; min-height: 520px; }
    .banner-text h1 { font-size: 48px; font-weight: 700; color: var(--deep-blue); line-height: 1.3; margin-bottom: 20px; }
    .banner-text .sub { font-size: 24px; font-weight: 500; color: var(--gray-blue); }
    .banner-media img { display: block; width: 100%; height: auto; }
```

- [ ] **Step 2: 在 `@media (max-width: 900px)` 中让 banner 单列堆叠**

把行 230 的 `@media` 规则：
```css
    @media (max-width: 900px) {
      .story-grid, .footer-grid, .proj-grid, .adv-grid { grid-template-columns: 1fr; }
    }
```
改为：
```css
    @media (max-width: 900px) {
      .story-grid, .footer-grid, .proj-grid, .adv-grid, .banner-grid { grid-template-columns: 1fr; }
      .banner-grid { min-height: 0; }
    }
```

- [ ] **Step 3: 验证（视觉回归）**

用 Playwright 打开 `http://127.0.0.1:8321/index.html`，视口 1200×900。执行：
```js
() => {
  const g = document.querySelector('.banner-grid').getBoundingClientRect();
  const img = document.querySelector('.banner-media img');
  const r = img.getBoundingClientRect();
  const h1 = document.querySelector('.banner-text h1');
  const h1c = getComputedStyle(h1);
  return {
    bannerBg: getComputedStyle(document.querySelector('.banner')).backgroundColor,
    minHeight: Math.round(g.height),
    imgWidth: Math.round(r.width), imgHeight: Math.round(r.height),
    h1Color: h1c.color, h1Size: h1c.fontSize
  };
}
```
Expected: `bannerBg` = `rgb(255,255,255)`、`minHeight` ≥ 520、`imgWidth` ≈ 图宽且 > 文字栏、`h1Color` = 深藏青 `rgb(26,41,88)`、`h1Size` = `48px`。
再缩视口至 800×1000，确认 `.banner-grid` 变 `1fr` 单列（可用 evaluate 读 `getComputedStyle(document.querySelector('.banner-grid')).gridTemplateColumns`，Expected 为单列，即含一个值而非两个百分比）。
截全页图 `fullpage-banner-split.png`（该文件名已由 .gitignore 的 `full-home-*` 不覆盖——需确认不被忽略；用 `banner-split-*.png` 命名更稳妥，避免入库）。控制台 0 报错。

- [ ] **Step 4: Commit（连同图片一并入库）**

```bash
git add index.html img/banner-hero.jpg
git commit -m "feat(index): white two-column banner hero CSS + responsive stacking; add banner hero image"
```

---

## 自检（Self-Review）

**Spec coverage：**
- 白底两栏 → Task 2 `.banner { background: var(--white) }` + `.banner-grid { grid-template-columns: 1fr 1fr }`。✔
- 左栏大标题+副标题 → Task 1 `data.headline` + `data.sub` + `.banner-text`。✔
- 右栏方形图无装饰 → Task 2 `.banner-media img { width:100%; height:auto }`（无圆角）。✔
- 高度较高 → `.banner-grid { min-height: 520px }`。✔
- `options.bg` 不再用作 banner 背景 → Task 1 配置去掉 `options.bg`，渲染器不再读它。✔
- 配置驱动/不改其它区块 → 仅 banner 一处的渲染器/配置/CSS。✔
- 图片入库 → Task 2 Step 4 `git add img/banner-hero.jpg`。✔
- 响应式单列 → Task 2 Step 2 `@media` 加 `.banner-grid`。✔

**Placeholder scan：** 无 TBD/TODO；每步给完整代码与验证命令。✔

**Type/naming 一致性：** 渲染器读 `b.options.image`、`b.data.headline`、`b.data.sub`；配置与之一致。CSS 类浏览器为 `.banner`、`.banner-grid`、`.banner-text`、`.banner-media`，与渲染器产出的 class 逐一对应。✔

**备注（非本计划范围）：** 仅改 `index.html` 的 banner 部分；about/cases 等其它页面的 banner 样式不同步（独立任务若需要再补）。

---

### Task 3: 右栏调小照片，加玫红错开背景块（迭代）

> 背景：Task 1–2 交付的初版右栏是「照片撑满整栏、无装饰」。需求迭代为更贴近参考站 allianceabroad.com/programs/：照片 **不撑满**，约占右栏 2/3、偏右上；照片左下方错开一块 **玫红 `#FF007A`** 纯色背景块；块仅桌面（>900px）显示，移动端单列时隐藏。

**Files:**
- Modify: `index.html`（`renderers.banner` 的 `.banner-media` 结构 + `.banner*` CSS 的 `.banner-media` / 新增 `.banner-patch` + `@media`）

- [ ] **Step 1: 渲染器——在 `.banner-media` 内加玫红块 `.banner-patch`**

把 `renderers.banner`（当前约行 383–394）的 media 分支从：
```js
        ${img ? `<div class="banner-media"><img src="${esc(img)}" alt="${esc(c.headline || '中惠文化')}"></div>` : ""}
```
改为：
```js
        ${img ? `<div class="banner-media">
          <div class="banner-patch"></div>
          <img src="${esc(img)}" alt="${esc(c.headline || '中惠文化')}">
        </div>` : ""}
```

- [ ] **Step 2: CSS——照片缩小靠右上、玫红包左下错开、移动端隐藏块**

把 `.banner-media` 相关规则（当前约行 84）从：
```css
    .banner-media img { display: block; width: 100%; height: auto; }
```
改为：
```css
    .banner-media { position: relative; }
    .banner-patch { position: absolute; inset: auto 0 0 auto; width: 60%; height: 88%; background: #FF007A; }
    .banner-media img { position: relative; display: block; width: 78%; height: auto; margin-left: auto; }
```
> 设计意图：
> - `.banner-media` 相对定位作为照片/块的定位上下文。
> - `.banner-patch` 绝对定位在**右下角**（`inset: auto 0 0 auto` → 右下贴边），宽 60%、高 88%。因 `.banner-media` 高度由 `.banner-grid` 撑起（≥520px），块从底部往上占 88%，且左侧留出 40%——但照片靠右上后，照片的左下角处会露出一块玫红（块向右下延伸超出照片左下，形成错开）。
> - `.banner-media img` 宽 78%（约占栏 2/3），`margin-left:auto` 靠右。
> - 若视觉上块露出位置不符（照片左下是否被玫红块"咬"出一块），按 Playwright 实测微调 `inset`（如改为 `inset: auto 0 12px auto`）或 `width/height`。

- [ ] **Step 3: 响应式——移动端隐藏玫红包**

在 `@media (max-width: 900px)`（当前约行 218）里追加：
```css
      .banner-patch { display: none; }
```
（保留已有 `.banner-grid` 单列 + `min-height:0`。）

- [ ] **Step 4: 验证**

启动/复用本地服务，Playwright 打开 `http://127.0.0.1:8321/index.html`，视口 1200×900，执行：
```js
() => {
  const media = document.querySelector('.banner-media');
  const pr = media.getBoundingClientRect();
  const patch = document.querySelector('.banner-patch');
  const prP = patch.getBoundingClientRect();
  const imgEl = document.querySelector('.banner-media img');
  const prI = imgEl.getBoundingClientRect();
  const cs = getComputedStyle(patch);
  return {
    media: {w: Math.round(pr.width), h: Math.round(pr.height)},
    patch: {w: Math.round(prP.width), h: Math.round(prP.height), color: cs.backgroundColor,
            right: Math.round(pr.right - prP.right), bottom: Math.round(pr.bottom - prP.bottom),
            left: Math.round(prP.left - pr.left)},
    img: {w: Math.round(prI.width), h: Math.round(prI.height), rightGap: Math.round(pr.right - prI.right)}
  };
}
```
Expected：
- `media` ≈ 右栏 552px 宽左右。
- `patch.color` = `rgb(255, 0, 122)`（#FF007A）；`patch` 宽约 60%、高约 88%（约 331×458）；`right:0`、`bottom:0`（右下贴边），`left` ≈ 40%（露出部分在左）。
- `img` 宽约 78%（约 431px，占栏约 2/3），靠右（`rightGap:0` 或很小）。
- 玫红块相对照片错开：照片在右上，块向右下——照片左下角外侧可见玫红块。
再缩视口至 700×900，确认 `.banner-patch` computed `display` = `none`，且 `.banner-grid` 单列堆叠。
控制台 0 报错；`node --check` 提取内联 script → SYNTAX_OK；截全页图 `banner-split-v2.png`（不入库）。
若视觉错开不符预期，微调步 2 的 `inset`/`width`/`height` 后重验。

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(index): shrink banner media, add offset rose patch behind photo"
```
---

### Task 4: 右栏改为「SVG 装饰块右上 + 主图左下」对角错开（迭代）

> 背景：Task 3 的方向（玫红包左下、照片右上）与预期相反，需反转：**背景装饰块偏右上，主图偏左下**。同时背景块从纯色改为 **`<img>` 引入 `img/pattern-box-5.svg`**（参考站同款，571×550，玫红 `#F35D5D` 底+图案）。主图较大、装饰块略小。

**Files:**
- Modify: `index.html`（`renderers.banner` 的 `.banner-media` 结构 + `.banner*` CSS + `@media`）
- 新增入库：`img/pattern-box-5.svg`（已下载至工作区）

- [ ] **Step 1: 下载并确认 SVG 已就位**

确认 `img/pattern-box-5.svg` 存在（已下载，571×550）。若未在 img/ 下则用 `curl -sL -o img/pattern-box-5.svg "https://allianceabroad.com/wp-content/uploads/2023/08/Pattern-Box-5.svg"`。

- [ ] **Step 2: 更新 banner 配置——加 `options.pattern`**

`pageConfig.blocks[0]`（约行 303-305）改为：
```js
      { type: "banner",
        data: { headline: "工作、学习、生活三位一体", sub: "专注国际文化交流" },
        options: { image: "img/banner-hero.jpg", pattern: "img/pattern-box-5.svg" } },
```

- [ ] **Step 3: 改渲染器——背景 SVG 块 + 主图命名区分**

`renderers.banner` 的 `.banner-media` 内改为：
```js
        ${img ? `<div class="banner-media">
          ${pattern ? `<img class="banner-pattern" src="${esc(pattern)}" alt="">` : ""}
          <img class="banner-photo" src="${esc(img)}" alt="${esc(c.headline || '中惠文化')}">
        </div>` : ""}
```
对应的 `const` 声明加 `const pattern = b.options.pattern || "";`。

- [ ] **Step 4: CSS——装饰块右上、主图左下**

当前 banner media CSS（约行 84-86）改为：
```css
    .banner-media { position: relative; height: 520px; }
    .banner-pattern { position: absolute; top: 0; right: 0; width: 60%; height: auto; display: block; }
    .banner-photo { position: absolute; left: 0; bottom: 0; width: 78%; height: auto; display: block; }
```
> 设计意图：`.banner-media` 相对定位 + 固定高 520px（与 grid min-height 对齐，作为两图定位的公共坐标系）。`.banner-pattern` 锚右上（top:0;right:0），宽 60%（略小）；`.banner-photo` 锚左下（left:0;bottom:0），宽 78%（较大）。对角错开。若 SVG 在 60% 高下高度超 520，调整宽度或加 `max-height`。

`@media (max-width:900px)` 里把 `.banner-patch` 规则改为 `/ 或新增 / `.banner-pattern { display: none; }`（隐藏装饰块）。当前该 media 块内是 `.banner-patch { display:none; }`，需同步为 `.banner-pattern`（class 已改名）。

- [ ] **Step 5: 验证**

Playwright 打开 `http://127.0.0.1:8321/index.html`，视口 1200×900，执行：
```js
() => {
  const media = document.querySelector('.banner-media');
  const mr = media.getBoundingClientRect();
  const pat = document.querySelector('.banner-pattern');
  const pr = pat.getBoundingClientRect();
  const ph = document.querySelector('.banner-photo');
  const hr = ph.getBoundingClientRect();
  return {
    media: {w: Math.round(mr.width), h: Math.round(mr.height)},
    pattern: {src: pat.getAttribute('src'), left: Math.round(pr.left-mr.left), top: Math.round(pr.top-mr.top), w: Math.round(pr.width), h: Math.round(pr.height)},
    photo: {left: Math.round(hr.left-mr.left), bottom: Math.round(mr.bottom-hr.bottom), w: Math.round(hr.width), h: Math.round(hr.height)}
  };
}
```
Expected：`pattern` 在右上（left 较大、top≈0、width 较 photo 小）、src = `img/pattern-box-5.svg`；`photo` 在左下（left≈0、bottom≈0、width 78% 较大）。两者对角错开（pattern 左上高、photo 右下低）。
再缩视口 700×900，确认 `.banner-pattern` computed `display` = `none`，`.banner-grid` 单列。
控制台 0 报错；`node --check` → SYNTAX_OK；截全页图 `banner-split-v3.png`（不入库）。

- [ ] **Step 6: Commit（连同 SVG）**

```bash
git add index.html img/pattern-box-5.svg
git commit -m "feat(index): banner decor pattern top-right (SVG), main photo bottom-left diagonal offset"
```
