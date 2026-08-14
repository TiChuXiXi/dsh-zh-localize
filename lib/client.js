window.__ModuleLoader__.load({
	id: "dsh-zh-localize",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		// ============================================================
		// dsh-zh-localize 浏览器端（client）半身
		// 作用：当界面语言（ctx.locale 快照的 active）为 "zh" 时，
		//   1. 翻译 / 命令菜单里内置命令的描述与输入提示；
		//   2. 翻译权限预设投影（permissions）里的选项名与描述；
		//   3. 为 t() 未命中的 key 提供兜底词典，并清理已翻译文案里残留的英文片段；
		//   4. DOM 层兜底：把硬编码标签（"Full access" 等）的精确文本节点替换为中文。
		// 语言为 en（或其他）时全部原样放行。
		// ============================================================

		// ── 内置命令描述（/ 菜单中展示，key 为命令名）───────────────
		const COMMAND_DESCRIPTIONS = {
			"permission": "切换权限预设（沙箱模式 + 审批策略）",
			"goal": "设置或查看长期任务的完成目标",
			"plan": "进入或退出计划模式",
			"compact": "压缩较早的对话历史",
			"feedback": "记录对本会话的反馈",
			"export": "将会话日志下载为 ZIP 压缩包",
			"model": "选择本会话使用的模型"
		};

		// ── 内置命令输入提示（<> 为占位符；clear/edit/pause/resume 等
		//    是需要原样输入的关键字，不翻译）───────────────────────────
		const COMMAND_HINTS = {
			"permission": "<预设>",
			"feedback": "<文本>",
			"goal": "[<目标>|clear|edit <目标>|pause|resume]"
		};

		// ── 权限预设选项名（主机下发的是机器名 kebab，如 read-only）──
		const PERMISSION_NAMES = {
			"read-only": "只读",
			"workspace-write": "写入工作区",
			"danger-full-access": "完全访问",
			"custom": "自定义",
			"Custom": "自定义"
		};

		// ── 权限预设描述（主机下发的英文描述 → 中文）────────────────
		const PERMISSION_DESCRIPTIONS = {
			"Write inside the workspace and permitted temporary directories; wider retries require approval.": "可在工作区内及允许的临时目录中写入；更广的操作需要批准。",
			"Full file access without approval prompts.": "无需批准提示即可完全访问文件。",
			"Current sandbox and approval settings do not match a preset.": "当前的沙箱与审批设置与任何预设都不匹配。"
		};

		// ── 通用兜底词典：locale.translate 未命中（返回原始 key）时 ──
		const OVERLAY = {
			"ok": "确定", "cancel": "取消", "close": "关闭", "open": "打开",
			"copy": "复制", "copied": "已复制", "paste": "粘贴",
			"save": "保存", "saved": "已保存", "delete": "删除", "deleted": "已删除",
			"edit": "编辑", "rename": "重命名", "retry": "重试", "refresh": "刷新",
			"reload": "重新加载", "search": "搜索", "filter": "筛选",
			"loading": "加载中…", "loaded": "已加载", "empty": "空", "none": "无",
			"all": "全部", "select": "选择", "selected": "已选择", "apply": "应用",
			"submit": "提交", "submitting": "正在提交…", "reset": "重置",
			"back": "返回", "next": "下一步", "previous": "上一步", "skip": "跳过",
			"done": "完成", "failed": "失败", "error": "错误", "warning": "警告",
			"success": "成功", "info": "信息", "unknown": "未知",
			"running": "运行中", "stopped": "已停止", "pending": "等待中",
			"queued": "已排队", "aborted": "已中止", "cancelled": "已取消",
			"unavailable": "不可用", "workspace": "工作区", "session": "会话",
			"settings": "设置", "language": "语言", "theme": "主题", "model": "模型",
			"permission": "权限", "command": "命令", "tool": "工具", "agent": "智能体",
			"goal": "目标", "plan": "计划", "job": "任务", "jobs": "任务",
			"status": "状态", "details": "详情", "detail": "详情", "history": "历史",
			"output": "输出", "input": "输入", "result": "结果", "summary": "摘要",
			"description": "描述", "title": "标题", "name": "名称", "value": "值",
			"size": "大小", "time": "时间", "date": "日期", "duration": "时长",
			"progress": "进度", "collapsed": "已收起", "expanded": "已展开",
			"read-only": "只读", "workspace-write": "写入工作区", "custom": "自定义",
			"full access": "完全访问"
		};

		// ── DOM 层兜底：精确文本节点替换（针对组件内硬编码的标签）──
		const DOM_LABELS = {
			"Read Only": "只读",
			"Workspace Write": "工作区写入",
			"Full access": "完全访问",
			"Full Access": "完全访问",
			"Custom": "自定义"
		};

		// t() 已命中但结果里残留的英文片段（如 zh 官方文案“确认启用 Full access？”）
		const FRAGMENTS = {
			"Full access": "完全访问",
			"Read Only": "只读",
			"Workspace Write": "工作区写入"
		};

		function isZh(locale) {
			try {
				return locale.getLocale().active === "zh";
			} catch {
				return false;
			}
		}

		function applyFragments(text) {
			let out = text;
			for (const [en, zh] of Object.entries(FRAGMENTS)) {
				if (out.includes(en)) out = out.split(en).join(zh);
			}
			return out;
		}

		// 1) 包装 locale.translate：未命中 key → OVERLAY；命中结果 → 清理英文片段
		function installTranslateOverlay(locale) {
			const original = locale.translate.bind(locale);
			locale.translate = (ns, key, params) => {
				const result = original(ns, key, params);
				if (locale.getLocale().active !== "zh") return result;
				if (result === key && Object.prototype.hasOwnProperty.call(OVERLAY, key)) {
					let text = OVERLAY[key];
					if (params) text = text.replace(/\{(\w+)\}/g, (match, name) => name in params ? String(params[name]) : match);
					return text;
				}
				return typeof result === "string" ? applyFragments(result) : result;
			};
		}

		// 2) 命令目录：/ 菜单里的描述与提示按当前语言翻译
		function installCommandTranslation(command, locale) {
			const original = command.candidates.bind(command);
			command.candidates = async (session, req) => {
				const rows = await original(session, req);
				if (!isZh(locale)) return rows;
				return rows.map((row) => {
					const next = { ...row };
					const description = COMMAND_DESCRIPTIONS[row.name];
					if (description !== void 0) next.description = description;
					const hint = COMMAND_HINTS[row.name];
					if (hint !== void 0 && row.hint !== void 0) next.hint = hint;
					return next;
				});
			};
		}

		// 3) 权限投影数据：改写 options 的 name/description（会话权限下拉 + /permission 弹层）
		function translatePermissionValue(value) {
			if (value === null || typeof value !== "object" || !Array.isArray(value.options)) return value;
			let changed = false;
			const options = value.options.map((option) => {
				if (option === null || typeof option !== "object") return option;
				const next = { ...option };
				if (typeof next.name === "string" && Object.prototype.hasOwnProperty.call(PERMISSION_NAMES, next.name)) {
					next.name = PERMISSION_NAMES[next.name];
					changed = true;
				}
				if (typeof next.description === "string" && Object.prototype.hasOwnProperty.call(PERMISSION_DESCRIPTIONS, next.description)) {
					next.description = PERMISSION_DESCRIPTIONS[next.description];
					changed = true;
				}
				return next;
			});
			return changed ? { ...value, options } : value;
		}

		function installProjectionTranslation(sessions, locale) {
			const patch = () => {
				for (const store of sessions.projectionStores.values()) {
					const proto = Object.getPrototypeOf(store);
					if (proto === null || proto === void 0 || proto.__zhLocalePatched === true) return;
					proto.__zhLocalePatched = true;
					const originalApply = proto.apply;
					proto.apply = function (key, value, seq) {
						if (key === "permissions" && isZh(locale)) value = translatePermissionValue(value);
						return originalApply.call(this, key, value, seq);
					};
					return;
				}
			};
			patch();
			// 插件激活时会话存储可能尚未创建；包裹 projectionStore，首个存储出现时即完成补丁
			const originalProjectionStore = sessions.projectionStore.bind(sessions);
			sessions.projectionStore = (sessionId) => {
				const store = originalProjectionStore(sessionId);
				patch();
				return store;
			};
		}

		// 4) DOM 兜底：硬编码标签的精确文本节点替换（仅中文模式）
		function installDomNet(locale) {
			if (typeof document === "undefined" || typeof NodeFilter === "undefined") return () => {};
			const SKIP_SELECTOR = "code, pre, script, style, textarea, input, select, [contenteditable]";
			const accept = (node) => {
				const parent = node.parentElement;
				if (parent === null) return NodeFilter.FILTER_REJECT;
				if (parent.closest(SKIP_SELECTOR) !== null) return NodeFilter.FILTER_REJECT;
				const text = node.nodeValue;
				if (typeof text !== "string") return NodeFilter.FILTER_REJECT;
				const trimmed = text.trim();
				if (trimmed.length === 0) return NodeFilter.FILTER_REJECT;
				return Object.prototype.hasOwnProperty.call(DOM_LABELS, trimmed) && DOM_LABELS[trimmed] !== trimmed
					? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
			};
			const scanRoot = (root) => {
				if (!isZh(locale)) return;
				const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: accept });
				const nodes = [];
				while (walker.nextNode()) nodes.push(walker.currentNode);
				for (const node of nodes) {
					const trimmed = node.nodeValue.trim();
					const replacement = DOM_LABELS[trimmed];
					if (replacement !== void 0) node.nodeValue = replacement;
				}
			};
			const scanAll = () => {
				if (!isZh(locale)) return;
				scanRoot(document.body);
			};
			let pendingRoots = null;
			let scheduled = false;
			let lastRun = 0;
			const flush = () => {
				scheduled = false;
				if (pendingRoots === null) return;
				const now = Date.now();
				if (now - lastRun < 200 && pendingRoots !== "all") return;
				lastRun = now;
				const roots = pendingRoots;
				pendingRoots = null;
				if (roots === "all") scanAll();
				else for (const root of roots) if (root.isConnected) scanRoot(root);
			};
			const schedule = (roots) => {
				if (roots === "all") pendingRoots = "all";
				else if (pendingRoots !== "all") {
					if (pendingRoots === null) pendingRoots = new Set();
					for (const root of roots) {
						if (root.nodeType === Node.TEXT_NODE) { if (root.parentElement) pendingRoots.add(root.parentElement); }
						else if (root.nodeType === Node.ELEMENT_NODE) pendingRoots.add(root);
					}
				}
				if (scheduled) return;
				scheduled = true;
				requestAnimationFrame(flush);
			};
			const onMutation = (records) => {
				const roots = new Set();
				for (const record of records) {
					if (record.type === "characterData") {
						if (record.target.parentElement) roots.add(record.target.parentElement);
					}
					for (const node of record.addedNodes) {
						if (node.nodeType === Node.TEXT_NODE) { if (node.parentElement) roots.add(node.parentElement); }
						else if (node.nodeType === Node.ELEMENT_NODE) roots.add(node);
					}
				}
				if (roots.size) schedule(roots);
			};
			const start = () => {
				const observer = new MutationObserver(onMutation);
				observer.observe(document.body, { childList: true, subtree: true, characterData: true });
				scanAll();
				locale.subscribe(() => schedule("all"));
				return () => observer.disconnect();
			};
			if (document.body) return start();
			document.addEventListener("DOMContentLoaded", start, { once: true });
			return () => {};
		}

		const inject = ["locale", "sessions", "commandUi"];

		function apply(ctx) {
			const locale = ctx.get("locale");
			const sessions = ctx.get("sessions");
			const command = ctx.get("commandUi");
			try {
				if (locale) installTranslateOverlay(locale);
			} catch (error) {
				console.error("[dsh-zh-localize] translate overlay failed:", error);
			}
			try {
				if (sessions && locale) installProjectionTranslation(sessions, locale);
			} catch (error) {
				console.error("[dsh-zh-localize] projection translation failed:", error);
			}
			try {
				if (command && locale) installCommandTranslation(command, locale);
			} catch (error) {
				console.error("[dsh-zh-localize] command translation failed:", error);
			}
			try {
				if (locale) installDomNet(locale);
			} catch (error) {
				console.error("[dsh-zh-localize] DOM net failed:", error);
			}
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
