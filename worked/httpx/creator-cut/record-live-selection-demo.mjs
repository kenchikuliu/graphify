#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = __dirname;
const recordingsDir = path.join(outDir, "recordings");
const screenshotsDir = path.join(outDir, "screenshots");
const FONT_CSS_URL = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";
const REPO_URL = "https://github.com/kenchikuliu/graphify";
const CAPTURE = {
	offsetX: 80,
	offsetY: 40,
	width: 1400,
	height: 960,
	windowWidth: 1400,
	windowHeight: 960,
	viewportWidth: 1280,
	viewportHeight: 820,
};
const OUTPUT_VIDEO = path.join(recordingsDir, "graphify-live-selection-proof.mp4");
const EVENTS_FILE = path.join(outDir, "live-selection-events.json");
const HTML_FILE = path.join(outDir, "graphify-live-selection-proof.html");
const MD_FILE = path.join(outDir, "graphify-live-selection-proof.md");

const steps = [
	{
		id: "hook",
		label: "Repo Thesis",
		mode: "video",
		probe: "it reads your files, builds a knowledge graph, and gives you back structure you didn't know was there",
		note: "我先圈这句，因为它把 graphify 的价值说得很直白：不是继续堆上下文，而是先还原结构。",
	},
	{
		id: "quote",
		label: "Compression Proof",
		mode: "video",
		probe: "graphify is the answer to that problem - 71.5x fewer tokens per query vs reading the raw files",
		note: "这一段适合做 hook。它不是抽象理念，而是直接把收益压到一句话里。",
	},
	{
		id: "pipeline",
		label: "Three Passes",
		mode: "video",
		probe: "graphify runs in three passes. First, a deterministic AST pass extracts structure from code files",
		note: "真正该放大的不是功能清单，而是这段机制说明。三段式流程决定它到底是不是工具链，而不只是可视化外壳。",
	},
	{
		id: "confidence",
		label: "Confidence Split",
		mode: "still",
		probe: "Every relationship is tagged EXTRACTED found directly in source INFERRED reasonable inference",
		note: "最后圈 EXTRACTED 和 INFERRED。这是最适合接 Agent 工作流的部分，因为它明确承认了哪些关系需要复核。",
	},
];

function htmlEscape(input) {
	return String(input ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function plainText(input) {
	return String(input || "")
		.replace(/<[^>]+>/g, " ")
		.replace(/`+/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

function escapeRegExp(value) {
	return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textProbe(input) {
	return plainText(input)
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 12)
		.join(" ");
}

function fontLinks() {
	return `<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="${FONT_CSS_URL}" rel="stylesheet" />`;
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
			// Try next resolution path.
		}
	}
	throw new Error("Playwright is required.");
}

async function launchChromium(playwright) {
	const baseArgs = [
		"--force-device-scale-factor=1",
		`--window-position=${CAPTURE.offsetX},${CAPTURE.offsetY}`,
		`--window-size=${CAPTURE.windowWidth},${CAPTURE.windowHeight}`,
	];
	const attempts = [
		{ channel: "chrome", args: baseArgs },
		{
			channel: "msedge",
			args: [
				...baseArgs,
				"--disable-features=Translate,msEdgeTranslate,msWebOOUI,msShowSearchHistoryShortcuts,msSettingsEdgeBar,EdgeMiniMenu",
			],
		},
	];
	for (const attempt of attempts) {
		try {
			return await playwright.chromium.launch({
				channel: attempt.channel,
				headless: false,
				args: attempt.args,
			});
		} catch {
			// Try next installed browser channel.
		}
	}
	throw new Error("Could not launch a visible Chromium channel.");
}

async function installCursorOverlay(context) {
	await context.addInitScript(() => {
		function mountCursor() {
			if (document.getElementById("codex-live-cursor")) return;
			const style = document.createElement("style");
			style.textContent = `
				#codex-live-cursor {
					position: fixed;
					left: 0;
					top: 0;
					width: 34px;
					height: 34px;
					z-index: 2147483647;
					pointer-events: none;
					transform: translate(-4px, -2px);
					filter: drop-shadow(0 7px 11px rgba(15, 23, 42, .46));
					transition: transform 120ms ease;
				}
				#codex-live-cursor::before {
					content: "";
					position: absolute;
					left: 0;
					top: 0;
					width: 0;
					height: 0;
					border-left: 23px solid #0f172a;
					border-bottom: 30px solid transparent;
				}
				#codex-live-cursor::after {
					content: "";
					position: absolute;
					left: 4px;
					top: 5px;
					width: 0;
					height: 0;
					border-left: 15px solid #ffffff;
					border-bottom: 20px solid transparent;
				}
				#codex-live-cursor.is-down {
					transform: translate(-4px, -2px) scale(.86);
				}
				#codex-live-cursor .ring {
					position: absolute;
					left: -9px;
					top: -9px;
					width: 30px;
					height: 30px;
					border: 2px solid rgba(37, 99, 235, .72);
					border-radius: 999px;
					opacity: 0;
					transform: scale(.7);
				}
				#codex-live-cursor.is-down .ring {
					opacity: 1;
					transform: scale(1.35);
				}
			`;
			document.documentElement.appendChild(style);
			const cursor = document.createElement("div");
			cursor.id = "codex-live-cursor";
			cursor.innerHTML = '<span class="ring"></span>';
			document.documentElement.appendChild(cursor);
			document.addEventListener("mousemove", (event) => {
				cursor.style.left = event.clientX + "px";
				cursor.style.top = event.clientY + "px";
			}, true);
			document.addEventListener("mousedown", () => cursor.classList.add("is-down"), true);
			document.addEventListener("mouseup", () => cursor.classList.remove("is-down"), true);
		}
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", mountCursor, { once: true });
		} else {
			mountCursor();
		}
	});
}

async function waitForRepoText(page) {
	await page.waitForFunction(
		() => {
			const text = document.body ? document.body.innerText : "";
			return text.includes("graphify runs in three passes")
				&& text.includes("71.5x fewer tokens per query");
		},
		null,
		{ timeout: 25000 },
	);
}

async function locatorBox(locator) {
	try {
		return await locator.boundingBox({ timeout: 1000 });
	} catch {
		return null;
	}
}

async function wheelToVisible(page, locator, label) {
	await locator.waitFor({ state: "attached", timeout: 20000 });
	const viewport = page.viewportSize() || { width: CAPTURE.viewportWidth, height: CAPTURE.viewportHeight };
	await page.mouse.move(viewport.width - 120, viewport.height - 100, { steps: 12 });
	for (let attempt = 0; attempt < 72; attempt += 1) {
		const box = await locatorBox(locator);
		if (box && box.y >= 112 && box.y + Math.min(box.height, 180) <= viewport.height - 110) {
			return box;
		}
		const delta = box && box.y < 112 ? -360 : 420;
		await page.mouse.move(viewport.width - 120, viewport.height - 100, { steps: 5 });
		await page.mouse.wheel(0, delta);
		await page.waitForTimeout(250);
	}
	throw new Error(`Could not bring target into view by mouse-wheel navigation: ${label}`);
}

function readmeSelectors() {
	return [
		"[data-testid='readme'] p, [data-testid='readme'] li, [data-testid='readme'] blockquote",
		"article.markdown-body p, article.markdown-body li, article.markdown-body blockquote",
		".markdown-body p, .markdown-body li, .markdown-body blockquote",
		"#readme p, #readme li, #readme blockquote",
		"main p, main li, main blockquote",
		"body p, body li, body blockquote",
	];
}

function buildProbePattern(probe) {
	const tokens = textProbe(probe)
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 10)
		.map((token) => escapeRegExp(token));
	if (!tokens.length) return null;
	return new RegExp(tokens.join("[\\s\\S]{0,24}?"), "i");
}

async function findTextBlock(page, step) {
	const pattern = buildProbePattern(step.probe);
	if (!pattern) return null;
	for (const selector of readmeSelectors()) {
		const locator = page.locator(selector).filter({ hasText: pattern }).first();
		if (await locator.count()) return locator;
	}
	return null;
}

async function slowMove(page, from, to, steps = 28, delayMs = 22) {
	for (let i = 1; i <= steps; i += 1) {
		const t = i / steps;
		const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
		const x = from.x + (to.x - from.x) * eased;
		const y = from.y + (to.y - from.y) * eased;
		await page.mouse.move(x, y, { steps: 2 });
		await page.waitForTimeout(delayMs);
	}
}

async function browserZoom(page, direction, steps = 1) {
	const modifier = process.platform === "darwin" ? "Meta" : "Control";
	const key = direction === "in" ? "=" : direction === "reset" ? "0" : "-";
	await page.keyboard.down(modifier);
	for (let i = 0; i < steps; i += 1) {
		await page.keyboard.press(key);
		await page.waitForTimeout(260);
	}
	await page.keyboard.up(modifier);
	await page.waitForTimeout(620);
}

async function clickToZoom(page, block, label) {
	const box = await wheelToVisible(page, block, `${label} click target`);
	const viewport = page.viewportSize() || { width: CAPTURE.viewportWidth, height: CAPTURE.viewportHeight };
	const target = {
		x: Math.max(44, Math.min(viewport.width - 58, box.x + Math.min(box.width * 0.42, 560))),
		y: Math.max(120, Math.min(viewport.height - 124, box.y + Math.min(34, Math.max(18, box.height * 0.24)))),
	};
	await page.mouse.move(target.x - 70, target.y + 26, { steps: 18 });
	await page.waitForTimeout(220);
	await page.mouse.move(target.x, target.y, { steps: 12 });
	await page.waitForTimeout(180);
	await page.mouse.down();
	await page.waitForTimeout(180);
	await page.mouse.up();
	await page.waitForTimeout(420);
	await browserZoom(page, "in", 2);
}

async function dragSelectText(page, block, label) {
	const box = await wheelToVisible(page, block, label);
	const viewport = page.viewportSize() || { width: CAPTURE.viewportWidth, height: CAPTURE.viewportHeight };
	const startX = Math.max(22, Math.min(viewport.width - 44, box.x + 5));
	const startY = Math.max(100, Math.min(viewport.height - 124, box.y + Math.min(24, Math.max(16, box.height * 0.18))));
	const endX = Math.max(startX + 240, Math.min(viewport.width - 40, box.x + Math.min(box.width - 10, 980)));
	const endY = Math.max(startY + 20, Math.min(viewport.height - 86, box.y + Math.min(box.height - 8, 88)));

	await page.mouse.move(startX - 18, startY - 12, { steps: 12 });
	await page.waitForTimeout(260);
	await page.mouse.move(startX, startY, { steps: 8 });
	await page.waitForTimeout(180);
	await page.mouse.down();
	await page.waitForTimeout(160);
	const mid1 = { x: endX * 0.5 + startX * 0.5, y: startY + 8 };
	const mid2 = { x: endX * 0.78 + startX * 0.22, y: endY - 10 };
	await slowMove(page, { x: startX, y: startY }, mid1, 18, 20);
	await slowMove(page, mid1, mid2, 22, 20);
	await slowMove(page, mid2, { x: endX, y: endY }, 28, 20);
	await page.waitForTimeout(500);
	await page.mouse.up();
	await page.waitForTimeout(1100);
	return {
		x: Math.round(startX),
		y: Math.round(startY),
		width: Math.round(endX - startX),
		height: Math.round(Math.max(34, endY - startY)),
	};
}

async function clearSelection(page) {
	await page.mouse.move(220, 92, { steps: 10 });
	await page.waitForTimeout(160);
	await page.mouse.click(220, 92);
	await page.waitForTimeout(320);
}

async function startCapture() {
	await fs.mkdir(recordingsDir, { recursive: true });
	await fs.rm(OUTPUT_VIDEO, { force: true });
	const args = [
		"-y",
		"-f",
		"gdigrab",
		"-framerate",
		"30",
		"-offset_x",
		String(CAPTURE.offsetX),
		"-offset_y",
		String(CAPTURE.offsetY),
		"-video_size",
		`${CAPTURE.width}x${CAPTURE.height}`,
		"-draw_mouse",
		"0",
		"-i",
		"desktop",
		"-c:v",
		"libx264",
		"-preset",
		"veryfast",
		"-crf",
		"18",
		"-pix_fmt",
		"yuv420p",
		"-movflags",
		"+faststart",
		OUTPUT_VIDEO,
	];
	const child = spawn("ffmpeg", args, {
		stdio: ["pipe", "inherit", "inherit"],
		shell: false,
	});
	await new Promise((resolve, reject) => {
		child.once("error", reject);
		setTimeout(resolve, 1200);
	});
	return child;
}

async function stopCapture(child) {
	if (!child) return;
	if (child.exitCode !== null || child.killed) return;
	await new Promise((resolve, reject) => {
		child.once("exit", (code) => {
			if (code === 0 || code === 255) resolve();
			else reject(new Error(`ffmpeg exited with ${code}`));
		});
		if (child.stdin && !child.stdin.destroyed) {
			child.stdin.write("q");
			child.stdin.end();
		}
	});
}

function proofMarkdown(events, durationSec) {
	return `# graphify Native Selection Proof

这条视频不是 staged creator cut，而是直接录 GitHub 页面上的真实鼠标动作、浏览器缩放和原生蓝色选区。

- 视频：\`recordings/graphify-live-selection-proof.mp4\`
- 页面：\`https://github.com/kenchikuliu/graphify\`
- 长文页：\`graphify-real-demo-blog.html\`
- 拆镜头页：\`graphify-real-demo-scenes.html\`
- 总时长：\`${durationSec.toFixed(1)}s\`
- 步骤数：\`${events.length}\`

${events.map((event, index) => `## ${index + 1}. ${event.label}

![${event.label}](${event.screenshot})

- 时间：${event.startSec.toFixed(1)}s - ${event.endSec.toFixed(1)}s
- 选区：x=${event.selection.x}, y=${event.selection.y}, w=${event.selection.width}, h=${event.selection.height}
- 说明：${event.note}
`).join("\n")}
`;
}

function proofHtml(events, durationSec) {
	const confidenceStill = "screenshots/live-selection-confidence.png";
	const stepChips = [
		...events.map((event, index) => `<a href="#step-${index + 1}">${String(index + 1).padStart(2, "0")}. ${htmlEscape(event.label)}</a>`),
		`<a href="#step-confidence">04. Confidence Split</a>`,
	].join("");
	const cards = events.map((event, index) => `
		<article class="step-card" id="step-${index + 1}">
			<div class="step-meta">
				<div>
					<div class="step-kicker">native proof</div>
					<h2>${String(index + 1).padStart(2, "0")}. ${htmlEscape(event.label)}</h2>
				</div>
				<div class="step-time">${htmlEscape(event.startSec.toFixed(1))}s - ${htmlEscape(event.endSec.toFixed(1))}s</div>
			</div>
			<figure>
				<img src="${htmlEscape(event.screenshot)}" alt="${htmlEscape(event.label)}" />
				<figcaption>${htmlEscape(event.note)}</figcaption>
			</figure>
		</article>
	`).join("\n");
	return `<!doctype html>
<html lang="zh-CN">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>graphify native selection proof</title>
	${fontLinks()}
	<style>
		:root {
			--canvas:#f5efe6;
			--paper:#fcf8f1;
			--ink:#101720;
			--muted:#5f6b76;
			--line:#d7ccb9;
			--accent:#1f5ed7;
			--signal:#0d6d66;
			--clay:#b45437;
			--display:"IBM Plex Sans Condensed","Arial Narrow",sans-serif;
			--body:"IBM Plex Sans","Segoe UI",sans-serif;
			--mono:"IBM Plex Mono",Consolas,monospace;
		}
		* { box-sizing:border-box; }
		body { margin:0; background:var(--canvas); color:var(--ink); font-family:var(--body); line-height:1.75; }
		body::before { content:""; position:fixed; inset:18px; border:1px solid rgba(16,23,32,.07); pointer-events:none; }
		a { color:var(--accent); }
		header { padding:56px max(28px,calc((100vw - 1120px)/2)) 42px; background:
			linear-gradient(180deg, rgba(245,239,230,.95), rgba(252,248,241,.92)),
			repeating-linear-gradient(90deg, rgba(16,23,32,.03) 0 1px, transparent 1px 130px);
			border-bottom:1px solid rgba(16,23,32,.08); }
		.eyebrow { display:inline-flex; align-items:center; gap:12px; color:var(--signal); font-weight:700; letter-spacing:.09em; text-transform:uppercase; }
		.eyebrow::before { content:""; width:26px; height:2px; background:var(--signal); }
		h1 { margin:16px 0 18px; max-width:980px; font:700 clamp(48px,6vw,92px)/.94 var(--display); text-transform:uppercase; }
		header p { max-width:780px; margin:0; color:var(--muted); font-size:21px; font-weight:500; }
		.header-grid { display:grid; grid-template-columns:1.18fr .82fr; gap:18px; margin-top:30px; }
		.video-card, .facts { border:1px solid rgba(16,23,32,.08); border-radius:14px; background:rgba(252,248,241,.88); box-shadow:0 14px 36px rgba(16,23,32,.07); overflow:hidden; }
		.video-card video { display:block; width:100%; background:#111827; }
		.video-card .video-copy { padding:14px 16px 18px; color:var(--muted); font-size:15px; }
		.facts { padding:18px 20px; }
		.facts h2 { margin:0 0 12px; font:700 24px/1 var(--display); text-transform:uppercase; }
		.facts ul { margin:0; padding-left:18px; }
		.facts li { margin:0 0 10px; font-size:16px; color:#1f2c37; }
		main { max-width:1040px; margin:0 auto; padding:42px 24px 92px; }
		.links { display:flex; flex-wrap:wrap; gap:12px; margin:0 0 24px; }
		.links a { display:inline-flex; align-items:center; padding:10px 14px; border:1px solid rgba(16,23,32,.12); border-radius:999px; background:rgba(252,248,241,.82); text-decoration:none; font-weight:600; }
		.callout { margin:0 0 32px; padding:18px 20px; border:1px solid rgba(180,84,55,.22); background:rgba(180,84,55,.08); border-radius:14px; color:#6d3324; font-size:17px; line-height:1.6; }
		.proof-split { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin:0 0 24px; }
		.proof-card { border:1px solid rgba(16,23,32,.08); border-radius:14px; background:rgba(252,248,241,.88); box-shadow:0 14px 34px rgba(16,23,32,.07); padding:18px 20px; }
		.proof-card h2 { margin:0 0 10px; font:700 28px/1 var(--display); text-transform:uppercase; }
		.proof-card p { margin:0; font-size:16px; color:var(--muted); }
		.proof-card .card-kicker { color:var(--signal); font:700 12px/1 var(--mono); letter-spacing:.08em; text-transform:uppercase; margin-bottom:10px; }
		.step-chips { display:flex; flex-wrap:wrap; gap:10px; margin:0 0 24px; }
		.step-chips a { display:inline-flex; align-items:center; padding:9px 12px; border:1px solid rgba(16,23,32,.12); border-radius:999px; background:rgba(255,255,255,.55); text-decoration:none; font-weight:600; font-size:14px; }
		.step-list { display:grid; gap:22px; }
		.step-card { border:1px solid rgba(16,23,32,.08); border-radius:14px; background:rgba(252,248,241,.92); box-shadow:0 14px 34px rgba(16,23,32,.07); overflow:hidden; }
		.step-meta { display:flex; justify-content:space-between; gap:18px; padding:18px 20px 12px; }
		.step-kicker { color:var(--signal); font-size:13px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; margin-bottom:10px; }
		.step-meta h2 { margin:0; font:700 34px/.98 var(--display); text-transform:uppercase; }
		.step-time { color:var(--muted); font-family:var(--mono); font-size:14px; white-space:nowrap; }
		figure { margin:0; border-top:1px solid rgba(16,23,32,.08); }
		figure img { display:block; width:100%; height:auto; }
		figcaption { padding:12px 14px; color:var(--muted); font-size:15px; border-top:1px solid rgba(16,23,32,.08); background:rgba(255,255,255,.45); }
		@media (max-width: 900px) {
			header { padding-left:24px; padding-right:24px; }
			h1 { font-size:clamp(42px,12vw,72px); }
			.header-grid { grid-template-columns:1fr; }
			.proof-split { grid-template-columns:1fr; }
			.step-meta { display:block; }
			.step-time { margin-top:12px; display:block; }
			.step-meta h2 { font-size:28px; }
		}
	</style>
</head>
<body>
	<header>
		<div class="eyebrow">native browser proof</div>
		<h1>这条 proof video 用的是真实 GitHub 页面</h1>
		<p>不是后期模拟选区，也不是 HTML 里画上去的框。这里直接录浏览器里的真实鼠标、真实缩放和原生蓝色文本选区。</p>
		<div class="header-grid">
			<section class="video-card">
				<video controls preload="metadata" src="recordings/graphify-live-selection-proof.mp4" poster="screenshots/live-selection-cover.png"></video>
				<div class="video-copy">总时长约 ${durationSec.toFixed(1)} 秒。每一步都来自真实 README 页面上的鼠标点击、浏览器 zoom 和文本拖选。</div>
			</section>
			<aside class="facts">
				<h2>Proof Pack</h2>
				<ul>
					<li>视频：<a href="recordings/graphify-live-selection-proof.mp4">graphify-live-selection-proof.mp4</a></li>
					<li>事件：<a href="live-selection-events.json">live-selection-events.json</a></li>
					<li>Markdown：<a href="graphify-live-selection-proof.md">graphify-live-selection-proof.md</a></li>
					<li>长文页：<a href="graphify-real-demo-blog.html">graphify-real-demo-blog.html</a></li>
					<li>拆镜头页：<a href="graphify-real-demo-scenes.html">graphify-real-demo-scenes.html</a></li>
					<li>来源：<a href="${htmlEscape(REPO_URL)}">${htmlEscape(REPO_URL)}</a></li>
					<li>live steps：${events.length}</li>
					<li>proof items：${events.length + 1}</li>
				</ul>
			</aside>
		</div>
	</header>
	<main>
		<div class="callout">这条 proof 的用途很明确：补足 creator cut 里最容易被质疑的部分，也就是“选区和 zoom 是不是原生浏览器效果”。</div>
		<div class="links">
			<a href="graphify-real-demo-blog.html">打开长文页</a>
			<a href="graphify-real-demo-scenes.html">打开拆镜头页</a>
			<a href="graphify-live-selection-proof.md">打开 proof Markdown</a>
			<a href="live-selection-events.json">打开 events JSON</a>
		</div>
		<section class="proof-split">
			<article class="proof-card">
				<div class="card-kicker">creator cut</div>
				<h2>讲判断和节奏</h2>
				<p>主视频适合直接发平台，因为它把论点、例子和节奏都整理好了，观众不需要知道每一步鼠标是怎么动的。</p>
			</article>
			<article class="proof-card">
				<div class="card-kicker">native proof</div>
				<h2>讲原生动作证据</h2>
				<p>proof 页则专门保留原生浏览器里的点击、缩放和拖选过程。要发博客、推文或回评论区时，它比成片更像证据库。</p>
			</article>
		</section>
		<nav class="step-chips">${stepChips}</nav>
		<section class="step-list">
			${cards}
			<article class="step-card" id="step-confidence">
				<div class="step-meta">
					<div>
						<div class="step-kicker">static proof</div>
						<h2>04. Confidence Split</h2>
					</div>
					<div class="step-time">still frame</div>
				</div>
				<figure>
					<img src="${confidenceStill}" alt="Confidence Split" />
					<figcaption>最后这张静态 proof 单独保留 EXTRACTED / INFERRED 的真实浏览器选区，避免长录屏在这一段变得拖沓。</figcaption>
				</figure>
			</article>
		</section>
	</main>
</body>
</html>`;
}

async function main() {
	await fs.mkdir(recordingsDir, { recursive: true });
	await fs.mkdir(screenshotsDir, { recursive: true });

	const playwright = await loadPlaywright();
	const browser = await launchChromium(playwright);
	const context = await browser.newContext({
		viewport: { width: CAPTURE.viewportWidth, height: CAPTURE.viewportHeight },
		deviceScaleFactor: 1,
	});
	await installCursorOverlay(context);
	const page = await context.newPage();
	await page.goto(REPO_URL, { waitUntil: "domcontentloaded", timeout: 90000 });
	await waitForRepoText(page);
	await page.waitForTimeout(2200);
	await page.bringToFront();
	await page.mouse.move(180, 145, { steps: 16 });
	await page.waitForTimeout(450);

	const capture = await startCapture();
	const startedAt = Date.now();
	const elapsed = () => (Date.now() - startedAt) / 1000;
	const events = [];
	const videoSteps = steps.filter((step) => step.mode === "video");
	const stillSteps = steps.filter((step) => step.mode === "still");

	try {
		await page.waitForTimeout(900);
		for (const step of videoSteps) {
			const block = await findTextBlock(page, step);
			if (!block || !(await block.count())) continue;
			const startSec = elapsed();
			await clickToZoom(page, block, step.label);
			const selection = await dragSelectText(page, block, step.label);
			const screenshot = `screenshots/live-selection-${step.id}.png`;
			await page.screenshot({ path: path.join(outDir, screenshot), fullPage: false });
			if (events.length === 0) {
				await fs.copyFile(path.join(outDir, screenshot), path.join(screenshotsDir, "live-selection-cover.png"));
			}
			await page.waitForTimeout(700);
			await browserZoom(page, "reset", 1);
			await clearSelection(page);
			await page.waitForTimeout(420);
			events.push({
				id: step.id,
				label: step.label,
				note: step.note,
				probe: step.probe,
				screenshot,
				selection,
				startSec,
				endSec: elapsed(),
			});
		}
		await page.waitForTimeout(1200);
		await stopCapture(capture);
		for (const step of stillSteps) {
			const block = await findTextBlock(page, step);
			if (!block || !(await block.count())) continue;
			await clickToZoom(page, block, step.label);
			await dragSelectText(page, block, step.label);
			await page.screenshot({ path: path.join(outDir, `screenshots/live-selection-${step.id}.png`), fullPage: false });
			await browserZoom(page, "reset", 1);
			await clearSelection(page);
			await page.waitForTimeout(300);
		}
	} finally {
		await stopCapture(capture).catch(() => {});
		await page.close().catch(() => {});
		await context.close().catch(() => {});
		await browser.close().catch(() => {});
	}

	const durationSec = ffprobeDuration(OUTPUT_VIDEO);
	const payload = {
		source: REPO_URL,
		generatedAt: new Date().toISOString(),
		durationSec,
		capture: CAPTURE,
		video: path.relative(outDir, OUTPUT_VIDEO).replace(/\\/g, "/"),
		events,
	};
	await fs.writeFile(EVENTS_FILE, JSON.stringify(payload, null, 2), "utf8");
	await fs.writeFile(MD_FILE, proofMarkdown(events, durationSec), "utf8");
	await fs.writeFile(HTML_FILE, proofHtml(events, durationSec), "utf8");
	console.log(`video=${OUTPUT_VIDEO}`);
	console.log(`events=${EVENTS_FILE}`);
	console.log(`html=${HTML_FILE}`);
	console.log(`markdown=${MD_FILE}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
