import { dialog, ipcMain, BrowserWindow } from 'electron';
import * as fs from 'node:fs/promises';
import { buildTree, treeToString } from './filetree/tree';
import { collectRecentFiles } from './filetree/recentFiles';
import { explainer } from './explainer/explainer';

let currentRootPath: string | null = null;

export function registerHandlers({ getWindow }: {
  getWindow: () => BrowserWindow | null;
}): void {
  ipcMain.handle('dialog:openFolder', async () => {
    const win = getWindow();
    if (!win) throw new Error('Window not initialized');
    const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
    if (result.canceled || result.filePaths.length === 0) return null;
    const rootPath = result.filePaths[0];
    currentRootPath = rootPath;
    return { rootPath, tree: await buildTree(rootPath) };
  });

  ipcMain.handle('fs:fileExists', async (_event, filePath: string) => {
    try { return (await fs.stat(filePath)).isFile(); } catch { return false; }
  });

  ipcMain.handle('fs:listRecentFiles', async () => {
    const rootPath = currentRootPath;
    if (!rootPath) throw new Error('No folder opened yet');
    return collectRecentFiles(rootPath, 50);
  });

  ipcMain.handle('fs:listTree', async () => {
    const rootPath = currentRootPath;
    if (!rootPath) throw new Error('No folder opened yet');
    return buildTree(rootPath);
  });

  ipcMain.handle('claude:explainFile', async (event, filePath: string, tabId: string) => {
    const rootPath = currentRootPath;
    if (!rootPath) { event.sender.send('claude:error', tabId, 'No folder opened yet'); return; }
    const fileStructure = treeToString(await buildTree(rootPath));
    await explainer(
      filePath,
      fileStructure,
      (chunk) => { event.sender.send('claude:chunk', tabId, chunk); },
      () => { event.sender.send('claude:done', tabId); },
      (err) => { event.sender.send('claude:error', tabId, err); },
    );
  });
}
