# Banner 预制布局模板（layout 变体）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给首页 banner 块加 `options.layout`（`"split"` / `"centered"`）预制布局变体配置，渲染器按 layout 分派，CSS 按变体作用域拆分。

**Architecture:** 在 `index.html` 里：把现有 banner CSS 全部加 `.banner--split` 前缀（行为不变），新增 `.banner--centered` + `.cover`（历史居中版）；渲染器改成 `bannerLayouts` 映射按 `b.options.layout` 分派，外壳加 `banner banner--<layout>` 类；配置加 `layout:"split"`。仅改 `index.html`，不动其它区块。

**Tech Stack:** 原生 HTML + 内联 CSS + 原生 JS（无框架/测试运行器）。验证用本地 http 服务 + Playwright（opencode.json 已配 `@playwright/mcp`）。

**Spec:** `docs/superpowers/specs/2026-10-01-banner-layout-variants-design.md`

---

## 文件结构

唯一被修改的文件：`index.html`。涉及：
1. CSS `.banner*` 段（行 79–87）+ 响应式 `@media`（行 222–229）
2. `pageConfig.blocks[0]` banner 配置（行 300–303）
3. `renderers.banner`（行 383–399 区段）

---

### Task 1: CSS 按变体作用域拆分（`.banner--split` + 新增 `.banner--centered`）

**Files:**
- Modify: `index.html:80-87`（banner CSS）
- Modify: `index.html:222-229`（响应式）

- [ ] **Step 1: 把现有 banner CSS 全部加 `.banner--split` 前缀，并新增 `.banner--centered`**

把行 80–87 从：
```css
    .banner { position: relative; overflow: hidden; background: var(--white); padding: 0; }
    .banner-grid { display: flex; flex-direction: row; align-items: stretch; gap: 20px; padding: 60px 0 120px; }
    .banner-text { display: flex; flex-direction: column; justify-content: center; gap: 20px; flex: 1.25; padding-top: 20px; }
    .banner-text h1 { font-size: 48px; font-weight: 700; color: var(--deep-blue); line-height: 1.3; margin-bottom: 0; }
    .banner-text .sub { font-size: 24px; font-weight: 500; color: var(--gray-blue); }
    .banner-media { position: relative; flex: 1; min-height: 340px; }
    .banner-pattern { position: absolute; top: -45px; right: -10px; bottom: 17px; left: -10px; width: 80%; height: auto; display: block; z-index: 0; margin-left: auto; }
    .banner-photo { position: absolute; top: 0; left: 0; width: 88%; height: auto; display: block; z-index: 1; border-radius: 0; }
```
改为：
```css
    .banner { position: relative; overflow: hidden; background: var(--white); padding: 0; }
    .banner--split .banner-grid { display: flex; flex-direction: row; align-items: stretch; gap: 20px; padding: 60px 0 120px; }
    .banner--split .banner-text { display: flex; flex-direction: column; justify-content: center; gap: 20px; flex: 1.25; padding-top: 20px; }
    .banner--split .banner-text h1 { font-size: 48px; font-weight: 700; color: var(--deep-blue); line-height: 1.3; margin-bottom: 0; }
    .banner--split .banner-text .sub { font-size: 24px; font-weight: 500; color: var(--gray-blue); }
    .banner--split .banner-media { position: relative; flex: 1; min-height: 340px; }
    .banner--split .banner-pattern { position: absolute; top: -45px; right: -10px; bottom: 17px; left: -10px; width: 80%; height: auto; display: block; z-index: 0; margin-left: auto; }
    .banner--split .banner-photo { position: absolute; top: 0; left: 0; width: 88%; height: auto; display: block; z-index: 1; border-radius: 0; }
    .banner--centered { min-height: 420px; display: flex; align-items: center; justify-content: center; background-size: cover; background-position: center; }
    .banner--centered .cover { position: relative; z-index: 1; text-align: center; color: #fff; padding: 0 24px; }
    .banner--centered .cover h1 { font-size: 52px; font-weight: 700; letter-spacing: 4px; text-shadow: 0 2px 16px rgba(0,0,0,0.45); }
    .banner--centered .cover .sub { font-size: 40px; font-weight: 500; margin-top: 12px; letter-spacing: 2px; }
```

- [ ] **Step 2: 响应式规则加 `.banner--split` 前缀**

把行 222–229 的 `@media` 块从：
```css
    @media (max-width: 900px) {
      .story-grid, .footer-grid, .proj-grid, .adv-grid { grid-template-columns: 1fr; }
      .banner-grid { flex-direction: column; padding: 40px 0 60px; }
      .banner-text { justify-content: flex-start; padding-top: 0; }
      .banner-media { min-height: 0; position: relative; }
      .banner-photo { position: static; width: 100%; margin-top: 24px; }
      .banner-pattern { display: none; }
    }
```
改为：
```css
    @media (max-width: 900px) {
      .story-grid, .footer-grid, .proj-grid, .adv-grid { grid-template-columns: 1fr; }
      .banner--split .banner-grid { flex-direction: column; padding: 40px 0 60px; }
      .banner--split .banner-text { justify-content: flex-start; padding-top: 0; }
      .banner--split .banner-media { min-height: 0; position: relative; }
      .banner--split .banner-photo { position: static; width: 100%; margin-top: 24px; }
      .banner--split .banner-pattern { display: none; }
    }
```

- [ ] **Step 3: 验证 CSS 无语法错误、页面未破（此刻渲染器尚未加 `banner--split` 类，布局会短暂失效——这是预期的，Task 2 接上）**

Run: 启动 `python3 -m http.server 8321 --bind 127.0.0.1`（若已在跑则复用），Playwright 打开 `http://127.0.0.1:8321/index.html`。确认控制台无 CSS 解析报错。此步不验证视觉（Task 2 后统一验证）。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "refactor(index): scope banner css under --split variant, add --centered variant"
```

---

### Task 2: 渲染器按 layout 分派 + 配置加 `layout`

**Files:**
- Modify: `index.html:300-303`（配置）
- Modify: `index.html:383-399`（渲染器）

- [ ] **Step 1: banner 配置加 `layout: "split"`**

把 `pageConfig.blocks[0]`（行 300–303）从：
```js
      // ① Banner 块：可配背景（图或渐变色）与文案
      { type: "banner",
        data: { headline: "工作、学习、生活三位一体", sub: "专注国际文化交流" },
        options: { image: "img/banner-hero.jpg", pattern: "img/pattern-box-5.svg" } },
```
改为：
```js
      // ① Banner 块：options.layout 选预制布局变体（split / centered）
      { type: "banner",
        data: { headline: "工作、学习、生活三位一体", sub: "专注国际文化交流" },
        options: { layout: "split", image: "img/banner-hero.jpg", pattern: "img/pattern-box-5.svg" } },
```

- [ ] **Step 2: 重写 `renderers.banner` 为 layout 分派**

把 `renderers.banner`（行 384–399，含闭合 `},`）从：
```js
    banner(b) {
      const c = b.data;
      const img = b.options.image || "";
      const pattern = b.options.pattern || "";
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
      return shell(b, inner).replace("class=\"section", "class=\"banner section");
    },
```
改为：
```js
    banner(b) {
      const c = b.data;
      const layout = b.options.layout;
      if (layout === "centered") {
        const inner = `<div class="cover">
          ${c.headline ? `<h1>${esc(c.headline)}</h1>` : ""}
          ${c.sub ? `<div class="sub">${esc(c.sub)}</div>` : ""}
        </div>`;
        return shell(b, inner).replace("class=\"section", "class=\"banner banner--centered section");
      }
      const img = b.options.image || "";
      const pattern = b.options.pattern || "";
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
      return shell(b, inner).replace("class=\"section", "class=\"banner banner--split section");
    },
```
> `shell` 已内置读取 `b.options.bg`（通过 `bgStyle`），所以 `centered` 变体只需正常调用 `shell`，背景会自动注入到 `<section>`；再用 `.replace` 加 `banner banner--centered` 类即可。`split` 变体不用 `bg`。

- [ ] **Step 3: 验证 split 变体视觉不变**

Playwright 打开 `http://127.0.0.1:8321/index.html`（加随机参数强制刷新，如 `?v=lv1`）。执行：
```js
() => {
  const banner = document.querySelector('.banner');
  const grid = document.querySelector('.banner--split .banner-grid');
  const photo = document.querySelector('.banner--split .banner-photo');
  const pat = document.querySelector('.banner--split .banner-pattern');
  const mr = document.querySelector('.banner--split .banner-media').getBoundingClientRect();
  const hr = photo ? photo.getBoundingClientRect() : null;
  return {
    bannerClass: banner.className,
    hasSplitGrid: !!grid, flexDir: grid ? getComputedStyle(grid).flexDirection : null,
    padTop: grid ? getComputedStyle(grid).paddingTop : null,
    padBottom: grid ? getComputedStyle(grid).paddingBottom : null,
    hasPhoto: !!photo, hasPattern: !!pat,
    photoPct: hr ? Math.round(hr.width/mr.width*100) : null
  };
}
```
Expected: `bannerClass` = `"banner banner--split section"`、`hasSplitGrid:true`、`flexDir:"row"`、`padTop:"60px"`、`padBottom:"120px"`、`hasPhoto:true`、`hasPattern:true`、`photoPct:88`。控制台 0 报错。

- [ ] **Step 4: 验证 centered 变体（临时切换）**

临时把配置的 `options` 改为 `{ layout: "centered", bg: "img/brand.png" }`，刷新页面执行：
```js
() => {
  const banner = document.querySelector('.banner');
  const cover = document.querySelector('.banner--centered .cover');
  const h1 = cover ? cover.querySelector('h1') : null;
  const cs = getComputedStyle(banner);
  return {
    bannerClass: banner.className,
    backgroundImage: cs.backgroundImage,
    display: cs.display, justifyContent: cs.justifyContent, alignItems: cs.alignItems,
    coverColor: cover ? getComputedStyle(cover).color : null,
    h1: h1 ? h1.textContent : null
  };
}
```
Expected: `bannerClass` = `"banner banner--centered section"`；`backgroundImage` 含 `img/brand.png`；`display:"flex"`、`justifyContent:"center"`、`alignItems:"center"`；`coverColor` = 白色 `rgb(255, 255, 255)`；`h1` 文本正确。控制台 0 报错。
验证后**还原**配置为 `{ layout: "split", image: "img/banner-hero.jpg", pattern: "img/pattern-box-5.svg" }`。

- [ ] **Step 5: 验证响应式 + 其它区块无回归**

视口 800×1000，确认 `.banner--split .banner-grid` flex-direction 为 `column`、`.banner--split .banner-pattern` display `none`；`.banner--split .banner-photo` position `static`。滚到其它区块（project-grid / advantage / memory-slider / story）确认正常。
Run: `node --check` 提取内联 `<script>` 内容 → SYNTAX_OK。

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(index): banner layout variants — dispatch via options.layout (split/centered)"
```

---

## 自检（Self-Review）

**Spec coverage：**
- `options.layout` 必填、两变体 → Task 2 Step 1/2。✔
- `split` 读 image+pattern → Task 2 Step 2 split 分支。✔
- `centered` 读 bg（bgStyle）→ Task 2 Step 2 centered 分支（注入 `bgStyle(b.options.bg)`）。✔
- 渲染器按 layout 分派 → Task 2 Step 2。✔
- CSS 加 `.banner--split` 前缀（行为不变）+ 新增 `.banner--centered`/`.cover` → Task 1 Step 1。✔
- 响应式按变体限定 → Task 1 Step 2。✔
- 仅改 index.html → 两任务都只动 index.html。✔

**Placeholder scan：** 无 TBD/TODO；每步给完整代码与验证。✔

**Type/naming 一致性：** 变体类名 `banner--split` / `banner--centered` 与渲染器 `.replace` 输出、CSS 选择器、验证脚本一致；配置字段 `options.layout` / `image` / `pattern` / `bg` 一致。✔

**备注（非本计划范围）：** 仅 banner；其它块后续按同模式推广。