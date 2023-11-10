import {Seek, Read, Write, CommonSeekType, CommonSeekCursor, ByteBuffer, isCommonSeekCursor, toBytes, readBytes, copy, limit} from "../../stream";
import { PAGE_META_SIZE, PAGE_SIZE } from "./constants";

const pageTypes: PageType[] = ["entry", "overflow"];

export type PageType = "entry" | "overflow";
export type PageId = number;
export type PageSeekType = CommonSeekType | "meta" | "data" | "free";

export interface PageSeekCursor {
    type: PageSeekType,
    value?: number
}

/**
 * Metadata of a page
 * Size: 72 bytes
 */
export interface PageMeta {
    /** 
    * Identifier of the page 
    * Size: 4 bytes
    */
    id: PageId | undefined;
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

/**
 * Write a page meta in the stream.
 * @param page 
 */
function writePageMeta(stream: Write, meta: PageMeta): number {
    return stream.write(toBytes(meta.id, 64)) +
            stream.write(toBytes(pageTypes.indexOf(meta.type), 8)) +
            stream.write(toBytes(meta.freeOffset, 16)) +
            stream.write(toBytes(meta.freeLength, 16));
}

/**
 * Read a page meta from the stream
 * @param stream 
 * @returns 
 */
function readPageMeta(stream: Read): PageMeta {
    return {
        id: readBytes(stream, 64),
        type: pageTypes[readBytes(stream, 8)],
        freeOffset: readBytes(stream, 16),
        freeLength: readBytes(stream, 16)
    }
}

export class Page implements Seek<PageSeekCursor>, Read, Write {
    private buffer: ByteBuffer
    protected meta: PageMeta;

    protected constructor(args: Partial<Pick<PageMeta, "id" | "type">>) {
        this.buffer = ByteBuffer.alloc(PAGE_SIZE);
        
        if(args.id) this.meta.id = args.id;
        if(args.type) this.meta.type = args.type;
    }

    protected initialiseNewPage() {
        this.meta.freeOffset = PAGE_META_SIZE;
        this.meta.freeLength = PAGE_SIZE - this.meta.freeOffset;
    }

    /**
     * Creates a blank new page.
     * @param args 
     * @returns 
     */
    static new(args: {id: PageId, type: PageType}): Page {
        let page = new Page(args);
        page.initialiseNewPage();
        return page;
    }

    /**
     * Load a page from a stream
     * @param s 
     * @returns 
     */
    static load(s: Read): Page {
        let page = new Page({});

        copy(page, limit(s, PAGE_SIZE));
        page.seek({type: 'meta', value: 0});
        page.meta = readPageMeta(page);
        
        return page;
    }
    
    /**
     * Allocate space in the page, either from the head or the tail of the free space.
     * @param sizeInBytes the number of bytes to allocate
     * @param direction allocate from the head of the free space, or the tail
     * @param putCursor put the stream cursor to the allocated space
     * @return the address to the allocated space, undefined if there is not enough space
     */
    alloc(sizeInBytes: number, direction: "head" | "tail", putCursor: boolean = false): number {
        if (this.meta.freeLength < sizeInBytes) {
            return undefined
        }

        let addr = 0;
        if(direction == "head") {
            addr = this.meta.freeOffset;
            this.meta.freeOffset += sizeInBytes;
            this.meta.freeLength -= sizeInBytes;
        } else {
            addr = this.meta.freeOffset + this.meta.freeLength - sizeInBytes;
            this.meta.freeLength -= sizeInBytes;
        }

        if(putCursor) this.seek({type: 'absolute', value: addr});

        return addr;
    }

    /**
     * Get the remaining free space
     */
    remainingFreeSpace(): number {
        return this.meta.freeLength;
    }

    seek(cursor: PageSeekCursor): number {
        if(isCommonSeekCursor(cursor))
            return this.buffer.seek(cursor);
        else if(cursor.type == 'meta')
            return this.buffer.seek({type: 'absolute', value: cursor.value || 0})
        else if(cursor.type == 'data')
            return this.buffer.seek({type: 'absolute', value: PAGE_META_SIZE + (cursor.value || 0)})
        else if(cursor.type == 'free')
            return this.buffer.seek({type: 'absolute', value: this.meta.freeOffset + (cursor.value || 0)})
    }

    read(buf: Uint8Array): number {
       return this.buffer.read(buf);
    }
    
    write(buf: Uint8Array): number {
        return this.buffer.write(buf);
    }
    
    flush(): void {
        this.seek({type: 'meta'})
        writePageMeta(this, this.meta);
    }
}