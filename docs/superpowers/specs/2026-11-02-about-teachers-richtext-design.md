# 关于中惠专业师资团队富文本化设计

日期：2026-11-02
状态：已确认
范围：Page 47（`/about/`）创始团队 section 下的「专业师资团队」内容

## 1. 背景

Page 47 的创始团队 section 当前包含：

- `heading`：创始团队
- `grid`：3 个创始人图文卡片
- `infoList`：标题「专业师资团队」，5 条无标签纯文本，无圆点

`infoList` 的标题和行内容只能逐项编辑；本次只将这一块改成富文本。

## 2. 目标

- 保留 section 背景、外层「创始团队」标题和创始人网格。
- 将 `infoList` 替换为白色 `stack` 内的单个 `richtext`。
- 「专业师资团队」转为 H3，5 条描述转为段落，文字内容不变。

## 3. 非目标

- 不修改互惠生页面的项目要求/项目待遇。
- 不修改创始人卡片或页面其他 section。
- 不新增数据库字段或富文本节点类型。

## 4. 方案

目标结构：

```text
section(bgImage=yinji-bg.jpg)
  heading(创始团队)
  grid(3 个创始人)
  stack(bgColor=#FFFFFF, padding=40, gap=sm)
    richtext(H3 专业师资团队 + 5 个段落)
```

- 更新 `cms/scripts/migrate-about-aupair.ts`，新环境直接生成新结构。
- 新增一次性脚本 `cms/scripts/migrate-about-teachers-richtext.ts`：
  - 定位 `/about/` 草稿中包含「创始团队」标题的 section；
  - 找到标题为「专业师资团队」的 `infoList`；
  - 用当前标题和 items 生成 `richtext`，包进白色 `stack`；
  - 已是目标结构时跳过，不覆盖用户其他修改。
- 复用 `textBlocksToRichText`。

## 5. 验证

- 转换脚本执行两次，第二次 no-op。
- 通过 API 检查 Page 47：目标 section 子块为 `heading, grid, stack`，stack 内仅一个 `richtext`。
- 预览确认白色卡片、标题层级和 5 段文字均保留。
- 运行 `npx tsc --noEmit`、`npm test -- --run`、`npm run build:generator`。

## 6. 风险

- `infoList` 自带边框和阴影，换成 `stack` 后卡片阴影会减弱；保留白底、圆角和内边距，视觉可接受。
- 若当前 `infoList` 含非空 label，转换时保留为 `label：desc` 文本，避免丢失。
