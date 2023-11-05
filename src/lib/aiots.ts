import * as georisques from "georisques"

export interface AiotFilter {
    activite?: string,
    codeInsee?: string[],
    codeAIOT?: string[],
    dateMaj?: string,
    debutInspection?: string,
    departement?: string, 
    finInspection?: string, 
    ied?: boolean, 
    latlon?: string, 
    nomenclature?: string[], 
    page?: number, 
    pageSize?: number, 
    prioriteNationale?: boolean, 
    raisonSociale?: string, 
    rayon?: number, 
    regime?: string, 
    region?: string, 
    siret?: string[], 
    statutSeveso?: string
}

async function getPageAiots(filter: AiotFilter): Promise<georisques.PaginatedResponseInstallationClassee> {
    const api = new georisques.InstallationsClassesApi()
    const resp = await api.rechercherAiotsParGeolocalisationUsingGET(
        filter.activite, 
        filter.codeInsee, 
        filter.codeAIOT, 
        filter.dateMaj, 
        filter.debutInspection, 
        filter.departement,
        filter.finInspection,
        filter.ied,
        filter.latlon,
        filter.nomenclature,
        filter.page,
        filter.pageSize, 
        filter.prioriteNationale,
        filter.raisonSociale,
        filter.rayon,
        filter.regime,
        filter.regime,
        filter.siret,
        filter.statutSeveso
    )
    return resp.data;
}

export async function* iterAiots(filter: AiotFilter) {
    let page = 1;
    let isExhausted = false;
    
    while(!isExhausted) {
        let chunk = await getPageAiots({...filter, page});
        isExhausted = chunk.next === null;
        page++;
        yield* chunk.data;
    }
}
