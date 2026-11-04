# 案例分享 CMS 设计（列表页 + 详情页）

**日期：** 2026-11-03
**状态：** 待确认
**范围：** 把 `cases.html` 与 `case-detail.html?id=...` 从两份静态页面改为“案例分类 + 案例集合 + 共享模板”的 CMS 结构。

## 1. 意图与原因

当前案例内容同时存在于列表页和详情页的静态 `collections.cases` 中，新增案例必须改两处；详情页还把导航、Banner、页脚、文章卡片写死在同一文件里。目标是：

- 运营只维护分类和案例内容，列表、分页、详情自动生成；
- 新增分类即可获得独立列表页，不需要复制页面；
- 所有分类共用一套列表模板和详情模板，视觉与交互一致；
- 案例详情只需要一张封面大图和富文本正文。

这对应 WordPress 的成熟模型：自定义文章类型 + 分类法 + 归档模板 + 单篇模板，而不是“每个案例复制一个页面”。

## 2. 目标 / 非目标

### 目标

- 新增 `caseCategories`（案例分类）和 `cases`（案例）两个集合。
- 自动生成 `/blog/` 全部案例、`/blog/{分类}/` 分类列表、`/blog/{分类}/{案例}/` 详情。
- 列表按发布日期倒序，页码分页。
- 列表卡片只显示封面图和标题。
- 详情页用封面作为顶部长图，叠加标题和日期，下接富文本正文。
- 分类的 Banner、副标题、每页条数可独立配置。
- 导航中只能选择某个案例分类作为链接。
- 分类或案例换 slug 时保留旧链接重定向。

### 非目标

- 不做案例搜索、标签、多分类、多级分类。
- 不做相关推荐、上一篇/下一篇、返回列表等详情页辅助导航。
- 不做列表摘要、浏览量、点赞、评论。
- 不改造首页“学生分享”区域；后续可另行接入案例集合。
- 不做多语言案例内容。

### 失败条件

- 新增分类仍需手工建页面或改模板代码。
- 列表与详情各自维护一份案例数据。
- 案例换分类后旧链接直接 404。
- 运营能改出每个分类不同的页面结构，导致模板漂移。

## 3. 使用场景

1. **潜在学员/家长**：从导航或首页进入 `/blog/`，浏览全部案例；点击卡片进入详情，看封面、日期和完整故事。
2. **运营新增分类**：在后台创建分类，填写名称、slug、Banner、副标题、每页条数；保存后自动拥有 `/blog/{slug}/` 列表页。
3. **运营发布案例**：选择分类，填标题、slug、封面、日期，写富文本正文；列表和详情自动更新。
4. **运营调整导航**：在菜单编辑器中选择某个分类，菜单链接自动解析到对应列表。
5. **案例换分类或改 slug**：旧 URL 自动重定向到新 URL。

## 4. 方案选择

### A. 集合 + 自动生成路由（采用）

新增分类与案例集合，生成器读取集合后生成列表、分页、详情路由。

- 最接近 WordPress 的 CPT + taxonomy + archive/single。
- 新增分类只填数据，页面自动出现。
- 模板统一，运营无法破坏布局。
- 代价：新增集合、生成规则和两个视图。

### B. Pages + 内容集合块（未采用）

每个分类建一个 Page，页面里放列表块。

- 复用现有页面编辑器。
- 但新增分类要“建分类 + 建页面 + 配块”，不是真正自动；配置容易重复和漂移。

### C. 自动路由 + 可选页面覆盖（未采用）

默认自动生成，个别分类挂自定义页面。

- 灵活，但两套数据源并存，维护成本高；当前内容形态统一，不需要。

## 5. 信息架构与 URL

```text
/blog/{categorySlug}/               分类列表
/blog/{categorySlug}/page/{n}/      分类分页
/blog/{categorySlug}/{caseSlug}/    案例详情
```

- 初始分类：名称「案例分享」，slug `study-case`。
- 分类 slug 与案例 slug 必须唯一；`page`、`blog` 为保留字。
- 详情 URL 跟随分类；换分类会改变详情 URL，必须生成重定向。
- 列表第 1 页不带 `page/1/`，从第 2 页开始生成。
- 最后一条数据删除后，旧分页页不应继续生成。

## 6. 数据模型

### 6.1 案例分类 `caseCategories`

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | text | 是 | 分类名称，如「案例分享」 |
| `slug` | text | 是 | URL 段，唯一，`^[a-z0-9-]+$`，保留字校验 |
| `banner` | upload(media) | 否 | 分类列表页 Banner 图 |
| `subtitle` | text | 否 | 分类列表页副标题 |
| `pageSize` | number | 是 | 每页条数，默认 12，范围 1–48 |
| `order` | number | 否 | 后台排序，默认 0 |
| `seoTitle` / `seoDescription` | text / textarea | 否 | 列表页 SEO 覆盖 |

分类不使用草稿状态：保存即公开。删除分类前必须先把该分类下的案例移到其它分类；仍有案例时阻止删除，避免案例被静默隐藏或构建失败。

### 6.2 案例 `cases`

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | text | 是 | 案例标题 |
| `slug` | text | 是 | 详情 URL 段，唯一，保留字校验 |
| `category` | relationship(caseCategories) | 是 | 所属分类，单选 |
| `cover` | upload(media) | 是 | 唯一大图；列表卡片与详情顶图共用。必填；页面上的无图兜底仅用于媒体文件损坏等异常情况 |
| `publishedAt` | date | 是 | 发布日期；列表排序字段 |
| `body` | richText | 是 | 富文本正文，支持图片、图集、引用、列表 |
| `seoTitle` / `seoDescription` | text / textarea | 否 | 详情页 SEO 覆盖 |
| `_status` | draft/published | — | Payload 草稿/发布状态 |

列表排序：`publishedAt` 降序；同日期按 `createdAt` 降序，保证稳定。

### 6.3 重定向 `caseRedirects`

| 字段 | 类型 | 说明 |
|---|---|---|
| `from` | text | 旧站内路径，唯一 |
| `to` | text | 新站内路径 |
| `createdAt` | date | 生成时间 |

触发规则：

- 只在**已发布 URL 发生变化**时写入；草稿阶段反复修改 slug 不产生重定向。
- 案例 slug 改变：旧 `/blog/{旧分类}/{旧slug}/` → 新详情 URL。
- 案例换分类：旧分类路径 → 新分类路径。
- 分类 slug 改变：该分类下所有案例的旧详情 URL 以及旧分类列表/分页 → 新路径。
- 链式变化（A→B，之后 B→C）合并为 A→C，避免多跳。
- 删除案例/分类：不自动删除历史重定向；重定向目标不存在时由构建校验报错。

## 7. 页面设计

### 7.1 `/blog/{分类}/` 分类列表

```text
导航
Banner（分类标题、副标题、分类 Banner 图）
案例宫格（同一套模板）
分页
页脚
```

- 只显示该分类案例。
- 除 Banner 数据外，布局与 `/blog/` 完全一致。
- 分类 Banner 缺失时回退到 `/blog/` Banner；再缺失则用纯色背景。
- 不重复显示第二层分类标题，避免 Banner 与宫格标题重复。

### 7.3 `/blog/{分类}/{案例}/` 详情

```text
导航
封面大图 Banner（cover，全宽，暗色渐变，标题 + 日期）
白色正文区（最大宽度约 820px，富文本）
页脚
```

- 只使用 `cover` 这一张固定大图；正文内可插入图片，但没有第二个“头图”字段。
- 封面使用 `object-fit: cover`；高度桌面约 460px，移动端约 320px。
- 标题与日期叠在封面左下角，暗色渐变保证可读性；日期使用中文格式（如 2025-07-02）。
- 无返回列表、无相关推荐。
- 封面缺失时回退为玫红渐变背景 + 标题/日期。
- 正文沿用现有 `.richtext` 样式：H2/H3、段落、列表、引用、单图、图集。

## 8. 编辑器与导航

### 8.1 运营流程

1. 创建分类：名称、slug、Banner、副标题、每页条数、排序。
2. 创建案例：标题、slug、分类、封面、发布日期、富文本正文。
3. 发布后由现有生成流程重建静态站。
4. 菜单编辑器中选择链接类型：
   - 案例分类 → `/blog/{分类slug}/`
   - 普通页面 → 现有 Page
   - 外链 → 现有外链（如已有）

### 8.2 菜单模型调整

现有菜单项只关联 `pages`。扩展为：

- `linkType`: `page`（默认）/ `caseCategory` / `external`
- `page`: 原有 Page 关系，`linkType=page` 时使用
- `caseCategory`: 关联 `caseCategories`，`linkType=caseCategory` 时使用
- `externalUrl`: `linkType=external` 时使用

菜单不自动插入分类；运营显式添加，避免分类增加导致导航自动变长。

导航激活态：分类列表与详情页应让对应分类菜单项高亮。

## 9. 生成与渲染架构

### 9.1 数据加载

`loadSiteData` 新增查询：

- `caseCategories`（按 `order`、`title`；分类无草稿状态）
- `cases`（published，按 `publishedAt` 降序）
- `caseRedirects`

输出 `SiteData` 增加 `caseCategories`、`cases`、`caseRedirects`，或在加载阶段直接合成 `PageDoc[]`。

推荐：加载阶段合成页面，复用现有 `pages` 生成管线：

- `PageDoc` 增加内部块 `caseList` 与 `caseDetail`（仅渲染用，不暴露给页面编辑器）。
- 每个分类按页数拆成多个 `PageDoc`。
- `/blog/` 及分页同理。
- 每条案例生成一个 `caseDetail` PageDoc。

### 9.2 渲染组件

新增：

- `CaseListView`：Banner + 卡片宫格 + 分页；接收分类/汇总配置、案例列表、分页信息。
- `CaseDetailView`：封面 Hero + 富文本正文。
- `CasePagination`：页码、上一页/下一页、当前页信息。

复用：

- 现有 `SiteNav` / `SiteFooter` / `LexicalContent` / `.richtext` 样式。
- 现有 `banner` 视图的分栏布局用于列表 Banner；详情 Hero 使用独立样式。

### 9.3 路由与分页

生成器按以下规则输出文件：

```text
/blog/study-case/index.html
/blog/study-case/page/2/index.html
/blog/study-case/xiaocao/index.html
```

- 不生成 `/blog/` 汇总页。
- 不从第 1 页生成 `/page/1/`。
- 分类列表页数 = `ceil(该分类案例数 / pageSize)`。
- `/blog/` 页数 = `ceil(全部案例数 / indexPageSize)`。

### 9.4 重定向

静态站无法天然返回 301。设计采用两层：

1. 为每个 `caseRedirects` 记录生成旧路径的 HTML：`<meta http-equiv="refresh" content="0;url={to}">` + `<link rel="canonical" href="{to}">`。
2. 同时输出 `redirects.json`，部署时若服务器支持（Nginx/Netlify/Cloudflare），转换为真正的 301。

需要在部署文档中说明：真正的 301 依赖托管环境；纯静态托管至少保证旧链接不会 404。

本设计只处理**新路由体系内**的重定向（案例换分类、分类改 slug）。旧静态页面 `/cases.html`、`/case-detail.html?id=...` 不在本次范围内，保留现状，作为单独的上线部署任务处理。

## 10. WordPress 对照

| 本方案 | WordPress |
|---|---|
| `cases` 集合 | 自定义文章类型 `case` |
| `caseCategories` 集合 | 分类法 `case_category` |
| `/blog/{分类}/` | 分类归档 `taxonomy-case_category.php` |
| `/blog/{分类}/{slug}/` | 单篇模板 `single-case.php` |
| 分类 Banner/副标题 | Term Meta / ACF 分类字段 |
| 菜单选择分类 | 菜单项关联分类术语 |
| `caseRedirects` | Redirection 插件/301 规则 |

## 11. 迁移

- 创建默认分类「案例分享」，slug `study-case`。
- 只迁移当前两个完整详情：`xiaocao`、`xiaoding`，使用现有标题、日期、封面和正文。
- 静态列表页其余 24 条只有标题和封面、没有正文，视为演示数据丢弃；`/blog/` 上线先显示 2 条，后续由运营发布真实内容。
- 保留旧静态 `cases.html` / `case-detail.html` 直到新路由验证完成；旧 URL 的重定向作为单独部署任务，不在本次实现范围。

## 12. 验收标准

- 新增分类后，不新增页面文件即可访问 `/blog/{slug}/`。
- 每个分类有独立列表页，只显示本分类。
- 列表按日期倒序；分页条数按分类配置。
- 卡片只显示封面 + 标题。
- 详情页只有封面大图 + 标题/日期 + 富文本；无辅助导航。
- 案例换分类后，旧详情 URL 可跳转到新 URL。
- 菜单可选择分类，链接正确且激活态正确。
- 手机端列表 2 列、详情 Hero 自适应，无横向滚动。
- `tsc`、测试、`build:generator` 通过。

## 13. 留给实现者的决定

- 列表 Banner 是否完全复用现有 `banner` 视图的分栏样式，还是为列表做更紧凑的变体。
- 详情 Hero 标题的左对齐/居中，以及移动端渐变强度。
- 空分类、封面缺失、Banner 缺失的兜底视觉。
- 分页按钮的省略号规则（页数很多时）。
- `caseRedirects` 是独立集合还是挂在案例/分类上的数组；推荐独立集合。
- 是否在本次迁移中把首页“学生分享”接入案例集合；默认不做。
- 无封面/Banner 的兜底视觉仅用于异常数据；正常发布流程必须填封面。
