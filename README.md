# HDR Screenshot Collapse Lab

纯静态 GitHub Pages 实验。

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
