import { World } from "./lib/models/world";

export {};


declare global {
    interface Window {
        world: {
            load(): Promise<World | undefined>;
        }
    }
}