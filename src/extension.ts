import * as vscode from "vscode";
import { STORE_KEY } from "./constants";
import {
  addToLayout,
  applyLayout,
  deleteLayout,
  saveAllEditorLayout,
} from "./extensions/editorLayout";
import { EditorLayoutDataProvider } from "./extensions/editorLayoutDataProvider";
import selectAllLines from "./extensions/selectAllLines";

export function activate(context: vscode.ExtensionContext) {
  // 从当前上下文中取布局记录
  const layoutDataString =
    (context.workspaceState.get(STORE_KEY) as string) ?? "[]";
  const layoutData = JSON.parse(layoutDataString) || [];

  const dataProvider = new EditorLayoutDataProvider(layoutData, context);
  vscode.window.registerTreeDataProvider("editorLayout", dataProvider);

  // 无标题文件中，选中所有行
  const salCommand = vscode.commands.registerCommand(
    "wangToolbox.selectAllLines",
    selectAllLines
  );

  //#region 编辑窗口布局相关
  // 保存当前内容
  const saveAllLayoutCommand = vscode.commands.registerCommand(
    "wangToolbox.saveAllEditorLayout",
    () => saveAllEditorLayout(dataProvider, context)
  );

  // 删除布局
  const deleteLayoutCommand = vscode.commands.registerCommand(
    "wangToolbox.deleteLayout",
    (item) => {
      deleteLayout(item, dataProvider, context);
    }
  );

  // 应用布局
  const applyLayoutCommand = vscode.commands.registerCommand(
    "wangToolbox.applyLayout",
    applyLayout
  );

  // 添加到当前布局
  const addToLayoutCommand = vscode.commands.registerCommand('wangToolbox.addToLayout', () => addToLayout(dataProvider, context))
  //#endregion

  context.subscriptions.push(
    salCommand,
    saveAllLayoutCommand,
    deleteLayoutCommand,
    applyLayoutCommand,
    addToLayoutCommand
  );
}

export function deactivate() {}
