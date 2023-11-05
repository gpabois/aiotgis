import { FeatureCollection as BaseFeatureCollection } from 'geojson';

export interface FeatureCollection extends BaseFeatureCollection {
    crs?: {
        type: string,
        properties: {
            name: string
        }
    }
}