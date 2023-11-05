import { Feature, Geometry } from "geojson";
import { WorldFeature } from "../lib/models/world";
import { iterObject } from "../lib/utills";

export interface FeatureInfoDisplayProps {
    feature: WorldFeature,
    onClosing?: (feature: WorldFeature) => void
}

export function FeatureInfoDisplay(props: FeatureInfoDisplayProps) {
    return <div className="flex flex-col p-1">
        {Array.from(iterObject(props.feature.properties)).map(([key, value]: [string, any]) => {
            return <div><b>{key}:</b> {JSON.stringify(value)}</div>
        })}
    </div>
}