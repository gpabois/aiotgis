import { contextBridge, ipcRenderer } from "electron";
import { World } from "./lib/models/world";

console.log("Loading preload scripts");
contextBridge.exposeInMainWorld("world", {
  async load(): Promise<World | undefined> {
    const res = await ipcRenderer.invoke('world.load');
    return res;

  }
})