# 海外留学项目内容富文本化设计

日期：2026-11-02
状态：待确认
范围：Page 49（`/study-abroad/`）第二个内容区块的正文转换

## 1. 背景

Page 49 的「海外留学项目」区块当前结构为：

- `section`：背景图 `yinji-bg.jpg`
- `heading`：海外留学项目（白字，保留在外层）
- `stack`：白色卡片，内边距 40
- `stack.children`：7 个独立 `text` 子块
  - 3 个用于小标题的 `text`（20px、700 字重、深玫红）
  - 4 个正文 `text`

独立 `text` 块只能逐块编辑，无法使用富文本的列表、链接、图片、统一样式能力。富文本组件已支持放在 `stack` 内，Page 50 已验证该结构。

## 2. 目标

- 保留外层 `section`、白色「海外留学项目」标题和白色卡片视觉不变。
- 将卡片内 7 个 `text` 合并为 1 个 `richtext`。
- 原有小标题转为 H3，正文转为段落，文字内容不变。
- 后续内容统一在富文本编辑器内维护，可使用现有富文本图片/图集/列表/链接能力。
- 新环境种子数据和现有环境数据都得到正确结果。

## 3. 非目标

- 不修改外层标题、背景图、卡片背景/内边距。
- 不调整「热门留学目的地」区块。
- 不新增富文本节点类型或数据库字段。
- 不重新设计页面视觉。

## 4. 方案

### 4.1 数据结构

保留：

```
section(bgImage=yinji-bg.jpg)
  heading(海外留学项目, 白字)
  stack(bgColor=#FFFFFF, padding=40, gap=sm)
    richtext
```

`stack.children` 由 7 个 `text` 替换为 1 个 `richtext`。

### 4.2 文本映射

按原 `text` 块的样式识别小标题：

- `fontSize === 20` 且 `fontWeight === '700'` → Lexical `heading(tag='h3')`
- 其余 → Lexical `paragraph`
- 文字内容原样保留，不合并段落、不改写。

这 3 个小标题将变为：

- 美国留学 · 奖学金计划
- 英国留学
- 其他留学项目

视觉上由 `text` 的 20px/深玫红切换为 `.richtext h3` 的 22px/深玫红，属于可接受的样式归一。

### 4.3 迁移策略

1. **更新种子脚本** `cms/scripts/migrate-study-abroad.ts`
   - 增加 Lexical 节点辅助函数和 `richtext` 区块构造。
   - 生成 Page 49 时直接输出新结构，保证全新环境一致。
2. **新增一次性转换脚本** `cms/scripts/migrate-study-abroad-richtext.ts`
   - 按 route `/study-abroad/` 找到现有页面草稿。
   - 只定位包含「海外留学项目」标题的 section 及其 `stack`。
   - 若 `stack.children` 已经是单个 `richtext`，直接跳过。
   - 否则读取子 `text`，转换成 Lexical 内容并更新 Page 49 草稿。
   - 不覆盖页面标题、其他区块或已发布的静态产物。

## 5. 验证

- 转换脚本执行两次，第二次为 no-op（幂等）。
- 通过 API 检查 Page 49：目标 stack 仅含 1 个 `richtext`，H3/段落数量正确。
- 打开编辑器确认富文本可编辑，Canvas 正常渲染；白色卡片和外层标题不变。
- 检查独立预览/静态生成输出仍包含全部原文。
- 运行 `npx tsc --noEmit`、相关测试和 `npm run build:generator`。

## 6. 风险与处理

- **富文本 h3 样式与原 text 小标题不完全一致**：接受统一到现有富文本 h3 样式，不新增专用样式。
- **重复执行覆盖用户新编辑**：脚本仅在目标 stack 仍为旧 `text` 结构时转换；已是 `richtext` 则跳过。
- **页面 49 当前可能有用户改动**：转换只读取当前草稿中的 7 个 `text` 内容，不依赖旧迁移常量。
