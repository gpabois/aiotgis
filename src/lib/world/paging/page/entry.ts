import { LengthSeekable, Read, RelSeekable, Write, copy, length, limit, readBytes, toBytes } from "../../stream";
import { Page, PageId } from "./base";
import { ENTRY_META_SIZE, ENTRY_OFFSET_SIZE, MIN_REQUIRED_ENTRY_SIZE } from "./constants";

/**
 * Metadata of the entry
 * Size: 112 bytes
 */
export interface EntryMeta {
    /**
     * Total size of the entry (page + overflow pages)
     * Size: 32 bits
     */
    totalSize: number
    /**
     * Size of the entry in the page 
     * Size: 16 bits
     */
    inPageSize: number
    /**
     * Overflow page 
     * Size: 64 bits
     */
    overflow: PageId | null;
}

function readEntryMeta(stream: Read): EntryMeta {
    return {
        totalSize: readBytes(stream, 32),
        inPageSize: readBytes(stream, 16),
        overflow: readBytes(stream, 64)
    }
}

function updateEntryMeta(stream: Write & RelSeekable, patch: Partial<EntryMeta>) {
    if(patch.totalSize) stream.write(toBytes(patch.totalSize, 32))
    else stream.seek({type: "relative", value: 4});

    if(patch.inPageSize) stream.write(toBytes(patch.inPageSize, 16));
    else stream.seek({type: "relative", value: 2});

    if(patch.overflow) stream.write(toBytes(patch.overflow, 64));
}
function writeEntryMeta(stream: Write & RelSeekable, meta: EntryMeta) {
    updateEntryMeta(stream, meta);
}

export class EntryPage extends Page {
    entryOffsets: number[];
    /**
     * Creates a blank new entry page.
     * @param args 
     * @returns 
     */
    static new(args: {id: PageId}): EntryPage {
        let page = new EntryPage({id: args.id, type: "entry"});
        page.initialiseNewPage();
        return page;
    }

    hasEnoughSpace(): boolean {
        return this.remainingFreeSpace() >= MIN_REQUIRED_ENTRY_SIZE;
    }

    /**
     * Write an entry in the page.
     * @param d 
     * @returns the in-page id of the entry, and the number of bytes written in the page.
     */
    writeEntry(d: LengthSeekable & Read): {id: number, written: number} {
        if(!this.hasEnoughSpace()) return;

        const totalSize = length(d);
        const inPageSize = Math.min(this.remainingFreeSpace(), totalSize);
        const entryId = this.entryOffsets.length - 1;
        
        const entryOffset = this.alloc(inPageSize + ENTRY_META_SIZE, "head");

        this.alloc(ENTRY_OFFSET_SIZE, "tail");
        this.entryOffsets.push(entryOffset);

        // Point to the area where we are going to store our entry, as well as some meta.
        this.seek({type: "absolute", value: entryOffset});
        writeEntryMeta(this, {
            totalSize,
            inPageSize,
            overflow: null
        });

        // Copy what we can copy to the page
        copy(this, limit(d, inPageSize));

        return {id: entryId, written: inPageSize};
    }
}