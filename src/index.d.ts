import { FeatureCollection } from "georisques";

export {};


declare global {
    interface Window {
        map: {
            loadFeatureCollections(): Promise<FeatureCollection[]>;
        }
    }
}