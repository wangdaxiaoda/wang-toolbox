export function isValidArray(param: unknown) {
  return Array.isArray(param) && param.length > 0;
}

/**
 * 根据 column 序号获取 columnID
 */
export function getColumnID(groupID: string, viewColumn: number) {
  return `${groupID}-${viewColumn}`;
}

/**
 * 根据 column 序号和文件名获取 fileID
 */
export function getFileID(
  groupID: string,
  viewColumn: number,
  fileLastPath: string
) {
  return `${groupID}-${viewColumn}-${fileLastPath}`;
}

/**
 * 根据文件名获取后面两部分信息
 */
export function getLastTwoFilepath(filePath: string) {
  if (!filePath) return "";
  return filePath.slice(
    filePath.lastIndexOf("/", filePath.lastIndexOf("/") - 1)
  );
}
