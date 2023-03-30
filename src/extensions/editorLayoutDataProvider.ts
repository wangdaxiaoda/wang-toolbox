import * as vscode from "vscode"
import * as path from "path"
import { STORE_KEY } from "../constants"
import { isValidArray } from "../util"

export class EditorLayoutDataProvider
implements vscode.TreeDataProvider<EditorItem>
{
	context: vscode.ExtensionContext
	constructor(public data: RootItem[], context: vscode.ExtensionContext) {
		this.data = data
		this.context = context
	}

	getTreeItem(element: EditorItem): vscode.TreeItem {
		return element
	}

	getChildren(element?: EditorItem): Thenable<EditorItem[]> {
		if (element) {
			return Promise.resolve(element.children ?? [])
		} else {
			return Promise.resolve(this.data)
		}
	}

	// 判断是否已经存在该布局
	isExistLayout(layoutID: string) {
		return this.data.some((item) => item.id === layoutID)
	}

	// 是否有数据
	isEmpty() {
		if (isValidArray(this.data)) return false
		vscode.window.showWarningMessage("没有已存在的布局，请先添加！")
		return true
	}

	// 定义事件，更新数据视图
	private _onDidChangeTreeData: vscode.EventEmitter<
    EditorItem | undefined | null | void
  > = new vscode.EventEmitter<EditorItem | undefined | null | void>()
	readonly onDidChangeTreeData: vscode.Event<
    EditorItem | undefined | null | void
  > = this._onDidChangeTreeData.event

	refresh(): void {
		this._onDidChangeTreeData.fire()
	}

	// 更新 + 保存数据
	saveData(): void {
		this.refresh()
		this.context.workspaceState.update(STORE_KEY, JSON.stringify(this.data))
	}
}

// 编辑布局单个结构
export class EditorItem extends vscode.TreeItem {
	constructor(
    /** 单个 ID */
    public readonly id: string,
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public children?: EditorItem[]
	) {
		super(label, collapsibleState)
		this.id = id
	}
}

// 单个文件结构
export class FileItem extends EditorItem {
	constructor(
    readonly id: string,
    public label: string,
    /** 文件完整路径 */
    readonly filePath: string
	) {
		super(id, id, vscode.TreeItemCollapsibleState.None)
		this.filePath = filePath
		this.contextValue = "file"
		this.iconPath = {
			light: path.resolve(__filename, "../../src/resources/light/file.svg"),
			dark: path.resolve(__filename, "../../src/resources/dark/file.svg"),
		}
	}
}

// 单个组结构
export class ColumnItem extends EditorItem {
	constructor(
    public readonly id: string,
    public label: string,
    public columnIndex: number,
    public children?: FileItem[]
	) {
		super(id, label, vscode.TreeItemCollapsibleState.Collapsed)
		this.contextValue = "column"
		this.children = []

		this.columnIndex = columnIndex
		this.iconPath = {
			light: path.resolve(__filename, "../../src/resources/light/folder.svg"),
			dark: path.resolve(__filename, "../../src/resources/dark/folder.svg"),
		}
	}
}

// root结构
export class RootItem extends EditorItem {
	constructor(public readonly id: string, public children?: ColumnItem[]) {
		super(id, id, vscode.TreeItemCollapsibleState.Expanded)
		this.contextValue = "root"

		this.children = []
		this.iconPath = {
			light: path.resolve(__filename, "../../src/resources/light/folder.svg"),
			dark: path.resolve(__filename, "../../src/resources/dark/folder.svg"),
		}
	}
}
