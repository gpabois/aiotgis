import { ByteBuffer, copy } from "../stream";

/**
 * Metadata of the paging system
 */
export interface PagingMeta {
    length: number
}

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