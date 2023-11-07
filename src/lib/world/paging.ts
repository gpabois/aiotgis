import { Uint8ArrayStream, writeDWord32, writeDWord64, writeWord } from "./bytes";

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

/**
 * A loaded entry page from memory
 * Includes data from overflow pages as well.
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
    buffer: Uint8Array = new Uint8Array(PAGE_SIZE);
    
    /**
     * Write Meta in the buffer
     */
    writeMeta() {
        let stream = new Uint8ArrayStream(this.buffer, 0);
        stream.writeDWord64(this.meta.id);
        stream.writeByte(PageTypeMap.indexOf(this.meta.type));
        stream.writeWord(this.meta.freeOffset);
        stream.writeWord(this.meta.freeLength);
    }

    /**
     * Write entry offsets
     * @param data 
     * @returns the number of byte written.
     */
    writeEntryOffsets(data: Uint8Array) {}

    writeEntryMeta(id: number, meta: EntryMeta) {
        this.updateEntryMeta(id, meta);
    }
    /**
     * Update an entry metadata
     * @param id 
     * @param patch 
     */
    updateEntryMeta(id: number, patch: Partial<EntryMeta>) {
        const off = this.entryOffsets[id];
        if(patch.totalSize)  writeDWord32(this.buffer, off, patch.totalSize);
        if(patch.sizeInPage) writeWord(this.buffer, off + 4, patch.sizeInPage);
        if(patch.overflow)   writeDWord64(this.buffer, off + 6, patch.overflow);
    }
    /**
     * Write a new entry
     * @param stream 
     * @returns -1 if no space, else the entry id in the page.
     */
    writeEntry(stream: Uint8ArrayStream): number {
        let rem = this.meta.freeLength - REQUIRED_ENTRY_SIZE;
        
        const totalSize = stream.length()
        const sizeInPage = Math.min(stream.remaining(), rem);
        
        let entryMeta: EntryMeta = {
            totalSize,
            sizeInPage,
            overflow: null
        };

        // Get the remaining space to store the row
        let offset = this.meta.freeOffset; 
        
        // Push an offset entry
        this.entryOffsets.push(offset);
        
        // Get the new entry in-page id
        const entryId = this.entryOffsets.length - 1;

        // Consume free space to allocate 
        // - space for a new entry offset,
        // - allocate space for an entry meta,
        // - allocate space to store as much entry data we can.
        this.meta.freeOffset += ENTRY_META_SIZE + sizeInPage;
        this.meta.freeLength -= REQUIRED_ENTRY_SIZE + sizeInPage;

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