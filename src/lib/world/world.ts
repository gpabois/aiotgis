import { Feature, Geometry, FeatureCollection } from "geojson";
import JSZip from 'jszip';



export interface Collection<I=string, T=WorldFeature> {
    // Reference to the metadata of the collection
    metaRef: CollectionMeta
    //
    entries: 
}

export interface WorldMeta {
    collections: CollectionMeta[];
}


export class World {
    meta: WorldMeta;
    collections: Collection[];

    constructor(args: {meta: WorldMeta, collections: Collection[]}) {
        this.meta = args.meta;
        this.collections = args.collections;
    }

    static new(): World {
        return new World({meta: {collections: []}, collections: {}});
    }

    /**
     * Query a collection
     * @param collection
     */
    query(collection: string) {

    }

    addFeatureCollection(meta: CollectionMeta, collection: FeatureCollection) {
        this.meta.collections.push(meta);
        this.collections[meta.name] = collection;
    }

    /**
     * Load a world from raw data.
     * @param data 
     * @returns 
     */
    static async load(data: Uint8Array): Promise<World> {
        let zip = await JSZip.loadAsync(data);
        const metaFile = zip.file("META");
        if(!metaFile) {
            throw Error("Fichier invalide");
        }

        const meta: WorldMeta = JSON.parse(await metaFile.async("string"));
        const collections: {[name: string]: FeatureCollection}= {};

        await Promise.all(meta.collections.map(async (meta) => {
            const file = await zip.file(`feature_collections/${meta.name}`);
            
            if(file === undefined) {
                console.error(`Attention: les données de la collection "${meta.name}" sont manquantes`)
            }

            collections[meta.name] = JSON.parse(await file.async("string"))
        }));

        return new World({meta, collections})

    }

    /**
     * Save the world into raw data.
     * @returns raw
     */
    async save(): Promise<Uint8Array> {
        let zip = new JSZip();
        zip.file("META", JSON.stringify(this.meta));

        // Serialize feature collections
        let featureCollections = zip.folder("feature_collections");
        this.meta.collections.forEach((meta) => {
            const optCol = this.collections[meta.name];
            if(optCol === undefined) {
                console.log(`Attention: les données de la collection "${meta.name}" sont manquantes`);
            }

            featureCollections.file(`${meta.name}`, JSON.stringify(optCol));

        })

        return await zip.generateAsync({type : "uint8array"});
    }
}

export type WorldFeature = Feature<Geometry, {type: string}>;
