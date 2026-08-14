# dsh-zh-localize

DSH（DeepSeek Harness）中文化自定义插件：当界面语言设置为中文（`locale` 为 `zh`）时，把 Web 界面里仍然显示英文的文案翻译成对应的中文；语言为英文时原样放行，不影响任何功能。

## 功能

- **权限预设翻译**：`Read Only` → `只读`、`Workspace Write` → `工作区写入`、`Full access` → `完全访问`、`Custom` → `自定义`（设置页权限行、会话输入栏权限选择器、`/permission` 弹层）
- **内置命令翻译**：`/` 菜单中内置命令的描述与输入提示（`/permission`、`/goal`、`/plan`、`/compact`、`/feedback`、`/export`、`/model`）
- **通用兜底词典**：`t()` 未命中的 key 提供中文兜底，并清理已翻译文案里残留的英文片段（如官方 zh 文案“确认启用 Full access？”→“确认启用完全访问？”）
- **DOM 精确兜底**：针对组件内硬编码的权限标签做精确文本节点替换（跳过代码块/输入框等区域，避免误伤会话内容）

> 命令名（如 `/permission`）是输入到输入框的机器标识，保持英文不变以保证可执行；翻译的是菜单里展示的描述与提示。

## 安装

### 从 npm 安装（推荐）

```bash
# 在 dsh web profile 中安装
dsh plugin --profile web add dsh-zh-localize
```

安装完成后**重启 dsh web**，在设置 → 通用 → 语言中选择“中文”即可生效。

### 从本地源码安装（开发调试）

```bash
# 在插件目录的父目录执行
dsh plugin --profile web add ./dsh-zh-localize
```

> Windows 注意：pnpm 在 Windows 上对跨盘绝对路径的 `link:`/`file:` 规格可能生成错误的链接。若 `dsh plugin` 提示 `dsh-zh-localize declares no dsh.bundle`，手动修复链接后重试：
>
> ```powershell
> # 以 profile 目录为例
> Remove-Item "$env:USERPROFILE\.dsh\profiles\web\node_modules\dsh-zh-localize" -Force
> New-Item -ItemType Junction -Path "$env:USERPROFILE\.dsh\profiles\web\node_modules\dsh-zh-localize" -Target "<本插件绝对路径>"
> ```

## 工作原理

插件是一个同时声明 `dsh.bundle.patch`（host 层）与 `dsh.client`（浏览器层）的包：

- `cordis.patch.yml`：向 web 组合树插入一条 loader 行 `zh-localize`
- `lib/index.js`：host 半身（空插件，使 loader 行成立）
- `lib/client.js`：浏览器半身，四个钩子：
  1. 包装 `locale.translate`（未命中 key → 兜底词典；命中结果 → 英文片段清理）
  2. 覆盖 `commandUi.candidates`（按当前语言翻译命令描述与提示）
  3. 补丁 `ProjectionValueStore.prototype.apply`（翻译 `permissions` 投影的选项名/描述）
  4. MutationObserver DOM 兜底（硬编码权限标签的精确文本节点替换）

## 自定义

编辑 `lib/client.js` 顶部的词典即可增改翻译：

- `COMMAND_DESCRIPTIONS` / `COMMAND_HINTS`：命令描述与提示
- `PERMISSION_NAMES` / `PERMISSION_DESCRIPTIONS`：权限预设名与描述
- `OVERLAY`：`t()` 未命中 key 的兜底词典
- `DOM_LABELS`：DOM 精确文本兜底
- `FRAGMENTS`：已翻译文案中的英文片段替换

修改后重启 dsh web 生效。

## 文件结构

```
dsh-zh-localize/
├── package.json        # dsh.bundle + dsh.client 声明
├── cordis.patch.yml    # bundle patch（插入 loader 行）
├── README.md
├── LICENSE             # MIT
└── lib/
    ├── index.js        # host 半身
    └── client.js       # 浏览器半身（核心逻辑）
```

## License

[MIT](LICENSE)
