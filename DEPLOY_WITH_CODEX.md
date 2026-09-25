# Codex 任务：部署 HDR Safari 截图实验到 GitHub Pages

## 目标

把当前项目目录完整部署为一个公开的 GitHub Pages 静态站点，并把最终可直接在 iPhone Safari 打开的 HTTPS URL 返回给用户。

不要修改 HDR 图像的编码，不要用图片优化器重新压缩 `assets/hdr-pq-test.avif`。

## 当前项目

根目录应该包含：

- `index.html`
- `.nojekyll`
- `README.md`
- `DEPLOY_WITH_CODEX.md`
- `assets/hdr-pq-test.avif`

这是纯静态页面，不需要 npm、Node、构建系统或后端。

## 执行要求

1. 检查当前目录文件完整。
2. 确认 Git 可用并检查当前 GitHub 登录状态。
3. 如果当前目录尚未初始化 Git：
   - `git init`
   - 创建合适的 `.gitignore`（如确有必要）
   - 添加所有项目文件并提交。
4. 使用当前用户已授权的 GitHub 账号创建一个新的公开仓库。
   - 推荐仓库名：`hdr-screenshot-collapse-lab`
   - 如果重名，使用一个清晰的近似名称。
5. 推送默认分支到 GitHub。
6. 开启 GitHub Pages。
   - Source 使用默认分支根目录 `/`。
   - 不要引入 Jekyll。
7. 等待 Pages deployment 完成。
8. 实际请求最终 Pages URL，确认：
   - HTTP 状态正常；
   - `index.html` 可访问；
   - `assets/hdr-pq-test.avif` 可访问；
   - 页面引用的 AVIF 路径没有 404。
9. 最终只需要清楚报告：
   - GitHub 仓库 URL；
   - GitHub Pages HTTPS URL；
   - Pages 是否已验证可访问；
   - 如果 GitHub 要求用户进行登录/授权或 Pages 设置需要用户手动确认，明确指出唯一需要用户完成的步骤，然后继续完成剩余工作。

## 不要做

- 不要把 AVIF 转成 PNG/JPEG/WebP。
- 不要重新编码 AVIF。
- 不要把页面改成 React/Vite/Next.js。
- 不要添加 CDN 图片优化。
- 不要使用会改变 HDR metadata 的托管图片服务。
- 不要为了“看起来更亮”修改实验亮度参数。

## 部署后给用户的测试提醒

iPhone：
1. 设置 → 通用 → 屏幕捕捉 → 格式 → SDR。
2. Safari 打开 Pages HTTPS URL。
3. 确认页面显示 `dynamic-range: high = true`。
4. 对比 A 与 B。
5. 系统截图。
6. 在照片中打开原始截图并放大 A 区。
7. 将截图返回用于分析。
