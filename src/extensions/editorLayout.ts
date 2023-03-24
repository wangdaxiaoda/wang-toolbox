// 编辑窗口布局
import * as vscode from "vscode";
import { STORE_KEY } from "../constants";
import {
  getColumnID,
  isValidArray,
  getFileID,
  getLastTwoFilepath,
} from "../util";
import {
  ColumnItem,
  EditorItem,
  EditorLayoutDataProvider,
  FileItem,
  RootItem,
} from "./editorLayoutDataProvider";

/**
 * 保存当前的编辑窗口布局
 */
export async function saveAllEditorLayout(
  dataProvider: EditorLayoutDataProvider,
  context: vscode.ExtensionContext
): Promise<void> {
  // 由用户输入 布局 名称
  const editorLayoutName = await vscode.window.showInputBox({
    title: "布局分组名称输入框",
    placeHolder: "请输入布局分组名称",
  });

  // 如果已存在，则不操作
  if (!editorLayoutName || dataProvider.isExistLayout(editorLayoutName)) {
    vscode.window.showErrorMessage("设置的布局名称不合法，请修改！");
    return;
  }
  if (!isValidArray(vscode.window.tabGroups?.all)) return;

  const rootItem = new RootItem(editorLayoutName);
  rootItem.contextValue = "root";

  const { all } = vscode.window.tabGroups;
  all.forEach((item) => {
    const { viewColumn, tabs } = item;
    if (!isValidArray(tabs)) return;
    // 创建 column 节点
    const columnID = getColumnID(editorLayoutName, viewColumn);
    const columnItem = new ColumnItem(
      columnID,
      `column ${viewColumn}`,
      viewColumn
    );
    rootItem.children?.push(columnItem);
    // 遍历 tabs 创建 file 节点
    tabs.forEach((tab) => {
      const inputInfo: { uri: vscode.Uri } = tab.input as any;
      // TODO: 这边之后需要加一个过滤规则，把 untitled、预览的、非当前项目的 都排除
      if (!inputInfo?.uri?.path) return;

      // 取文件绝对路径的最后两个部分
      // TODO: 这个地方可以优化一下，不超出当前项目根目录
      const filePath = inputInfo.uri.path;
      const lastFilename = getLastTwoFilepath(filePath);
      // 创建 file 节点
      const fileID = getFileID(editorLayoutName, viewColumn, lastFilename);
      const fileItem = new FileItem(fileID, lastFilename, filePath);
      columnItem.children?.push(fileItem);
    });
  });

  // 添加数据，刷新
  dataProvider.data.push(rootItem);
  dataProvider.refresh();

  context.workspaceState.update(STORE_KEY, JSON.stringify(dataProvider.data));
}

/**
 * 根据 ID 删除节点
 */
function deleteByID(items: EditorItem[], id: string) {
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    // 当前节点是否为目标节点
    if (id === item.id) {
      items.splice(index, 1);
      return true;
    }
    // 遍历子
    if (isValidArray(item.children) && deleteByID(item.children ?? [], id))
      return true;
  }
}

/**
 * 删除布局
 */
export function deleteLayout(
  item: EditorItem,
  dataProvider: EditorLayoutDataProvider,
  context: vscode.ExtensionContext
) {
  const targetID = item.id;
  // 找到指定布局，然后删除
  const cloneData = [...dataProvider.data];
  deleteByID(cloneData, targetID);

  // 添加数据，刷新
  dataProvider.data = cloneData;
  dataProvider.refresh();

  context.workspaceState.update(STORE_KEY, JSON.stringify(cloneData));
}

/**
 * 应用布局
 */
export function applyLayout(openItem: RootItem) {
  // 关闭所有编辑器
  vscode.commands.executeCommand("workbench.action.closeAllEditors");
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
      );
    });
  });
}

/**
 * 当前文件添加到布局中
 */
export async function addToLayout(dataProvider: EditorLayoutDataProvider, context: vscode.ExtensionContext) {
  const cloneData = [...dataProvider.data];
  // 获取所有布局信息
  const layoutList = dataProvider.data.map((item) => item.id);
  if (!isValidArray(layoutList)) {
    vscode.window.showWarningMessage("没有已存在的布局，请先添加！");
    return;
  }
  // 让用户选择需要添加到哪个布局中
  const selectedLayoutName = await vscode.window.showQuickPick(layoutList);
  if (!selectedLayoutName) return;

  // 根据当前活跃的编辑窗口创建文件节点
  const { viewColumn, document } = vscode.window.activeTextEditor ?? {};
  const lastFilePath = getLastTwoFilepath(document?.fileName ?? "");
  if (!lastFilePath) return;
  const fileID = getFileID(selectedLayoutName, viewColumn ?? 1, lastFilePath);
  const fileItem = new FileItem(fileID, lastFilePath, document?.fileName ?? "");
  // 判断当前文件节点是否在分组节点中存在
  const rightLayoutItem = cloneData.find(
    (item) => item.id === selectedLayoutName
  );
  const groupItem = rightLayoutItem?.children?.[viewColumn ?? 0];
  if (groupItem?.children?.some((item) => item.id === fileID)) {
    vscode.window.showWarningMessage("分组中已存在该文件");
    return;
  }

  // 添加当前文件进入分组
  groupItem?.children?.push(fileItem);
  // 保存、刷新
  dataProvider.refresh();
  context.workspaceState.update(STORE_KEY, JSON.stringify(cloneData));
}
