import * as vscode from "vscode";

/**
 * 选中所有行
 */
function selectAllLines() {
  // 1. 取到当前打开的文件
  const currentFile = vscode.window.activeTextEditor;
  const currentDocument = currentFile?.document;
  if (!currentDocument) return;
  // 2. 选中所有行
  const selections = [];
  const lineCount = currentDocument.lineCount;
  for (let index = 0; index < lineCount; index++) {
    const currentLine = currentDocument.lineAt(index);
    // 3. 进阶一下，如果某一行没有内容，则跳过
    if (currentLine.range.start.isEqual(currentLine.range.end)) continue;
    const newSelection = new vscode.Selection(
      new vscode.Position(index, 0),
      new vscode.Position(index, 0)
    );
    selections.push(newSelection);
  }

  currentFile.selections = selections;
}

export default selectAllLines;
