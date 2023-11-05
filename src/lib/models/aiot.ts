import { Feature, FeatureCollection, Point } from "geojson";
import { RubriqueIC } from "georisques";

export interface AiotProperties {
    type: "AIOT",
    codeAiot: string,
    nom: string,
    adresse?: string,
    rubriques: RubriqueIC[]
}

export type Aiot = Feature<Point, AiotProperties>;
export type AiotCollection = FeatureCollection<Point, AiotProperties>;