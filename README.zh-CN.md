<p align="center"><img src="images/Preview image.png" alt="TabGrid 预览" width="500"></p>

# TabGrid

[English](README.md) · **简体中文** · [日本語](README.ja.md)

将桌面 Chrome 的标签页与分组整合到一个直观网格中。搜索、整理并自定义工作空间；数据保存在本地，无需账号。

## 界面一览

![TabGrid 标签页网格：页面预览与彩色分组](images/showcase/overview.png)

**轻松找到打开的标签页。** 在同一个网格中浏览页面预览和分组，搜索标题或网址，再通过筛选缩小范围。

![TabGrid 搜索与筛选：网站、分组、固定状态、播放音频和静音状态](images/showcase/search-filters.png)

**打造自己的工作空间。** 选择经典、扁平或玻璃拟态风格，切换浅色与深色模式，并自定义字体、颜色和背景。

![TabGrid 玻璃拟态外观，以及经典、扁平和玻璃拟态风格选项](images/showcase/appearance.png)

*以上为根据界面生成的 AI 示意展示图，使用示例标签页与缩略图，并非精确截图。[图片说明（英文）](docs/showcase-artwork.md)。*

## 安装

需要 **Chrome 120 或更新版本**。发布包已包含依赖和字体，无需命令行或构建步骤。

1. 下载[最新版本的 **TabGrid.zip**](https://github.com/Morikana39/TabGrid/releases/latest/download/TabGrid.zip)，或打开[发布页面](https://github.com/Morikana39/TabGrid/releases/latest)，在 **Assets** 中选择 **TabGrid.zip**。请选择这个安装包，不要下载 GitHub 自动生成的 **Source code** 源码压缩包，也不要使用 **Code → Download ZIP**。
2. 解压 `TabGrid.zip`，并将解压后的文件夹放在长期保留的位置。
3. 打开 `chrome://extensions`，开启**开发者模式**。
4. 点击**加载已解压的扩展程序**，选择解压后包含 `manifest.json` 的文件夹。
5. 在 Chrome 的扩展程序菜单（拼图图标）中固定 **TabGrid**。
6. 点击扩展图标打开 TabGrid。

图文说明见 [Chrome 安装指南](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)。更新时，从上方发布链接下载最新的 `TabGrid.zip` 并解压，用其中的文件覆盖现有安装文件夹中的文件。保留原安装文件夹，在扩展管理页面点击**重新加载**，再重新打开 TabGrid。

发布包仅保留运行所需文件及许可声明，不包含测试素材、开发截图、源码映射及未使用的依赖文件。如需从源码自行打包，请参阅下方的开发说明。

## 使用

- **打开标签页和分组**：点击标签页切换到对应页面，点击分组浏览内部标签页。分组颜色与 Chrome 一致，最近打开的标签页或分组会高亮。
- **查找标签页**：在搜索框输入内容，展开**筛选**可按网站、分组、固定状态、播放音频或静音状态筛选。使用**排序**和**卡片大小**调整视图。
- **移动卡片**：拖动可排序。将卡片覆盖到其他标签页或分组上，等待目标高亮后松开即可分组；继续移过目标远端边缘则进行排序。在分组内，拖到底部**从分组中移除**区域后松开可取消分组；停留在面板外可继续在主网格拖动。排序需使用**标签页顺序**，并清除文字搜索及非分组筛选。拖动分组默认开启，分组放置目标抽屉默认关闭。
- **滑动关闭**：在**设置 → 标签页与分组**启用后，用鼠标左右拖动卡片关闭。短距离或以垂直方向为主的拖动不会关闭卡片。点击并按住片刻可排序或分组，关闭确认和撤销仍然有效。
- **切换类别**：在类别栏下方用触控板双指水平滑动，可切换标签页、闲置标签页（启用时）及最近关闭。搜索时还会显示所有结果。每次手势切换一个类别，垂直滚动仍然可用。
- **跨窗口操作**：开启 **⋮ → 显示所有窗口**，在窗口区块之间拖动卡片，可移动标签页或整个分组。
- **批量操作**：选择 **⋮ → 选择标签页**，选中卡片后打开**编辑**。右键卡片或点击其三点按钮可操作单项。
- **关闭与恢复**：用 **×** 关闭标签页或分组。在普通窗口中可使用**撤销**恢复最近关闭项，或浏览**最近关闭**。**闲置标签页**仅分离较久未使用的标签页，不会自动关闭它们。

按 **/** 聚焦搜索框；在非文本输入区域按 **Ctrl+Z**（Windows/Linux）或 **⌘Z**（Mac）撤销；按 **Escape** 关闭菜单或对话框。

普通窗口中的分组和取消分组也支持**撤销**，提示显示在底部中央。点击静音卡片上的扬声器图标可取消静音。启用搜索历史后，点击记录旁的 **×** 可删除记录，也可以用方向键选中记录后按 **Delete**。

通过工具栏图标或 Chrome 快捷键打开 TabGrid 时，会使用同一普通或无痕环境中的已有网格，即使它位于另一个窗口。手动复制或恢复的网格会保持打开：自动关闭它们会向 Chrome 的最近关闭记录添加新条目，造成反复恢复的循环。Chrome 没有提供可将这些关闭操作排除在记录之外的扩展 API。在**设置 → 标签页与分组**中，可选的**选择标签页后关闭 TabGrid**仅在点击标签页卡片后关闭网格，默认关闭。当前视图会临时保存在浏览器会话中，供下次打开时恢复；撤销仍可用时不会自动关闭。这些可选的关闭操作也可能出现在 Chrome 的最近关闭记录中。

## 自定义

打开 **⋮ → 扩展程序设置**，有效更改会自动保存。

- **常规**：选择语言，记住搜索内容、滚动位置及窗口范围，调整搜索框焦点行为。
- **外观**：选择浅色、深色或跟随系统；选择视觉风格、颜色和字体，调整动画和卡片详情。
- **搜索与筛选**：选择搜索范围、可见筛选器及本地搜索历史（默认关闭）。
- **标签页与分组**：调整新标签页行为、关闭确认、撤销时限及闲置排除项。
- **自定义背景**：在外观中选择不超过 1 GB 的本地 JPG、PNG 或 WebP 图片，拖动预览调整位置，缩放裁剪，并调整透明度和模糊。大图会缩小至最长边不超过 2,560 像素，并以紧凑 WebP 格式保存，原文件不变。可随时替换、重置或移除。
- **预览与存储**：控制截图捕获，选择低／标准／高画质，排除网站、清除预览并设置存储上限。画质更改仅影响之后的截图，默认为标准。
- **键盘**：自定义页面快捷键，或打开 Chrome 快捷键编辑器设置**打开 TabGrid**。
- **备份**：导出本地 JSON 设置文件，或预览并应用导入。不包含浏览历史、标签页网址、截图或自定义背景图片。

界面默认跟随 Chrome 语言，支持英语、简体中文和日语。浏览器使用其他中文变体时也显示简体中文。可在**设置 → 常规 → 语言**指定语言；更改后会重新加载视图。标签页标题、分组名称、搜索内容和网站地址不会翻译。Chrome 扩展列表中的描述及命令名称跟随 Chrome 自身语言。

## 隐私与离线使用

界面、设置、字体和标签页整理均在本地运行，无需服务器或云同步。访问网站本身仍需对应网站所需的网络连接。

普通标签页打开、被激活或加载完成后，以及滚动或交互停止后，会更新预览。网页可见且聚焦时也会约每 15 秒刷新一次；Chrome 运行时另有 30 秒后台定时检查作为补充。通过工具栏图标或 Chrome 快捷键打开 TabGrid，会在切换前捕获当前页面（普通网站最多等待 250 毫秒，受限页面最多 1 秒）。该明确操作可让 Chrome 通过临时 `activeTab` 权限允许捕获新标签页、Chrome 内部页面或 Chrome 应用商店。部分页面仍可能被 Chrome 拒绝捕获，此时使用网站图标。文件页面还需要在 Chrome 中开启文件访问权限。受限页面不会注入页面脚本。

直接切换到已打开的 TabGrid 标签页会使用最近保存的预览。明确调用扩展并成功截图后，TabGrid 可在当前浏览器会话中对同一受限标签页的同一网址重试自动刷新。每次捕获仍由 Chrome 验证权限。导航、关闭标签页、清除预览或捕获被拒绝后，会清除该记录。依次访问多个新标签页后直接切换到 TabGrid，并不会授予截图权限；请在要捕获的页面处于活动状态时，点击 TabGrid 工具栏图标或使用其 Chrome 快捷键。新截图会等比缩小至不超过 960 × 600 像素，不放大小图，以减少本地预览存储；这与扩展安装包大小是两回事。网站排除项仍然生效。

TabGrid 使用 Chrome 权限管理标签页和分组、显示最近关闭项并捕获预览。预览及扩展自身的浏览相关数据保存在本地 Chrome 存储中。仅在使用时才请求书签、阅读清单及网站静音权限。

如需无痕浏览，请在 Chrome 扩展详情中启用**在无痕模式下启用**。普通与无痕标签页始终分离；无痕模式不保存截图、搜索历史或 TabGrid 撤销记录。

## 致谢

感谢以下开源项目：

- [Material Design 动效](https://m3.material.io/styles/motion)：卡片平稳回弹的参考，通过现有 AutoAnimate 动效实现。
- [Google Material Design Icons](https://github.com/google/material-design-icons)：菜单和设置图标（[Apache 2.0](assets/icons/material/LICENSE)）。
- [SortableJS](https://github.com/SortableJS/Sortable)：拖放排序（[MIT](node_modules/sortablejs/LICENSE)）。
- [FormKit AutoAnimate](https://github.com/formkit/auto-animate)：界面和卡片动画（[MIT](node_modules/@formkit/auto-animate/LICENSE)）。
- [Liquid DOM](https://github.com/AndrewPrifer/liquid-dom)：玻璃拟态控件、筛选面板、菜单、对话框及滑块的 WebGPU 背景折射和弹簧动画（[MIT](assets/licenses/liquid-dom.txt)）。使用本地图片纹理，无需实验性 HTML-in-Canvas 标志；无 WebGPU 或自定义背景时使用 CSS 回退。
- [Geist / Geist Mono](https://github.com/vercel/geist-font)、[Outfit](https://github.com/Outfitio/Outfit-Fonts)、[Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans)、[Newsreader](https://github.com/productiontype/Newsreader)：离线字体（SIL Open Font License）。
- [Chromium / Android 版 Chrome](https://chromium.googlesource.com/chromium/src/)：标签页重叠分组、排序边界及分组面板动画的行为参考。见[参考与桌面适配说明](docs/chrome-grid-interaction-research.md)及 [Chromium 许可](https://chromium.googlesource.com/chromium/src/+/main/LICENSE)。
- [Leonxlnx 的 taste-skill](https://github.com/Leonxlnx/taste-skill)：前端布局及样式参考（[MIT](assets/licenses/taste-skill.txt)）。

视觉灵感来自 [Flat UI](https://github.com/designmodo/Flat-UI)、[liquidGL](https://github.com/naughtyduk/liquidGL)、[neumorphism](https://github.com/adamgiebl/neumorphism) 和 [clay.css](https://github.com/codeAdrian/clay.css)。风格由 TabGrid 自有 CSS 实现，未包含这些项目的运行库。

打包时请保留依赖许可文件，包括单独的 Liquid DOM layout 声明。许可随依赖、[字体](assets/fonts/README.md)及 [Material 图标](assets/icons/material/README.md)一同提供。

受限页面捕获独立使用 Chrome 文档中的 [captureVisibleTab](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-captureVisibleTab) 和 [activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab) API。[Tab Thumbnails](https://chromewebstore.google.com/detail/tab-thumbnails/adcmjkdmkpfdlhinedckkklaklijifpo) 仅作为行为参考，其代码和资源未包含在本项目中；所检查的发行文件中未找到再利用许可。

## 开发

运行 `npm test` 和 `npm run check`。本地界面测试可运行 `node tests/preview-server.mjs`，然后打开 `http://127.0.0.1:4173`。测试页面使用模拟标签页。已验证行为和仍需原生浏览器检查的内容见[验证说明](docs/verification.md)。

使用 Node.js 20 或更新版本运行 `npm run package`，生成 `dist/TabGrid/` 和 `dist/TabGrid.zip`。打包器会跟踪本地运行时依赖并保留第三方声明，无需新增构建依赖。界面翻译位于 `locales/`，Chrome 元数据翻译位于 `_locales/`。各语言的占位符编号必须对应；只翻译界面消息，不翻译用户内容。
