export interface Schema {
    typeName: string,
    mandatory?: string[]
}

export interface CollectionMeta {
    // Name of the collection
    name: string,
    schema: Schema,
    indexes: IndexMeta[]
}