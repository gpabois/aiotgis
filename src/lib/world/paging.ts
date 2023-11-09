import { Uint8ArrayStream, writeDWord32, writeDWord64, writeWord } from "./bytes";
import { ByteStream, copy } from "./stream";

/**
 * Size of a page
 */
const PAGE_SIZE = 16000;

/**
 * Size of the page metadata
 */
const PAGE_META_SIZE = 72;
/**
 * Size of an entry metadata
 */
const ENTRY_META_SIZE = 112;
/**
 * Size to store an entry offset in a page
 */
const ENTRY_OFFSET_SIZE = 2;
/**
 *  Minimum required space to enter a row is 114 octets (entry offset + meta)
 */
const REQUIRED_ENTRY_SIZE = ENTRY_META_SIZE + ENTRY_OFFSET_SIZE;

/**
 * Metadata of the paging system
 */
export interface PagingMeta {
    /**
     * Maximum size of a page in bytes
     * Default is 8kB
     */
    maxPageSize: number
    /**
     * Number of pages
     */
    length: number
}

export type PageType = "entry" | "overflow";
const PageTypeMap = ["entry", "overflow"]


/**
 * Metadata of a page
 * Size: 72 bytes
 */
export interface PageMeta {
    /** 
    * Identifier of the page 
    * Size: 4 bytes
    */
    id: PageId | null;
    /**
     * Offset to the free space from the top of the page
     * Size: 2 bytes
     */
    freeOffset: number
    /**
     * Remaining space 
     * Size: 2 bytes
     */
    freeLength: number
    /**
     * Type of the page 
     * Size: 1 byte
     */
    type: PageType
}

export interface EntryAddress {
    PageId: PageId;
    Offset: number;
}

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
    sizeInPage: number
    /**
     * Overflow page 
     * Size: 64 bits
     */
    overflow: PageId | null;
}

function readEntryMeta(stream: ByteStream): EntryMeta {
    return {
        totalSize: stream.readValue(64),
        sizeInPage: stream.readValue(16),
        overflow: stream.readValue(64)
    }
}

function updateEntryMeta(stream: ByteStream, patch: Partial<EntryMeta>) {
    if(patch.totalSize) stream.writeValue(patch.totalSize, 64);
    else stream.seek(stream.cursor() + 4);

    if(patch.sizeInPage) stream.writeValue(patch.sizeInPage, 16);
    else stream.seek(stream.cursor() + 2);

    if(patch.overflow) stream.writeValue(patch.overflow, 64);
}
function writeEntryMeta(stream: ByteStream, meta: EntryMeta) {
    updateEntryMeta(stream, meta);
}

/**
 * En entry page
 */
export class EntryPage {
    /**
     * Metadata of the page  
     **/ 
    meta: PageMeta
    /**
     * Entry offsets
     */
    entryOffsets: Array<number>

    /**
     * Page has been modified
     */
    modified: boolean

    /**
     * Buffer
     */
    stream: ByteStream = ByteStream.alloc(PAGE_SIZE);
    
    /**
     * Write Meta in the buffer
     */
    writeMeta() {
        let cur = this.stream.seek({type: "relative", value: 0});
        this.stream.seek(0);
        this.stream.writeValue(this.meta.id, 64);
        this.stream.writeValue(PageTypeMap.indexOf(this.meta.type), 8);
        this.stream.writeValue(this.meta.freeOffset, 16);
        this.stream.writeValue(this.meta.freeLength, 16);
        this.stream.seek(cur);
    }

    /**
     * Write entry offsets
     * @param data 
     */
    writeEntryOffsets() {
        this.stream.seek(-(this.entryOffsets.length * 2));
        this.entryOffsets.reverse().forEach((off) => this.stream.writeValue(off, 16));
    }

    /**
     * Put the page cursor to the entry behind the id.
     * @param rowId 
     */
    seekEntry(rowId: number) {
        this.stream.seek(this.entryOffsets[rowId]);
    }

    /**
     * Push a new entry, returns the internal id
     */
    pushEntry(): number {
        // Get the current offset to the free space.
        let offset = this.meta.freeOffset; 
        
        // Push an offset entry
        this.entryOffsets.push(offset);
        
        // Get the new entry in-page id
        return this.entryOffsets.length - 1;
    }
    /**
     * Write a new entry
     * @param stream 
     * @returns the entry's in-page id
     */
    writeEntry(data: ByteStream): number {
        let rem = this.meta.freeLength - REQUIRED_ENTRY_SIZE;
        
        const totalSize = data.length()
        const sizeInPage = Math.min(data.remaining(), rem);
        
        let entryMeta: EntryMeta = {
            totalSize,
            sizeInPage,
            overflow: null
        };

        // Allocate space for a new entry
        let entryId = this.pushEntry();

        // Consume free space to allocate space
        // - for a new entry offset,
        // - for an entry meta,
        // - to store as much entry data we can.
        this.meta.freeOffset += ENTRY_META_SIZE + sizeInPage;
        this.meta.freeLength -= REQUIRED_ENTRY_SIZE + sizeInPage;

        // Write what we can write
        this.seekEntry(entryId);
        
        // Write entry meta
        writeEntryMeta(this.stream, entryMeta);

        // Write what we can
        copy(this.stream, data, sizeInPage);
        
        return entryId;
    }
    /**
     * Check if the entry page has enough space to get a new entry.
     * @returns 
     */
    hasEnoughSpace(): boolean {
        return this.meta.freeLength > REQUIRED_ENTRY_SIZE;
    }
}

export type PageId = number;

export class Paging 
{
    meta: PagingMeta;
    /**
     * Current new entry page to be filled
     */
    private entryPage: EntryPage | null;

    private pendingEntryPages: Array<EntryPage>;
    /**
     * Allocate a new page
     */
    private getEntryPage(): EntryPage {
        if(!this.entryPage)
            this.entryPage = new EntryPage();
        
        return this.entryPage;
    }

    writeOverflow(stream: Uint8ArrayStream): PageId {

    }
    /**
     * Write new entry in a page
     * @param data 
     */
    writeEntry(data: Uint8Array){
        let stream = new Uint8ArrayStream(data);

        let page = this.getEntryPage();
        // Check if the current entry page has enough space.
        if(!page.hasEnoughSpace()) {
            this.pendingEntryPages.push(page);
            this.entryPage = null;
            page = this.getEntryPage();
        }

        this.entryPage.writeEntry(stream);
    }  
}