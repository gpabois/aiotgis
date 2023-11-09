export interface SeekCursor<S extends string> {
    type: S,
    value: number
};

export type CommonSeekType = "relative" | "absolute";

export interface Seek<S extends string> {
    seek(cursor: SeekCursor<S>): number
};

export interface Write {
    writeValue(value: number, byteSize: number): void
    flush(): void
};

export interface Read {
    readValue(byteSize: number): number;
};

export function copy(dest: Write, src: Read, length: number) {
    for(let i = 0; i < length; i++) {
        dest.writeValue(src.readValue(8), 8);
    }
}

export function position(s: Seek<"relative">): number {
    return s.seek({type: "relative", value: 0});
}

export function length(s: Seek<"relative" | "absolute">): number {
    const pos = position(s);
    const length = s.seek({type: "absolute", value: -1});
    s.seek({type: "absolute", value: pos});
    return length;
}

export function remaining(s: Seek<"relative" | "absolute">): number {
    const pos = position(s);
    const len = length(s);
    return len - pos;
}

export class ByteStream implements Write, Read, Seek<CommonSeekType> {
    private buffer: Uint8Array;
    private cur: number;

    constructor(buffer: Uint8Array) {
        this.buffer = buffer;
        this.cur = 0;
    }

    static alloc(length: number): ByteStream {
        return new ByteStream(new Uint8Array(length));
    }

    flush() {}

    seek(cursor: SeekCursor<CommonSeekType>): number {
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

    writeValue(value: number, byteSize: number) {
        const off = byteSize / 8;
        [...Array(off).keys()].forEach((_) => {
            this.buffer[this.cur] = value & 0xFF;
            this.cur++;
            value = value >> 8;
        })
    }

    readValue(byteSize: number): number {
        let value = 0;
        const off = byteSize / 8;
        [...Array(off).keys()].forEach((i) => {
            value = value | (this.buffer[this.cur] & 0xFF);
            this.cur++;  
            if(i < off - 1) value = value << 8;
        })
    
        return value;
    }
}