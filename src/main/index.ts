import {app, BrowserWindow, dialog, ipcMain} from 'electron'
import { FeatureCollection } from 'georisques';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { World } from '../lib/models/world';

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

    // World API
    ipcMain.handle('world.load', async() => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                {name: "Monde", extensions: ["world"]}
            ]
        });
        if (result.filePaths.length > 0)  {
            const data = await readFile(result.filePaths[0]);
            return World.load(data)
        } else {
            return undefined
        }
    })
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) 
            createWindow()
    })
});

app.on('window-all-closed', () => {
    if(process.platform != "darwin") app.quit();
})