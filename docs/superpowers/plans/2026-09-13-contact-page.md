# 联系我们页面（contact.html）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建 `contact.html`（联系方式/社交矩阵/二维码占位/免责声明），并将 7 个现有页面导航"联系我们"从 `#` 接通到该页。

**Architecture:** 沿用站点"配置化内容块"模式：单文件静态页，内联 CSS + JS，pageConfig.blocks 有序组合 banner / contact-info / social / qr / notice 五个块，各配独立渲染器；结构以 news.html 为模板（容器 1000px、banner 240px）。

**Tech Stack:** 纯 HTML/CSS/原生 JS，无构建工具、无测试框架、非 git 仓库（无提交步骤）。

**Spec:** `docs/superpowers/specs/2026-09-13-contact-page-design.md`

---

## 文件清单

| 操作 | 文件 | 职责 |
|------|------|------|
| Create | `contact.html` | 联系我们页（5 个内容块） |
| Modify | `index.html` `about.html` `project-swt.html` `cases.html` `case-detail.html` `news.html` `news-detail.html` | nav 中"联系我们"link 从 `#` 改为 `contact.html` |

---

### Task 1: 创建 contact.html

**Files:**
- Create: `contact.html`

- [ ] **Step 1: 写入完整文件**

创建 `contact.html`，内容如下（基础结构/CSS 变量/nav/footer 渲染器复制自 news.html；banner 高 240px；新增 contact/social/qr/notice 四个渲染器与配套样式；导航"联系我们" active）：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>联系我们 — 中惠文化</title>
  <style>
    :root {
      --deep-blue: #1A4B7A;
      --bright-blue: #4A90E2;
      --light-blue: #E5F0FA;
      --pale-blue: #D0E7F8;
      --gray-blue: #5A7A9A;
      --dark-text: #44546A;
      --white: #FFFFFF;
      --border: #E1E9F2;
      --orange: #EE822F;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, "PingFang SC", "Microsoft YaHei", "Source Han Sans SC", sans-serif;
      color: var(--dark-text);
      line-height: 1.6;
      background: var(--white);
    }
    a { text-decoration: none; color: inherit; }
    .container { max-width: 1000px; margin: 0 auto; padding: 0 24px; }

    /* ===== 顶部导航栏 ===== */
    header {
      background: linear-gradient(120deg, var(--deep-blue) 0%, #24598f 100%);
      position: sticky; top: 0; z-index: 100;
      box-shadow: 0 2px 10px rgba(26,75,122,0.25);
    }
    .nav { display: flex; align-items: center; justify-content: space-between; height: 68px; max-width: 1280px; margin: 0 auto; padding: 0 24px; }
    .logo img { display: block; height: 44px; width: auto; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35)); }
    .nav-menu { display: flex; list-style: none; gap: 28px; align-items: center; }
    .nav-menu > li { position: relative; }
    .nav-menu > li > a {
      font-size: 15px; color: #d7e6f5; font-weight: 500; padding: 6px 0;
      display: flex; align-items: center; gap: 4px; transition: color .2s;
    }
    .nav-menu > li > a:hover { color: #fff; }
    .nav-menu > li > a.active { color: #fff; }
    .nav-menu > li > a.active::after {
      content: ""; position: absolute; left: 0; right: 0; bottom: -2px;
      height: 3px; border-radius: 2px; background: var(--bright-blue);
    }
    .nav-menu .caret { font-size: 10px; opacity: .8; }
    .nav-menu .dropdown {
      position: absolute; top: 100%; left: -12px; min-width: 172px;
      background: var(--white); border-radius: 0 0 8px 8px;
      box-shadow: 0 10px 24px rgba(26,75,122,0.18); overflow: hidden;
      opacity: 0; visibility: hidden; transform: translateY(8px);
      transition: opacity .2s, transform .2s, visibility .2s;
      padding: 6px 0; z-index: 200;
    }
    .nav-menu > li:hover .dropdown,
    .nav-menu > li:focus-within .dropdown { opacity: 1; visibility: visible; transform: translateY(0); }
    .nav-menu .dropdown a {
      display: block; padding: 11px 20px; font-size: 14px; color: var(--deep-blue);
      transition: background .15s, color .15s; white-space: nowrap;
    }
    .nav-menu .dropdown a:hover { background: var(--light-blue); color: var(--bright-blue); }
    .nav-lang { font-size: 14px; color: #9db6cf; display: flex; gap: 6px; }
    .nav-lang .sep { color: #5a7a9a; }
    .nav-lang a { color: #9db6cf; }
    .nav-lang a:hover { color: #fff; }
    .nav-lang a.active { color: #fff; font-weight: 600; }

    /* ===== Banner ===== */
    .banner {
      height: 240px; display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden; background-size: cover; background-position: center;
    }
    .banner.bg-gradient { background: linear-gradient(135deg, #0e3d63 0%, #1A4B7A 50%, #3372b8 100%); }
    .banner::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(#ffffff22 1px, transparent 1px); background-size: 28px 28px; }
    .banner-note { position: relative; z-index: 1; color: rgba(255,255,255,.7); font-size: 15px; letter-spacing: 2px; padding: 8px 20px; border: 1px dashed rgba(255,255,255,.4); border-radius: 6px; }

    /* ===== 区块通用 ===== */
    .section { padding: 56px 0; }
    .section-title { text-align: center; margin-bottom: 36px; }
    .section-title h2 { font-size: 30px; color: var(--deep-blue); font-weight: 700; }
    .section-title .en { font-size: 13px; color: var(--gray-blue); letter-spacing: 3px; text-transform: uppercase; margin-top: 6px; }
    .section-title .en::before, .section-title .en::after { content: "—"; color: var(--bright-blue); margin: 0 10px; }

    /* ===== 联系方式卡片 ===== */
    .contact-card { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 8px 28px; }
    .contact-row { display: flex; align-items: baseline; padding: 16px 0; border-bottom: 1px dashed var(--border); font-size: 15px; }
    .contact-row:last-child { border-bottom: none; }
    .contact-row .icon { margin-right: 12px; }
    .contact-row .label { color: var(--gray-blue); width: 96px; flex-shrink: 0; }
    .contact-row .value { color: var(--dark-text); font-weight: 500; }

    /* ===== 社交媒体矩阵 ===== */
    .social-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; }
    .social-card {
      background: var(--white); border: 1px solid var(--border); border-radius: 12px;
      padding: 24px 12px; text-align: center; transition: transform .25s, box-shadow .25s;
    }
    .social-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(26,75,122,0.12); }
    .social-logo {
      width: 56px; height: 56px; border-radius: 14px; margin: 0 auto 12px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 24px; font-weight: 700;
    }
    .social-card .platform { font-size: 15px; color: var(--deep-blue); font-weight: 600; }
    .social-card .account { font-size: 13px; color: var(--gray-blue); margin-top: 6px; }

    /* ===== 二维码 ===== */
    .qr-box-large { display: flex; gap: 40px; justify-content: center; }
    .qr-large .qr {
      width: 150px; height: 150px; background: var(--white); border: 1px solid var(--border);
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      color: var(--deep-blue); font-size: 14px; text-align: center; padding: 10px; margin-bottom: 10px;
    }
    .qr-large p { font-size: 14px; color: var(--dark-text); text-align: center; }

    /* ===== 温馨提示 ===== */
    .notice-panel { background: var(--light-blue); border-left: 4px solid var(--bright-blue); border-radius: 6px; padding: 20px 26px; color: var(--deep-blue); }
    .notice-panel ol { margin-left: 20px; }
    .notice-panel li { margin-bottom: 8px; font-size: 15px; }
    .notice-panel li:last-child { margin-bottom: 0; }

    /* ===== 页脚 ===== */
    footer { background: var(--deep-blue); color: #cfdff0; }
    .footer-grid { max-width: 1280px; margin: 0 auto; padding: 56px 24px 32px; display: grid; grid-template-columns: 1.2fr 2fr 1fr; gap: 40px; }
    .footer-brand img { display: block; margin-bottom: 14px; height: 110px; width: auto; }
    .footer-brand .zh { font-size: 22px; font-weight: 700; color: #fff; }
    .footer-brand .en { font-size: 12px; letter-spacing: 2px; color: #9db6cf; margin-top: 4px; }
    .footer-info p { font-size: 14px; margin-bottom: 12px; color: #d7e6f5; }
    .footer-info .label { color: #9db6cf; margin-right: 8px; }
    .footer-copy { border-top: 1px solid rgba(255,255,255,.12); padding: 20px 24px; text-align: center; font-size: 13px; color: #9db6cf; }
    .footer-qr { text-align: center; }
    .footer-qr h4 { color: #fff; font-size: 16px; margin-bottom: 16px; }
    .qr-box { display: flex; gap: 16px; justify-content: center; }
    .qr-item .qr { width: 92px; height: 92px; background: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--deep-blue); font-size: 11px; text-align: center; padding: 6px; margin-bottom: 8px; }
    .qr-item p { font-size: 13px; color: #d7e6f5; }

    @media (max-width: 700px) {
      .social-grid { grid-template-columns: repeat(2, 1fr); }
      .footer-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

  <header id="site-header"></header>
  <main id="page"></main>
  <footer id="site-footer"></footer>

  <script>
  /* =========================================================
     CMS 配置化内容模型 —— 联系我们页
     块组合：banner → contact-info → social → qr → notice
     ========================================================= */

  const pageConfig = {
    title: "联系我们",
    nav: {
      logo: "img/logo.png",
      langCurrent: "中文", langOther: "EN",
      items: [
        { label: "首页", link: "index.html" },
        { label: "关于我们", link: "about.html", children: [
            { label: "公司介绍", link: "about.html#company" },
            { label: "中惠团队", link: "about.html#team" },
            { label: "核心优势", link: "about.html#advantage" } ] },
        { label: "项目介绍", link: "project-swt.html", children: [
            { label: "SWT 赴美带薪实习", link: "project-swt.html" },
            { label: "ITP 赴美专业实习", link: "#" },
            { label: "ICCP 赴美营地辅导员", link: "#" },
            { label: "Au Pair 赴美互惠生", link: "#" } ] },
        { label: "案例分享", link: "cases.html" },
        { label: "资讯中心", link: "news.html" },
        { label: "联系我们", link: "contact.html", active: true }
      ]
    },
    footer: {
      logo: "img/footLogo.png",
      info: [
        { label: "📍 地址：", text: "北京东城区绿景馨园东区12号楼" },
        { label: "📞 电话：", text: "010-64159286" },
        { label: "✉ 邮箱：", text: "info@zhonghui.com" },
        { label: "🌐 中文官网：", text: "www.chinaaupairs.com" },
        { label: "🌐 英文官网：", text: "www.aupaircn.com" }
      ],
      qrcodes: [
        { title: "公众号", text: "公众号\n二维码" },
        { title: "咨询微信", text: "咨询微信\n二维码" }
      ],
      copyright: "Copyright © 2026 中惠文化　·　京ICP备XXXXXXXX号"
    },
    blocks: [
      // ① Banner 大图块
      { type: "banner", data: { bg: "gradient", note: "[ 页面大图 ]" }, options: {} },
      // ② 联系方式块
      { type: "contact-info",
        data: { title: "联系方式", en: "Contact Us",
          items: [
            { icon: "🌐", label: "中文官网", value: "www.chinaaupairs.com" },
            { icon: "🌐", label: "英文官网", value: "www.aupaircn.com" },
            { icon: "📍", label: "地址", value: "北京东城区绿景馨园东区12号楼" },
            { icon: "📞", label: "电话", value: "010-64159286" },
            { icon: "✉", label: "邮箱", value: "info@zhonghui.com" } ] },
        options: {} },
      // ③ 社交媒体矩阵块（纯展示不跳转）
      { type: "social",
        data: { title: "中惠官方账号", en: "Follow Us",
          items: [
            { platform: "知乎", abbr: "知", color: "linear-gradient(135deg,#4A90E2,#1A4B7A)", account: "中惠互惠生" },
            { platform: "小红书", abbr: "红", color: "linear-gradient(135deg,#E54C5E,#8c1d2a)", account: "中惠互惠生" },
            { platform: "Facebook", abbr: "F", color: "linear-gradient(135deg,#3372b8,#24598f)", account: "中惠文化" },
            { platform: "抖音", abbr: "抖", color: "linear-gradient(135deg,#EE822F,#C25E00)", account: "中惠文化—互惠生中心" },
            { platform: "哔哩哔哩", abbr: "B", color: "linear-gradient(135deg,#30C0B4,#0e5b54)", account: "中惠互惠生" } ] },
        options: {} },
      // ④ 二维码占位块（后续替换真实图片）
      { type: "qr",
        data: { title: "扫码咨询", en: "WeChat",
          items: [
            { title: "公众号", text: "公众号\n二维码" },
            { title: "咨询微信", text: "咨询微信\n二维码" } ] },
        options: {} },
      // ⑤ 温馨提示块（免责声明）
      { type: "notice",
        data: { title: "温馨提示", en: "Kindly Notice",
          items: [
            "岗位匹配仅为咨询推荐服务，不保证获取录用 offer；",
            "海外薪资、工作内容、排班由当地合作方确定，不承诺固定收益；",
            "海外就业遵守当地法规，雇主与参与者可依法调整合作关系；",
            "项目体验因人而异，成长收获取决于个人主动参与。" ] },
        options: {} }
    ]
  };

  // ---------------- 渲染器 ----------------
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));

  const sectionHead = d => `<div class="section-title"><h2>${esc(d.title)}</h2>${d.en ? `<div class="en">${esc(d.en)}</div>` : ""}</div>`;

  const renderers = {
    banner(b) {
      const bg = b.data.bg;
      const style = bg && bg !== "gradient" ? `style="background-image:url('${esc(bg)}')"` : "";
      return `<section class="banner ${bg === "gradient" || !bg ? "bg-gradient" : ""}" ${style}>${b.data.note ? `<span class="banner-note">${esc(b.data.note)}</span>` : ""}</section>`;
    },
    "contact-info"(b) {
      const rows = b.data.items.map(i => `
        <div class="contact-row"><span class="icon">${esc(i.icon)}</span><span class="label">${esc(i.label)}</span><span class="value">${esc(i.value)}</span></div>`).join("");
      return `<section class="section"><div class="container">${sectionHead(b.data)}<div class="contact-card">${rows}</div></div></section>`;
    },
    social(b) {
      const cards = b.data.items.map(i => `
        <div class="social-card">
          <div class="social-logo" style="background:${esc(i.color)};">${esc(i.abbr)}</div>
          <div class="platform">${esc(i.platform)}</div>
          <div class="account">账号：${esc(i.account)}</div>
        </div>`).join("");
      return `<section class="section"><div class="container">${sectionHead(b.data)}<div class="social-grid">${cards}</div></div></section>`;
    },
    qr(b) {
      const boxes = b.data.items.map(q => `
        <div class="qr-large">
          <div class="qr">${esc(q.text).replace(/\n/g,"<br>")}</div>
          <p>${esc(q.title)}</p>
        </div>`).join("");
      return `<section class="section"><div class="container">${sectionHead(b.data)}<div class="qr-box-large">${boxes}</div></div></section>`;
    },
    notice(b) {
      const items = b.data.items.map(t => `<li>${esc(t)}</li>`).join("");
      return `<section class="section"><div class="container">${sectionHead(b.data)}<div class="notice-panel"><ol>${items}</ol></div></div></section>`;
    }
  };

  // ---------------- 渲染页面 ----------------
  function renderNav(nav) {
    const menu = nav.items.map(m => {
      const sub = m.children ? `<div class="dropdown">${m.children.map(c =>
        `<a href="${esc(c.link)}">${esc(c.label)}</a>`).join("")}</div>` : "";
      return `<li><a href="${esc(m.link)}" class="${m.active ? "active" : ""}">${esc(m.label)}${m.children ? ' <span class="caret">▾</span>' : ""}</a>${sub}</li>`;
    }).join("");
    document.getElementById("site-header").innerHTML = `
      <div class="nav">
        <a class="logo" href="index.html"><img src="${esc(nav.logo)}" alt="中惠文化"></a>
        <ul class="nav-menu">${menu}</ul>
        <div class="nav-lang"><a class="active" href="#">${esc(nav.langCurrent)}</a><span class="sep">|</span><a href="#">${esc(nav.langOther)}</a></div>
      </div>`;
  }

  function renderBlocks(blocks) {
    document.getElementById("page").innerHTML = blocks
      .filter(b => renderers[b.type])
      .map(b => renderers[b.type](b)).join("");
  }

  function renderFooter(f) {
    const info = f.info.map(i => `<p><span class="label">${esc(i.label)}</span>${esc(i.text)}</p>`).join("");
    const qr = f.qrcodes.map(q => `
      <div class="qr-item"><div class="qr">${esc(q.text).replace(/\n/g,"<br>")}</div><p>${esc(q.title)}</p></div>`).join("");
    document.getElementById("site-footer").innerHTML = `
      <div class="footer-grid">
        <div class="footer-brand"><img src="${esc(f.logo)}" alt="中惠文化"></div>
        <div class="footer-info">${info}</div>
        <div class="footer-qr"><h4>关注我们</h4><div class="qr-box">${qr}</div></div>
      </div>
      <div class="footer-copy">${esc(f.copyright)}</div>`;
  }

  renderNav(pageConfig.nav);
  renderBlocks(pageConfig.blocks);
  renderFooter(pageConfig.footer);
  </script>
</body>
</html>
```

- [ ] **Step 2: 静态验证**

```bash
ls -la contact.html
awk '/<script>/{f=1;next}/<\/script>/{f=0}f' contact.html > /tmp/contact.js && node --check /tmp/contact.js && echo SYNTAX_OK
grep -c 'sectionHead\|"contact-info"\|"social"\|"qr"\|"notice"' contact.html
```

Expected: 文件存在；SYNTAX_OK；grep 计数 ≥ 5（5 个渲染器 + sectionHead 辅助函数）。用后删除 /tmp/contact.js。

---

### Task 2: 更新 7 个页面导航链接

**Files:**
- Modify: `index.html` `about.html` `project-swt.html` `cases.html` `case-detail.html` `news.html` `news-detail.html`

- [ ] **Step 1: 逐文件修改"联系我们"link**

7 个文件中各有一行（各文件恰好出现一次）：

oldString:
```
        { label: "联系我们", link: "#" }
```
newString:
```
        { label: "联系我们", link: "contact.html" }
```

对 index.html、about.html、project-swt.html、cases.html、case-detail.html、news.html、news-detail.html 逐一执行（7 处编辑）。

- [ ] **Step 2: 验证**

```bash
grep -c '{ label: "联系我们", link: "contact.html" }' index.html about.html project-swt.html cases.html case-detail.html news.html news-detail.html contact.html
```

Expected: 7 个修改文件各输出 1；contact.html 输出 0（它自身是 `link: "contact.html", active: true` 不同模式）。
再确认 8 文件 nav 完整性：`grep -c 'contact.html' contact.html` ≥ 1。

---

### Task 3: 完整验证（对照 spec 第 7 节）

**Files:** 无新增修改（只读验证）

- [ ] **Step 1: JS 语法全量检查**

```bash
for f in contact.html index.html about.html project-swt.html cases.html case-detail.html news.html news-detail.html; do awk '/<script>/{x=1;next}/<\/script>/{x=0}x' $f > /tmp/v.js && node --check /tmp/v.js && echo "$f OK"; done; rm -f /tmp/v.js
```

Expected: 8 行 OK。

- [ ] **Step 2: 链接目标存在性检查**

```bash
for f in *.html; do case $f in *.backup.html) continue;; esac; for t in $(grep -o 'link: "[a-z-]*\.html' $f | sed 's/link: "//' | sort -u); do [ -f "$t" ] || echo "MISSING: $f -> $t"; done; done; echo DONE
```

Expected: 无 MISSING，仅输出 DONE。

- [ ] **Step 3: 本地服务器冒烟**

```bash
python3 -m http.server 8000
```

- `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/contact.html` → 200
- `curl -s http://localhost:8000/contact.html | grep -o '<title>[^<]*</title>'` → `<title>联系我们 — 中惠文化</title>`
- 逐页 `curl -s http://localhost:8000/<page>.html | grep -c 'contact.html'`（8 个页面）→ 均 ≥ 1
- img/logo.png、img/footLogo.png → 200

用完 Ctrl+C 停止服务器。

- [ ] **Step 4: 汇总需人工浏览器确认项**

- contact.html 五个区块的视觉布局（联系卡片/社交矩阵/二维码占位/免责面板）
- 导航"联系我们"高亮与其他 8 页跳转
- 小屏（≤700px）社交卡片 2 列换行、页脚单列
- 控制台无 JS 报错

---

## Self-Review 记录

- **Spec 覆盖：** 5 个区块（§4.1-4.4 + banner §3）✓ Task 1；7 页导航更新（§5）✓ Task 2；验证（§7）✓ Task 3；社交渐变色 5 组与 spec 一致 ✓；二维码 公众号/咨询微信 ✓；免责声明 4 条文案与 PPT/内容文档逐字一致 ✓；纯展示不跳转 ✓（social 卡片为 div 非 a 标签）
- **占位符扫描：** 无 TBD/TODO，全部代码完整
- **类型一致性：** 渲染器名 banner/contact-info/social/qr/notice 与 blocks type 一致；sectionHead 为新增共享辅助函数，各渲染器统一使用
- **Git 说明：** 非 git 仓库，无提交步骤
