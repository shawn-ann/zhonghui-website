# 新闻详情页（news-detail.html）设计文档

日期：2026-09-11
状态：已获用户批准

## 1. 背景与目标

中惠官网为纯静态 HTML 站点，采用"CMS 配置化内容模型"架构：每个页面由 nav / banner / 内容块 / footer 组成，由页内脚本渲染。`news.html`（资讯中心列表页）已有 12 条模拟数据，但仅前 2 条链接到尚不存在的 `news-detail.html`。`case-detail.html` 已实现"共享详情模板"模式（URL `?id=` 参数 + 富文本正文渲染），是本页的直接参照。

目标：新建 `news-detail.html`，使资讯中心 12 条记录全部可点开阅读。

## 2. 方案选择

采用**方案 A：镜像 case-detail.html 模式**（已获批准）。

- 新建独立的 `news-detail.html`，结构与 case-detail.html 完全一致
- 不抽取共享 JS（避免改动现有全部页面，超出本次范围）
- 不合并案例/新闻详情页（保持架构文档 13.4 节约定）

## 3. 页面结构

```
header（导航栏，"资讯中心"高亮）
  → banner 块（渐变大图，同现有占位样式）
  → detail 块（文章标题 / 日期 / 头图 / 富文本正文 / 上一篇下一篇）
  → footer（与现有页面完全相同）
```

样式沿用 case-detail.html 的全部 CSS 变量与组件样式，容器宽度 900px。

## 4. 数据模型

`collections.news`：12 篇文章数组，每篇字段：

| 字段 | 说明 |
|------|------|
| `id` | 语义化 slug，用于 URL 参数 |
| `title` | 标题（与 news.html 列表一致） |
| `date` | 日期（与 news.html 列表一致） |
| `cover` | 头图渐变色（与 news.html 列表一致） |
| `body` | 富文本节点数组 |

ID 清单（按 news.html 列表顺序）：

1. `lifeguard` — 赴美做 Lifeguard，到底要过哪些关？（真实内容）
2. `wystc` — 中惠出海！在里斯本谈下更多赴美实习好机会（真实内容，含表格）
3. `swt-zero-visa-rejection` — 2025 年 SWT 项目 0 拒签战绩公布
4. `apply-test-guide` — 申请攻略：项目适配测试三步走
5. `visa-interview-tips` — 面签攻略：着装规范与作答技巧
6. `lifeguard-training-beijing` — 2026 中惠 SWT 救生员培训北京站圆满结束
7. `itp-jobs-update` — ITP 专业实习岗位更新：会计 / 物流 / 酒店前台
8. `aupair-faq` — 互惠生项目常见问题答疑
9. `camp-types` — 营地辅导员：六种营地类型怎么选？
10. `pre-departure-checklist` — 行前培训清单：出发前你需要准备什么
11. `j1-policy-trends` — 行业资讯：2026 美国 J1 项目政策趋势
12. `student-story` — 学员分享：第一次独自出国的成长

内容来源：
- 第 1、2 篇取自《中惠官网内容整理.md》"中惠动态一/二"的完整真实内容
- 第 3-12 篇由 AI 按列表标题/摘要生成贴合站点语境的示例正文（每篇 3-5 段，可用 h2/p/ul/blockquote 等节点）

## 5. 详情渲染器

复制 case-detail.html 的 `detail` 渲染器（支持 `p` / `h2` / `h3` / `blockquote` / `figure` / `ul`），并新增两种节点类型：

- `table`：`{ type: "table", headers: [...], rows: [[...], ...] }` → 渲染 `<table class="article-table">`。样式：表头 `--light-blue` 背景 + `--deep-blue` 文字，单元格 `--border` 边框，内边距 10-12px，外边距 20px 0。用于 WYSTC 文章的"合作亮点"表（合作方 / 说明，5 行）。
- `ol`：`{ type: "ol", items: [...] }` → 有序列表，样式同 `ul`。用于 Lifeguard 文章的两种培训方式。

所有文本渲染均经过现有 `esc()` 转义。

## 6. URL 与上下篇导航

- URL 参数 `?id=` 取文章；无 id 或 id 无效时回退到第一篇（与 case-detail.html 现有行为一致，静默回退）
- 上一篇/下一篇从集合顺序**动态计算**（改进 case-detail 的硬编码写法）：
  ```js
  const idx = news.findIndex(n => n.id === articleId);
  prev = idx > 0 ? news[idx - 1] : null;
  next = idx < news.length - 1 ? news[idx + 1] : null;
  ```
- 链接格式：`news-detail.html?id=xxx`

## 7. news.html 联动修改

列表 12 条的 `link` 全部改为对应 `news-detail.html?id=<slug>` 地址，去掉 `#` 占位。列表页其余逻辑（分页等）不变。

## 8. 错误处理

| 场景 | 行为 |
|------|------|
| 无 `id` 参数 | 渲染第一篇（lifeguard） |
| 无效 `id` | 同上，静默回退 |
| `body` 为空 | 渲染空正文（数据侧保证每篇都有正文） |

## 9. 验证方式

站点无自动化测试框架，采用浏览器手动验证：

1. 打开 `news-detail.html?id=lifeguard` — 正文完整、含 ul/ol、上一篇无/下一篇为 wystc
2. 打开 `news-detail.html?id=wystc` — 表格正确渲染、上一篇为 lifeguard、下一篇为第 3 篇
3. 打开 `news-detail.html`（无 id）— 回退第一篇
4. 打开 `news-detail.html?id=invalid` — 回退第一篇
5. 从 `news.html` 列表逐一点击 12 条链接 — 均进入对应详情
6. 检查移动端窄屏下表格可读性（`.article-table` 外层用 `overflow-x: auto` 容器包裹，窄屏可横向滚动）

## 10. 范围外（YAGNI）

- 不做多语言切换逻辑（语言切换保持现状占位）
- 不抽取共享 JS / CSS 公共文件
- 不做真实后端 API 接入
