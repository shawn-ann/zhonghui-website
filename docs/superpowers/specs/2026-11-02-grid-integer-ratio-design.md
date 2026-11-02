# Grid 整数列宽比例设计

日期：2026-11-02
状态：已确认
范围：`grid` 的 `columnRatio` 从固定枚举改为按列数生成的整数比例

## 1. 目标

- 支持任意 1–4 列的正整数比例，如 `2:3`、`1:2:1`。
- 默认比例按列数生成：`1`、`1:1`、`1:1:1`、`1:1:1:1`。
- 列数变化时，比例段数不匹配则重置为等比默认值。
- 保留旧数据的可用性：`equal`、`leftNarrow`、`leftWide` 读取时映射为新比例。

## 2. 方案

- `columnRatio` 改为字符串，格式为冒号分隔的正整数。
- 新增 `src/render/columnRatio.ts`：
  - `defaultColumnRatio(columns)`
  - `parseColumnRatio(value, columns)`
  - `normalizeColumnRatio(value, columns)`
  - `ratioToGridTemplate(value, columns)`
- 编辑器使用单个文本输入框，实时校验；非法输入不写回，失焦恢复上一个有效值。
- 渲染直接输出 `2fr 3fr` 或 `1fr 2fr 1fr`。
- 旧值映射：`equal → 1:1`、`leftNarrow → 2:3`、`leftWide → 3:2`。
- 1 列时隐藏比例输入；列数仅允许 1–4，比例段数必须等于列数。

## 3. 兼容

- Payload `columnRatio` 从 select 改为 text；旧字符串可继续读取。
- 自定义编辑器加载时会把旧枚举规范化为整数比例，下一次保存即写回新格式。
- 不改静态生成区块结构，不新增节点类型。

## 4. 验证

- 纯函数测试覆盖默认值、合法/非法比例、旧值映射和 fr 输出。
- 网格渲染测试断言 `2:3 → 2fr 3fr`。
- 属性面板输入合法比例后立即更新 Canvas；非法输入显示提示并恢复。
- 更改列数时自动更新默认比例。
- `npx tsc --noEmit`、`npm test -- --run`、`npm run build:generator` 通过。
