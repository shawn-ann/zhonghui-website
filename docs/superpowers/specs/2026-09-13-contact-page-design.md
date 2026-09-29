# 联系我们页面（contact.html）设计文档

日期：2026-09-13
状态：已获用户批准

## 1. 背景与目标

站点现有 7 个页面（index/about/project-swt/cases/case-detail/news/news-detail），各页导航"联系我们"均为 `#` 占位。架构文档 9.1 节已定义联系我们页线框图，内容文档第五章与 PPT 第 78-79 页提供了完整素材。目标：新建 `contact.html` 并接通全部页面导航。

## 2. 方案选择

采用**方案 A：按架构文档 9.1 线框图分块实现**（已获批准）。沿用站点"配置化内容块"模式：每类内容一个独立渲染器，pageConfig.blocks 有序组合，与其他页面完全一致。不抽取公共文件（超范围）。

## 3. 页面结构

```
header（导航栏，"联系我们"高亮）
  → banner 块（渐变大图占位，高 240px，同 case-detail/news-detail 详情页）
  → contact-info 块（联系方式）
  → social 块（社交媒体矩阵）
  → qr 块（微信二维码占位）
  → notice 块（温馨提示/免责声明）
  → footer（与现有页面完全相同）
```

容器宽度 1000px（同 news.html），样式全部复用现有 CSS 变量体系。

## 4. 区块设计

### 4.1 contact-info（联系方式）
- 标题："联系方式"，副标题 "Contact Us"（同 section-title 双语样式）
- 白底圆角卡片（border + 边框阴影，同 news-item 样式语言），内部逐行展示：

| 图标 | 栏目 | 值 |
|---|---|---|
| 🌐 | 中文官网 | www.chinaaupairs.com |
| 🌐 | 英文官网 | www.aupaircn.com |
| 📍 | 地址 | 北京东城区绿景馨园东区12号楼 |
| 📞 | 电话 | 010-64159286 |
| ✉ | 邮箱 | info@zhonghui.com |

（邮箱取自页脚既有信息；官网为文本展示，暂不做超链接）

### 4.2 social（中惠官方账号）
- 标题："中惠官方账号"，副标题 "Follow Us"
- 5 张卡片横向网格（小屏自动换行）：知乎、小红书、Facebook、抖音、哔哩哔哩
- 每张卡片：彩色圆角方块内平台名首字作为 logo 占位（无 logo 图片资源）+ 平台名 + "账号：中惠互惠生" 等
- logo 占位方块配色：每个平台使用一个渐变色（取自 news 列表 cover 的既有渐变系列，如 #4A90E2→#1A4B7A、#EE822F→#C25E00、#30C0B4→#0e5b54、#E54C5E→#8c1d2a、#3372b8→#24598f），保证五卡视觉区分度
- 账号清单：知乎 中惠互惠生 / 小红书 中惠互惠生 / Facebook 中惠文化 / 抖音 中惠文化—互惠生中心 / 哔哩哔哩 中惠互惠生
- **纯展示不跳转**（用户确认：仅 applogo + 账号名）

### 4.3 qr（微信二维码）
- 标题："扫码咨询"，副标题 "WeChat"
- 两个占位框：公众号、咨询微信（样式复用页脚 .qr-item/.qr 白底圆角框 + 文案占位），横向居中排列
- 后续拿到真实二维码图片后替换为 img

### 4.4 notice（温馨提示/免责声明）
- 标题："温馨提示"，副标题 "Kindly Notice"
- 浅蓝底（--light-blue）圆角面板 + 左侧蓝色竖线（同 blockquote 样式语言），内部 4 条有序列表：
  1. 岗位匹配仅为咨询推荐服务，不保证获取录用 offer；
  2. 海外薪资、工作内容、排班由当地合作方确定，不承诺固定收益；
  3. 海外就业遵守当地法规，雇主与参与者可依法调整合作关系；
  4. 项目体验因人而异，成长收获取决于个人主动参与。

## 5. 导航更新

其余 7 个页面（index.html / about.html / project-swt.html / cases.html / case-detail.html / news.html / news-detail.html）的 nav 配置中：

```
{ label: "联系我们", link: "#" }  →  { label: "联系我们", link: "contact.html" }
```

contact.html 自身导航"联系我们"带 `active: true`。全部 8 个页面 nav items 保持一致（仅 active 项不同）。

## 6. 错误处理

纯静态展示页，无 URL 参数、无表单提交、无 JS 交互逻辑。所有文本经 `esc()` 转义。

## 7. 验证方式

无自动化测试框架，采用：

1. `node --check` 校验全部 8 个文件内联 JS 语法
2. 链接目标存在性检查：所有页面 `link: "xxx.html"` 指向的文件均存在
3. `python3 -m http.server` 冒烟：contact.html 返回 200、title 正确、8 页导航"联系我们"链接均为 contact.html
4. 浏览器人工确认：布局/卡片/占位框视觉效果、小屏（≤700px）响应式、控制台无报错

## 8. 范围外（YAGNI）

- 不做留言表单/地图嵌入（素材中无此内容）
- 不做社交账号真实链接（无主页 URL）
- 不做官网/邮箱超链接
- 不抽取公共 header/footer
