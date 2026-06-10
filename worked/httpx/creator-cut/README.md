# graphify Creator Cut

这个目录是 `worked/httpx` 的一套“视频 + 图文”发布包，角度不是复述 README，而是按真实输出做一条证据链：

1. `graph.html` 给人看整体地图
2. `GRAPH_REPORT.md` 给 Agent 定向
3. `graphify query` 证明它能返回局部子图
4. `EXTRACTED / INFERRED` 说明它适合复核，不只是生成漂亮摘要

## 主要产物

- `recordings/graphify-real-demo-cut.mp4`
  最终成片，当前时长约 86.7 秒
- `recordings/graphify-live-selection-proof.mp4`
  原生浏览器 proof，保留真实 GitHub 页面里的点击、浏览器 zoom 和文本拖选
- `graphify-real-demo-blog.html`
  可直接打开的长文版图文页
- `graphify-real-demo-blog.md`
  长文 Markdown
- `graphify-real-demo-scenes.html`
  按镜头拆开的发布页
- `graphify-real-demo-scenes.md`
  按镜头拆开的 Markdown 稿
- `graphify-live-selection-proof.html`
  原生 proof 的独立发布页
- `graphify-live-selection-proof.md`
  原生 proof 的 Markdown 稿
- `live-selection-events.json`
  原生 proof 的时间点和选区元数据
- `real-demo-storyboard.json`
  视频镜头配置
- `scene-frames/`
  每个镜头对应的一张代表帧

## 输入素材

- `assets/httpx-graph.html`
- `assets/httpx-graph.json`
- `assets/httpx-GRAPH_REPORT.md`
- `assets/query-httpx-client.txt`
- `assets/query-httpx-core.txt`

## 生成脚本

- `make-real-demo-cut.mjs`
- `record-live-selection-demo.mjs`

全量重生成：

```powershell
node .\make-real-demo-cut.mjs
```

如果已经有最终成片，只想重建 scene 拆解页和代表帧：

```powershell
$env:SKIP_SCREENSHOTS='1'
$env:REUSE_FINAL_VIDEO='1'
node .\make-real-demo-cut.mjs
```

如果只想重录原生浏览器里的点击 / zoom / 文字拖选 proof：

```powershell
node .\record-live-selection-demo.mjs
```

## 说明

- 旁白当前来自 `elevenlabs`
- `scene-frames/` 的时间轴已按最终 `mp4` 时长对齐，不再按原始旁白长度估算
- `graphify-real-demo-blog.html` 和 `graphify-real-demo-scenes.html` 现在都会直接链接到原生 proof 页面
- 原生 proof 里视频保留前三段最稳的真实浏览器操作，`EXTRACTED / INFERRED` 额外保留成静态证据截图
- 目录里的 `.gitignore` 会忽略中间 `webm`、逐段配音缓存和 review 调试图
