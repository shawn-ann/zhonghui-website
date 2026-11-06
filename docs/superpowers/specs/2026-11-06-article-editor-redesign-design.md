# 文章编辑页视觉重设计 — 设计文档

- 日期：2026-11-06
- 状态：待确认
- 相关代码：`cms/src/collections/Cases.ts`、`cms/src/collections/CaseCategories.ts`、`cms/src/components/admin/*`、`cms/src/editor/RichTextControl.tsx`、`cms/src/components/admin/admin-theme.css`

## 1. 背景与动机

文章（`cases`）目前复用 Payload 默认的整页编辑表单，视觉上还是「默认后台」的样子：顶部信息零散、正文折叠成「编辑正文」按钮再弹窗、右栏是默认上传组件，整页大面积留白。上一轮已经把分类管理做成了自定义列表 + 抽屉，风格统一，文章编辑页反而显得割裂。

这次只重做**文章编辑页的视觉与字段组织**，目标是把「写一篇文章」变成一件顺手的事：标题、封面、分类、URL、正文一屏可及，正文直接写，不再弹窗。

## 2. 目标 / 非目标

### 目标

1. 编辑页改成左右两栏：左侧写作区（标题 + 正文），右侧属性栏（封面、分类、URL、只读日期）。
2. 正文富文本**内联展开**，不再点「编辑正文」弹窗。
3. 字段收敛为 5 项：分类、标题、URL、正文、发布日期（只读隐藏）；封面图保留。
4. 分类只提供下拉选择，**不允许新增分类**。
5. 发布日期不可编辑，列表页可见，列表默认按发布日期倒序。
6. 视觉语言与现有后台（`--zc-*` 令牌、`.zc-*` 组件）一致。

### 非目标

- 不改前台文章卡片、详情页的视觉与数据结构。
- 不把文章编辑改成抽屉（上一轮讨论过，正文编辑器不适合放抽屉）。
- 不改草稿 / 发布 / 版本 / 自动保存的底层行为。
- 不新增 SEO 编辑 UI（`seoTitle` / `seoDescription` 保持隐藏）。
- 不改 `publishedAt` 的历史数据与已有 URL。

## 3. 现状与约束

- 文章集合开启了 `versions.drafts`，编辑页的保存草稿 / 发布 / 版本能力来自 Payload 默认文档视图。
- `Cases.fields` 当前：`title`、`slug`、`category`(sidebar)、`cover`(sidebar)、`publishedAt`(sidebar)、`body`(richText，自定义 `ArticleBodyField`)、隐藏的 `publishedPath` / `seoTitle` / `seoDescription`。
- `body` 使用 `RichTextControl`，它自带「填写正文 / 编辑正文」按钮 + 弹窗；`ArticleBodyField` 通过 `useField` 接 Payload 表单。
- 文章卡片（前台列表）是 1:1 方形（`.case-card { aspect-ratio: 1 / 1 }`），封面会以 `background-size: cover` 裁切。
- 列表当前没有自定义 view，用 Payload 默认表格；分类管理才有自定义列表 + 抽屉。
- 后台主题 `admin-theme.css` 已经隐藏了 Payload 原生顶栏、接管了侧边栏，并提供 `.zc-page` / `.zc-card` / `.zc-input` / `.zc-btn` 等类。

## 4. 方案对比

### 方案 A：保留 Payload 默认文档视图，重做样式与字段组件（选用）

继续用 Payload 的默认 edit view（`useAsTitle`、`doc-controls`、字段渲染、草稿/发布/版本/校验都留着），通过 `admin-theme.css` + 少量自定义字段组件把它改造成左右两栏的视觉。

- 优点：草稿、发布、版本、必填校验、发布跳转 hook 全部沿用，风险最低；与现有「用 CSS 接管 Payload 外壳」的做法一致。
- 缺点：DOM 来自 Payload，布局要靠选择器覆盖，个别细节（顶部操作条、字段间距）需要实测微调；后续升级 Payload 时选择器可能失效。

### 方案 B：自定义文档视图（`admin.components.views.edit.default`）

完全自己渲染编辑表单，用 Payload 的表单上下文（`useDocumentForm` / `useField` / `useDocumentInfo`）接保存、草稿、发布。

- 优点：像素级控制，结构最干净。
- 缺点：需要确认 Payload 3.90 的表单 API 版本、草稿/发布按钮、版本抽屉、未保存提示、错误定位都要重新接；升级面大，回归风险高。

### 方案 C：像分类管理一样自定义页面 + REST 保存

- 优点：视觉完全自由，与分类管理一致。
- 缺点：要自己实现草稿 / 发布 / 版本 / 校验 / 发布跳转，正文与媒体关系也要手写；重复造轮子，排除。

**结论：选 A。** 视觉目标用 B 式布局，但底层仍是默认文档视图。

## 5. 字段与行为

### 5.1 分类（`category`）

- `admin.position: 'sidebar'`，`admin.allowCreate: false`、`admin.allowEdit: false`，只渲染下拉选择。
- 保持 `required: true`。
- 不提供「+ 新建分类」入口；新增分类仍走分类管理页。

### 5.2 标题（`title`）

- 左侧写作区第一行，大字号输入（约 26–28px，字重 700），无标签或弱标签。
- 保持 `required: true`。

### 5.3 URL（`slug`）

- 左侧写作区，紧接标题。
- 输入框内展示完整路径前缀：`/blog/{分类 slug}/`（浅色）+ 可编辑的别名。
- 保留现有 `validateCaseSlug` 与发布时生成旧链接跳转的逻辑。
- 前缀随分类选择变化；实现上新增一个自定义 `SlugField`，从 Payload 表单读取 `category` 值并通过 `/api/case-categories/{id}?depth=0`（或表单中的关系对象）取 slug。取不到时退回现有说明文案。

### 5.4 封面（`cover`）

- 右栏第一项，**1:1 方形预览**，与前台列表卡片同比例（`.case-card`）。
- 预览带底部标题压条（与卡片一致），让编辑看到真实裁切效果。
- 鼠标悬停显示「更换」；点击打开现有 `MediaModal`。
- **不提供「移除」**：封面是必填项，移除后无法保存，只留「更换」避免出现"能点但不能存"的死路。
- 新增自定义字段组件 `ArticleCoverField`（参考 `MediaPickerField`），仍绑定 `upload` 字段类型，`required: true`。

### 5.5 正文（`body`）

- 左侧写作区主体，**内联富文本编辑器**，不再弹窗。
- `RichTextControl` 增加 `inline?: boolean`：`inline` 时直接渲染 `<Editor>`（工具栏 + 编辑区），不渲染按钮与弹窗；现有页面编辑器继续用弹窗模式，行为不变。
- `ArticleBodyField` 改为 `inline` 模式，编辑区填满左栏宽度，`min-height` 约 420px。
- 工具栏、图集、图片插入、媒体弹窗保持现状。
- 保持 `required: true`。

### 5.6 发布日期（`publishedAt`）

- 表单中完全隐藏：`admin.hidden: true`；从右栏移除。
- 写入规则（本次采用）：**新建时写入当前北京日期；之后任何保存都不再修改**（包括草稿转发布）。
  - 存储沿用现有约定：日期存成当天 `00:00:00.000Z`（现有数据即 `2025-07-02 00:00:00+00`），前台 `slice(0, 10)` 才能得到正确的日期。
  - 按 `Asia/Shanghai` 取日历日（`Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' })` → `YYYY-MM-DD`），再拼成 `${day}T00:00:00.000Z`，避免服务器跑在 UTC 时 0–8 点写成前一天。
  - 更新时保留原值；若历史数据为空，则用 `createdAt` 的北京日期补一次，避免永久留空。
  - `required` 改为 `false`（由 hook 兜底），避免历史/导入数据被卡住。
- 列表可见，`defaultColumns` 包含 `publishedAt`；列表默认 `defaultSort: '-publishedAt'`。
- 前台分类页 / 预览页本来按 `publishedAt` 倒序，保持现状。

### 5.7 其他隐藏字段

- `publishedPath`、`seoTitle`、`seoDescription` 维持隐藏，不进入新 UI。

## 6. 页面结构与视觉

### 6.1 布局

```
┌ 顶部粘性操作条：状态徽标 …………………… 预览 · 保存草稿 · 发布 ┐
├───────────────────────────────────┬──────────────────┤
│ 写作区（自适应，最大约 760–900px）  │ 属性栏 280px      │
│  标题输入（大字号）                  │  封面图（1:1）     │
│  URL 输入（带路径前缀）              │  文章分类 下拉      │
│  正文字段标签 + 富文本卡片           │  （发布日期隐藏）   │
└───────────────────────────────────┴──────────────────┘
```

- 整页背景沿用 `--zc-bg`，写作区与属性栏之间用 1px 边框分隔。
- 顶部操作条 `position: sticky; top: 0`，背景白、底部细边框，向下滚动时始终可保存。
- 属性栏背景 `#faf7f9`（与分类抽屉的浅底一致）。

### 6.2 样式要点

- 复用 `--zc-*` 令牌与 `.zc-btn` / `.zc-input` 风格；输入框圆角 6px、聚焦玫红描边。
- 标题输入去掉 Payload 默认 border，使用无边框大字号 + 底部细线；聚焦时底部变玫红。
- URL 输入用等宽字体展示前缀与别名。
- 富文本卡片：工具栏浅底 `#faf7f9`，内容区白底、行高 1.85、H2 玫红。
- 发布按钮用主色 `--zc-primary`；「保存草稿」「预览」用次级样式。
- 响应式：< 1100px 时属性栏移到写作区下方（单列），封面预览最大 320px 宽。

### 6.3 操作条

- 左侧：状态徽标（已发布 / 草稿），以及最后修改时间等元信息。
- 右侧：预览（新窗口打开 `/preview/cases/{id}`）、保存草稿、发布 / 发布修改（沿用 Payload 默认按钮行为）。
- 返回文章列表沿用左侧全局导航（「文章列表」），不在操作条重复放置返回链接。
- 已有 `CollectionPreviewLink` 的「预览」按钮保留或合并进操作条，避免重复。

### 6.4 时间显示规范（全系统）

所有后台时间与日志统一使用北京时间、格式 `YYYY/MM/DD HH:mm:ss`（示例 `2026/01/01 12:12:30`）：

- Payload 全局（作用于文档页「最后修改时间 / 已创建」、日期字段、列表日期列等）：
  - `admin.timezones.defaultTimezone = 'Asia/Shanghai'`
  - `admin.dateFormat = 'yyyy/MM/dd HH:mm:ss'`
- 自定义组件（页面列表的更新时间、重定向记录、后续新增 UI）统一调用 `cms/src/lib/datetime.ts` 的 `formatBeijingTime(value)`，内部用 `Intl.DateTimeFormat` 指定 `Asia/Shanghai` 与 `YYYY/MM/DD HH:mm:ss`。
- 服务端日志：容器设置 `TZ=Asia/Shanghai`（`deploy/docker-compose.local.yml`、`deploy/docker-compose.yml` 的 cms / builder 服务），让框架输出与控制台日志也走北京时间。
- 文章列表的发布日期按同一格式展示（`2026/11/06 00:00:00`）；前台公开站点仍按日期显示，不在本次范围。
- 不修改数据库存储格式；`publishedAt` 仍是 UTC 零点（见 5.6）。

## 7. 列表页

- 使用 Payload 默认列表视图，只调整：
  - `defaultColumns: ['title', 'category', 'publishedAt', '_status']`
  - `defaultSort: '-publishedAt'`
- 发布日期列可见；状态列保留，便于识别草稿。
- 不改列表的视觉；如果后续想统一成分类管理的自定义表格，另开任务。

## 8. 影响面

| 文件 | 变更 |
|---|---|
| `cms/src/collections/Cases.ts` | `defaultSort`、`defaultColumns`、字段 `admin` 配置、`beforeChange` 写入发布日期、cover/body 组件、隐藏 publishedAt |
| `cms/src/collections/CaseCategories.ts` | 无需改动（分类下拉的限制在关系字段上） |
| `cms/src/components/admin/ArticleCoverField.tsx` | 新增：1:1 封面预览 + 媒体选择 |
| `cms/src/components/admin/ArticleBodyField.tsx` | 传 `inline` 给 `RichTextControl` |
| `cms/src/components/admin/SlugField.tsx` | 新增：带 `/blog/{分类}/` 前缀的 URL 输入 |
| `cms/src/editor/RichTextControl.tsx` | 新增 `inline` 模式（默认行为不变） |
| `cms/src/components/admin/admin-theme.css` | 新增文章编辑页两栏布局、操作条、字段样式 |
| `cms/src/payload.config.ts` | 全局 `admin.dateFormat` + `admin.timezones.defaultTimezone` |
| `cms/src/lib/datetime.ts` | 新增北京时间格式化工具 |
| `cms/src/components/PagesListView.tsx` | 更新时间改用 `formatBeijingTime` |
| `deploy/docker-compose.local.yml`、`deploy/docker-compose.yml` | cms / builder 增加 `TZ=Asia/Shanghai` |
| 文章发布日期逻辑 | 抽成可测试的纯函数（如 `resolvePublishedAt`） |

## 9. 测试与验收

### 自动化

- 纯函数测试：`resolvePublishedAt`（创建写入北京日期、更新保留、已有值不覆盖、缺失时用 `createdAt` 补）；`formatBeijingTime`（UTC 输入 → 北京 `YYYY/MM/DD HH:mm:ss`，含跨日边界）。
- 配置断言测试：`Cases` 的 `defaultSort` / `defaultColumns` / `category.allowCreate === false` / `publishedAt.admin.hidden === true`。
- 组件测试：`ArticleCoverField` 渲染 1:1 容器与标题压条；`SlugField` 有分类时展示前缀。
- 回归：现有 221 个测试全绿；`tsc --noEmit` 通过。

### 手工验收（本地 docker 栈 + Playwright）

1. 打开 `/admin/collections/cases/1`：两栏布局、封面 1:1、正文内联可编辑、分类为纯下拉（无「+」）、无发布日期字段。
2. 修改正文后保存，前台预览反映修改。
3. 新建文章：发布日期自动写入；列表按日期倒序，新文章在最前。
4. 发布 / 保存草稿 / 预览按钮工作正常；窄屏下属性栏落到下方。

## 10. 留给实现者的决定

- 顶部操作条的具体 DOM 结构：优先复用 Payload 的 `doc-controls`，必要时用 CSS 重排；不新增第二套保存按钮。
- 写作区最大宽度在 760–900px 之间取舍，以实测阅读舒适度为准。
- URL 前缀获取不到分类 slug 时的降级展示（只显示别名或静态说明）。

## 11. 风险

- Payload 默认文档视图的类名依赖：升级 Payload 可能导致样式失效，需在升级时回归本页。
- 内联富文本在长文中滚动与工具栏吸顶的体验，需要实测。
- 封面 1:1 预览与详情页头图裁切不同，需在字段说明里写清楚（列表方形、详情页整幅裁切）。

## 12. 实现者已定的取舍（评审时可推翻）

- **发布日期按北京日历日、存 UTC 零点**：与现有数据（`2025-07-02 00:00:00+00`）和前台 `slice(0, 10)` 的展示方式一致；列表与前台不会再出现差一天。
- **封面不提供「移除」**：必填字段移除后无法保存；悬停只保留「更换」。
- **历史缺失日期在首次更新时补齐**：用 `createdAt` 的北京日期补一次，之后不再变。
