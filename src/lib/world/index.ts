import BTree from 'sorted-btree';

export interface IndexMeta {
    // Name of the index
    name: string,
    // Which fields are indexed
    fields: string[],
    // Which type
    type: "BTree" | "Quadtree"
}