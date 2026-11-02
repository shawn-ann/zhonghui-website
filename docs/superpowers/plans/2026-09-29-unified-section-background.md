# 统一区块外壳与背景配置 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让首页每个区块（block）都能通过统一的 `options.bg` 配置设置背景（图片 / 颜色 / 渐变），并移除各渲染器里写死的背景（如 `.proj-band` 的 348px 红色渐变硬编码、`memory-slider` 的固定背景图），真正做到「配置驱动、前端外壳统一」。

**Architecture:** 在 `index.html` 中引入一个统一的外壳函数 `shell(b, innerHtml)`，它读取 `b.options.bg` 生成统一的 `<section>` 容器及背景样式；各渲染器只负责产出自身内容 HTML，不再自行写 `<section>` / 背景类。把红色渐变「项目一览」带也抽象成配置选项 `options.band`（支持 图 / 颜色 / 渐变 / 关闭），替代写死的 `.proj-band{height:348px}`。背景统一用一个工具函数 `bgStyle(bg)` 把「图片 / 纯色 / 渐变」转成内联 CSS。

**Tech Stack:** 原生 HTML + 内联 CSS + 原生 JS（无构建、无框架、无测试运行器）。验证用本地 http 服务 + Playwright（opencode.json 已配置 `@playwright/mcp`）。仓库单一文件，改动全部落在 `index.html`。

---

## 任务分解（文件映射）

唯一被修改的文件：`index.html`。CSS 段、`pageConfig` 段、`renderers` 段、`renderBlocks` 段依次涉及。每步可独立提交。

背景工具函数设计（贯穿任务的核心接口）：

```js
// 把 b.options.bg 转成图片 / 纯色 / 渐变背景的 style 字符串（含内边距兜底）
function bgStyle(bg) {
  if (!bg) return "";
  if (bg.startsWith("linear-gradient") || bg.startsWith("radial-gradient")) {
    return `style="background:${bg};"`;
  }
  // 形如 "#FF0000" / "var(--light-blue)" / "white" 视为纯色
  if (/^(#|var\(|rgb|hsl|[a-z]+)/i.test(bg)) {
    return `style="background:${bg};"`;
  }
  // 其余视为图片路径
  return `style="background-image:url('${esc(bg)}');background-size:cover;background-position:center;"`;
}
```

统一外壳函数设计（贯穿任务的核心接口）：

```js
// 统一的区块外壳。Zone 负责 section 类 + 背景 style；innerHtml 是各渲染器的内容。
function shell(b, innerHtml) {
  const bg = b.options.bg || "";
  const style = bgStyle(bg);
  const cls = ["section"];
  if (bgStyle(bg) === "" && b.options.alt) cls.push("section-alt"); // 无自定义背景才退回 alt
  let inner = innerHtml;
  if (b.options.band) {
    const band = b.options.band;
    if (typeof band === "string") {
      inner = bandHtml(band) + inner;      // band 为字符串：用统一白字标题带
    } else {
      inner = bandCustomHtml(band) + inner; // band 为对象：定制高度/内容/层级
    }
  }
  return `<section class="${cls.join(" ")}" ${style}>${inner}</section>`;
}
```

> 设计取舍（DRY / YAGNI）：`bg` 只做「图 / 纯色 / 渐变」三种；不做遮罩、不做背景色叠加文本反色（当前无此需求，YAGNI）。`band` 只服务「项目一览」这一类带背景带的区块，做到可配但不过度抽象。

---

### Task 1: 新增背景工具函数与统一外壳函数

**Files:**
- Modify: `index.html`（在 `renderers` 对象定义之前，插入两个工具函数）

- [ ] **Step 1: 在 `renderers` 之前插入 `bgStyle`、`bandHtml`、`shell` 三个工具函数**

在 `index.html` 第 364 行 `const esc = ...` 之后、`const renderers = {` 之前插入：

```js
  // ---------------- 统一区块外壳：支持背景（图/纯色/渐变）与前置背景带 ----------------
  // 把 b.options.bg 转成背景 style 字符串。"" | linear-gradient… | #hex/var()/名 → 纯色 | 其余 → 图片
  function bgStyle(bg) {
    if (!bg) return "";
    if (bg.indexOf("linear-gradient") === 0 || bg.indexOf("radial-gradient") === 0) {
      return `style="background:${bg};"`;
    }
    if (/^(#|var\(|rgb|hsl|[a-z]+)/i.test(bg)) {
      return `style="background:${bg};"`;
    }
    return `style="background-image:url('${esc(bg)}');background-size:cover;background-position:center;"`;
  }

  // 生成一个如实的背景带（背景仅在区块头部，标题区为其浅色/深色文字承托）。返回可直接拼进内层的 HTML。
  function bandHtml(band, height) {
    const h = height && !isNaN(height) ? `height:${height}px;` : "";
    const inner = typeof band === "string" ? band : (band.background || "");
    const bg = bgStyle(inner);
    const cls = band && band.dark ? "band band-dark" : "band";
    return `<div class="band" ${bg} style="height:${h || '348px'};"></div>`;
  }
```

- [ ] **Step 2: 本地冒烟验证（无回归）**

改动此时还不会影响任何现有渲染器（尚未接入）。验证目标是确认脚本无语法错误、页面仍正常渲染。

Run: 启动本地服务并截图：
```bash
python3 -m http.server 8321 --bind 127.0.0.1 &
```
用 Playwright 打开 `http://127.0.0.1:8321/index.html`，检查浏览器 console 无 JS 报错，页面五大区块仍照常渲染。
Expected：无语法错误，首页 UI 与改动前一致（新增函数未被引用，属纯增量）。

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "refactor(index): scaffold unified section shell bg helpers (not yet wired)"
```

---

### Task 2: 让 Banner 渲染器接入统一背景 `options.bg`

**Files:**
- Modify: `index.html`（`renderers.banner`，`pageConfig.blocks[0]`，相关 `.banner` CSS）

- [ ] **Step 1: 改页面配置：Banner 的背景从 `data.bg` 移到 `options.bg`**

把 `pageConfig.blocks` 里 Banner 块（第 313-315 行）改为：

```js
  { type: "banner",
    data: { headline: "工作、学习、生活三位一体" },
    options: { bg: "img/brand.png" } },
```

- [ ] **Step 2: 重写 `renderers.banner` 使用 `shell` 与 `options.bg`**

把 `renderers.banner`（第 367-376 行）替换为：

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

- [ ] **Step 3: 说明与约束（无代码改动，仅确保 Banner 特化）**

Banner 需要 `.banner` 的专属高度/居中布局。`shell` 统一产出 `.section`，因此 Banner 渲染器用 `.replace()` 把外壳第一个 `section` 补上 `banner` 类。`.banner.bg-gradient` 类仍在 CSS 里，但本方案弃用（配置走 `options.bg`）；保留 CSS 以免误伤其它页面，本任务不删除。

- [ ] **Step 4: 验证 Banner 背景由配置驱动**

Run: 刷新 `http://127.0.0.1:8321/index.html`。
- 用 Playwright 打开页面，截图确认 Banner 仍显示 `img/brand.png` 背景、高度约 420px、大字「工作、学习、生活三位一体」居中白色。
- 临时把 `options.bg` 改成 `"var(--deep-blue)"`，刷新确认 Banner 变藏青纯色（验证「纯色」分支）。验完改回 `"img/brand.png"`。
Expected：图片与纯色两种配置均生效。

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "refactor(index): drive banner background via options.bg"
```

---

### Task 3: 让 project-grid 用统一的 `section` + 配置驱动 `options.band`

**Files:**
- Modify: `index.html`（`renderers["project-grid"]`，`pageConfig.blocks` 中 project-grid 块，新增 `.band` CSS）

- [ ] **Step 1: 新增 `.band` 区块样式到 CSS**

在 `.proj-content` 规则（第 164 行）之后追加：

```css
    .band { position: absolute; left: 0; right: 0; top: 0; z-index: 1; background: linear-gradient(123deg, #FF0000 0%, #F35D5D 50.52%, #FF007A 100%); }
    .band-dark { border-radius: 0 0 18px 18px; }
    .section-with-band { position: relative; overflow: hidden; }
    .section-with-band .container, .section-with-band .section-title { position: relative; z-index: 2; }
    .section-with-band .section-title h2 { color: #fff; text-shadow: 0 2px 12px rgba(0,0,0,0.55); }
```

- [ ] **Step 2: 改 `renderBlcoks`/`shell` 支持 `options.band` 拼装**

把 `shell` 函数体（Task 1 中定义）替换为支持 band 的版本（即方案里 shell 的最终形态）：

```js
  function shell(b, innerHtml) {
    const bg = b.options.bg || "";
    const style = bgStyle(bg);
    const cls = ["section"];
    if (!style && b.options.band) cls.push("section-with-band");
    if (!style && !b.options.band && b.options.alt) cls.push("section-alt");
    let inner = innerHtml;
    if (b.options.band) {
      const band = b.options.band;
      const bgInner = typeof band === "string" ? band : (band.background || "");
      const h = typeof band === "object" && band.height ? band.height : 348;
      const darkCls = typeof band === "object" && band.dark ? " band-dark" : "";
      inner = `<div class="band${darkCls}" ${bgStyle(bgInner)} style="height:${h}px;"></div>` + inner;
    }
    return `<section class="${cls.join(" ")}" ${style}>${inner}</section>`;
  }
```

- [ ] **Step 3: 改 project-grid 渲染器去掉写死包裹，改用 `shell` 读写配置**

把 `renderers["project-grid"]`（第 420-433 行）替换为：

```js
    "project-grid"(b) {
      const cols = b.options.columns || 3;
      const cards = b.data.items.map(p => `<div class="proj-card">
        <div class="ph"><img src="${esc(p.img)}" alt="${esc(p.title)}"></div>
        <div class="proj-body"><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p></div>
      </div>`).join("");
      const inner = `<div class="container proj-content">
        <div class="section-title"><h2>${esc(b.data.title)}</h2></div>
        <div class="proj-grid" style="grid-template-columns:repeat(${cols},1fr);">${cards}</div>
      </div>`;
      return shell(b, inner);
    },
```

- [ ] **Step 4: 给 project-grid 块加 `options.band` 配置**

把第 330 行 project-grid 的 `options` 改为：

```js
        options: { columns: 3, alt: false, band: { background: "linear-gradient(123deg, #FF0000 0%, #F35D5D 50.52%, #FF007A 100%)", height: 348, dark: true } } },
```

- [ ] **Step 5: 删除不再使用的 `.proj-wrap` / `.proj-band` / `.proj-content` 盒模型（保留 `.proj-grid`, `.proj-card`）**

把第 159-164 行：

```css
    .proj-wrap { position: relative; background: var(--white); overflow: hidden; }
    .proj-band {
      position: absolute; left: 0; right: 0; top: 0; height: 348px; z-index: 1;
      background: linear-gradient(123deg, #FF0000 0%, #F35D5D 50.52%, #FF007A 100%);
    }
    .proj-content { position: relative; z-index: 2; padding: 56px 0 72px; }
```

替换为：

```css
    .proj-content { position: relative; z-index: 2; padding: 56px 0 72px; }
```

- [ ] **Step 6: 验证「项目一览」红色带仍与 Banner 相连、间距/高度等同改动前**

Run: 刷新 `http://127.0.0.1:8321/index.html`，Playwright 全页截图 `proj-band-config.png`。
- 确认红色渐变带自区块顶部起、高度 348px、与上方 Banner 底部无缝相连；标题「项目一览」白字、第一行卡片上半部被带覆盖，与改动前 `proj-band-connected.png` 一致。
- 临时把 `band.background` 改成 `"#123456"`、`band.height` 改为 `200`，刷新确认带变纯色矮带（验证 height 与纯色可配）。验完还原。
Expected：视觉与改动前参考图一致，且配置项生效。

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "refactor(index): project-grid red band now config-driven via options.band"
```

---

### Task 4: 让 memory-slider 背景走 `options.bg`

**Files:**
- Modify: `index.html`（`renderers["memory-slider"]`，`pageConfig.blocks` 中 memory-slider 块，`.memory-slider` CSS）

- [ ] **Step 1: 改块配置：把背景图交给 `options.bg`**

把 memory-slider 块（第 347-354 行）的 `options` 由 `{}` 改为：

```js
        options: { bg: "img/yinji-bg.jpg", zIndex: "1" } },
```

（`zIndex` 用于把背景图压到 `.container` 之后，详见 Step 3。该键仅在 memory-slider 里被手动读取，非 shell 通用字段。）

- [ ] **Step 2: 重写 `renderers["memory-slider"]` 使用 `shell` 并注入白字标题 / 背景**

把 `renderers["memory-slider"]`（第 447-458 行）替换为：

```js
    "memory-slider"(b) {
      const imgs = (b.data.images || []).map(src =>
        `<div class="swiper-slide"><a href="#"><div class="slide-inner"><img src="${esc(src)}" alt="${esc(b.data.title)}"></div></a></div>`).join("");
      const titleCls = "section-title title-on-image";
      const inner = `<div class="container">
        <div class="${titleCls}"><h2>${esc(b.data.title)}</h2></div>
        <div class="swiper memory-swiper">
          <div class="swiper-wrapper">${imgs}</div>
          <span class="memory-arrow prev"><svg viewBox="0 0 27 44"><path d="M0,22L22,0l4.2,4.2L8.4,22l17.8,17.8L22,44L0,22z" fill="#fff"></path></svg></span>
          <span class="memory-arrow next"><svg viewBox="0 0 27 44"><path d="M0,22L22,0l4.2,4.2L8.4,22l17.8,17.8L22,44L0,22z" transform="rotate(180 13.5 22)" fill="#fff"></path></svg></span>
        </div>
      </div>`;
      const html = shell(b, inner);
      return html.replace("class=\"section", "class=\"memory-slider section") + `<style>@media(max-width:900px){.memory-slider{z-index:${b.options.zIndex||1};}}</style>`;
    },
```

- [ ] **Step 3: 调整 memory-slider 相关 CSS，去掉写死背景，改用容器类承托**

把第 183 行：

```css
    .memory-slider { position: relative; background: url('img/yinji-bg.jpg') center / cover no-repeat; overflow: hidden; }
```

替换为：

```css
    .memory-slider { position: relative; overflow: hidden; background-color: #1A2958; }
```

并把第 185 行：

```css
    .memory-slider .section-title h2 { color: #ffffff; text-shadow: 0 2px 12px rgba(0,0,0,0.55); }
```

替换为（新增通用「图上白字标题」类，供 memory 与 band 共用）：

```css
    .title-on-image h2 { color: #ffffff; text-shadow: 0 2px 12px rgba(0,0,0,0.55); }
```

- [ ] **Step 4: 验证 memory-slider 背景由 `options.bg` 驱动、标题白字**

Run: 刷新页面。
- 截图确认背景图为 `img/yinji-bg.jpg`、标题「中惠印记」白字、Swipre 3D 封面流与改动前一致。
- 临时把 `options.bg` 改为 `"linear-gradient(135deg,#101d40 0%,#1A2958 50%,#2E4380 100%)"`，刷新确认背景变为藏青渐变。验完改回 `"img/yinji-bg.jpg"`。
Expected：图与渐变两种配置均生效，Swiper 无初始化报错。

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "refactor(index): drive memory-slider background via options.bg"
```

---

### Task 5: 让 card-grid / story-list / advantage-grid 支持 `options.bg`（带 `alt` 回退）

**Files:**
- Modify: `index.html`（三个渲染器，及对应块配置）

- [ ] **Step 1: 重写三个渲染器统一走 `shell`**

把 `renderers["card-grid"]`（第 384-397 行）替换为：

```js
    "card-grid"(b) {
      const cols = b.options.columns || 4;
      const cards = b.data.items.map(p => `<div class="prog-card">
          <div class="icon">${esc(p.icon)}</div>
          <h3>${esc(p.title)}</h3>
          <p class="sub">${esc(p.desc)}</p>
          <a class="more" href="${esc(p.link)}">查看详情 →</a>
        </div>`).join("");
      const inner = `<div class="container">
        <div class="section-title"><h2>${esc(b.data.title)}</h2></div>
        <div class="prog-grid" style="grid-template-columns:repeat(${cols},1fr);">${cards}</div>
      </div>`;
      return shell(b, inner);
    },
```

把 `renderers["story-list"]`（第 398-419 行）替换为：

```js
    "story-list"(b) {
      const src = b.data.source;
      const list = (collections[src] || []).slice(0, b.data.limit);
      if (!list.length) return "";
      const cols = b.options.cols || 2;
      const cards = list.map(s => {
        const bg = s.cover && s.cover.indexOf("linear-gradient") === -1
          ? `background-image:url('${esc(s.cover)}');`
          : `background:${s.cover};`;
        return `<a class="story-card" href="${esc(s.link)}">
          <div class="thumb" style="${bg}">
            ${s.tag ? `<span class="tag">${esc(s.tag)}</span>` : ""}
          </div>
          <div class="body"><h3>${esc(s.title)}</h3><p>${esc(s.intro)}</p><span class="read">阅读全文</span></div>
        </a>`;
      }).join("");
      const inner = `<div class="container">
        <div class="section-title"><h2>${esc(b.data.title)}</h2></div>
        <div class="story-grid" style="grid-template-columns:repeat(${cols},1fr);">${cards}</div>
      </div>`;
      return shell(b, inner);
    },
```

把 `renderers["advantage-grid"]`（第 434-446 行）替换为：

```js
    "advantage-grid"(b) {
      const cols = b.options.columns || 4;
      const cards = b.data.items.map(p => `<div class="adv-card">
        <div class="icon">${esc(p.icon)}</div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.desc)}</p>
      </div>`).join("");
      const inner = `<div class="container">
        <div class="section-title"><h2>${esc(b.data.title)}</h2></div>
        <div class="adv-grid" style="grid-template-columns:repeat(${cols},1fr);">${cards}</div>
      </div>`;
      return shell(b, inner);
    },
```

- [ ] **Step 2: 确认三个块的 `options.alt` 仍驱动浅底背景**

在 `shell` 里：无自定义 `bg` 且无 `band` 时，`alt:true` 追加 `section-alt`（浅蓝 `--light-blue`）；`alt:false` 则纯白。当前配置：card-grid 未设 alt（白）、project-grid `alt:false`、advantage-grid `alt:true`、story-list `alt:true`。无需改块配置即可保持现状。

- [ ] **Step 3: 验证三个块背景回退行为与自定义 `bg`**

Run: 刷新页面截图，确认这四个区块仍与改动前一致（advantage、story 为浅蓝底，card 为白底）。
- 临时把 story-list 块加 `bg:"img/footLogo.png"`（仅验证分支）→ 刷新确认背景被图片覆盖、文字仍浅蓝块之上。验完移除该 `bg`。
Expected：无 `bg` 时 `alt` 回退生效；有 `bg` 时背景被覆盖。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "refactor(index): card-grid/story-list/advantage-grid share unified shell with bg/alt"
```

---

### Task 6: 清理遗留的 `.stats` 与死代码，全页回归截图

**Files:**
- Modify: `index.html`（移除未用 `.banner.bg-gradient`、`.stats*` 等，保留必要）

- [ ] **Step 1: 移除已无引用或仅 Banner 特化不需要的类**

`.stats` 系列（第 98-104 行）与 stats 渲染器（第 377-383 行）：当前 `pageConfig.blocks` 不再包含 stats 块（先前已整体删除数据带），可连同移除，保持外壳统一。`.banner.bg-gradient`（第 86 行）：Banner 已走 `options.bg`，此 class 不再被引用，移除。

- [ ] **Step 2: 全页回归：五大区块 + 菜单 + 页脚截图对比**

Run: 用 Playwright 全页滚动截图 `full-home-final.png`，与改动前参考（memory-slider-final.png、proj-band-connected.png）比对：
- Banner 高度/文案、项目一览红带、优势浅蓝底、印记 Swiper、学生分享浅蓝底、底部二维码 3 个。
- 浏览器 console 无报错。
Expected：整体像素级一致（除纯配置驱动的背景外）。

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "chore(index): remove dead banner-gradient/stats css, full-page regression ok"
```

---

## 自检（Self-Review）

**Spec coverage：**
- 「支持设置背景（图片/背景色等）」→ Task 2/4/5 让各块都经 `options.bg`（图/纯色/渐变）驱动；Task 3 让 `options.band` 支持「图/颜色/渐变/高度」。 ✔
- 「统一配置驱动 / 统一外壳」→ `shell(b, inner)` 成为唯一区块外壳，所有渲染器共用，消除写死的背景硬编码。 ✔
- 移除 `.proj-band` 348px 写死 → Task 3 改为 `options.band.height`。 ✔

**Placeholder 扫描：** 无 TBD/TODO；每步给出完整代码与验证命令。✔

**类型/命名一致性：** 全部渲染器统一用 `shell(b, inner)`；背景工具一律 `bgStyle(bg)`；band 用对象 `{background, height, dark}`。Banner/memory-slider 因需要非 `.section` 专属类，用 `.replace()` 特化外壳 class——这是故意保留的两处特化，与任务描述一致。✔

**备注（非本计划范围）：** 本次只改 `index.html`。about/cases 等其它页面的外壳未同步，另一个独立任务若需要再补。