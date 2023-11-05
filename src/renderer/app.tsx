import { MapContainer, TileLayer, WMSTileLayer, TileLayerProps, WMSTileLayerProps, GeoJSON } from 'react-leaflet'
import "./app.css"
import L from "leaflet"
import { useState } from 'react';
import { Geometry, Feature, FeatureCollection } from 'geojson';
import { LatLng, Layer, LeafletMouseEvent } from 'leaflet';
import { WorldFeature } from '../lib/models/world';
import { FeatureInfoDisplay } from './featureInfoDisplay';
//@ts-ignore
import factoryIcon from './assets/icons/factory.svg'
//@ts-ignore
import waterPipeIcon from './assets/icons/water-pipe.svg'
//@ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
//@ts-ignore
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerIconShadow
});

L.Marker.prototype.options.icon = DefaultIcon;

export function App() {
    const position: [number, number] = [48.790367, 2.455572];
    const aiotIcon = L.icon({iconUrl: factoryIcon, iconSize: [24, 24]});
    const ouvrageRejetsIcon = L.icon({iconUrl: waterPipeIcon, iconSize: [24, 24]});

    const [featureCollections, setFeatureCollections] = useState<Array<FeatureCollection>>([]);
    const [selectedFeatures, setSelectedFeatures] = useState<Array<WorldFeature>>([]);

    async function addFeatureCollections(e: React.MouseEvent<HTMLElement>) {
        const newCollections = await window.map.loadFeatureCollections();
        //@ts-ignore
        setFeatureCollections([...featureCollections, ...newCollections]);
    }

    function pointToLayer(feature: WorldFeature, latlng: LatLng) {
        let icon = markerIcon;

        switch(feature.properties.type) {
            case "AIOT":
                icon = aiotIcon;
                break;
            case "OuvrageRejets":
                icon = ouvrageRejetsIcon;
                break;
        }

        return L.marker(latlng, {icon})
    }

    function onEachFeature(feature: Feature<Geometry, {type: string} & {[propName: string]: any}>, layer: Layer) {
        layer.on({
            click: (e: LeafletMouseEvent) => {
                onFeatureClicked(e.sourceTarget.feature)
            }
        })
    }

    function addSelectedFeature(feature: WorldFeature) {
        setSelectedFeatures(selectedFeatures => [...selectedFeatures, feature])
    }

    function clearSelectedFeatures() {
        setSelectedFeatures(selectedFeatures => [])
    }


    function onFeatureClicked(feature: WorldFeature) {
        addSelectedFeature(feature);
    }

    const tileLayers: TileLayerProps[] = [{
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }];

    const wmsTileLayers: WMSTileLayerProps[] = [];

    return <div id="app" className="flex flex-row max-h-screen">
        <div className="flex-none grow-0 max-h-full overflow-auto">
            <button onClick={addFeatureCollections}>Ajouter des collections de features</button>
            <button onClick={clearSelectedFeatures}>x</button>
            {selectedFeatures.map((selectedFeature) => <FeatureInfoDisplay feature={selectedFeature}/>)}
        </div>
        <MapContainer className='grow map' center={position} zoom={13} scrollWheelZoom={false}>
            {featureCollections.map((featureCollection) => <GeoJSON data={featureCollection} pointToLayer={pointToLayer} onEachFeature={onEachFeature}/>)}
            {wmsTileLayers.map((wmsTileLayer) => <WMSTileLayer {...wmsTileLayer} />)}
            {tileLayers.map((tileLayer) => <TileLayer {...tileLayer}/>)}
        </MapContainer>
    </div>
}