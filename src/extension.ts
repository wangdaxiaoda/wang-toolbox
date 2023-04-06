import * as vscode from "vscode"
import { STORE_KEY } from "./constants"
import {
	addToLayout,
	applyLayout,
	deleteLayout,
	saveAllEditorLayout,
	updateLayout,
} from "./extensions/editorLayout"
import { EditorLayoutDataProvider } from "./extensions/editorLayoutDataProvider"
import selectAllLines from "./extensions/selectAllLines"
import TomatoClock from "./extensions/tomatoClock"

export function activate(context: vscode.ExtensionContext) {
	// 从当前上下文中取布局记录
	const layoutDataString =
    (context.workspaceState.get(STORE_KEY) as string) ?? "[]"
	const layoutData = JSON.parse(layoutDataString) || []

	const dataProvider = new EditorLayoutDataProvider(layoutData, context)
	vscode.window.registerTreeDataProvider("editorLayout", dataProvider)

	// 无标题文件中，选中所有行
	const salCommand = vscode.commands.registerCommand(
		"wangToolbox.selectAllLines",
		selectAllLines
	)

	//#region 编辑窗口布局相关
	// 保存当前内容
	const saveAllLayoutCommand = vscode.commands.registerCommand(
		"wangToolbox.saveAllEditorLayout",
		() => saveAllEditorLayout(dataProvider)
	)

	// 删除布局
	const deleteLayoutCommand = vscode.commands.registerCommand(
		"wangToolbox.deleteLayout",
		(item) => {
			deleteLayout(item.id, dataProvider)
		}
	)

	// 应用布局
	const applyLayoutCommand = vscode.commands.registerCommand(
		"wangToolbox.applyLayout",
		applyLayout
	)

	// 添加到当前布局
	const addToLayoutCommand = vscode.commands.registerCommand("wangToolbox.addToLayout", () => addToLayout(dataProvider))

	// 更新布局
	const updateLayoutCommand = vscode.commands.registerCommand("wangToolbox.updateLayout", () => updateLayout(dataProvider))
	//#endregion

	//#region 番茄钟
	// 专注时长
	const focusTime = vscode.workspace.getConfiguration().get("tomatoClock.focusTime") as number
	// 间隙时长
	const restTime = vscode.workspace.getConfiguration().get("tomatoClock.restTime") as number
	const tomatoClock = new TomatoClock(focusTime, restTime)
	// 开始番茄钟
	const startTomatoClock = vscode.commands.registerCommand("wangToolbox.startTomatoClock", () => {
		tomatoClock.start()
	})

	// 结束番茄钟
	const finishTomatoClock = vscode.commands.registerCommand("wangToolbox.finishTomatoClock", () => {
		tomatoClock.finish()
	})
	//#endregion

	context.subscriptions.push(
		salCommand,
		saveAllLayoutCommand,
		deleteLayoutCommand,
		applyLayoutCommand,
		addToLayoutCommand,
		updateLayoutCommand,
		startTomatoClock,
		finishTomatoClock
	)
}

export function deactivate() {}
