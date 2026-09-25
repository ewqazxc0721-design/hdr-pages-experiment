# HDR 聊天消息显示方案：C9 接入说明

版本：1.0 · 2026-09-25  
用途：交给负责聊天网页的 Agent，实现消息正文的 HDR 显示功能。  
当前决策：纯网页；本轮只实现 iOS / iPadOS 路线；背景与文字统一采用 C9，暂不按设备调参，Windows / Android 暂不开发。

## 1. 本轮要交付什么

在已有聊天网页中接入一个可复用的 HDR 消息渲染组件：消息在支持 HDR 的目标设备上正常阅读；当系统走经过验证的 SDR 截图路径时，消息文字与其背景在截图中趋近同一亮度，文字可能消失。

用户已决定先进入聊天网页接入阶段。因此，旧实验需求中“先完成三平台参数交集再进入聊天产品化”的安排，不再作为本轮前置条件。保留已有实验和测试证据，但本轮不重做 54 格矩阵，不开发 Windows / Android 方案，不要求用户逐台设备选择亮度参数。

范围是**已发送、已接收消息的正文显示区域**。输入框、输入法、昵称、时间、通知、引用预览、转发预览、图片附件不是自动受保护的区域。需要同样处理的正文副本必须走同一个 HDR 渲染组件；不能把普通文字预览误标为受保护。

## 2. 固定参数：C9

| 项目 | 本轮标准 |
| --- | --- |
| 配置 ID | `hdr-c9-v1` |
| 矩阵参考 | C9 |
| 气泡内部背景目标亮度 | **230 nit** |
| 文字内部目标亮度 | **1000 nit** |
| 图像格式 | AVIF，AV1，10-bit |
| 色域 / 传递函数 / 矩阵 | BT.2020 / PQ（SMPTE ST 2084）/ BT.2020 non-constant luminance |
| CICP | **9 / 16 / 9**；容器和 AV1 码流都必须正确 |
| 像素格式 | YUV444 10-bit，全范围；与现有参考素材一致 |
| 透明度 | 首版使用不透明图片，背景与文字一起编码 |
| 显示 CSS | `dynamic-range-limit: no-limit` |
| 对照 CSS | `dynamic-range-limit: standard`，仅用于诊断 |
| 10-bit 全范围 PQ 端点码值 | 背景 Y=**607**；文字 Y=**769**；中性色度 U=V=**512** |

230 / 1000 nit 是**素材编码目标值**，不是浏览器能强制设定的面板实测亮度。C9 是用户指定的临时产品标准，不是已经证明适合所有 iPhone / iPad 的最佳参数。调整字号、行数、图片面积时保持 B/T 不变；若以后改参数，必须更换配置版本并重新验证。

C9 的“背景”指包含字形的 HDR 图片内部背景，不是整个网页背景。页面可以保留自己的普通 SDR 主题色；不能用 CSS 白底代替图像中的 230 nit 背景，也不能为了区分发送 / 接收方而直接染色 HDR 气泡。首版通过对齐、头像、外部标签区分消息方向。

## 3. 实验事实与结论边界

| 证据 | 已知结果 | 不能由此推出 |
| --- | --- | --- |
| iPhone 14 Pro，iOS 27，Safari；用户实测 | 更新后的页面能看到 HDR / SDR 亮度变化；用户偏好 B7 / B8，反馈非 HDR 直显可读，HDR 内容的 SDR 截图文字消失 | 尚未收到该 iPhone 对 **C9** 的明确单格复测结果 |
| iPad Pro 2022，M2，iPadOS 27；用户实测 | **C7–C9** 原屏清晰，SDR 截图文字消失 | 未提供屏幕尺寸、浏览器版本、原始截图量化及全部亮度条件 |
| 早期 iPhone 单图实验 | 用户确认 SDR 截图文字消失；需求材料记载 HDR 截图能保留文字 | 不能宣称 HDR 截图同样失效 |
| 自动素材检查 | 54 张 AVIF 的解码像素与生成源一致，HDR 元数据通过检查 | 不代表浏览器或面板已经实际输出 HDR |
| 移除矩阵内部滚动框后 | 用户确认恢复可见亮度变化 | 尚无严格成对真机对照，不能把具体 WebKit 根因写为已证实 |

这些是真机**用户定性报告**。尚未收到新一轮原始 SDR 截图、正式 0–4 评分或截图残留 ΔY；不能补造数值，也不能把截图缩略图“看起来空白”当作信息绝对不可恢复的证明。

## 4. 机制：正文必须进入 HDR 像素

显示链路：

```text
聊天消息正文
  → 文本排版 / 字形覆盖掩膜
  → C9 亮度图：背景 230 nit，字形内部 1000 nit
  → PQ 编码 + 10-bit AVIF + 正确色彩标记
  → 原始 AVIF 通过 <img> 显示，no-limit 请求 HDR
  → 原屏保留亮度差；部分 SDR 截图路径压缩或裁掉亮度差
```

目标是 `屏幕上的文字/背景差异大，SDR 截图中的差异小`。SDR 映射不由网页控制，也不是所有截取路径都会把两个亮度压到同一个值。

**不能使用以下替代实现：**

- 普通 DOM 文字覆盖在 HDR 图片上，或把截图敏感正文放到气泡旁边。
- 单靠 CSS `color`、`brightness()`、白色发光效果或普通 Canvas 白字白底模拟 HDR。
- 将普通 PNG / JPEG 只改后缀或补一个 PQ 标签，就当作正确 HDR 图像。
- 将真实 HDR AVIF 经普通 SDR Canvas 重绘后，再以 PNG / JPEG / SDR WebP 展示。
- 用禁止右键、禁止复制、监听 PrintScreen、失焦遮挡替代本方案。

`standard` 对照仍可能清晰可读；这不与“系统 SDR 截图文字消失”矛盾。CSS 显示限制和系统截图是两条不同链路，必须分别测试。

## 5. 已有可用资产与代码

实验仓库：[hdr-pages-experiment](https://github.com/ewqazxc0721-design/hdr-pages-experiment)  
基线代码版本：`1fc8e24f8e52d20a86a5f1dfe98f3f03a77ee652`。

| 资源 | 用途 |
| --- | --- |
| [C9 原始 AVIF](https://ewqazxc0721-design.github.io/hdr-pages-experiment/assets/matrix-v1/C9-B230-T1000.avif) | 首先原样接入，验证聊天布局没有破坏已知素材 |
| [54 格矩阵](https://ewqazxc0721-design.github.io/hdr-pages-experiment/matrix.html?v=flow-2) | 复查参数；本轮不需要用户调参 |
| [HDR 隔离页](https://ewqazxc0721-design.github.io/hdr-pages-experiment/hdr-check.html?v=flow-2) | 普通 / 滚动布局、旧图 / B9 对照；注意该页新版图默认是 **B9，不是 C9** |
| [生成器](https://github.com/ewqazxc0721-design/hdr-pages-experiment/blob/1fc8e24f8e52d20a86a5f1dfe98f3f03a77ee652/tools/generate-matrix.cjs) | 参考 PQ 编码与 libavif 参数；它当前生成固定测试矩阵，不是聊天文本 API |
| [字形掩膜生成](https://github.com/ewqazxc0721-design/hdr-pages-experiment/blob/1fc8e24f8e52d20a86a5f1dfe98f3f03a77ee652/tools/export-mask.ps1) | Windows 字体排版参考；当前固定“测试 AB12” |
| [独立解码验证](https://github.com/ewqazxc0721-design/hdr-pages-experiment/blob/1fc8e24f8e52d20a86a5f1dfe98f3f03a77ee652/tools/verify-matrix.cjs) | 素材像素与码流校验参考；运行此脚本需要完整矩阵和生成源 |
| [用户实测记录](https://ewqazxc0721-design.github.io/hdr-pages-experiment/validation/device-candidates.json) | 区分用户报告、已测参数和未测条件 |

C9 参考文件：`C9-B230-T1000.avif`；480 × 160；2814 bytes。SHA-256：

```text
a02271ebc34050eb284121819bf0b4afcc10aa8fadc640c4d69e3fdd6c9a5cb7
```

参考图中的文字是“测试 AB12”，它只用于接入检查。正式聊天必须生成真实消息正文的 HDR 图，不能用固定图冒充消息渲染成功。附件包中的 `assets/C9-B230-T1000.avif` 是该原文件的逐字节副本。

## 6. 动态消息生成要求

### 6.1 文本到亮度图

先完成真实文本排版：中文、英文、数字、标点、换行和长消息。按最终字体、字号、宽度生成灰度字形覆盖掩膜 `a ∈ [0,1]`。中间掩膜可以由 Canvas / 字体库生成；限制的是最终显示图不能被转成 SDR。

每个像素先在绝对亮度域计算：

```js
const luminanceNit = 230 + (1000 - 230) * coverage;

function pqEncode(nit) {
  const m1 = 2610 / 16384;
  const m2 = 2523 / 32;
  const c1 = 3424 / 4096;
  const c2 = 2413 / 128;
  const c3 = 2392 / 128;
  const p = (nit / 10000) ** m1;
  return ((c1 + c2 * p) / (1 + c3 * p)) ** m2;
}

const y10 = Math.round(pqEncode(luminanceNit) * 1023);
// 本方案为中性灰；YUV444 全范围，U10 = V10 = 512。
```

抗锯齿在亮度域混合，再做 PQ；不要直接在两个 PQ 码值之间插值来替换现有算法。图片内部留白也填 230 nit。首版用单色字形；彩色 emoji、富文本颜色、链接高亮等需要单独设计，不能直接套普通彩色文本渲染并宣称效果不变。

排版尺寸可适应聊天气泡，不必保持参考图的 3:1。按 CSS 目标尺寸和适当像素密度生成，设置明确的宽高以避免布局跳动。换行、字体大小改变或长消息拆图都需要相应的真实截图复测。固定测试图的字号不是聊天产品强制字号。

### 6.2 编码链路

已验证参考链路：libavif 1.4.2 / libaom，无损 AV1、YUV444 10-bit，全范围。已有源文件采用 Y4M，编码调用参考：

```text
avifenc -q 100 -s 6 -j 2 --cicp 9/16/9 message.y4m message.avif
```

输入必须已经是正确的 10-bit PQ YUV 数据；`--cicp` 负责标记，不会把普通 SDR 像素自动变成 230 / 1000 nit。生成后检查容器和 AV1 码流，不能只看扩展名或只检查 `colr`。

本轮不要求引入 gain map、透明层或另一种 HDR 编码路线。若为性能改编码器 / 质量档，必须验证像素偏差、色彩标记、真机可读性和截图结果。

### 6.3 编码运行在哪里

纯网页表示用户不安装 App / 插件，不等于必须没有后端。接入 Agent 应先检查聊天项目现有架构：

- 已有允许处理消息明文的业务后端：可在现有后端编码后返回原始 AVIF；不要额外接第三方图片转换服务。
- 静态站点或消息明文必须留在客户端：需要在浏览器中实现合适的 WASM HDR AVIF 编码链路，不能直接假设 `canvas.toBlob()` 已能输出所需的 10-bit PQ 文件。
- 如果现有聊天有端到端加密，不得为了编码图片把解密后的正文传回服务器。

GitHub Pages 本身不会执行服务器编码。上述动态编码链路是聊天接入阶段的待实现工作，当前实验项目只提供固定样本生成器。

可以缓存同一正文及排版的已生成结果；缓存版本必须包含 C9 配置和字体 / 宽度 / 排版版本。保持聊天现有鉴权、消息权限和存储策略；HDR 像素不等于加密。

## 7. 网页组件与布局

### 7.1 最小显示结构

下面只演示原图显示，不包含动态编码器；路径按接入项目调整。

```html
<article class="chat-message">
  <div class="message-meta">发送者 · 时间</div>
  <img
    class="hdr-message-image"
    src="./assets/C9-B230-T1000.avif"
    width="480" height="160"
    alt="HDR 消息图片"
  >
</article>
```

```css
.chat-message {
  overflow: visible;
  /* 首版由外层对齐区分发送/接收，不裁剪图片气泡。 */
}
.hdr-message-image {
  display: block;
  max-width: 100%;
  height: auto;
  opacity: 1;
  filter: none;
  mix-blend-mode: normal;
  dynamic-range-limit: no-limit;
}
.hdr-message-image.is-diagnostic-sdr {
  dynamic-range-limit: standard;
}
```

生产消息组件建议接收 `{messageId, assetUrl, pixelWidth, pixelHeight, profileId}`，并报告 `loading / decoded / failed / unsupported`。图片“decoded”只表示解码成功；不得将此状态命名为“截图防护已验证”。

加载与编码期间显示不含正文的占位提示；失败时显示明确状态。不要先显示普通明文再替换成 HDR，以免加载阶段或失败时出现可截图正文。若产品需要普通阅读降级，由用户明确选择，并标记“普通显示，不适用 HDR 截图效果”。

无障碍需要明确设计：示例使用概括性的图片说明，不宣称提供完整的屏幕阅读器体验。若提供可访问的文字版本，应承认其不受 HDR 视觉机制保护；不能用隐藏 DOM 明文当成“内容无法读取”的实现。

### 7.2 重点：聊天列表不要重现滚动回归

先采用**页面自然纵向滚动**。历史矩阵把图片放进 `overflow:auto` 的限高内部滚动框，且卡片有 `overflow:hidden`，曾出现旧图正常而矩阵 HDR / SDR 无差异；移除后用户反馈亮度变化恢复。

因此首版接入要求：

- 消息图片及主要祖先不使用内部 `overflow:auto / scroll` 聊天滚动区，不采用 `height:100vh; overflow:hidden` 再把消息区设成独立滚动框的常见布局。
- 输入栏可作为独立布局元素处理；不要为了固定输入栏让消息图片进入未验证的内部滚动层。真机检查键盘弹出、页面滚动和底部消息可见性。
- 首版不要对图片或祖先做整体透明度、滤镜、混合、遮罩或额外离屏合成；避免未经验证的 `transform` 虚拟列表和气泡裁剪。并非断言所有这些属性都必然破坏 HDR，而是先沿用已恢复效果的简单显示路径。
- 如果项目确实必须使用内部滚动或虚拟列表，先用**原样 C9**对比普通文档流与目标容器，并通过 iPhone / iPad 实测后再采用。

不要把 `translateZ(0)` 或 `will-change` 当作通用 HDR 修复。遇到回归时，先对比 C9 原图在最小页和聊天页的表现，再检查父级合成、图片转码及动态消息编码。

### 7.3 资源交付

- 使用普通 `<img>` 加载原始 AVIF，不经过框架默认图片优化器、CDN 自动格式选择或压缩转码。
- 响应应为 `image/avif`，HTTPS 可访问且鉴权正确，无 404、重定向到登录 HTML 等异常。
- 确认生产 URL 的文件字节与编码器产物一致；自适应 `srcset` 的每个候选也必须是合格 HDR 图。
- 不把消息图再绘制到普通 SDR Canvas 作为最终显示层。

## 8. 能力判定与用户状态

按 iOS / iPadOS 选择本轮路线，但不要仅凭系统名字启用“已验证”标记。iPad 的桌面站点 UA 可能类似 Mac；平台判断是路由提示，不是支持或安全证明。

诊断至少包括：

```js
const diagnostic = {
  dynamicRangeHigh: matchMedia('(dynamic-range: high)').matches,
  cssNoLimit: CSS.supports('dynamic-range-limit', 'no-limit'),
  cssStandard: CSS.supports('dynamic-range-limit', 'standard'),
  // 图片加载后另外记录 naturalWidth/naturalHeight 和 computed style。
};
```

区分三个层次：能力报告支持、图片实际解码、用户肉眼确认 HDR / SDR 有变化。网页不能仅凭这些 API 读取面板实际 nit，也不能可靠读取或强制改变系统截图是 SDR 还是 HDR。

建议状态文案：

- “HDR 显示实验模式”：正在请求 HDR，不等于已确认截图效果。
- “当前环境未报告 HDR 支持”：不静默改成普通文字并继续显示保护标志。
- “图片加载失败，请重试”：错误状态不显示正文副本。
- 说明入口：“本效果针对部分 SDR 截图路径；HDR 截图可能保留文字。”

保留一个使用固定 C9 的 HDR / SDR 对照入口，供诊断；不要让用户先扫描矩阵或填写一套设备校准参数。显示 / 能力条件变化后更新诊断状态。

## 9. 接入顺序

1. **先验证布局**：把原始 C9 放进实际聊天页，暂不涉及任意文本编码。手机上对照 HDR / SDR；若最小页有效、聊天页无效，优先排查布局和资源处理。
2. **实现真实正文编码**：先生成一条中文和一条英文/数字消息，核对 230 / 1000 nit、10-bit 和双层色彩标记；与参考 C9 同页比较。
3. **接入消息生命周期**：发送、接收、编辑、重试、历史记录、宽度变化，均使用真实内容对应的资产，不显示临时普通正文。
4. **验证完整会话**：长消息、换行、连续消息、键盘弹出和滚动都走最终产品布局。
5. **完成真机验收并记录结果**：只将实际通过的设备 / 浏览器 / 捕捉条件写入结果。若没有真机，用自动测试交付代码，但明确真机验收仍待用户完成。

## 10. 验收清单

### 自动检查

- [ ] 配置统一使用 `hdr-c9-v1`，背景 230 nit、文字 1000 nit；不存在按设备自动改为 B7/B8 的分支。
- [ ] 消息正文与内部背景一起编码，实际展示真实聊天内容；普通 UI 与 HDR 正文的范围明确。
- [ ] AVIF 容器和 AV1 码流都为 10-bit、9/16/9、全范围；首版独立解码与生成源一致。
- [ ] 生产环境无自动 SDR 转码，MIME 正确；参考 C9 的 SHA-256 一致。
- [ ] 最终图片计算样式是 `no-limit`，没有误继承的 SDR 限制或未经验证的祖先效果。
- [ ] 加载、编码失败、离线与不支持状态不静默泄露为普通正文。
- [ ] 中文、标点、长英文、换行、长消息无缺字/溢出/拉伸；敏感引用预览没有漏走渲染路径。

### 真机检查

- [ ] iPhone 14 Pro / iOS 27：补做 **C9** 的原屏可读性与系统 SDR 截图测试，不能用此前 B7/B8 成绩替代。
- [ ] iPad Pro 2022 M2 / iPadOS 27：将 C9 在实验页的成功反馈迁移验证到真实聊天页。
- [ ] 同位置 HDR / SDR 切换存在可见差异；原屏阅读舒适，建议明确记录 0–4 分评分。
- [ ] 系统 SDR 截图中文字不可自然阅读；保存原始截图并检查放大及简单对比度增强后的字形残留。
- [ ] 系统 HDR 截图单独记录，承认它可能保留文字，不能与 SDR 结果混为一谈。
- [ ] 单条、6 条、12 条及长会话；静止与滚动、键盘弹出、横竖屏均复测。
- [ ] 屏幕亮度 25 / 50 / 75 / 100%，以及实际可用的低电量、自动亮度、原彩、夜览条件分别记录。
- [ ] 真机记录包括系统、浏览器、亮度、配置 ID、截图路径、原始格式、原屏评分和残留情况。

截图分析如需要复用矩阵指标：它按解码 sRGB 的 Rec.709 线性亮度计算文字 / 背景均值差，量程 0–255，探索阈值为 2。**聊天图片尺寸与字形改变后，必须使用每条消息自己的字形掩膜或可靠对应区域，不能继续套用固定“测试 AB12”的 `samples.json` 和 3:1 裁剪。** 阈值不能被当成安全认证。

## 11. 必须保留的限制说明

这是针对特定 SDR 截图链路的显示效果，不是操作系统级禁截屏，不是消息加密。不能保证阻止 HDR / gain-map 截图、录屏、摄像头拍屏、图片下载、源码 / 网络 / 内存读取或图像处理恢复。不要出现“绝对防截图”“无法保存”或“所有 iOS 设备都安全”等描述。

大量高亮消息可能改变显示效果与阅读舒适度；单张固定图成功不等于完整聊天页成功。C9 为暂定参数，参数标准化与全面验证是两件事。

## 12. 交给接入 Agent 的任务摘要

> 请在现有聊天网页中实现 HDR 消息显示组件，依据本说明使用唯一暂定配置 `hdr-c9-v1`：背景 230 nit、文字 1000 nit。保持纯网页，本轮只考虑 iOS / iPadOS，Windows 和 Android 不开发，不要求逐台设备校准。先用随附原始 C9 AVIF 验证实际聊天布局，再实现真实消息正文到 10-bit BT.2020/PQ AVIF 的生成与显示。正文和背景必须一起编码，避免内部滚动合成回归、图片优化转码和普通文本降级泄露。交付组件、编码链路、加载/失败/不支持状态、诊断入口、部署链接及真实测试记录。不得把固定测试图当成动态聊天功能完成；不得把能力报告或桌面模拟当成真机截图验收。

## 13. 技术依据

- [WebKit：Safari 26 的 HDR 图片与 dynamic-range-limit](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/#hdr-images)：支持 HDR 图像显示与动态范围限制；不承诺截图防护效果。
- [Apple：iPhone 屏幕捕捉设置](https://support.apple.com/guide/iphone/change-the-screen-capture-settings-iph2d2500abc/ios)：按设备可用选项区分 SDR / HDR 捕捉；网站不控制这项系统设置。
- [本项目滚动路径排查](https://github.com/ewqazxc0721-design/hdr-pages-experiment/blob/1fc8e24f8e52d20a86a5f1dfe98f3f03a77ee652/validation/iphone-hdr-flow-2.md)：记录回归、源码线索与验证边界。

官方资料用于说明平台能力；“SDR 截图文字消失”的证据来自本项目用户真机反馈，不能写成 Apple / WebKit 的保证。
