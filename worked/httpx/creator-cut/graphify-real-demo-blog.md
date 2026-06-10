# 我把 graphify 的真实输出打开看了一遍：AI 缺的可能不是上下文，是地图

这版我不再写成 README 介绍，而是按实测证据链来拆 graphify。

我用仓库里的 `worked/httpx` 样例看了四个产物：`graph.html`、`GRAPH_REPORT.md`、`graph.json` 和 `graphify query` 输出。这个样例的图谱是 144 个节点、330 条边、6 个社区。

![graph.html 实际渲染](screenshots/01-graph-html.png)

## 先看结果：它不是把 README 摘一遍

graphify 的重点不是“生成一张漂亮图”，而是把项目变成 Agent 可以先读、再追问、最后回到源码复核的结构。

我会把它的输出拆成三层：

- `graph.html`：给人看的交互地图。
- `GRAPH_REPORT.md`：给 Agent 先读的路线图。
- `graph.json`：给 query、MCP、后续工具链复用的底层图。

![输出证据链](screenshots/02-output-proof.png)

## GRAPH_REPORT.md 最像路线图

我最先看的不是安装命令，而是报告里的 god nodes。因为这些节点告诉你项目主线在哪里。

在这个 httpx 样例里，排在前面的节点是：

1. `Client` - 26 edges
2. `AsyncClient` - 25 edges
3. `Response` - 24 edges
4. `exceptions.py` - 23 edges
5. `Request` - 21 edges
6. `BaseClient` - 18 edges

这比“文件树里有 auth.py、client.py、transport.py”更有用。文件树告诉你文件存在，图谱告诉你谁在连接谁。

![报告里的主线节点](screenshots/03-report-proof.png)

## query 返回的是子图，不是一句摘要

我问的是：

```bash
graphify query "why does Client connect transport auth URL and errors"
```

返回结果不是一段笼统解释，而是 NODE 和 EDGE 列表，里面有来源文件、行号、关系和置信度。这个形态更适合真实开发：先拿局部结构，再回到源码验证。

![query 输出](screenshots/04-query-client.png)

## 我最看重的是置信度

graphify 会把关系分成 `EXTRACTED` 和 `INFERRED`。这点比可视化本身更关键。

如果一个工具只告诉我“我发现了关系”，我还要担心它是不是在编。但如果它明确区分哪些来自原文、哪些来自模型推断，那它就更适合接入 Agent 工作流。

![关系置信度](screenshots/05-confidence.png)

## 我会怎么发布这篇内容

视频结构应该这样走：

1. 开场直接给结论：AI 缺的不是更长上下文，而是地图。
2. 展示真实输出：graph.html、GRAPH_REPORT.md、graph.json、query。
3. 放大 god nodes，让观众看到 Client / AsyncClient / Response 是主线。
4. 用 query 输出证明它能按问题捞局部结构。
5. 最后强调 EXTRACTED / INFERRED，这才是可复核的部分。

一句话结论：graphify 值得讲，不是因为它能把代码画成图，而是因为它把项目阅读变成了可追问、可复用、可复核的地图。

Source: https://github.com/kenchikuliu/graphify
