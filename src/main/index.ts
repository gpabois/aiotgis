import {app, BrowserWindow, dialog, ipcMain} from 'electron'
import { FeatureCollection } from 'georisques';
import { readFile } from 'fs/promises';
import * as path from 'path';

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    
    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow();

    ipcMain.handle('map.loadFeatureCollection', async() => {
        const result = await dialog.showOpenDialog({properties: ['openFile', 'multiSelections']});
        return Promise.all(result.filePaths.map(async (fp) => {
          const data = await readFile(fp);
          return JSON.parse(data.toString()) as FeatureCollection;
        }))
    })
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) 
            createWindow()
    })
});

app.on('window-all-closed', () => {
    if(process.platform != "darwin") app.quit();
})