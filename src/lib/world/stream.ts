export interface CommonSeekCursor<S extends string> {type: S, value: number};

/**
 * Size of the buffer to copy value for i/o
 */
const DEFAULT_BUF_SIZE = 8000;

const commonSeekTypes = ['relative', 'absolute'] as const;

export type CommonSeekType = typeof commonSeekTypes[number];
export function isCommonSeekCursor(maybeCommonSeekCursor: unknown): maybeCommonSeekCursor is CommonSeekCursor<CommonSeekType> {
    //@ts-ignore
    return isCommonSeekCursor(maybeCommonSeekCursor.type);
}
export function isCommonSeekType(maybeCommonSeekType: unknown): maybeCommonSeekType is CommonSeekType {
    return commonSeekTypes.find((n) => n === maybeCommonSeekType) !== undefined;
}

export interface Seek<Cursor> {
    seek(cursor: Cursor): number
};

export function toBytes(value: number, byteSize: 8 | 16 | 32 | 64, endianness: "little" | "big" = "little") : Uint8Array {
    const nbBytes = byteSize / 8;
    const buf = new Uint8Array(nbBytes);
    
    if (endianness == "little") {
        for(let i = nbBytes - 1; i >= 0; i --) {
            buf[i] = value & 0xFF;
            value = value >> 8;
        }
    } else {
        for(let i = 0; i < nbBytes; i++) {
            buf[i] = value & 0xFF;
            value = value >> 8;
        }       
    }

    return buf;
}

export function fromBytes(buf: Uint8Array, byteSize: 8 | 16 | 32 | 64, endianness: "little" | "big" = "little"): number {
    const nbBytes = byteSize / 8;
    let value = 0;
    
    if (endianness == "little") {
        for(let i = nbBytes - 1; i >= 0; i --) {
            value |= buf[i];
            value <<= 8;
        }
    } else {
        for(let i = 0; i < nbBytes; i++) {
            value |= buf[i];
            value <<= 8;
        }       
    }

    return value;  
}

export function readBytes(reader: Read, byteSize: 8 | 16 | 32 | 64, endianness: "little" | "big" = "little"): number {
    const nbBytes = byteSize / 8;
    let buf = new Uint8Array(nbBytes);
    if(reader.read(buf) !== nbBytes) throw new Error("Cannot read bytes")
    return fromBytes(buf, byteSize, endianness);
}

/**
 * Copy the entire content of the reader into the writer.
 * @param dest
 * @param src 
 */
export function copy(dest: Write, src: Read) {
    let buf = new Uint8Array(DEFAULT_BUF_SIZE);

    while(true) {
        const read = src.read(buf);

        // Reading stream is exhausted
        if(read === 0) break;

        const written = dest.write(buf);
        
        if(written !== read) throw new Error("Not enough space to copy the buffer");
    }
}

export interface Write {
    /**
     * Write bytes
     * @param src 
     * @return the number of bytes written
     */
    write(src: Uint8Array): number
    flush(): void
};

export interface Read {
    /**
     * Read bytes
     * @param dest 
     * @return the number of bytes read
     */
    read(dest:  Uint8Array): number;
};

/**
 * Limit the reader to a certain length
 * @param R
 */
export function limit(r: Read, length: number): Read {
    return new LimitedRead(r, length)
}
/**
 * Limit the reader to a certain length.
 */
class LimitedRead implements Read {
    private r: Read;
    private bytesLimit: number;
    private bytesRead: number;
    
    constructor(r: Read, length: number) {
        this.r = r;
        this.bytesLimit = length;
        this.bytesRead = 0;
    }

    read(buf: Uint8Array): number {
        if(this.bytesRead == this.bytesLimit) return 0;

        const remaining = this.bytesLimit - this.bytesRead;
        
        let _buf = buf;
        if(remaining < buf.length) _buf = new Uint8Array(remaining);

        const read = this.r.read(_buf);
        this.bytesRead += read;

        if(_buf != buf) replace(buf, _buf);

        return read;
    }

}

export function replace(dest: Uint8Array, src: Uint8Array, at?: number) {
    for(let i = 0; i < src.length; i++) {
        dest[(at||0) + i] = src[i];
    }
}

export type RelSeekable = Seek<CommonSeekCursor<"relative">>;
export type PositionSeekable = RelSeekable;
export function position(s: PositionSeekable): number {
    return s.seek({type: "relative", value: 0});
}

export type LengthSeekable = Seek<CommonSeekCursor<"absolute">> & PositionSeekable;
export function length(s: LengthSeekable): number {
    const pos = position(s);
    const length = s.seek({type: "absolute", value: -1});
    s.seek({type: "absolute", value: pos});
    return length;
}

export function remaining(s: Seek<CommonSeekCursor<"relative" | "absolute">>): number {
    const pos = position(s);
    const len = length(s);
    return len - pos;
}

export class ByteBuffer implements Write, Read, Seek<CommonSeekCursor<CommonSeekType>> {
    private buffer: Uint8Array;
    private cur: number;

    constructor(buffer: Uint8Array) {
        this.buffer = buffer;
        this.cur = 0;
    }

    static alloc(length: number): ByteBuffer {
        return new ByteBuffer(new Uint8Array(length));
    }

    flush() {}

    seek(cursor: CommonSeekCursor<CommonSeekType>): number {
        if(cursor.type == "relative") {
            this.cur += cursor.value;
        } else {
            if(this.cur >= 0)
                this.cur = cursor.value;
            else
                this.cur = length(this) + cursor.value;
            
        }

        return this.cur;
    }

    write(buf: Uint8Array) {
        const written = Math.min((this.buffer.length - this.cur), buf.length);
        for(let i = 0; i < written; i++) {
            this.buffer[this.cur] = buf[i];
            this.cur++;
        }
        return written;
    }

    read(buf: Uint8Array): number {
        const read = Math.min((this.buffer.length - this.cur), buf.length);
        for(let i = 0; i < read; i++) {
            buf[i] = this.buffer[this.cur];
            this.cur++;
        }
        return read;
    }
}