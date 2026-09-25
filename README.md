# HDR Screenshot Collapse Lab

纯静态 GitHub Pages 实验。

## Cross-platform HDR Capture Calibration Matrix v1

入口：[54 格矩阵](https://ewqazxc0721-design.github.io/hdr-pages-experiment/matrix.html)。
原来的 [iPhone 单图实验](https://ewqazxc0721-design.github.io/hdr-pages-experiment/) 保留；原始和修复后的 AVIF 未改动。

### 参数与显示

- 背景 B：180 / 203 / 230 / 260 / 300 / 400 nit。
- 文字 T：230 / 260 / 300 / 350 / 400 / 500 / 600 / 800 / 1000 nit。
- 行 A–F 对应背景；列 1–9 对应文字，共 54 格，例如 B6 = B203/T500。
- 统一文字为“测试 AB12”。编号与 B/T 位于普通 SDR HTML 标签中。
- A：HDR no-limit；B：同一素材 standard；C：普通黑字浅底 HTML 基准。
- C1、D2、E3、F5 是 B=T 的零对比度控制组，不能认定为成功。
- 矩阵允许横向滚动与放大；也可选择单格、6 条、12 条重复布局。
- 6 / 12 条布局仅用于研究内容面积及滚动的影响，不是聊天产品。

### 一次试验怎么做

1. 填写设备、OS 版本、浏览器、亮度、HDR 状态、截图工具/模式及鲁棒性条件。
2. 确认 A/B 在原屏确有可见差异；`dynamic-range: high` 只是能力报告。
3. 保持 A 模式，按 0–4 评估原屏可读性；点击格子编号可选择要记录的格子。
4. 用实际系统截图路径截图。矩阵一次截不全时可分屏截图，保留普通 SDR 编号。
5. 把原始 SDR PNG/JPEG 载入本页，在截图上拖动框选该格完整的 3:1 图片内部，不含标签或边框；也可手动输入像素坐标。框选区域至少 240×80 像素，推荐单格复测的大图。
6. 点击“分析当前选区”，检查原图放大和增强预览，填写能否恢复，再“保存本格记录”。
7. 记录第一格后，环境条件锁定。改变设备、捕捉路径、HDR/SDR 格式、亮度、内容面积等条件前点击“新建试次”。旧试次进入本地历史，导出包含全部历史及当前试次。
8. 导出 JSON / CSV。若浏览器没有自动下载，使用导出预览中的下载链接或复制完整内容。所有记录保存在 localStorage，截图只在内存中处理，不上传、不持久保存。清理浏览器数据会丢失未导出的记录。

平台和浏览器只做诊断；Android 14/15/16 的版本优先使用 Client Hints，再由用户确认，不将简化 UA 中的 Android 10 当作真机版本。没有已验证平台参数，所有 Profile 均显示“待校准”。

### 指标定义与误差

截图通过浏览器解码到 sRGB canvas，先对 RGB 做 sRGB 逆传递，再以 Rec.709 权重 `0.2126R + 0.7152G + 0.0722B` 计算线性亮度，缩放为 0–255。分别对字形内部和远离字形的背景掩膜取均值，计算 `abs(Y_text - Y_bg)`。

`samples.json` 的文字样本避开 1 像素边缘，背景避开字形 3 像素范围；手工裁框会造成对齐误差，缩放、JPEG 压缩、色彩配置、抗锯齿也会影响结果。这是探索性筛选，不是仪器测量或信息不可恢复证明。增强预览采用 1%–99% 百分位线性拉伸；不会模拟所有恢复算法。

初筛候选要求：非零对照、原屏评分 ≥3、实际 HDR 已人工确认、SDR 路径且不保留 HDR、原始 SDR 文件已确认、A 模式截图分析、ΔY 不超过试次记录的阈值、放大及增强均人工确认不可读。默认阈值 2/255 仅作探索，不是经过验证的安全阈值。

HDR / gain-map 截图不进入 SDR 残留候选判定。PNG/JPEG 扩展名不能证明原文件不含 HDR 信息，必须确认原始捕捉路径；转换后图像不用于证明原截图丢失信息。

### 真机测试安排

| 平台 | 必测捕捉路径 | 当前状态 |
| --- | --- | --- |
| iPhone 14 Pro / iOS 27 / Safari | SDR 与 HDR 系统截图分开试次 | 单图用户实测有效；矩阵待复测 |
| Windows 11 / Edge | Win+Shift+S、Print Screen、浏览器截图 | 待真机 HDR 测试 |
| Windows 11 / Chrome | 同上；可选 Xbox Game Bar | 待真机 HDR 测试 |
| Android 14 / Chrome | 系统截图、格式与 gain map | 待真机测试 |
| Android 15 / Chrome | 同上 | 待真机测试 |
| Android 16 / Chrome | 同上；特别记录 HDR 保留 | 待真机测试 |

找到候选后，在亮度 25/50/75/100%、自动亮度、低电量、夜览、原彩、系统浅/深色、单格/6条/12条、静止/滚动、浏览器缩放、横/竖屏下建立独立试次。跨平台交集和 ROI 精扫须等实际数据后进行，当前不虚构统一参数。

### 素材生成与验证

生成：Windows PowerShell 执行 `tools/export-mask.ps1`，然后 `node tools/generate-matrix.cjs <avifenc 路径>`。字形先渲染为灰度掩膜，以绝对亮度混合边缘，按 ST 2084 编码到全范围 10 位 YUV444；U/V 固定中性 512。libavif 1.4.2 / libaom 无损编码，显式 CICP 9/16/9。字体为 Microsoft YaHei Bold，52 px；480×160 素材对应 240 CSS px 时约 26 px 字号。

执行 `node tools/verify-matrix.cjs <avifdec 路径> <ffprobe 路径>` 独立解码每张图，逐字节比较解码 YUV 与生成源，同时检查码流与帧的 10 位、BT.2020、PQ、全范围标记。结果见 [素材验证记录](validation/matrix-assets.json)。编码参数、PQ 码值、尺寸与文件 SHA-256 见 [manifest](assets/matrix-v1/manifest.json)。本轮使用不含 gain map 的基础 PQ AVIF；不依赖 CDN 转码。

本地运行：`node tools/serve.cjs`，打开 `http://127.0.0.1:8765/matrix.html`。
逻辑检查：`node tools/test-core.mjs`。

验证边界见 [平台与功能状态](validation/status.json)。桌面内置 Chromium 能加载与解码不代表 Windows HDR 系统捕捉路径已验证；移动尺寸模拟也不代表 iPhone / Android 真机已验证。

### 参考

- [WebKit：Safari 26 的 HDR 图片与 dynamic-range-limit](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/#hdr-images)
- [Chromium：UA reduction 与 Client Hints](https://www.chromium.org/updates/ua-reduction/)
- [AOMedia：AV1 色彩标记与位流规范](https://aomediacodec.github.io/av1-spec/)
- [Apple：SDR / HDR 屏幕捕捉格式](https://support.apple.com/en-md/guide/iphone/iph2d2500abc/ios)

本机制不保证防止 HDR 截图、gain-map 捕捉、拍屏、源码/DOM/内存/网络读取、OCR/增强、HDR 录屏。禁止将候选结果表述为绝对防截图。

## v2 色彩标记修复（2026-09-25）

原始 `assets/hdr-pq-test.avif` 的容器和 AV1 码流均标记 CICP 2/2/9：
色域、传递函数未指定，只有矩阵为 BT.2020 non-constant。10 位本身不代表 PQ HDR。
`node tools/fix-hdr-metadata.cjs` 为这份原始素材生成 `hdr-pq-test-tagged.avif`，
将两处 CICP 同时修为 9/16/9（BT.2020 / SMPTE ST 2084 / BT.2020 NC）。
仅修改 4 个元数据字节，原图保留，编码帧数据不变。
目标亮度沿用原实验说明；不将其视为屏幕实测亮度。

页面使用新素材，并提供同位置 HDR/SDR 切换、解码状态及 CSS 支持诊断。
`dynamic-range: high = true` 是能力报告，不证明当前图像正在输出 HDR。
[Safari 26 起支持 HDR 图片及 dynamic-range-limit](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/#hdr-images)。
修复不能代替 iPhone 真机复测，也不保证 SDR 截图丢失文字。

## 实验目标

验证 iPhone Safari 在 HDR 屏幕显示与 SDR 系统截图之间，是否存在可利用的亮度信息坍缩窗口。

HDR 图像：
- AVIF
- 10-bit
- BT.2020 primaries
- PQ / SMPTE ST 2084 transfer
- 背景约 203 nit
- 文字：203 / 210 / 220 / 230 / 240 / 260 / 280 / 320 / 400 / 600 / 1000 nit

页面包含：
- A: `dynamic-range-limit: no-limit`
- B: `dynamic-range-limit: standard`
- C: 普通 SDR 基准

## iPhone 测试前

设置 → 通用 → 屏幕捕捉 → 格式 → SDR。

必须用 Safari 打开 GitHub Pages 的 HTTPS 地址，不要用文件预览器。

## 成功标准

某一档同时满足：
1. A 原屏清晰；
2. B 明显弱于 A；
3. SDR 系统截图中的 A 文字消失或严重接近背景；
4. 截图放大仍不可恢复。

若未确认 HDR 实际显示，应先排查显示链路；若 HDR 已显示但截图仍可读，
则本轮未达到预期。此实验不应被视为可靠的防截图方案。

## iPhone 矩阵 HDR 排查（flow-2）

用户反馈旧版仍正常、矩阵 HDR/SDR 无肉眼差异。当前已移除矩阵嵌套滚动框及卡片裁剪，改为页面内自适应网格；素材未修改。滚动合成是有源码依据的怀疑，尚未确认真机修复。

先打开 [HDR 隔离测试](./hdr-check.html?v=flow-2)，对比同一张 B9 在普通页面与滚动容器中的 HDR/SDR 变化，再换旧图交叉验证。新旧布局试次按 `display_revision` 区分，旧记录保留。详见 [排查证据与验证范围](./validation/iphone-hdr-flow-2.md)。
