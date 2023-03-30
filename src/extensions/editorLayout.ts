// 编辑窗口布局
import * as vscode from "vscode"
import {
	getColumnID,
	isValidArray,
	getFileID,
	getLastTwoFilepath,
} from "../util"
import {
	ColumnItem,
	EditorItem,
	EditorLayoutDataProvider,
	FileItem,
	RootItem,
} from "./editorLayoutDataProvider"

/**
 * 保存布局
 * @param itemID 节点 id
 */
function saveLayout(itemID: string) {
	const rootItem = new RootItem(itemID)
	rootItem.contextValue = "root"

	const { all } = vscode.window.tabGroups
	all.forEach((item) => {
		const { viewColumn, tabs } = item
		if (!isValidArray(tabs)) return
		// 创建 column 节点
		const columnID = getColumnID(itemID, viewColumn)
		const columnItem = new ColumnItem(
			columnID,
			`column ${viewColumn}`,
			viewColumn
		)
		rootItem.children?.push(columnItem)
		// 遍历 tabs 创建 file 节点
		tabs.forEach((tab) => {
			const inputInfo: { uri: vscode.Uri } = tab.input as any
			// TODO: 这边之后需要加一个过滤规则，把 untitled、预览的、非当前项目的 都排除
			if (!inputInfo?.uri?.path) return

			// 取文件绝对路径的最后两个部分
			// TODO: 这个地方可以优化一下，不超出当前项目根目录
			const filePath = inputInfo.uri.path
			const lastFilename = getLastTwoFilepath(filePath)
			// 创建 file 节点
			const fileID = getFileID(itemID, viewColumn, lastFilename)
			const fileItem = new FileItem(fileID, lastFilename, filePath)
			columnItem.children?.push(fileItem)
		})
	})

	return rootItem
}

/**
 * 保存当前的编辑窗口布局
 */
export async function saveAllEditorLayout(
	dataProvider: EditorLayoutDataProvider,
): Promise<void> {
	// 由用户输入 布局 名称
	const editorLayoutName = await vscode.window.showInputBox({
		title: "布局分组名称输入框",
		placeHolder: "请输入布局分组名称",
	})

	// 如果已存在，则不操作
	if (!editorLayoutName || dataProvider.isExistLayout(editorLayoutName)) {
		vscode.window.showErrorMessage("设置的布局名称不合法，请修改！")
		return
	}
	if (!isValidArray(vscode.window.tabGroups?.all)) return

	const rootItem = saveLayout(editorLayoutName)
	// 添加数据，刷新
	dataProvider.data.push(rootItem)
	dataProvider.saveData()
}

/**
 * 根据 ID 删除节点
 */
function deleteByID(items: EditorItem[], id: string) {
	for (let index = 0; index < items.length; index++) {
		const item = items[index]
		// 当前节点是否为目标节点
		if (id === item.id) {
			items.splice(index, 1)
			return true
		}
		// 遍历子
		if (isValidArray(item.children) && deleteByID(item.children ?? [], id))
			return true
	}
}

/**
 * 删除布局
 */
export function deleteLayout(
	itemID: string,
	dataProvider: EditorLayoutDataProvider,
) {
	// 找到指定布局，然后删除
	const cloneData = [...dataProvider.data]
	deleteByID(cloneData, itemID)

	// 添加数据，刷新
	dataProvider.data = cloneData
	dataProvider.saveData()
}

/**
 * 应用布局
 */
export function applyLayout(openItem: RootItem) {
	// 关闭所有编辑器
	vscode.commands.executeCommand("workbench.action.closeAllEditors")
	// 然后读取配置，打开
	openItem.children?.forEach((columnItem) => {
		columnItem.children?.forEach((fileItem) => {
			vscode.commands.executeCommand(
				"vscode.open",
				vscode.Uri.parse(fileItem.filePath),
				{
					viewColumn: columnItem.columnIndex,
					preview: false,
				}
			)
		})
	})
}

/**
 * 当前文件添加到布局中
 */
export async function addToLayout(dataProvider: EditorLayoutDataProvider) {
	const cloneData = [...dataProvider.data]
	// 获取所有布局信息
	const layoutList = dataProvider.data.map((item) => item.id)
	if (dataProvider.isEmpty()) return
	// 让用户选择需要添加到哪个布局中
	const selectedLayoutName = await vscode.window.showQuickPick(layoutList)
	if (!selectedLayoutName) return

	// 根据当前活跃的编辑窗口创建文件节点
	const { viewColumn, document } = vscode.window.activeTextEditor ?? {}
	const lastFilePath = getLastTwoFilepath(document?.fileName ?? "")
	if (!lastFilePath) return
	const fileID = getFileID(selectedLayoutName, viewColumn ?? 1, lastFilePath)
	const fileItem = new FileItem(fileID, lastFilePath, document?.fileName ?? "")
	// 判断当前文件节点是否在分组节点中存在
	const rightLayoutItem = cloneData.find(
		(item) => item.id === selectedLayoutName
	)
	const groupItem = rightLayoutItem?.children?.[viewColumn ?? 0]
	if (groupItem?.children?.some((item) => item.id === fileID)) {
		vscode.window.showWarningMessage("分组中已存在该文件")
		return
	}

	// 添加当前文件进入分组
	groupItem?.children?.push(fileItem)
	dataProvider.saveData()
}

/**
 * 更新布局
 */
export async function updateLayout(dataProvider: EditorLayoutDataProvider) {
	const cloneData = [...dataProvider.data]
	// 获取所有布局信息
	const layoutList = dataProvider.data.map((item) => item.id)
	if (dataProvider.isEmpty()) return
	// 让用户选择需要添加到哪个布局中
	const selectedLayoutName = await vscode.window.showQuickPick(layoutList)
	if (!selectedLayoutName) return

	const rootItem = saveLayout(selectedLayoutName)
	// 替换节点
	const originItemIndex = cloneData.findIndex(item => item.id === selectedLayoutName)
	cloneData.splice(originItemIndex, 1, rootItem)
	dataProvider.data = cloneData
	dataProvider.saveData()
}