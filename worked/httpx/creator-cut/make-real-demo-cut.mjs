#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = __dirname;
const assetsDir = path.join(outDir, "assets");
const screenshotsDir = path.join(outDir, "screenshots");
const recordingsDir = path.join(outDir, "recordings");
const narrationDir = path.join(outDir, "narration");
const FONT_CSS_URL = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";
const FRAME = {
	name: "Graphify Field Report",
	description: "Evidence-first editorial system for technical graph demos and creator-style breakdown videos.",
	colors: {
		canvas: "#f5efe6",
		paper: "#fcf8f1",
		ink: "#101720",
		muted: "#5f6b76",
		line: "#d7ccb9",
		accent: "#1f5ed7",
		signal: "#0d6d66",
		clay: "#b45437",
		sun: "#b88426",
		night: "#0d1726",
	},
	fonts: {
		display: "\"IBM Plex Sans Condensed\", \"Arial Narrow\", sans-serif",
		body: "\"IBM Plex Sans\", \"Segoe UI\", sans-serif",
		mono: "\"IBM Plex Mono\", Consolas, monospace",
	},
	radius: {
		sm: "8px",
		md: "14px",
		lg: "20px",
	},
	spacing: {
		xs: "8px",
		sm: "14px",
		md: "22px",
		lg: "34px",
		xl: "48px",
	},
};

function htmlEscape(input) {
	return String(input ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function formatInline(text) {
	return htmlEscape(text)
		.replace(/`([^`]+)`/g, "<code>$1</code>")
		.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
}

function fontLinks() {
	return `<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="${FONT_CSS_URL}" rel="stylesheet" />`;
}

function frameCssVars() {
	return `--canvas:${FRAME.colors.canvas};
		--paper:${FRAME.colors.paper};
		--ink:${FRAME.colors.ink};
		--muted:${FRAME.colors.muted};
		--line:${FRAME.colors.line};
		--accent:${FRAME.colors.accent};
		--signal:${FRAME.colors.signal};
		--clay:${FRAME.colors.clay};
		--sun:${FRAME.colors.sun};
		--night:${FRAME.colors.night};
		--display:${FRAME.fonts.display};
		--body:${FRAME.fonts.body};
		--mono:${FRAME.fonts.mono};
		--r-sm:${FRAME.radius.sm};
		--r-md:${FRAME.radius.md};
		--r-lg:${FRAME.radius.lg};
		--space-xs:${FRAME.spacing.xs};
		--space-sm:${FRAME.spacing.sm};
		--space-md:${FRAME.spacing.md};
		--space-lg:${FRAME.spacing.lg};
		--space-xl:${FRAME.spacing.xl};`;
}

function frameMarkdown() {
	return `---
name: ${FRAME.name}
description: "${FRAME.description}"
colors:
  canvas: "${FRAME.colors.canvas}"
  paper: "${FRAME.colors.paper}"
  ink: "${FRAME.colors.ink}"
  muted: "${FRAME.colors.muted}"
  accent: "${FRAME.colors.accent}"
  signal: "${FRAME.colors.signal}"
  clay: "${FRAME.colors.clay}"
  sun: "${FRAME.colors.sun}"
typography:
  display:
    fontFamily: "IBM Plex Sans Condensed"
    fontSize: 4.5rem
    fontWeight: 700
    lineHeight: 0.98
  body:
    fontFamily: "IBM Plex Sans"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.7
  data:
    fontFamily: "IBM Plex Mono"
    fontSize: 0.95rem
    fontWeight: 500
rounded:
  sm: ${FRAME.radius.sm}
  md: ${FRAME.radius.md}
  lg: ${FRAME.radius.lg}
spacing:
  xs: ${FRAME.spacing.xs}
  sm: ${FRAME.spacing.sm}
  md: ${FRAME.spacing.md}
  lg: ${FRAME.spacing.lg}
  xl: ${FRAME.spacing.xl}
components:
  proof-strap:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
  insight-note:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
---

## Overview

Field-report editorial design for technical creator demos. The tone should feel like a lab notebook, not a SaaS dashboard and not a marketing landing page.

## Colors

- **Canvas:** warm paper, not pure white.
- **Ink:** dense near-black for all major headlines.
- **Accent:** cobalt for structure, focus boxes, and interactive proof.
- **Signal:** oxidized green for navigation cues and valid evidence.
- **Clay:** human emphasis, correction, and skepticism.

## Typography

- Use condensed sans for display lines so dense technical claims still read large on video.
- Use a neutral grotesk for body copy.
- Use mono only for paths, commands, and evidence snippets.

## Layout

- Treat each scene like a proof board: one main claim, one evidence zone, one annotation zone.
- Favor asymmetry and left-weighted reading flow over centered marketing layouts.
- Use bands, rules, and labels to separate claim from proof.

## Elevation & Depth

- Keep depth shallow and tactile: paper surfaces, thin rules, soft shadows.
- Avoid glassmorphism, giant gradients, or glowing dark-mode chrome.

## Shapes

- Corners are tight, almost print-like.
- Boxes and note cards should feel clipped onto a board, not floating as product cards.

## Do's and Don'ts

- Do lead with evidence before commentary.
- Do use accent colors as punctuation.
- Do keep code and graph screenshots large and legible.
- Don't reproduce dashboard UI patterns if the point is architecture understanding.
- Don't let decorative motion overpower the proof.
`;
}

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		stdio: options.stdio || "pipe",
		encoding: "utf8",
		shell: false,
		...options,
	});
	if (result.status !== 0) {
		throw new Error(`${command} ${args.join(" ")} failed\n${result.stderr || result.stdout}`);
	}
	return result.stdout || "";
}

function runAsync(command, args, options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			stdio: options.stdio || "inherit",
			shell: false,
			...options,
		});
		child.on("error", reject);
		child.on("exit", (code) => {
			if (code === 0) resolve();
			else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
		});
	});
}

async function pathExists(file) {
	try {
		await fs.access(file);
		return true;
	} catch {
		return false;
	}
}

function ffprobeDuration(file) {
	const stdout = run("ffprobe", [
		"-v",
		"error",
		"-show_entries",
		"format=duration",
		"-of",
		"default=noprint_wrappers=1:nokey=1",
		file,
	]);
	return Number.parseFloat(stdout.trim()) || 0;
}

async function loadNativeProofMeta() {
	const videoFile = path.join(recordingsDir, "graphify-live-selection-proof.mp4");
	const eventsFile = path.join(outDir, "live-selection-events.json");
	if (!(await pathExists(videoFile)) || !(await pathExists(eventsFile))) return null;
	let parsed = {};
	try {
		parsed = JSON.parse(await fs.readFile(eventsFile, "utf8"));
	} catch {
		parsed = {};
	}
	const cover = (await pathExists(path.join(screenshotsDir, "live-selection-cover.png")))
		? "screenshots/live-selection-cover.png"
		: "screenshots/01-graph-html.png";
	const confidenceStill = (await pathExists(path.join(screenshotsDir, "live-selection-confidence.png")))
		? "screenshots/live-selection-confidence.png"
		: "";
	const events = Array.isArray(parsed.events) ? parsed.events : [];
	return {
		video: "recordings/graphify-live-selection-proof.mp4",
		html: "graphify-live-selection-proof.html",
		markdown: "graphify-live-selection-proof.md",
		eventsJson: "live-selection-events.json",
		cover,
		confidenceStill,
		durationSec: Number.isFinite(parsed.durationSec) ? parsed.durationSec : ffprobeDuration(videoFile),
		liveSteps: events.length,
		totalProofSteps: events.length + (confidenceStill ? 1 : 0),
	};
}

async function loadPlaywright() {
	const attempts = [
		() => import("playwright"),
		() => createRequire(path.join(process.cwd(), "package.json"))("playwright"),
		() => createRequire(path.join(__dirname, "package.json"))("playwright"),
	];
	for (const attempt of attempts) {
		try {
			const mod = await attempt();
			return mod.default || mod;
		} catch {
			// Try the next location.
		}
	}
	throw new Error("Playwright is required.");
}

async function launchChromium(playwright) {
	const attempts = [
		{ headless: true },
		{ channel: "chrome", headless: true },
		{ channel: "msedge", headless: true },
	];
	for (const options of attempts) {
		try {
			return await playwright.chromium.launch(options);
		} catch {
			// Try the next browser.
		}
	}
	throw new Error("Could not launch Chromium.");
}

async function loadDemoData() {
	const [graphRaw, reportRaw, queryClientRaw, queryCoreRaw] = await Promise.all([
		fs.readFile(path.join(assetsDir, "httpx-graph.json"), "utf8"),
		fs.readFile(path.join(assetsDir, "httpx-GRAPH_REPORT.md"), "utf8"),
		fs.readFile(path.join(assetsDir, "query-httpx-client.txt"), "utf8"),
		fs.readFile(path.join(assetsDir, "query-httpx-core.txt"), "utf8"),
	]);
	const graph = JSON.parse(graphRaw);
	const labels = new Map(graph.nodes.map((node) => [node.id, node.label || node.id]));
	const degree = new Map(graph.nodes.map((node) => [node.id, 0]));
	for (const link of graph.links) {
		const source = typeof link.source === "object" ? link.source.id : link.source;
		const target = typeof link.target === "object" ? link.target.id : link.target;
		degree.set(source, (degree.get(source) || 0) + 1);
		degree.set(target, (degree.get(target) || 0) + 1);
	}
	const topNodes = [...degree.entries()]
		.map(([id, count]) => ({ id, label: labels.get(id) || id, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10);
	const communities = new Set(graph.nodes.map((node) => node.community));
	return {
		graph,
		report: reportRaw,
		queryClient: queryClientRaw,
		queryCore: queryCoreRaw,
		stats: {
			nodes: graph.nodes.length,
			edges: graph.links.length,
			communities: communities.size,
			topNodes,
		},
	};
}

function extractReportSections(report) {
	const lines = report.split(/\r?\n/);
	const summary = [];
	const godNodes = [];
	const surprises = [];
	const questions = [];
	let section = "";
	for (const line of lines) {
		if (line.startsWith("## ")) section = line.replace(/^##\s+/, "").trim();
		if (section === "Summary" && line.startsWith("- ")) summary.push(line.replace(/^- /, ""));
		if (section === "God Nodes (most connected - your core abstractions)" && /^\d+\./.test(line)) godNodes.push(line);
		if (section === "Surprising Connections (you probably didn't know these)" && line.startsWith("- ")) surprises.push(line.replace(/^- /, ""));
		if (section === "Suggested Questions" && line.startsWith("- **")) questions.push(line);
	}
	return {
		summary,
		godNodes: godNodes.slice(0, 10),
		surprises: surprises.slice(0, 4),
		questions: questions.slice(0, 3),
	};
}

function wrapTokenHighlights(text) {
	return htmlEscape(text)
		.replace(/\b(Client|AsyncClient|Response|Request|Timeout|HTTPTransport|BaseTransport|Headers|URL|Cookies)\b/g, "<mark>$1</mark>")
		.replace(/\[(EXTRACTED|INFERRED|AMBIGUOUS)\]/g, '<span class="tag">$&</span>');
}

function proofPageHtml(data) {
	return `<!doctype html>
<html lang="zh-CN">
<head>
	<meta charset="utf-8" />
	${fontLinks()}
	<style>
		:root { ${frameCssVars()} }
		body { margin:0; width:1365px; height:768px; overflow:hidden; background:
			linear-gradient(180deg, rgba(245,239,230,.98), rgba(245,239,230,.98)),
			repeating-linear-gradient(90deg, rgba(16,23,32,.03) 0 1px, transparent 1px 120px);
			font-family:var(--body); color:var(--ink); }
		body::before { content:""; position:absolute; inset:24px; border:1px solid rgba(16,23,32,.08); pointer-events:none; }
		.wrap { position:relative; padding:44px 54px 36px; }
		.topline { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
		.eyebrow { display:inline-flex; align-items:center; gap:10px; color:var(--signal); font-weight:700; font-size:15px; letter-spacing:.08em; text-transform:uppercase; }
		.eyebrow::before { content:""; width:18px; height:2px; background:var(--signal); }
		.edition { font-family:var(--mono); font-size:13px; color:var(--muted); }
		h1 { margin:0 0 24px; font-family:var(--display); font-size:64px; line-height:.95; letter-spacing:0; max-width:980px; text-transform:uppercase; }
		.deck { margin:0 0 26px; max-width:760px; font-size:20px; color:var(--muted); line-height:1.45; }
		.grid { display:grid; grid-template-columns:1.12fr .88fr; gap:20px; }
		.card { position:relative; border:1px solid var(--line); border-radius:var(--r-md); background:rgba(252,248,241,.92); box-shadow:0 16px 44px rgba(16,23,32,.08); padding:24px; min-height:410px; overflow:hidden; }
		.card::before { content:""; position:absolute; top:0; left:0; width:100%; height:6px; background:linear-gradient(90deg,var(--accent),var(--signal),var(--sun)); opacity:.95; }
		.files { display:grid; gap:12px; margin-top:8px; }
		.file { display:grid; grid-template-columns:42px 1fr auto; gap:12px; align-items:center; border:1px solid rgba(16,23,32,.08); border-radius:var(--r-sm); padding:14px 16px; background:linear-gradient(180deg, rgba(255,255,255,.8), rgba(252,248,241,.96)); font-size:19px; font-weight:700; }
		.file span:first-child { font-family:var(--mono); color:var(--accent); font-size:14px; }
		.file small { color:var(--muted); font-weight:600; }
		.metric-row { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:20px; }
		.metric { background:var(--night); color:var(--paper); border-radius:var(--r-sm); padding:18px; }
		.metric strong { display:block; font-family:var(--display); font-size:54px; line-height:.9; }
		.metric span { display:block; margin-top:8px; color:#c7d0db; font-weight:600; text-transform:uppercase; letter-spacing:.06em; font-size:12px; }
		pre { margin:0; height:362px; overflow:hidden; white-space:pre-wrap; color:#d8dde4; background:#111a29; border-radius:var(--r-sm); padding:18px 20px; font-size:17px; line-height:1.5; box-shadow:inset 0 0 0 1px rgba(255,255,255,.05); }
		code { font-family:var(--mono); }
		.path { color:#8bb7ff; }
		.note { position:absolute; right:20px; bottom:18px; padding:10px 12px; border:1px solid rgba(180,84,55,.22); background:rgba(180,84,55,.08); color:#6f3321; border-radius:var(--r-sm); font-size:14px; }
	</style>
</head>
<body>
	<div class="wrap">
		<div class="topline">
			<div class="eyebrow">field report</div>
			<div class="edition">spec / proof / route</div>
		</div>
		<h1>这版不是复述 README<br/>我直接看生成物</h1>
		<p class="deck">先看真正落地的产物，再判断 graphify 值不值得讲。这里的重点不是“它会画图”，而是这四个产物能不能组成一条可信的证据链。</p>
		<div class="grid">
			<section class="card">
				<div class="files">
					<div class="file"><span>01</span><b>graph.html</b><small>interactive map</small></div>
					<div class="file"><span>02</span><b>GRAPH_REPORT.md</b><small>agent route map</small></div>
					<div class="file"><span>03</span><b>graph.json</b><small>query / MCP substrate</small></div>
					<div class="file"><span>04</span><b>graphify query</b><small>question → subgraph</small></div>
				</div>
				<div class="metric-row">
					<div class="metric"><strong>${data.stats.nodes}</strong><span>nodes</span></div>
					<div class="metric"><strong>${data.stats.edges}</strong><span>edges</span></div>
					<div class="metric"><strong>${data.stats.communities}</strong><span>communities</span></div>
				</div>
			</section>
			<section class="card">
				<pre><code><span class="path">worked/httpx</span>
├── raw/
│   ├── auth.py
│   ├── client.py
│   ├── models.py
│   └── transport.py
├── graph.html
├── GRAPH_REPORT.md
└── graph.json

question:
why does Client connect transport,
auth, URL and errors?</code></pre>
				<div class="note">证据不是一句总结，而是一套可回查的文件。</div>
			</section>
		</div>
	</div>
</body>
</html>`;
}

function reportPageHtml(data) {
	const sections = extractReportSections(data.report);
	return `<!doctype html>
<html lang="zh-CN">
<head>
	<meta charset="utf-8" />
	${fontLinks()}
	<style>
		:root { ${frameCssVars()} }
		body { margin:0; width:1365px; height:768px; overflow:hidden; background:
			linear-gradient(180deg, rgba(252,248,241,.98), rgba(245,239,230,.98));
			font-family:var(--body); color:var(--ink); }
		body::before { content:""; position:absolute; inset:28px; border:1px solid rgba(16,23,32,.08); pointer-events:none; }
		.wrap { position:relative; padding:34px 46px; }
		.kicker { display:inline-flex; align-items:center; gap:12px; margin-bottom:16px; color:var(--signal); font:700 15px var(--body); letter-spacing:.08em; text-transform:uppercase; }
		.kicker::before { content:""; width:28px; height:2px; background:var(--signal); }
		h1 { margin:0 0 18px; font-family:var(--display); font-size:54px; line-height:.96; letter-spacing:0; max-width:1120px; text-transform:uppercase; }
		.grid { display:grid; grid-template-columns:.88fr 1.12fr; gap:18px; align-items:start; }
		.card { border:1px solid var(--line); background:rgba(252,248,241,.96); border-radius:var(--r-md); box-shadow:0 14px 38px rgba(16,23,32,.08); padding:20px; }
		.card h2 { margin:0 0 14px; font-family:var(--display); font-size:27px; text-transform:uppercase; letter-spacing:.01em; }
		.summary { display:grid; gap:12px; }
		.pill { border:1px solid rgba(16,23,32,.08); border-left:5px solid var(--accent); border-radius:var(--r-sm); padding:13px 14px; font-size:18px; font-weight:700; background:linear-gradient(180deg, rgba(255,255,255,.72), rgba(252,248,241,.95)); }
		ol { margin:0; padding-left:24px; columns:1; }
		li { margin:8px 0; font-size:19px; line-height:1.42; }
		code { color:var(--accent); font-weight:700; background:rgba(31,94,215,.09); border-radius:5px; padding:2px 5px; font-family:var(--mono); }
		.surprises { margin-top:20px; display:grid; gap:10px; }
		.surprise { padding:13px 14px; border-radius:var(--r-sm); background:rgba(180,84,55,.08); border:1px solid rgba(180,84,55,.18); color:#6f3321; font-size:17px; line-height:1.45; }
	</style>
</head>
<body>
	<div class="wrap">
		<div class="kicker">agent route map</div>
		<h1>GRAPH_REPORT.md 先告诉 Agent<br/>项目主线在哪里</h1>
		<div class="grid">
			<section class="card">
				<h2>Summary</h2>
				<div class="summary">
					${sections.summary.map((item) => `<div class="pill">${htmlEscape(item)}</div>`).join("\n")}
				</div>
			</section>
			<section class="card">
				<h2>God Nodes</h2>
				<ol>
					${sections.godNodes.map((line) => `<li>${line.replace(/^\d+\.\s+/, "").replace(/`([^`]+)`/g, "<code>$1</code>")}</li>`).join("\n")}
				</ol>
				<div class="surprises">
					${sections.surprises.map((item) => `<div class="surprise">${item.replace(/`([^`]+)`/g, "<code>$1</code>")}</div>`).join("\n")}
				</div>
			</section>
		</div>
	</div>
</body>
</html>`;
}

function queryPageHtml(data, mode = "client") {
	const query = mode === "client"
		? "why does Client connect transport auth URL and errors"
		: "what are the core abstractions in httpx";
	const output = mode === "client" ? data.queryClient : data.queryCore;
	const lines = output.split(/\r?\n/).slice(0, 34).join("\n");
	return `<!doctype html>
<html lang="zh-CN">
<head>
	<meta charset="utf-8" />
	${fontLinks()}
	<style>
		:root { ${frameCssVars()} }
		body { margin:0; width:1365px; height:768px; overflow:hidden; background:#0f1723; font-family:var(--body); color:white; }
		body::before { content:""; position:absolute; inset:20px; border:1px solid rgba(255,255,255,.08); pointer-events:none; }
		.wrap { position:relative; padding:34px 46px; }
		.kicker { display:inline-flex; align-items:center; gap:10px; margin-bottom:14px; color:#83d0c8; font:700 15px var(--body); letter-spacing:.08em; text-transform:uppercase; }
		.kicker::before { content:""; width:24px; height:2px; background:#83d0c8; }
		h1 { margin:0 0 18px; font-family:var(--display); font-size:54px; line-height:.97; letter-spacing:0; max-width:980px; text-transform:uppercase; }
		.shell { border:1px solid rgba(255,255,255,.12); border-radius:var(--r-md); overflow:hidden; box-shadow:0 30px 80px rgba(0,0,0,.32); background:#09111b; }
		.bar { height:48px; background:#111b29; border-bottom:1px solid rgba(255,255,255,.08); display:flex; align-items:center; gap:9px; padding:0 16px; }
		.dot { width:12px; height:12px; border-radius:999px; background:#ef4444; box-shadow:22px 0 0 #f59e0b,44px 0 0 #22c55e; }
		.cmd { color:#dbe5f2; margin-left:64px; font-size:15px; font-family:var(--mono); }
		pre { margin:0; height:560px; padding:22px; overflow:hidden; white-space:pre-wrap; font-size:16px; line-height:1.46; color:#d1d7df; }
		code { font-family:var(--mono); }
		mark { color:#dbeafe; background:rgba(31,94,215,.34); border-radius:4px; padding:0 2px; }
		.tag { color:#b8f0de; background:rgba(13,109,102,.18); border:1px solid rgba(13,109,102,.34); border-radius:5px; padding:0 4px; }
		.note { position:absolute; right:48px; top:46px; padding:10px 12px; border:1px solid rgba(191,84,55,.28); background:rgba(191,84,55,.12); color:#ffcfbf; border-radius:var(--r-sm); font-size:13px; font-family:var(--mono); }
	</style>
</head>
<body>
	<div class="wrap">
		<div class="kicker">subgraph query</div>
		<h1>查询输出不是一句摘要<br/>而是一段可追溯的子图</h1>
		<div class="note">question -> nodes -> edges -> source</div>
		<div class="shell">
			<div class="bar"><span class="dot"></span><span class="cmd">graphify query "${htmlEscape(query)}"</span></div>
			<pre><code>${wrapTokenHighlights(lines)}</code></pre>
		</div>
	</div>
</body>
</html>`;
}

function confidencePageHtml(data) {
	const inferred = data.graph.links.filter((link) => link.confidence === "INFERRED").slice(0, 8);
	const extracted = data.graph.links.filter((link) => link.confidence === "EXTRACTED").slice(0, 8);
	const labelById = new Map(data.graph.nodes.map((node) => [node.id, node.label || node.id]));
	function edgeRow(link) {
		const source = typeof link.source === "object" ? link.source.id : link.source;
		const target = typeof link.target === "object" ? link.target.id : link.target;
		return `<tr><td>${htmlEscape(labelById.get(source) || source)}</td><td>${htmlEscape(link.relation || "related_to")}</td><td>${htmlEscape(labelById.get(target) || target)}</td><td><span class="${link.confidence === "INFERRED" ? "inferred" : "extracted"}">${link.confidence}</span></td></tr>`;
	}
	return `<!doctype html>
<html lang="zh-CN">
<head>
	<meta charset="utf-8" />
	${fontLinks()}
	<style>
		:root { ${frameCssVars()} }
		body { margin:0; width:1365px; height:768px; overflow:hidden; background:linear-gradient(180deg, rgba(245,239,230,.99), rgba(252,248,241,.98)); font-family:var(--body); color:var(--ink); }
		body::before { content:""; position:absolute; inset:26px; border:1px solid rgba(16,23,32,.08); pointer-events:none; }
		.wrap { position:relative; padding:38px 50px; }
		.kicker { display:inline-flex; align-items:center; gap:10px; margin-bottom:14px; color:var(--signal); font:700 15px var(--body); letter-spacing:.08em; text-transform:uppercase; }
		.kicker::before { content:""; width:28px; height:2px; background:var(--signal); }
		h1 { margin:0 0 14px; font-family:var(--display); font-size:56px; line-height:.96; letter-spacing:0; max-width:1040px; text-transform:uppercase; }
		p { margin:0 0 22px; color:var(--muted); font-size:20px; font-weight:500; max-width:980px; }
		.grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
		.card { background:rgba(252,248,241,.96); border:1px solid var(--line); border-radius:var(--r-md); box-shadow:0 18px 50px rgba(15,23,42,.08); overflow:hidden; }
		h2 { margin:0; padding:16px 18px; border-bottom:1px solid rgba(16,23,32,.08); font:700 22px var(--display); text-transform:uppercase; background:rgba(255,255,255,.46); }
		table { width:100%; border-collapse:collapse; font-size:15px; }
		td { border-bottom:1px solid rgba(16,23,32,.06); padding:11px 13px; vertical-align:top; }
		td:first-child, td:last-child { font-weight:760; }
		.extracted, .inferred { display:inline-block; border-radius:999px; padding:4px 8px; font-size:12px; font-weight:850; font-family:var(--mono); }
		.extracted { background:#d6f4ea; color:#07564f; }
		.inferred { background:#dbe8ff; color:#1f5ed7; }
	</style>
</head>
<body>
	<div class="wrap">
		<div class="kicker">trust boundary</div>
		<h1>我最看重的不是“有图”<br/>而是关系有置信度</h1>
		<p>EXTRACTED 是原文抽到的，INFERRED 是模型推断的。能区分这两类，才方便复核。</p>
		<div class="grid">
			<section class="card"><h2>EXTRACTED edges</h2><table>${extracted.map(edgeRow).join("\n")}</table></section>
			<section class="card"><h2>INFERRED edges</h2><table>${inferred.map(edgeRow).join("\n")}</table></section>
		</div>
	</div>
</body>
</html>`;
}

async function captureScreenshots(data) {
	if (process.env.SKIP_SCREENSHOTS === "1") {
		const required = [
			"01-graph-html.png",
			"02-output-proof.png",
			"03-report-proof.png",
			"04-query-client.png",
			"05-confidence.png",
		];
		await Promise.all(required.map((file) => fs.access(path.join(screenshotsDir, file))));
		return;
	}
	await fs.mkdir(screenshotsDir, { recursive: true });
	const pages = [
		["02-output-proof.html", proofPageHtml(data), "02-output-proof.png"],
		["03-report-proof.html", reportPageHtml(data), "03-report-proof.png"],
		["04-query-client.html", queryPageHtml(data, "client"), "04-query-client.png"],
		["05-confidence.html", confidencePageHtml(data), "05-confidence.png"],
	];
	for (const [filename, html, image] of pages) {
		const file = path.join(outDir, filename);
		await fs.writeFile(file, html, "utf8");
	}
	const playwright = await loadPlaywright();
	const browser = await launchChromium(playwright);
	const page = await browser.newPage({ viewport: { width: 1365, height: 768 }, deviceScaleFactor: 1 });
	await page.goto(pathToFileURL(path.join(assetsDir, "httpx-graph.html")).href, { waitUntil: "domcontentloaded", timeout: 60000 });
	await page.waitForTimeout(6500);
	await page.screenshot({ path: path.join(screenshotsDir, "01-graph-html.png"), fullPage: false });
	for (const [filename,, image] of pages) {
		await page.goto(pathToFileURL(path.join(outDir, filename)).href, { waitUntil: "load" });
		await page.evaluate(() => document.fonts ? document.fonts.ready : Promise.resolve());
		await page.waitForTimeout(350);
		await page.screenshot({ path: path.join(screenshotsDir, image), fullPage: false });
	}
	await browser.close();
}

const scenes = [
	{
		id: "hook",
		image: "screenshots/01-graph-html.png",
		kicker: "实测判断",
		title: "AI 读大项目缺的不是更长上下文",
		subtitle: "它先需要一张能追问的地图。",
		caption: "我这版直接看 graphify 的真实输出：graph.html、GRAPH_REPORT.md、graph.json 和 query 结果。",
		narration: "这一版我不再复述 README，直接看 graphify 的真实输出。我的判断是：AI 读大项目迷路，不一定是上下文不够，它先需要一张能追问的地图。",
		focus: { x: 272, y: 126, w: 612, h: 438 },
		cursor: { from: [720, 240], to: [620, 360] },
		cameraBias: { startDriftX: 58, startDriftY: 28, centerX: -28, centerY: -16, maxScale: 1.24, fillX: 0.76, fillY: 0.8, pushIn: 0.16 },
	},
	{
		id: "outputs",
		image: "screenshots/02-output-proof.png",
		kicker: "证据链",
		title: "我只认这四个产物",
		subtitle: "图给人看，报告给 Agent 定向，JSON 给查询。",
		caption: "这次用 worked/httpx 示例：144 nodes、330 edges、6 communities，报告和 JSON 统计一致。",
		narration: "我只认这四个产物。graph 点 html 给人点开看，GRAPH_REPORT 点 md 给 Agent 定向，graph 点 json 作为查询底座，再加一条 graphify query 的结果。这个 httpx 示例是 144 个节点，330 条边，6 个社区。",
		focus: { x: 58, y: 313, w: 690, h: 412 },
		cursor: { from: [175, 315], to: [535, 455] },
		cameraBias: { startDriftX: -42, startDriftY: 26, centerY: 22, maxScale: 1.16, fillX: 0.84, fillY: 0.84, pushIn: 0.14 },
	},
	{
		id: "report",
		image: "screenshots/03-report-proof.png",
		kicker: "报告",
		title: "GRAPH_REPORT.md 像一张读项目路线图",
		subtitle: "先告诉你 god nodes，再告诉你哪些连接值得怀疑。",
		caption: "Client、AsyncClient、Response、Request 这些节点被排在最前面，Agent 不必从文件树盲扫。",
		narration: "GRAPH_REPORT 点 md 最适合给 Agent 先读。它先把 god nodes 排出来，Client、AsyncClient、Response、Request 都在前面。也就是说，Agent 不必从文件树盲扫，而是先知道架构主线在哪里。",
		focus: { x: 620, y: 198, w: 688, h: 472 },
		cursor: { from: [1030, 185], to: [890, 335] },
		cameraBias: { startDriftX: 38, startDriftY: 14, centerX: 14, centerY: -12, maxScale: 1.2, fillX: 0.84, fillY: 0.82, pushIn: 0.14 },
	},
	{
		id: "graph",
		image: "screenshots/01-graph-html.png",
		kicker: "可视化",
		title: "graph.html 不是装饰图",
		subtitle: "右侧社区列表让你直接看模块边界。",
		caption: "中心的大节点和右侧社区一起看，能快速发现 Client 如何跨 transport、auth、models 和 errors。",
		narration: "graph 点 html 也不是装饰图。你看右侧社区列表，再看中心的大节点，就能很快发现 Client 是怎么跨 transport、auth、models 和 errors 的。这个画面比单纯看目录更像地图。",
		focus: { x: 1092, y: 194, w: 242, h: 212 },
		cameraBox: { x: 842, y: 148, w: 482, h: 356 },
		cursor: { from: [1120, 250], to: [1165, 422] },
		cameraBias: { startDriftX: 62, startDriftY: -28, centerX: 30, centerY: -8, maxScale: 1.26, fillX: 0.72, fillY: 0.8, pushIn: 0.18 },
	},
	{
		id: "query",
		image: "screenshots/04-query-client.png",
		kicker: "查询",
		title: "query 返回的是子图，不是一句漂亮摘要",
		subtitle: "NODE 和 EDGE 都带来源、位置和关系。",
		caption: "这就适合接到真实工作流：先拿局部结构，再回到源码复核。",
		narration: "更关键的是 query。它返回的不是一句漂亮摘要，而是一段子图。NODE 有来源文件和行号，EDGE 有关系和置信标记。真实工作流里，你可以先拿局部结构，再回到源码复核。",
		focus: { x: 56, y: 214, w: 1228, h: 218 },
		focusVisible: false,
		cameraBox: { x: 44, y: 218, w: 1172, h: 196 },
		selection: { x: 62, y: 262, w: 504, h: 66 },
		selectionLines: [
			{ x: 64, y: 260, w: 452, h: 34, delay: 0.18, duration: 0.34 },
			{ x: 64, y: 292, w: 498, h: 34, delay: 0.36, duration: 0.4 },
		],
		selectionTheme: "dark",
		selectionDom: {
			x: 66,
			y: 260,
			w: 760,
			h: 62,
			fontSize: 16,
			lineHeight: 1.46,
			text: "NODE Client [src=worked/httpx/raw/client.py loc=L70 community=2]\nNODE AsyncClient [src=worked/httpx/raw/client.py loc=L123 community=2]",
			delay: 0.4,
			duration: 0.68,
			theme: "dark",
		},
		cursor: { from: [170, 270], to: [825, 280] },
		cameraBias: { startDriftX: -72, startDriftY: 12, centerY: -6, maxScale: 1.26, fillX: 0.82, fillY: 0.72, pushIn: 0.18 },
	},
	{
		id: "confidence",
		image: "screenshots/05-confidence.png",
		kicker: "我最看重",
		title: "关系有置信度，才方便复核",
		subtitle: "EXTRACTED 和 INFERRED 分开，减少幻觉污染。",
		caption: "这比“我帮你总结一下项目”更可靠，因为它承认哪些关系来自原文，哪些来自模型推断。",
		narration: "我最看重的是置信度。EXTRACTED 是原文抽到的，INFERRED 是模型推断的。一个工具愿意把这两类分开，才适合给 AI assistant 用，因为你知道哪些地方需要复核。",
		focus: { x: 704, y: 246, w: 582, h: 294 },
		focusVisible: false,
		cameraBox: { x: 706, y: 248, w: 568, h: 202 },
		selection: { x: 712, y: 307, w: 512, h: 66 },
		selectionLines: [
			{ x: 712, y: 306, w: 492, h: 32, delay: 0.2, duration: 0.32 },
			{ x: 712, y: 338, w: 454, h: 32, delay: 0.38, duration: 0.34 },
		],
		selectionTheme: "light",
		cursor: { from: [890, 348], to: [1210, 348] },
		cameraBias: { startDriftX: -58, startDriftY: 18, centerX: 18, centerY: -2, maxScale: 1.26, fillX: 0.82, fillY: 0.72, pushIn: 0.18 },
	},
	{
		id: "close",
		image: "screenshots/02-output-proof.png",
		kicker: "发布角度",
		title: "这篇就按“实测证据链”来写",
		subtitle: "先结果，再报告，再查询，最后讲接入方式。",
		caption: "一句话结论：给 Agent 地图，而不是无休止塞上下文。",
		narration: "所以这篇图文和视频，我会按实测证据链来写：先看结果，再看报告，再看查询，最后讲怎么接到 Agent 工作流。结论就一句话：给 Agent 地图，而不是无休止塞上下文。",
		focus: { x: 78, y: 617, w: 646, h: 108 },
		cursor: { from: [540, 580], to: [310, 590] },
		cameraBias: { startDriftX: 24, startDriftY: 32, centerX: -12, centerY: 18, maxScale: 1.14, fillX: 0.82, fillY: 0.72, pushIn: 0.12 },
	},
];

function formatTimecode(totalSeconds) {
	const safe = Math.max(0, totalSeconds);
	const minutes = Math.floor(safe / 60);
	const seconds = Math.floor(safe % 60);
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function sceneTimeline(totalDurationOverride = null) {
	const plannedTotal = scenes.reduce((sum, scene) => sum + (scene.durationSec || 0), 0);
	const scale = totalDurationOverride && plannedTotal > 0 ? totalDurationOverride / plannedTotal : 1;
	let cursor = 0;
	return scenes.map((scene, index) => {
		const startSec = cursor;
		const plannedDurationSec = scene.durationSec || 0;
		const durationSec = plannedDurationSec * scale;
		const endSec = index === scenes.length - 1 && totalDurationOverride
			? totalDurationOverride
			: startSec + durationSec;
		cursor = endSec;
		return {
			...scene,
			index: index + 1,
			startSec,
			endSec,
			startLabel: formatTimecode(startSec),
			endLabel: formatTimecode(Math.max(startSec, endSec - 0.01)),
			durationLabel: `${durationSec.toFixed(1)}s`,
			frameFile: `scene-frames/${String(index + 1).padStart(2, "0")}-${scene.id}.png`,
			sourceImage: scene.image,
		};
	});
}

function sceneBreakdownMarkdown(voiceProvider, totalDurationOverride = null, nativeProof = null) {
	const timeline = sceneTimeline(totalDurationOverride);
	const totalDurationSec = timeline.length ? timeline[timeline.length - 1].endSec : 0;
	return `# graphify Creator Cut 拆镜头稿

这个文件把最终视频按镜头拆开，方便继续改成图文博客、社媒长图文，或者二次录屏脚本。

- 视频：\`recordings/graphify-real-demo-cut.mp4\`
- 长文：\`graphify-real-demo-blog.md\`
- 配音：\`${voiceProvider}\`
- 总时长：\`${formatTimecode(totalDurationSec)}\`（约 ${totalDurationSec.toFixed(1)} 秒）
- 镜头数：\`${timeline.length}\`
${nativeProof ? `- 原生浏览器 proof：\`${nativeProof.video}\`（约 ${nativeProof.durationSec.toFixed(1)} 秒）
- 原生 proof 页面：\`${nativeProof.html}\`
- 原生 proof 步骤：\`${nativeProof.totalProofSteps}\`
` : ""}

${timeline.map((scene) => `## ${scene.index}. ${scene.title}

![${scene.title} - 视频代表帧](${scene.frameFile})

![${scene.title} - 原始证据截图](${scene.sourceImage})

- 时间：${scene.startLabel} - ${scene.endLabel}
- Kicker：${scene.kicker}
- Subtitle：${scene.subtitle}
- Caption：${scene.caption}
- 博客正文优先截图：${scene.sourceImage}
- 旁白：${scene.narration}
`).join("\n")}
`;
}

function sceneBreakdownHtml(voiceProvider, totalDurationOverride = null, nativeProof = null) {
	const timeline = sceneTimeline(totalDurationOverride);
	const totalDurationSec = timeline.length ? timeline[timeline.length - 1].endSec : 0;
	const cards = timeline.map((scene) => `
		<article class="scene-card">
			<div class="scene-meta">
				<div>
					<div class="scene-kicker">${htmlEscape(scene.kicker)}</div>
					<h2>${String(scene.index).padStart(2, "0")}. ${htmlEscape(scene.title)}</h2>
				</div>
				<div class="scene-time">
					<b>${htmlEscape(scene.startLabel)} - ${htmlEscape(scene.endLabel)}</b>
					<span>${htmlEscape(scene.durationLabel)}</span>
				</div>
			</div>
			<div class="media-grid">
				<figure>
					<div class="figure-label">Video Frame</div>
					<button class="zoom" data-img="${htmlEscape(scene.frameFile)}" aria-label="open image">
						<img src="${htmlEscape(scene.frameFile)}" alt="${htmlEscape(scene.title)} 视频代表帧" />
					</button>
					<figcaption>成片代表帧。用来对齐镜头节奏和标题判断。</figcaption>
				</figure>
				<figure>
					<div class="figure-label">Source Proof</div>
					<button class="zoom" data-img="${htmlEscape(scene.sourceImage)}" aria-label="open image">
						<img src="${htmlEscape(scene.sourceImage)}" alt="${htmlEscape(scene.title)} 原始证据截图" />
					</button>
					<figcaption>${htmlEscape(scene.caption)}</figcaption>
				</figure>
			</div>
			<div class="scene-copy">
				<p class="scene-subtitle">${htmlEscape(scene.subtitle)}</p>
				<p>${htmlEscape(scene.narration)}</p>
				<p class="scene-proof-path">博客正文优先截图：<code>${htmlEscape(scene.sourceImage)}</code></p>
			</div>
		</article>
	`).join("\n");
	return `<!doctype html>
<html lang="zh-CN">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>graphify creator cut scenes</title>
	${fontLinks()}
	<style>
		:root { ${frameCssVars()} }
		body { margin:0; background:var(--canvas); color:var(--ink); font-family:var(--body); line-height:1.75; }
		body::before { content:""; position:fixed; inset:18px; border:1px solid rgba(16,23,32,.07); pointer-events:none; z-index:0; }
		a { color:var(--accent); }
		header { position:relative; padding:56px max(28px,calc((100vw - 1120px)/2)) 42px; background:
			linear-gradient(180deg, rgba(245,239,230,.95), rgba(252,248,241,.92)),
			repeating-linear-gradient(90deg, rgba(16,23,32,.03) 0 1px, transparent 1px 130px);
			border-bottom:1px solid rgba(16,23,32,.08); overflow:hidden; }
		header::after { content:""; position:absolute; right:-120px; top:42px; width:420px; height:420px; border-radius:999px; background:radial-gradient(circle, rgba(31,94,215,.12), transparent 68%); }
		.eyebrow { position:relative; display:inline-flex; align-items:center; gap:12px; color:var(--signal); font-weight:700; letter-spacing:.09em; text-transform:uppercase; }
		.eyebrow::before { content:""; width:26px; height:2px; background:var(--signal); }
		h1 { position:relative; margin:16px 0 18px; max-width:980px; font:700 clamp(48px,6vw,90px)/.94 var(--display); text-transform:uppercase; letter-spacing:0; }
		header p { position:relative; max-width:760px; margin:0; color:var(--muted); font-size:21px; font-weight:500; }
		.header-grid { position:relative; display:grid; grid-template-columns:1.2fr .8fr; gap:18px; margin-top:30px; }
		.video-card, .facts { border:1px solid rgba(16,23,32,.08); border-radius:var(--r-md); background:rgba(252,248,241,.86); box-shadow:0 14px 36px rgba(16,23,32,.07); overflow:hidden; }
		.video-card video { display:block; width:100%; height:auto; background:#111827; }
		.video-card .video-copy { padding:14px 16px 18px; color:var(--muted); font-size:15px; }
		.facts { padding:18px 20px; }
		.facts h2 { margin:0 0 12px; font:700 24px/1 var(--display); text-transform:uppercase; }
		.facts ul { margin:0; padding-left:18px; }
		.facts li { margin:0 0 10px; font-size:16px; color:#1f2c37; }
		main { position:relative; max-width:1040px; margin:0 auto; padding:42px 24px 92px; z-index:1; }
		.links { display:flex; flex-wrap:wrap; gap:12px; margin-bottom:24px; }
		.links a { display:inline-flex; align-items:center; padding:10px 14px; border:1px solid rgba(16,23,32,.12); border-radius:999px; background:rgba(252,248,241,.82); text-decoration:none; font-weight:600; }
		.callout { margin:0 0 32px; padding:18px 20px; border:1px solid rgba(180,84,55,.22); background:rgba(180,84,55,.08); border-radius:var(--r-md); color:#6d3324; font-size:17px; line-height:1.6; }
		.scene-list { display:grid; gap:22px; }
		.scene-card { border:1px solid rgba(16,23,32,.08); border-radius:var(--r-md); background:rgba(252,248,241,.92); box-shadow:0 14px 34px rgba(16,23,32,.07); overflow:hidden; }
		.scene-meta { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; padding:18px 20px 12px; }
		.scene-kicker { color:var(--signal); font-size:13px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; margin-bottom:10px; }
		.scene-meta h2 { margin:0; font:700 34px/.98 var(--display); text-transform:uppercase; }
		.scene-time { flex:0 0 auto; display:grid; gap:6px; text-align:right; color:var(--muted); font-size:13px; }
		.scene-time b { color:var(--ink); font-family:var(--mono); font-size:14px; }
		.media-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; border-top:1px solid rgba(16,23,32,.08); border-bottom:1px solid rgba(16,23,32,.08); }
		figure { margin:0; background:rgba(255,255,255,.4); min-width:0; }
		figure + figure { border-left:1px solid rgba(16,23,32,.08); }
		.figure-label { display:flex; align-items:center; min-height:42px; padding:0 14px; border-bottom:1px solid rgba(16,23,32,.08); font:700 12px/1 var(--mono); letter-spacing:.08em; text-transform:uppercase; color:var(--muted); background:rgba(252,248,241,.82); }
		figure button { display:block; width:100%; border:0; padding:0; background:transparent; cursor:zoom-in; }
		figure img { display:block; width:100%; height:auto; }
		figcaption { padding:12px 14px; color:var(--muted); font-size:14px; background:rgba(255,255,255,.45); }
		.scene-copy { padding:18px 20px 22px; }
		.scene-copy p { margin:0 0 12px; font-size:18px; color:#1f2c37; }
		.scene-copy p:last-child { margin-bottom:0; }
		.scene-subtitle { color:var(--accent); font-weight:700; }
		.scene-proof-path { color:var(--muted); font-size:15px; }
		.scene-proof-path code { font-size:14px; }
		.lightbox { position:fixed; inset:0; display:none; place-items:center; padding:28px; background:rgba(15,23,42,.86); z-index:100; }
		.lightbox.open { display:grid; }
		.lightbox img { max-width:96vw; max-height:92vh; border-radius:8px; box-shadow:0 22px 70px rgba(0,0,0,.42); }
		@media (max-width: 900px) {
			header { padding-left:24px; padding-right:24px; }
			h1 { font-size:clamp(42px,12vw,72px); }
			.header-grid { grid-template-columns:1fr; }
			.scene-meta { display:block; }
			.scene-time { margin-top:14px; text-align:left; }
			.scene-meta h2 { font-size:28px; }
			.media-grid { grid-template-columns:1fr; }
			figure + figure { border-left:0; border-top:1px solid rgba(16,23,32,.08); }
		}
	</style>
</head>
<body>
	<header>
		<div class="eyebrow">creator cut breakdown</div>
		<h1>一条视频，拆成可直接发布的图文步骤</h1>
		<p>这个页面对应最终成片，每个镜头都保留了代表帧、时间段、标题判断和旁白，后面发博客时不用再从头拆。</p>
		<div class="header-grid">
			<section class="video-card">
				<video controls preload="metadata" src="recordings/graphify-real-demo-cut.mp4" poster="${timeline[0] ? timeline[0].frameFile : ""}"></video>
				<div class="video-copy">最终成片：${timeline.length} 个镜头，约 ${totalDurationSec.toFixed(1)} 秒，配音来自 ${htmlEscape(voiceProvider)}。</div>
			</section>
			<aside class="facts">
				<h2>Publish Pack</h2>
				<ul>
					<li>长文版：<a href="graphify-real-demo-blog.html">graphify-real-demo-blog.html</a></li>
					<li>Markdown：<a href="graphify-real-demo-blog.md">graphify-real-demo-blog.md</a></li>
					<li>Storyboard：<a href="real-demo-storyboard.json">real-demo-storyboard.json</a></li>
					<li>总时长：${htmlEscape(formatTimecode(totalDurationSec))}</li>
					<li>镜头数：${timeline.length}</li>
					${nativeProof ? `<li>原生 proof 页面：<a href="${htmlEscape(nativeProof.html)}">${htmlEscape(nativeProof.html)}</a></li>
					<li>原生 proof 视频：<a href="${htmlEscape(nativeProof.video)}">${htmlEscape(nativeProof.video)}</a></li>
					<li>原生 proof：${nativeProof.totalProofSteps} 步 / ${nativeProof.durationSec.toFixed(1)} 秒</li>` : ""}
				</ul>
			</aside>
		</div>
	</header>
	<main>
		<div class="links">
			<a href="graphify-real-demo-blog.html">打开长文页</a>
			<a href="graphify-real-demo-blog.md">打开 Markdown</a>
			<a href="real-demo-storyboard.json">打开 Storyboard</a>
			${nativeProof ? `<a href="${htmlEscape(nativeProof.html)}">打开原生 proof</a>` : ""}
		</div>
		<div class="callout">这版的重点不是再讲 README，而是直接按证据链发布：先结果，再报告，再查询，最后把 EXTRACTED / INFERRED 讲清楚。${nativeProof ? "如果有人质疑 zoom 和选区是不是后期模拟，直接看原生浏览器 proof 那条。": ""}</div>
		<section class="scene-list">
			${cards}
		</section>
	</main>
	<div class="lightbox" id="lightbox"><img alt="" /></div>
	<script>
		const box = document.getElementById("lightbox");
		const boxImg = box.querySelector("img");
		document.querySelectorAll(".zoom").forEach((button) => {
			button.addEventListener("click", () => {
				boxImg.src = button.dataset.img;
				box.classList.add("open");
			});
		});
		box.addEventListener("click", () => box.classList.remove("open"));
		document.addEventListener("keydown", (event) => {
			if (event.key === "Escape") box.classList.remove("open");
		});
	</script>
</body>
</html>`;
}

async function synthesizeSceneWithElevenLabs(scene, file) {
	const apiKey = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY;
	if (!apiKey) return false;
	const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
	const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
	const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
		method: "POST",
		headers: {
			"xi-api-key": apiKey,
			"content-type": "application/json",
			accept: "audio/mpeg",
		},
		body: JSON.stringify({
			text: scene.narration,
			model_id: modelId,
			voice_settings: {
				stability: 0.52,
				similarity_boost: 0.72,
				style: 0.16,
				use_speaker_boost: true,
			},
		}),
	});
	if (!response.ok) {
		const body = await response.text().catch(() => "");
		throw new Error(`ElevenLabs TTS failed: ${response.status} ${body}`);
	}
	const buffer = Buffer.from(await response.arrayBuffer());
	await fs.writeFile(file, buffer);
	return true;
}

async function synthesizeAudio() {
	await fs.mkdir(narrationDir, { recursive: true });
	let voiceProvider = "edge-tts";
	const narrationTempo = Number.parseFloat(process.env.NARRATION_ATEMPO || "1.16");
	try {
		const existingScript = await fs.readFile(path.join(narrationDir, "real-demo-script.md"), "utf8");
		const match = existingScript.match(/^voice_provider:\s*(.+)$/m);
		if (match?.[1]) voiceProvider = match[1].trim();
	} catch {
		// No prior narration metadata.
	}
	const files = [];
	const forceTts = process.env.FORCE_TTS === "1";
	for (let i = 0; i < scenes.length; i += 1) {
		const scene = scenes[i];
		const baseFile = path.join(narrationDir, `${String(i + 1).padStart(2, "0")}-${scene.id}.mp3`);
		const file = narrationTempo === 1
			? baseFile
			: path.join(narrationDir, `${String(i + 1).padStart(2, "0")}-${scene.id}-paced.mp3`);
		let reusedExisting = false;
		if (!forceTts) {
			try {
				await fs.access(baseFile);
				reusedExisting = true;
			} catch {
				// Fall through to synthesis.
			}
		}
		let usedElevenLabs = false;
		if (!reusedExisting) {
			try {
				usedElevenLabs = await synthesizeSceneWithElevenLabs(scene, baseFile);
			} catch (error) {
				console.warn(String(error.message || error));
			}
		}
		if (!usedElevenLabs && !reusedExisting) {
			await runAsync(process.platform === "win32" ? "python" : "python3", [
				"-m",
				"edge_tts",
				"--voice",
				"zh-CN-YunyangNeural",
				"--rate",
				"+12%",
				"--text",
				scene.narration,
				"--write-media",
				baseFile,
			]);
		} else {
			voiceProvider = "elevenlabs";
		}
		if (narrationTempo !== 1) {
			run("ffmpeg", [
				"-y",
				"-i",
				baseFile,
				"-filter:a",
				`atempo=${narrationTempo.toFixed(2)}`,
				"-c:a",
				"libmp3lame",
				"-q:a",
				"3",
				file,
			]);
		}
		scene.durationSec = Math.max(6.35, ffprobeDuration(file) + 0.18);
		files.push(file);
	}
	await fs.writeFile(
		path.join(narrationDir, "real-demo-script.md"),
		`voice_provider: ${voiceProvider}\npace: ${narrationTempo}\n\n` + scenes.map((scene, index) => `## ${index + 1}. ${scene.title}\n\n${scene.narration}`).join("\n\n"),
		"utf8",
	);
	const concatFile = path.join(narrationDir, "concat.txt");
	await fs.writeFile(concatFile, files.map((file) => `file '${file.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"), "utf8");
	const narration = path.join(narrationDir, "graphify-real-demo-narration.mp3");
	run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatFile, "-c:a", "libmp3lame", "-q:a", "3", narration]);
	return { narration, voiceProvider };
}

async function loadExistingStoryboardMeta() {
	const storyboardFile = path.join(outDir, "real-demo-storyboard.json");
	const scriptFile = path.join(narrationDir, "real-demo-script.md");
	const raw = await fs.readFile(storyboardFile, "utf8").catch(() => "");
	if (!raw) {
		throw new Error("REUSE_FINAL_VIDEO=1 requires an existing real-demo-storyboard.json.");
	}
	const parsed = JSON.parse(raw);
	const byId = new Map((parsed.scenes || []).map((scene) => [scene.id, scene]));
	for (const scene of scenes) {
		const prior = byId.get(scene.id);
		if (typeof prior?.durationSec === "number" && Number.isFinite(prior.durationSec)) {
			scene.durationSec = prior.durationSec;
		}
	}
	if (scenes.some((scene) => typeof scene.durationSec !== "number" || !Number.isFinite(scene.durationSec))) {
		throw new Error("Existing storyboard is missing scene durations required for reuse mode.");
	}
	let voiceProvider = typeof parsed.voiceProvider === "string" && parsed.voiceProvider.trim()
		? parsed.voiceProvider.trim()
		: "edge-tts";
	if (voiceProvider === "edge-tts") {
		const existingScript = await fs.readFile(scriptFile, "utf8").catch(() => "");
		const match = existingScript.match(/^voice_provider:\s*(.+)$/m);
		if (match?.[1]) voiceProvider = match[1].trim();
	}
	return { voiceProvider };
}

function stageHtml() {
	const totalDuration = scenes.reduce((sum, scene) => sum + scene.durationSec, 0);
	return `<!doctype html>
<html lang="zh-CN">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>graphify real demo cut</title>
	${fontLinks()}
	<style>
		:root { ${frameCssVars()} }
		* { box-sizing:border-box; }
		body { margin:0; overflow:hidden; background:var(--canvas); font-family:var(--body); color:var(--ink); }
		.stage { position:relative; width:1280px; height:720px; overflow:hidden; background:
			linear-gradient(180deg, rgba(245,239,230,.98), rgba(252,248,241,.94)),
			repeating-linear-gradient(90deg, rgba(16,23,32,.025) 0 1px, transparent 1px 116px); }
		.stage::before { content:""; position:absolute; inset:18px; border:1px solid rgba(16,23,32,.08); }
		.stage::after { content:""; position:absolute; inset:0; background:
			radial-gradient(circle at 83% 16%, rgba(31,94,215,.10), transparent 24%),
			radial-gradient(circle at 12% 78%, rgba(13,109,102,.10), transparent 21%); pointer-events:none; }
		.brand { position:absolute; left:36px; top:24px; display:flex; align-items:center; gap:12px; color:var(--signal); font-size:13px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; z-index:20; }
		.brand i { width:22px; height:2px; background:var(--signal); }
		.brand small { color:var(--muted); font-family:var(--mono); font-size:11px; letter-spacing:.12em; }
		.frame { position:absolute; left:38px; top:96px; width:805px; height:453px; border-radius:var(--r-md); overflow:hidden; background:white; border:1px solid rgba(16,23,32,.10); box-shadow:0 28px 76px rgba(15,23,42,.16); z-index:2; }
		.viewport { position:absolute; inset:0; overflow:hidden; background:#0f1723; }
		.media-scene { position:absolute; left:0; top:0; width:1365px; height:768px; transform-origin:top left; will-change:transform; transition:transform var(--scene-motion,7s) cubic-bezier(.16,.82,.22,1); }
		.media-scene img { position:absolute; inset:0; width:1365px; height:768px; object-fit:cover; object-position:left top; filter:saturate(1.04) contrast(1.02); }
		.frame.fade { opacity:0; transform:translateY(18px) scale(.984) rotate(-.35deg); transition:opacity .36s ease, transform .5s cubic-bezier(.2,.8,.2,1); }
		.stage.scene-on .frame.fade { opacity:1; transform:translateY(0) scale(1) rotate(0deg); }
		.panel { position:absolute; right:34px; top:76px; width:382px; min-height:418px; border:1px solid rgba(16,23,32,.10); border-radius:var(--r-md); background:rgba(252,248,241,.92); box-shadow:0 20px 56px rgba(15,23,42,.12); padding:24px 24px 22px; z-index:9; overflow:hidden; }
		.panel::before { content:""; position:absolute; top:0; left:0; width:100%; height:6px; background:linear-gradient(90deg,var(--accent),var(--signal),var(--sun)); }
		.panel::after { content:"field note"; position:absolute; right:24px; bottom:20px; color:rgba(16,23,32,.16); font-family:var(--display); font-size:44px; text-transform:uppercase; line-height:.9; pointer-events:none; }
		.panel.fade { opacity:0; transform:translateX(26px) translateY(12px); transition:opacity .34s ease, transform .5s cubic-bezier(.2,.8,.2,1); }
		.stage.scene-on .panel.fade { opacity:1; transform:translateX(0) translateY(0); }
		.kicker { display:inline-flex; align-items:center; gap:10px; margin-bottom:16px; color:var(--signal); font-size:13px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }
		.kicker::before { content:""; width:20px; height:2px; background:var(--signal); }
		h1 { margin:0; font-family:var(--display); font-size:44px; line-height:.96; letter-spacing:0; text-transform:uppercase; }
		.subtitle { margin:16px 0 0; color:#1d2732; font-size:20px; line-height:1.34; font-weight:600; max-width:295px; }
		.caption { margin:22px 0 0; color:var(--muted); font-size:15px; line-height:1.62; max-width:292px; }
		.focus, .selection, .selection-dom { position:absolute; left:var(--x); top:var(--y); width:var(--w); height:var(--h); z-index:6; pointer-events:none; opacity:0; transform:scale(.965); }
		.focus { border:4px solid rgba(31,94,215,.8); border-radius:16px; box-shadow:0 0 0 10px rgba(31,94,215,.08), 0 18px 40px rgba(31,94,215,.14); animation:focusPulse 1.7s ease-in-out infinite; }
		.selection { background:transparent; box-shadow:none; overflow:visible; }
		.selection-line {
			position:absolute;
			left:var(--lx);
			top:var(--ly);
			width:var(--lw);
			height:var(--lh);
			border-radius:4px;
			opacity:0;
			transform:scaleX(.04);
			transform-origin:left center;
			box-shadow:0 2px 8px rgba(19,56,151,.14);
			transition:
				opacity .14s ease var(--delay,0s),
				transform var(--duration,.36s) cubic-bezier(.22,.82,.2,1) var(--delay,0s),
				filter .22s ease var(--delay,0s);
			filter:saturate(.96) brightness(.98);
		}
		.selection-line::after {
			content:"";
			position:absolute;
			right:-6px;
			top:50%;
			width:10px;
			height:10px;
			border-radius:999px;
			background:inherit;
			transform:translateY(-50%);
			opacity:.9;
		}
		.selection[data-theme="dark"] .selection-line {
			background:linear-gradient(90deg, rgba(82,134,255,.72), rgba(82,134,255,.62));
			mix-blend-mode:screen;
		}
		.selection[data-theme="light"] .selection-line,
		.selection:not([data-theme]) .selection-line {
			background:linear-gradient(90deg, rgba(61,123,255,.34), rgba(61,123,255,.28));
		}
		.selection[data-theme="light"] .selection-line { box-shadow:0 2px 8px rgba(61,123,255,.1); }
		.selection-dom {
			overflow:hidden;
			color:transparent;
			white-space:pre-wrap;
			font-family:var(--mono);
			background:transparent;
		}
		.selection-dom .selection-dom-text {
			position:absolute;
			inset:0;
			padding:0;
			margin:0;
			font-family:inherit;
			font-size:var(--dom-font-size,16px);
			line-height:var(--dom-line-height,1.46);
			white-space:pre-wrap;
			letter-spacing:0;
			user-select:none;
			-webkit-user-select:none;
			color:transparent;
		}
		.selection-dom[data-theme="light"] .selection-dom-text { color:transparent; }
		.selection-dom .selection-dom-text::selection { background:rgba(79,131,255,.72); color:transparent; }
		.selection-dom[data-theme="light"] .selection-dom-text::selection { background:rgba(79,131,255,.34); color:transparent; }
		.stage.scene-on .focus, .stage.scene-on .selection, .stage.scene-on .selection-dom { opacity:1; transform:scale(1); transition:opacity .22s ease .24s, transform .34s ease .24s; }
		.stage.scene-on .selection .selection-line { opacity:1; transform:scaleX(1); filter:saturate(1.04) brightness(1.02); }
		.cursor { position:absolute; z-index:30; width:34px; height:34px; left:var(--cx,690px); top:var(--cy,300px); filter:drop-shadow(0 8px 11px rgba(15,23,42,.35)); transition:left .9s cubic-bezier(.18,.84,.22,1),top .9s cubic-bezier(.18,.84,.22,1); }
		.cursor::before { content:""; position:absolute; width:0; height:0; border-left:22px solid #111827; border-bottom:29px solid transparent; }
		.cursor::after { content:""; position:absolute; left:4px; top:5px; width:0; height:0; border-left:14px solid white; border-bottom:19px solid transparent; }
		.cursor-trail { position:absolute; z-index:29; width:18px; height:18px; border-radius:999px; background:radial-gradient(circle, rgba(31,94,215,.18), transparent 68%); left:var(--trail-x,690px); top:var(--trail-y,300px); transform:translate(-50%,-50%); transition:left 1.02s cubic-bezier(.18,.84,.22,1), top 1.02s cubic-bezier(.18,.84,.22,1), opacity .3s ease; opacity:.85; }
		.rule { position:absolute; left:868px; top:110px; width:1px; height:502px; background:linear-gradient(180deg, transparent, rgba(16,23,32,.14), transparent); z-index:9; }
		.flash { position:absolute; inset:0; background:linear-gradient(90deg, transparent 0 8%, rgba(255,255,255,.24) 18%, rgba(255,255,255,.06) 28%, transparent 40%); transform:translateX(-120%); opacity:0; pointer-events:none; z-index:18; }
		.stage.scene-on .flash { animation:sceneFlash .62s ease; }
		.progress { position:absolute; left:38px; right:38px; bottom:18px; height:5px; border-radius:999px; background:rgba(16,23,32,.10); overflow:hidden; z-index:20; }
		.progress span { display:block; height:100%; width:0; background:linear-gradient(90deg,var(--signal),var(--accent),var(--sun)); }
		.fade { opacity:0; transform:translateY(12px); transition:opacity .3s ease, transform .36s ease; }
		.stage.scene-on .fade { opacity:1; transform:translateY(0); }
		@keyframes focusPulse {
			0%,100% { box-shadow:0 0 0 10px rgba(31,94,215,.08), 0 18px 40px rgba(31,94,215,.14); }
			50% { box-shadow:0 0 0 14px rgba(31,94,215,.07), 0 24px 44px rgba(31,94,215,.18); }
		}
		@keyframes sceneFlash {
			0% { opacity:0; transform:translateX(-120%); }
			25% { opacity:1; }
			100% { opacity:0; transform:translateX(145%); }
		}
	</style>
</head>
<body>
	<div class="stage">
		<div class="brand"><i></i> graphify field report <small>volume 01</small></div>
		<div class="frame fade">
			<div class="viewport">
				<div class="media-scene">
					<img alt="" />
					<div class="focus"></div>
					<div class="selection"></div>
					<div class="selection-dom"></div>
				</div>
			</div>
		</div>
		<div class="rule"></div>
		<div class="panel fade">
			<div class="kicker"></div>
			<h1></h1>
			<div class="subtitle"></div>
			<div class="caption"></div>
		</div>
		<div class="flash"></div>
		<div class="cursor-trail"></div>
		<div class="cursor"></div>
		<div class="progress"><span></span></div>
	</div>
	<script>
		const SOURCE_W = 1365;
		const SOURCE_H = 768;
		const VIEW_W = 805;
		const VIEW_H = 453;
		const FIT_SCALE = Math.max(VIEW_W / SOURCE_W, VIEW_H / SOURCE_H);
		const scenes = ${JSON.stringify(scenes)};
		const totalDuration = ${JSON.stringify(totalDuration)};
		const stage = document.querySelector(".stage");
		const frame = document.querySelector(".frame");
		const mediaScene = document.querySelector(".media-scene");
		const img = document.querySelector(".media-scene img");
		const kicker = document.querySelector(".kicker");
		const title = document.querySelector("h1");
		const subtitle = document.querySelector(".subtitle");
		const caption = document.querySelector(".caption");
		const focus = document.querySelector(".focus");
		const selection = document.querySelector(".selection");
		const selectionDom = document.querySelector(".selection-dom");
		const cursor = document.querySelector(".cursor");
		const cursorTrail = document.querySelector(".cursor-trail");
		const progress = document.querySelector(".progress span");
		let current = -1;
		let start = performance.now();
		const offsets = [];
		scenes.reduce((sum, scene, index) => {
			offsets[index] = sum;
			return sum + scene.durationSec;
		}, 0);
		function sceneIndexAt(time) {
			for (let i = 0; i < scenes.length; i += 1) {
				if (time >= offsets[i] && time < offsets[i] + scenes[i].durationSec) return i;
			}
			return scenes.length - 1;
		}
		function clamp(value, min, max) {
			return Math.min(max, Math.max(min, value));
		}
		function fitFrame(scale, centerX, centerY) {
			const renderScale = FIT_SCALE * scale;
			const scaledW = SOURCE_W * renderScale;
			const scaledH = SOURCE_H * renderScale;
			return {
				x: clamp(VIEW_W / 2 - centerX * renderScale, VIEW_W - scaledW, 0),
				y: clamp(VIEW_H / 2 - centerY * renderScale, VIEW_H - scaledH, 0),
				scale: renderScale,
			};
		}
		function resolveCamera(scene) {
			const subject = scene.cameraBox || scene.focus || scene.selection || { x: 160, y: 120, w: 980, h: 520 };
			const bias = scene.cameraBias || {};
			const fillX = bias.fillX || 0.8;
			const fillY = bias.fillY || 0.78;
			const centerX = subject.x + subject.w / 2 + (bias.centerX || 0);
			const centerY = subject.y + subject.h / 2 + (bias.centerY || 0);
			const scaleForWidth = VIEW_W * fillX / (subject.w * FIT_SCALE);
			const scaleForHeight = VIEW_H * fillY / (subject.h * FIT_SCALE);
			const targetScale = clamp(Math.min(scaleForWidth, scaleForHeight), 1, bias.maxScale || 1.18);
			const startScale = clamp(Math.max(1, targetScale - (bias.pushIn || 0.12)), 1, targetScale);
			const end = fitFrame(targetScale, centerX, centerY);
			const start = fitFrame(
				startScale,
				centerX + (bias.startDriftX || 0),
				centerY + (bias.startDriftY || 0),
			);
			return { start, end };
		}
		function applyCamera(camera, durationSec) {
			mediaScene.style.setProperty("--scene-motion", Math.max(1.15, durationSec - 0.9).toFixed(2) + "s");
			mediaScene.style.transform = "translate3d(" + camera.start.x.toFixed(2) + "px, " + camera.start.y.toFixed(2) + "px, 0) scale(" + camera.start.scale.toFixed(4) + ")";
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					mediaScene.style.transform = "translate3d(" + camera.end.x.toFixed(2) + "px, " + camera.end.y.toFixed(2) + "px, 0) scale(" + camera.end.scale.toFixed(4) + ")";
				});
			});
		}
		function setBox(el, box) {
			if (!box) {
				el.style.display = "none";
				return;
			}
			el.style.display = "block";
			el.style.setProperty("--x", Math.round(box.x) + "px");
			el.style.setProperty("--y", Math.round(box.y) + "px");
			el.style.setProperty("--w", Math.round(box.w) + "px");
			el.style.setProperty("--h", Math.round(box.h) + "px");
		}
		function setFocusBox(scene) {
			if (!scene.focus || scene.focusVisible === false) {
				focus.style.display = "none";
				return;
			}
			setBox(focus, scene.focus);
		}
		function buildSelectionLines(scene) {
			if (!scene.selection || scene.selectionDom) {
				selection.innerHTML = "";
				selection.removeAttribute("data-theme");
				selection.style.display = "none";
				return;
			}
			setBox(selection, scene.selection);
			selection.style.display = "block";
			selection.dataset.theme = scene.selectionTheme || "";
			const lines = scene.selectionLines?.length
				? scene.selectionLines
				: [{ x: scene.selection.x, y: scene.selection.y, w: scene.selection.w, h: scene.selection.h, delay: 0.22, duration: 0.4 }];
			selection.innerHTML = lines.map((line) => {
				const relX = line.x - scene.selection.x;
				const relY = line.y - scene.selection.y;
				return '<div class="selection-line" style="--lx:' + Math.round(relX) + 'px;--ly:' + Math.round(relY) + 'px;--lw:' + Math.round(line.w) + 'px;--lh:' + Math.round(line.h) + 'px;--delay:' + (line.delay || 0) + 's;--duration:' + (line.duration || 0.36) + 's;"></div>';
			}).join("");
		}
		function clearSelectionDom() {
			selectionDom.innerHTML = "";
			selectionDom.style.display = "none";
			selectionDom.removeAttribute("data-theme");
			selectionDom.style.removeProperty("--dom-font-size");
			selectionDom.style.removeProperty("--dom-line-height");
			const selectionApi = window.getSelection ? window.getSelection() : null;
			selectionApi?.removeAllRanges();
		}
		function buildSelectionDom(scene) {
			if (!scene.selectionDom) {
				clearSelectionDom();
				return;
			}
			const box = scene.selectionDom;
			setBox(selectionDom, box);
			selectionDom.style.display = "block";
			selectionDom.dataset.theme = box.theme || "";
			selectionDom.style.setProperty("--dom-font-size", (box.fontSize || 16) + "px");
			selectionDom.style.setProperty("--dom-line-height", String(box.lineHeight || 1.46));
			selectionDom.innerHTML = '<div class="selection-dom-text">' + box.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</div>";
			const textEl = selectionDom.querySelector(".selection-dom-text");
			textEl.style.opacity = "0";
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					const selectionApi = window.getSelection ? window.getSelection() : null;
					if (!selectionApi) return;
					selectionApi.removeAllRanges();
					const walker = document.createTreeWalker(textEl, NodeFilter.SHOW_TEXT);
					const firstText = walker.nextNode();
					if (!firstText) return;
					let lastText = firstText;
					while (walker.nextNode()) lastText = walker.currentNode;
					const range = document.createRange();
					range.setStart(firstText, 0);
					range.setEnd(lastText, lastText.textContent.length);
					textEl.style.opacity = "1";
					setTimeout(() => {
						selectionApi.removeAllRanges();
						selectionApi.addRange(range);
					}, Math.round((box.delay || 0.38) * 1000));
				});
			});
		}
		function projectPoint(cameraState, point) {
			const x = frame.offsetLeft + cameraState.x + point[0] * cameraState.scale;
			const y = frame.offsetTop + cameraState.y + point[1] * cameraState.scale;
			return {
				x: clamp(x, 36, 1242),
				y: clamp(y, 62, 684),
			};
		}
		function deriveCursorPath(scene, camera) {
			if (scene.selection) {
				const inset = Math.min(22, Math.max(12, scene.selection.w * 0.05));
				return {
					from: projectPoint(camera.start, [scene.selection.x + inset, scene.selection.y + scene.selection.h / 2]),
					to: projectPoint(camera.end, [scene.selection.x + scene.selection.w - inset, scene.selection.y + scene.selection.h / 2]),
				};
			}
			if (scene.focus) {
				return {
					from: projectPoint(camera.start, [scene.focus.x + scene.focus.w * 0.74, scene.focus.y + Math.min(34, scene.focus.h * 0.16)]),
					to: projectPoint(camera.end, [scene.focus.x + scene.focus.w * 0.4, scene.focus.y + scene.focus.h * 0.56]),
				};
			}
			const from = scene.cursor?.from || [650, 320];
			const to = scene.cursor?.to || from;
			return { from: { x: from[0], y: from[1] }, to: { x: to[0], y: to[1] } };
		}
		function render(index) {
			const scene = scenes[index];
			const camera = resolveCamera(scene);
			const cursorPath = deriveCursorPath(scene, camera);
			stage.classList.remove("scene-on");
			void stage.offsetWidth;
			img.src = scene.image;
			applyCamera(camera, scene.durationSec || 7.5);
			kicker.textContent = scene.kicker;
			title.textContent = scene.title;
			subtitle.textContent = scene.subtitle;
			caption.textContent = scene.caption;
			setFocusBox(scene);
			buildSelectionLines(scene);
			buildSelectionDom(scene);
			cursor.style.setProperty("--cx", cursorPath.from.x.toFixed(1) + "px");
			cursor.style.setProperty("--cy", cursorPath.from.y.toFixed(1) + "px");
			cursorTrail.style.setProperty("--trail-x", cursorPath.from.x.toFixed(1) + "px");
			cursorTrail.style.setProperty("--trail-y", cursorPath.from.y.toFixed(1) + "px");
			stage.classList.add("scene-on");
			setTimeout(() => {
				cursor.style.setProperty("--cx", cursorPath.to.x.toFixed(1) + "px");
				cursor.style.setProperty("--cy", cursorPath.to.y.toFixed(1) + "px");
				cursorTrail.style.setProperty("--trail-x", (cursorPath.to.x - 10).toFixed(1) + "px");
				cursorTrail.style.setProperty("--trail-y", (cursorPath.to.y - 8).toFixed(1) + "px");
			}, 420);
		}
		function tick() {
			const elapsed = (performance.now() - start) / 1000;
			const idx = sceneIndexAt(elapsed);
			if (idx !== current) {
				current = idx;
				render(idx);
			}
			progress.style.width = Math.min(100, elapsed / totalDuration * 100) + "%";
			if (elapsed >= totalDuration + .35) {
				window.__REAL_DEMO_DONE__ = true;
				return;
			}
			requestAnimationFrame(tick);
		}
		Promise.resolve(document.fonts ? document.fonts.ready : null).then(() => {
			render(0);
			requestAnimationFrame(tick);
			setTimeout(() => { window.__REAL_DEMO_DONE__ = true; }, Math.ceil((totalDuration + 2) * 1000));
		});
	</script>
</body>
</html>`;
}

function blogMarkdown(data, nativeProof = null) {
	const top = data.stats.topNodes.slice(0, 6).map((node, index) => `${index + 1}. \`${node.label}\` - ${node.count} edges`).join("\n");
	return `# 我把 graphify 的真实输出打开看了一遍：AI 缺的可能不是上下文，是地图

这版我不再写成 README 介绍，而是按实测证据链来拆 graphify。

我用仓库里的 \`worked/httpx\` 样例看了四个产物：\`graph.html\`、\`GRAPH_REPORT.md\`、\`graph.json\` 和 \`graphify query\` 输出。这个样例的图谱是 ${data.stats.nodes} 个节点、${data.stats.edges} 条边、${data.stats.communities} 个社区。

![graph.html 实际渲染](screenshots/01-graph-html.png)

## 先看结果：它不是把 README 摘一遍

graphify 的重点不是“生成一张漂亮图”，而是把项目变成 Agent 可以先读、再追问、最后回到源码复核的结构。

我会把它的输出拆成三层：

- \`graph.html\`：给人看的交互地图。
- \`GRAPH_REPORT.md\`：给 Agent 先读的路线图。
- \`graph.json\`：给 query、MCP、后续工具链复用的底层图。

![输出证据链](screenshots/02-output-proof.png)

## GRAPH_REPORT.md 最像路线图

我最先看的不是安装命令，而是报告里的 god nodes。因为这些节点告诉你项目主线在哪里。

在这个 httpx 样例里，排在前面的节点是：

${top}

这比“文件树里有 auth.py、client.py、transport.py”更有用。文件树告诉你文件存在，图谱告诉你谁在连接谁。

![报告里的主线节点](screenshots/03-report-proof.png)

## query 返回的是子图，不是一句摘要

我问的是：

\`\`\`bash
graphify query "why does Client connect transport auth URL and errors"
\`\`\`

返回结果不是一段笼统解释，而是 NODE 和 EDGE 列表，里面有来源文件、行号、关系和置信度。这个形态更适合真实开发：先拿局部结构，再回到源码验证。

![query 输出](screenshots/04-query-client.png)

## 我最看重的是置信度

graphify 会把关系分成 \`EXTRACTED\` 和 \`INFERRED\`。这点比可视化本身更关键。

如果一个工具只告诉我“我发现了关系”，我还要担心它是不是在编。但如果它明确区分哪些来自原文、哪些来自模型推断，那它就更适合接入 Agent 工作流。

![关系置信度](screenshots/05-confidence.png)

## 我会怎么发布这篇内容

视频结构应该这样走：

1. 开场直接给结论：AI 缺的不是更长上下文，而是地图。
2. 展示真实输出：graph.html、GRAPH_REPORT.md、graph.json、query。
3. 放大 god nodes，让观众看到 Client / AsyncClient / Response 是主线。
4. 用 query 输出证明它能按问题捞局部结构。
5. 最后强调 EXTRACTED / INFERRED，这才是可复核的部分。

${nativeProof && nativeProof.confidenceStill ? `## 原生浏览器 proof 补足了什么

我另外补了一条原生 GitHub 页面录屏，专门解决“这个 zoom 和选区是不是后期画出来的”这个问题。

它直接在浏览器里做三步：点击、浏览器放大、鼠标拖选文本。最后把 \`EXTRACTED / INFERRED\` 那段单独保留成静态 proof 截图。

![原生浏览器里的 EXTRACTED / INFERRED 选区](${nativeProof.confidenceStill})

如果后面要发博客或发推，这条 proof 更像证据页，而不是讲解页。

` : ""}一句话结论：graphify 值得讲，不是因为它能把代码画成图，而是因为它把项目阅读变成了可追问、可复用、可复核的地图。

Source: https://github.com/kenchikuliu/graphify
`;
}

function markdownToHtml(markdown) {
	const tokens = markdown.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
	return tokens.map((block) => {
		if (block.startsWith("# ")) return `<h1>${htmlEscape(block.slice(2))}</h1>`;
		if (block.startsWith("## ")) return `<h2>${htmlEscape(block.slice(3))}</h2>`;
		if (block.startsWith("```")) {
			const code = block.replace(/^```[a-z]*\n?|\n?```$/g, "");
			return `<pre><code>${htmlEscape(code)}</code></pre>`;
		}
		if (/^!\[/.test(block)) {
			const match = block.match(/^!\[(.*?)\]\((.*?)\)$/);
			if (!match) return "";
			return `<figure><button class="zoom" data-img="${htmlEscape(match[2])}" aria-label="open image"><img src="${htmlEscape(match[2])}" alt="${htmlEscape(match[1])}" /></button><figcaption>${htmlEscape(match[1])}</figcaption></figure>`;
		}
		if (block.startsWith("- ")) {
			return `<ul>${block.split(/\n/).map((line) => `<li>${formatInline(line.replace(/^- /, ""))}</li>`).join("")}</ul>`;
		}
		if (/^\d+\.\s/m.test(block)) {
			return `<ol>${block.split(/\n/).map((line) => `<li>${formatInline(line.replace(/^\d+\.\s+/, ""))}</li>`).join("")}</ol>`;
		}
		return `<p>${formatInline(block)}</p>`;
	}).join("\n");
}

function blogHtml(markdown, nativeProof = null) {
	const proofPanel = nativeProof ? `
		<section class="proof-band">
			<article class="proof-card">
				<div class="proof-kicker">creator cut</div>
				<h2>讲解版成片</h2>
				<video controls preload="metadata" src="recordings/graphify-real-demo-cut.mp4" poster="scene-frames/01-hook.png"></video>
				<p>这条是完整讲解版，适合直接发视频平台。</p>
			</article>
			<article class="proof-card">
				<div class="proof-kicker">native proof</div>
				<h2>原生浏览器证据版</h2>
				<video controls preload="metadata" src="${htmlEscape(nativeProof.video)}" poster="${htmlEscape(nativeProof.cover)}"></video>
				<p>这条保留真实 GitHub 页面里的点击、浏览器 zoom 和文本拖选，专门回答“这个效果是不是后期模拟”。</p>
				<div class="proof-links">
					<a href="${htmlEscape(nativeProof.html)}">打开 proof 页面</a>
					<a href="${htmlEscape(nativeProof.markdown)}">查看 proof Markdown</a>
				</div>
			</article>
		</section>` : "";
	return `<!doctype html>
<html lang="zh-CN">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>graphify 实测图文</title>
	${fontLinks()}
	<style>
		:root { ${frameCssVars()} }
		body { margin:0; color:var(--ink); background:var(--canvas); font-family:var(--body); line-height:1.78; }
		body::before { content:""; position:fixed; inset:18px; border:1px solid rgba(16,23,32,.07); pointer-events:none; z-index:0; }
		a { color:var(--accent); }
		header { position:relative; padding:56px max(28px,calc((100vw - 1120px)/2)) 48px; background:
			linear-gradient(180deg, rgba(245,239,230,.94), rgba(252,248,241,.92)),
			repeating-linear-gradient(90deg, rgba(16,23,32,.03) 0 1px, transparent 1px 130px);
			border-bottom:1px solid rgba(16,23,32,.08); overflow:hidden; }
		header::after { content:""; position:absolute; right:-120px; top:56px; width:460px; height:460px; border-radius:999px; background:radial-gradient(circle, rgba(31,94,215,.12), transparent 68%); }
		header .eyebrow { position:relative; display:inline-flex; align-items:center; gap:12px; color:var(--signal); font-weight:700; margin-bottom:16px; letter-spacing:.09em; text-transform:uppercase; }
		header .eyebrow::before { content:""; width:26px; height:2px; background:var(--signal); }
		header h1 { position:relative; max-width:1040px; margin:0; font-family:var(--display); font-size:clamp(56px,7vw,108px); line-height:.92; letter-spacing:0; text-transform:uppercase; }
		header p { position:relative; max-width:760px; margin:24px 0 0; font-size:22px; color:var(--muted); font-weight:500; line-height:1.45; }
		hero-strap, .hero-strap { position:relative; display:grid; grid-template-columns:1.1fr .9fr; gap:18px; margin-top:36px; }
		hero-strap section, .hero-strap section { border:1px solid rgba(16,23,32,.08); border-radius:var(--r-md); background:rgba(252,248,241,.86); box-shadow:0 14px 36px rgba(16,23,32,.07); padding:18px 20px; }
		hero-strap b, .hero-strap b { display:block; font-family:var(--display); font-size:24px; text-transform:uppercase; line-height:1; margin-bottom:12px; }
		hero-strap p, .hero-strap p { margin:0; font-size:16px; color:var(--muted); }
		main { position:relative; max-width:920px; margin:0 auto; padding:56px 24px 96px; z-index:1; }
		h1 { margin:0 0 30px; font-family:var(--display); font-size:54px; line-height:.98; letter-spacing:0; text-transform:uppercase; }
		h2 { margin:60px 0 16px; font-family:var(--display); font-size:38px; line-height:.98; letter-spacing:0; text-transform:uppercase; }
		p, li { font-size:19px; color:#1f2c37; }
		code { font-family:var(--mono); background:rgba(31,94,215,.08); padding:2px 5px; border-radius:5px; }
		pre { padding:18px; border-radius:var(--r-md); background:#101824; color:#e5e7eb; overflow:auto; border:1px solid rgba(255,255,255,.08); }
		pre code { background:transparent; padding:0; color:inherit; }
		ul, ol { padding-left:24px; }
		figure { margin:38px 0; border:1px solid rgba(16,23,32,.08); border-radius:var(--r-md); overflow:hidden; background:rgba(252,248,241,.9); box-shadow:0 14px 34px rgba(16,23,32,.07); }
		figure button { display:block; width:100%; padding:0; border:0; cursor:zoom-in; background:transparent; }
		figure img { display:block; width:100%; height:auto; }
		figcaption { padding:12px 14px; color:var(--muted); font-size:14px; border-top:1px solid rgba(16,23,32,.08); background:rgba(255,255,255,.4); }
		.callout { margin:28px 0 36px; padding:18px 20px; border:1px solid rgba(180,84,55,.22); background:rgba(180,84,55,.08); border-radius:var(--r-md); color:#6d3324; font-size:17px; line-height:1.6; }
		.proof-band { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin:0 0 32px; }
		.proof-card { border:1px solid rgba(16,23,32,.08); border-radius:var(--r-md); background:rgba(252,248,241,.9); box-shadow:0 14px 34px rgba(16,23,32,.07); overflow:hidden; }
		.proof-card video { display:block; width:100%; background:#101824; }
		.proof-card h2 { margin:0 16px 10px; font-size:28px; }
		.proof-card p { margin:0; padding:0 16px 16px; font-size:16px; color:var(--muted); }
		.proof-kicker { padding:14px 16px 8px; color:var(--signal); font:700 12px/1 var(--mono); letter-spacing:.08em; text-transform:uppercase; }
		.proof-links { display:flex; gap:10px; flex-wrap:wrap; padding:0 16px 18px; }
		.proof-links a { display:inline-flex; align-items:center; padding:9px 12px; border:1px solid rgba(16,23,32,.12); border-radius:999px; background:rgba(255,255,255,.55); text-decoration:none; font-weight:600; font-size:14px; }
		.lightbox { position:fixed; inset:0; display:none; place-items:center; padding:28px; background:rgba(15,23,42,.86); z-index:100; }
		.lightbox.open { display:grid; }
		.lightbox img { max-width:96vw; max-height:92vh; border-radius:8px; box-shadow:0 22px 70px rgba(0,0,0,.42); }
		@media (max-width: 900px) {
			header { padding-left:24px; padding-right:24px; }
			.hero-strap { grid-template-columns:1fr; }
			.proof-band { grid-template-columns:1fr; }
			header h1 { font-size:clamp(46px,13vw,72px); }
			h1 { font-size:46px; }
			h2 { font-size:34px; }
		}
	</style>
</head>
<body>
	<header>
		<div class="eyebrow">graphify field report</div>
		<h1>AI 读项目缺的可能<br/>不是上下文，是地图</h1>
		<p>这次按真实输出拆：先看 <code>graph.html</code>，再看 <code>GRAPH_REPORT.md</code>，再看 query 如何返回局部子图。</p>
		<div class="hero-strap">
			<section>
				<b>核心判断</b>
				<p>graphify 最值得讲的，不是它能“读很多文件”，而是它能把项目阅读变成一张可以追问的地图。</p>
			</section>
			<section>
				<b>证据链</b>
				<p>graph.html / GRAPH_REPORT.md / graph.json / query output。四份产物必须互相支撑，而不是只讲观点。</p>
			</section>
		</div>
	</header>
	<main>
		<div class="callout">这篇不是“我看了 README 后的感受”，而是一次实测复盘：先看产物，再判断它是否真的适合放进 Agent 工作流。</div>
		${proofPanel}
		${markdownToHtml(markdown)}
	</main>
	<div class="lightbox" id="lightbox"><img alt="" /></div>
	<script>
		const box = document.getElementById("lightbox");
		const boxImg = box.querySelector("img");
		document.querySelectorAll("figure .zoom").forEach((button) => {
			button.addEventListener("click", () => {
				boxImg.src = button.dataset.img;
				box.classList.add("open");
			});
		});
		box.addEventListener("click", () => box.classList.remove("open"));
		document.addEventListener("keydown", (event) => {
			if (event.key === "Escape") box.classList.remove("open");
		});
	</script>
</body>
</html>`;
}

async function recordStage() {
	const playwright = await loadPlaywright();
	const browser = await launchChromium(playwright);
	await fs.mkdir(recordingsDir, { recursive: true });
	const context = await browser.newContext({
		viewport: { width: 1280, height: 720 },
		recordVideo: { dir: recordingsDir, size: { width: 1280, height: 720 } },
	});
	const page = await context.newPage();
	await page.goto(pathToFileURL(path.join(outDir, "real-demo-stage.html")).href, { waitUntil: "load" });
	const waitMs = Math.ceil((scenes.reduce((sum, scene) => sum + scene.durationSec, 0) + 4) * 1000);
	await page.waitForFunction(() => window.__REAL_DEMO_DONE__ === true, null, { timeout: waitMs });
	const video = page.video();
	await page.close();
	await context.close();
	let stageVideo = "";
	if (video) {
		const generated = await video.path();
		stageVideo = path.join(recordingsDir, "graphify-real-demo-stage.webm");
		await fs.copyFile(generated, stageVideo);
	}
	await browser.close();
	return stageVideo;
}

async function extractReviewFrames(finalMp4) {
	await fs.mkdir(path.join(outDir, "review-frames"), { recursive: true });
	const times = ["00:00:05", "00:00:18", "00:00:34", "00:00:52", "00:01:06"];
	for (let i = 0; i < times.length; i += 1) {
		run("ffmpeg", [
			"-y",
			"-ss",
			times[i],
			"-i",
			finalMp4,
			"-frames:v",
			"1",
			path.join(outDir, "review-frames", `frame-${String(i + 1).padStart(2, "0")}.png`),
		]);
	}
}

async function extractSceneFrames(finalMp4, totalDurationOverride = null) {
	const frameDir = path.join(outDir, "scene-frames");
	await fs.mkdir(frameDir, { recursive: true });
	const timeline = sceneTimeline(totalDurationOverride);
	for (const scene of timeline) {
		const probeOffset = scene.startSec + Math.max(0.8, Math.min(scene.durationSec * 0.54, scene.durationSec - 0.45));
		run("ffmpeg", [
			"-y",
			"-ss",
			probeOffset.toFixed(3),
			"-i",
			finalMp4,
			"-frames:v",
			"1",
			path.join(frameDir, `${String(scene.index).padStart(2, "0")}-${scene.id}.png`),
		]);
	}
}

async function main() {
	await fs.mkdir(assetsDir, { recursive: true });
	await fs.mkdir(recordingsDir, { recursive: true });
	const data = await loadDemoData();
	const nativeProof = await loadNativeProofMeta();
	const reuseFinalVideo = process.env.REUSE_FINAL_VIDEO === "1";
	const finalMp4 = path.join(recordingsDir, "graphify-real-demo-cut.mp4");
	await fs.writeFile(path.join(outDir, "frame.md"), frameMarkdown(), "utf8");
	await captureScreenshots(data);
	const { narration, voiceProvider } = reuseFinalVideo
		? { narration: path.join(narrationDir, "graphify-real-demo-narration.mp3"), ...(await loadExistingStoryboardMeta()) }
		: await synthesizeAudio();
	await fs.writeFile(path.join(outDir, "real-demo-stage.html"), stageHtml(), "utf8");
	const md = blogMarkdown(data, nativeProof);
	await fs.writeFile(path.join(outDir, "graphify-real-demo-blog.md"), md, "utf8");
	await fs.writeFile(path.join(outDir, "graphify-real-demo-blog.html"), blogHtml(md, nativeProof), "utf8");
	await fs.writeFile(path.join(outDir, "real-demo-storyboard.json"), JSON.stringify({ voiceProvider, scenes }, null, 2), "utf8");
	if (reuseFinalVideo) {
		await fs.access(finalMp4);
	} else {
		const stageVideo = await recordStage();
		run("ffmpeg", [
			"-y",
			"-i",
			stageVideo,
			"-i",
			narration,
			"-c:v",
			"libx264",
			"-pix_fmt",
			"yuv420p",
			"-c:a",
			"aac",
			"-b:a",
			"160k",
			"-af",
			"apad",
			"-shortest",
			"-movflags",
			"+faststart",
			finalMp4,
		]);
	}
	const finalDurationSec = ffprobeDuration(finalMp4);
	await extractReviewFrames(finalMp4);
	await extractSceneFrames(finalMp4, finalDurationSec);
	await fs.writeFile(path.join(outDir, "graphify-real-demo-scenes.md"), sceneBreakdownMarkdown(voiceProvider, finalDurationSec, nativeProof), "utf8");
	await fs.writeFile(path.join(outDir, "graphify-real-demo-scenes.html"), sceneBreakdownHtml(voiceProvider, finalDurationSec, nativeProof), "utf8");
	console.log(`voice_provider=${voiceProvider}`);
	console.log(`video=${finalMp4}`);
	console.log(`blog_html=${path.join(outDir, "graphify-real-demo-blog.html")}`);
	console.log(`blog_md=${path.join(outDir, "graphify-real-demo-blog.md")}`);
	console.log(`scene_html=${path.join(outDir, "graphify-real-demo-scenes.html")}`);
	console.log(`scene_md=${path.join(outDir, "graphify-real-demo-scenes.md")}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
