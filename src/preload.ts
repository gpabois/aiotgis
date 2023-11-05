import { contextBridge, ipcRenderer } from "electron";
import { FeatureCollection } from "geojson";

console.log("Loading preload scripts");
contextBridge.exposeInMainWorld("map", {
  async loadFeatureCollections(): Promise<FeatureCollection[]> {
    const res = await ipcRenderer.invoke('map.loadFeatureCollection');
    return res;

  }
})