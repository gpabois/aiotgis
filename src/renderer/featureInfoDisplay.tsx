import { WorldFeature } from "../lib/models/world";

export interface FeatureInfoDisplayProps {
    feature: WorldFeature,
    onClosing?: (feature: WorldFeature) => void
}

export interface FeaturesInfoDisplayProps {
    features: WorldFeature[],
    onClosing?: (feature: WorldFeature) => void
}

export function InfoDisplay(props: {info: any}) {
    const info = props.info;
    if(!info || typeof info === "string" || typeof info === "number") 
        return <span>{info}</span>
    else if(Array.isArray(info)) {
        if(info.length == 0) return <div>[]</div>

        return <div className="flex flex-col divide-y">
                {info.map(el => 
                <div>   
                    <InfoDisplay info={el}/>
                </div>
                )}

            </div>
    } else {
        return <div className="flex flex-col divide-y">
            {Object.keys(info).map((key) => {
                return <div className="flex flex-wrap p-2">
                    <div className="font-bold">{key}: </div>
                    <div className="ml-2 flex-auto">
                        <InfoDisplay info={info[key]}/>
                    </div>
                </div>
            })}
        </div>
    }
}

export function FeatureInfoDisplay(props: FeatureInfoDisplayProps) {
    return <div className="flex flex-row">
       <div className="flex-auto"><InfoDisplay info={props.feature.properties}/></div>
       <div className="flex-none"><button onClick={(_) => props.onClosing?.(props.feature)}>x</button></div>
    </div>
}

export function FeaturesInfoDisplay(props: FeaturesInfoDisplayProps) {
    return <div className="flex flex-col divide-y-4 divide-b-gray-500">
        {props.features.map((feature) => <FeatureInfoDisplay feature={feature} onClosing={props.onClosing}/>)}
    </div>
}