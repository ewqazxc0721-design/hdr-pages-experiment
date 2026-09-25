# HDR Screenshot Collapse Lab

纯静态 GitHub Pages 实验。

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

否则不应把它视为防截图方案。
