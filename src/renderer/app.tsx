import { MapContainer, TileLayer, WMSTileLayer, TileLayerProps, WMSTileLayerProps, GeoJSON, useMap } from 'react-leaflet'
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import "./app.css"
import L, { Map, PathOptions } from "leaflet"
import React, { useState } from 'react';
import { Geometry, Feature, FeatureCollection } from 'geojson';
import { LatLng, Layer, LeafletMouseEvent } from 'leaflet';
import { World, WorldFeature } from '../lib/models/world';
import { FeatureInfoDisplay, FeaturesInfoDisplay } from './featureInfoDisplay';
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

export function MapHook(props: {onMapCreated: (map: Map) => void}): null {
    props.onMapCreated(useMap());
    return null;
}

export function App() {
    const position: [number, number] = [48.790367, 2.455572];
    const aiotIcon = L.icon({iconUrl: factoryIcon, iconSize: [24, 24]});
    const ouvrageRejetsIcon = L.icon({iconUrl: waterPipeIcon, iconSize: [24, 24]});
    const [map, setMap] = useState<Map|undefined>(undefined);

    const [world, setWorld] = useState<World | undefined>(undefined);
    const [displayedCollections, setDisplayedCollections] = useState<Array<string>>([]);
    const [selectedFeatures, setSelectedFeatures] = useState<Array<WorldFeature>>([]);

    async function onMapReceived(map: Map) {
        setMap((_) => map);
    }

    async function loadWorld(e: React.MouseEvent<HTMLElement>) {
        const world = await window.world.load();
        if(world) {
            setWorld((_) => world);
            setDisplayedCollections((_) => []);
        }
    }


    async function toggleFeatureCollectionDisplay(name: string) {
        if(displayedCollections.includes(name)) {
            setDisplayedCollections((a) => a = a.filter((value) => value != name))
        } else {
            setDisplayedCollections((a) => [...a, name]);
        }

    }

    function styleFeature(feature: WorldFeature): PathOptions {
        if(selectedFeatures.includes(feature)) {
            return {
                color: "red"
            }
        }
        return {}
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

    /**
     * Bind events upon feature click
     * @param feature 
     * @param layer 
     */
    function onEachFeature(feature: Feature<Geometry, {type: string} & {[propName: string]: any}>, layer: Layer) {
        layer.on({
            click: (e: LeafletMouseEvent) => {
                onFeatureClicked(e.sourceTarget.feature)
            }
        })
    }
    function onFeatureClicked(feature: WorldFeature) {
        addSelectedFeature(feature);
    }

    function addSelectedFeature(feature: WorldFeature) {
        setSelectedFeatures(selectedFeatures => [...selectedFeatures, feature])
    }

    function removeSelectedFeature(feature: WorldFeature) {
        setSelectedFeatures(selectedFeatures => selectedFeatures.filter((sf) => sf != feature))
    }

    function clearSelectedFeatures() {
        setSelectedFeatures(selectedFeatures => [])
    }


    const tileLayers: TileLayerProps[] = [{
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }];

    const wmsTileLayers: WMSTileLayerProps[] = [];

    return <div id="app" className='max-h-screen flex flex-col bg-gray-800 text-white'>
        <div className="flex flex-row z-20 w-full bg-gray-800 border-b-gray-900 border-b-1 shadow">
            <button onClick={loadWorld} className='hover:bg-gray-700 font-bold py-2 px-4 mr-1'>Charger monde</button>
        </div>
        <PanelGroup direction="horizontal"  className="flex flex-row h-full" onLayout={(_) => map?.invalidateSize()}>
            <Panel className="overflow-auto bg-gray-700 flex flex-col z-10 shadow max-h-full" style={{overflow: "auto"}} defaultSize={150}>
                {world &&
                    <div>
                        <h1 className="font-bold mb-2 bg-gray-900 border-b-4 border-gray-1000 py-2 px-2 shadow">Collections</h1>
                        <div className="flex flex-col px-2">
                        {world.meta.collections.map((meta) => 
                            <div className="flex flex-row">
                                <div className="flex-auto">{meta.name}</div>
                                <div>
                                    <input type="checkbox" checked={displayedCollections.includes(meta.name)} onClick={(_) => toggleFeatureCollectionDisplay(meta.name)}/>
                                </div>
                            </div>
                        )}
                        </div>
                        <ul>
                            
                        </ul>
                    </div>
                }
                {selectedFeatures.length > 0 && 
                    <div className="mt-4">
                        <h1 className="font-bold mb-2 bg-gray-900 border-b-4 border-gray-1000 py-2 px-2 shadow">Entités</h1>
                        <FeaturesInfoDisplay features={selectedFeatures} onClosing={removeSelectedFeature}/>
                    </div>
                }
            </Panel>
            <PanelResizeHandle className='border-2 border-gray-900 z-10'></PanelResizeHandle>
            <Panel className='z-0'>
                <MapContainer className='grow map' center={position} zoom={13} scrollWheelZoom={false}>
                    <MapHook onMapCreated={onMapReceived}/>

                    {world && 
                        Object.keys(world.collections).filter((name) => displayedCollections.includes(name)).map((name) => {
                            const featureCollection = world.collections[name]!;
                            return <GeoJSON data={featureCollection} pointToLayer={pointToLayer} style={styleFeature} onEachFeature={onEachFeature}/>
                        })
                    }
                    {wmsTileLayers.map((wmsTileLayer) => <WMSTileLayer {...wmsTileLayer} />)}
                    {tileLayers.map((tileLayer) => <TileLayer {...tileLayer}/>)}
                </MapContainer>
            </Panel>
        </PanelGroup>
    </div>
}