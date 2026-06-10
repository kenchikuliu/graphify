voice_provider: elevenlabs
pace: 1.16

## 1. AI 读大项目缺的不是更长上下文

这一版我不再复述 README，直接看 graphify 的真实输出。我的判断是：AI 读大项目迷路，不一定是上下文不够，它先需要一张能追问的地图。

## 2. 我只认这四个产物

我只认这四个产物。graph 点 html 给人点开看，GRAPH_REPORT 点 md 给 Agent 定向，graph 点 json 作为查询底座，再加一条 graphify query 的结果。这个 httpx 示例是 144 个节点，330 条边，6 个社区。

## 3. GRAPH_REPORT.md 像一张读项目路线图

GRAPH_REPORT 点 md 最适合给 Agent 先读。它先把 god nodes 排出来，Client、AsyncClient、Response、Request 都在前面。也就是说，Agent 不必从文件树盲扫，而是先知道架构主线在哪里。

## 4. graph.html 不是装饰图

graph 点 html 也不是装饰图。你看右侧社区列表，再看中心的大节点，就能很快发现 Client 是怎么跨 transport、auth、models 和 errors 的。这个画面比单纯看目录更像地图。

## 5. query 返回的是子图，不是一句漂亮摘要

更关键的是 query。它返回的不是一句漂亮摘要，而是一段子图。NODE 有来源文件和行号，EDGE 有关系和置信标记。真实工作流里，你可以先拿局部结构，再回到源码复核。

## 6. 关系有置信度，才方便复核

我最看重的是置信度。EXTRACTED 是原文抽到的，INFERRED 是模型推断的。一个工具愿意把这两类分开，才适合给 AI assistant 用，因为你知道哪些地方需要复核。

## 7. 这篇就按“实测证据链”来写

所以这篇图文和视频，我会按实测证据链来写：先看结果，再看报告，再看查询，最后讲怎么接到 Agent 工作流。结论就一句话：给 Agent 地图，而不是无休止塞上下文。