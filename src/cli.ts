#!/usr/bin/env node
import yargs, { argv } from 'yargs';
import { AiotFilter, iterAiots } from "./lib/aiots";
import { InstallationClassee } from 'georisques';
import { writeFile, readFile } from 'fs/promises';
import { Aiot, AiotCollection } from './lib/models/aiot';
import transformation from 'transform-coordinates';
import { World } from './lib/models/world';
import { Geometry, FeatureCollection } from 'geojson';

function genAiotFeature(aiot: InstallationClassee): Aiot {
    return {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [aiot.longitude, aiot.latitude]
        },
        properties: {
            type: "AIOT",
            codeAiot: aiot.codeAIOT,
            nom: aiot.raisonSociale,
            rubriques: aiot.rubriques
        }
    }
}

async function genAiotColFromGeorisques(filter: AiotFilter): Promise<AiotCollection> {
    let features = [];
    for await (const aiot of iterAiots({departement: "94"})) {
        features.push(genAiotFeature(aiot));
    }
    return {
        type: "FeatureCollection",
        features
    }
}

async function genAiotCollection() {
    const aiotColl = await genAiotColFromGeorisques({departement: "94"});
    writeFile("aiots.geojson", JSON.stringify(aiotColl));
}

async function run() {
    let data = await readFile("dataset.geojson");
    let featureColl = JSON.parse(data.toString())
    featureColl.features.forEach((feature: any) => {
        feature.properties.type = "OuvrageRejets"
        feature.geometry.coordinates = transformation("2154", "4326").forward(feature.geometry.coordinates);

    });
    await writeFile("ouvrages-rejets.geojson", JSON.stringify(featureColl));
}


yargs
    .command('generate', 'Génère des feature collections', () => {})
    .command('read <world>', '', (yargs) => {
        yargs.positional('world', {desribe: "Monde", type: "string", demandOption: true})
    }, async (argv) => {
        const world = await World.load(await readFile(argv.world as string));
        console.log(world.meta);
    })
    .command('add <in> <name> <type> <world>', "Ajouter une collection au monde", (yargs) => {
        yargs.positional('in', {desribe: "Fichier (GeoJSON)", type: "string", demandOption: true})
        yargs.positional('name', {desribe: "Nom", type: "string", demandOption: true})
        yargs.positional('type', {desribe: "Type", type: "string", demandOption: true})
        yargs.positional('world', {desribe: "Monde", type: "string", demandOption: true})

    }, async (argv) => {
        const world = await World.load(await readFile(argv.world as string));
        const collection: FeatureCollection<Geometry, {type?:string}> = JSON.parse((await readFile(argv.in as string)).toString());
        
        const name = argv.name as string;
        const type = argv.type as string;

        collection.features.forEach((feature) => feature.properties.type = type);

        world.addFeatureCollection({name, type}, collection);

        writeFile(argv.world as string, await world.save());
    })
    .command('new', 'Commande de création', (yargs) => {
        yargs.command('world <dest>', "Crée un nouveau monde", (yargs) => {
            yargs.positional('dest', {desribe: "Destination", type: "string", demandOption: true})
        }, async (argv) => {
            const world  = World.new();
            //@ts-ignore
            writeFile(argv.dest, await world.save())
        })
    })
  .demandCommand()
  .help()
  .argv