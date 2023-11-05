export function* iterObject(object: {[key: string | number | symbol]: any}) {
    yield* Object.keys(object).map((key) => [key, object[key]])
}
