export class Uint8ArrayStream {
    array: Uint8Array
    cursor: number
    
    constructor(array: Uint8Array, cursor: number = 0) {
        this.array = array;
        this.cursor = cursor
    }

    length(): number {
        return this.array.length
    }

    remaining(): number {
        return this.array.length - this.cursor;
    }

    readByte(): number {
        const byte = readByte(this.array, this.cursor);
        this.cursor++;
        return byte;
    }

    writeByte(byte: number) {
        writeByte(this.array, this.cursor, byte);
        this.cursor++;
    }

    writeWord(word: number) {
        writeWord(this.array, this.cursor, word);
        this.cursor += 2;
    }

    writeDWord64(word: number) {
        writeDWord64(this.array, this.cursor, word);
        this.cursor += 4;
    }
}

/**
 * Write a value in the buffer
 * @param arr 
 * @param at 
 * @param value a 64 bite receiver
 * @param byteSize value from 8 to 64 
 */
function write(arr: Uint8Array, at: number, value: number, byteSize: number) {
    const off = byteSize / 8;
    let idx = at;
    [...Array(off).keys()].forEach((_) => {
        arr[idx] = value & 0xFF; 
        idx++;   
        value = value >> 8;
    })
}

/**
 * Read a value from the buffer
 * @param arr 
 * @param at 
 * @param byteSize 
 * @returns 
 */
function read(arr: Uint8Array, at: number, byteSize: number): number {
    let value = 0;
    let idx = at;
    const off = byteSize / 8;
    [...Array(off).keys()].forEach((_) => {
        value = value | arr[idx];  
        idx++;
        if(idx < off) value = value << 8;
    })

    return value;
}

/**
 * Write a byte in the array
 * @param arr
 * @param at 
 * @param value 
 */
export function writeByte(arr: Uint8Array, at: number, value: number) {
    write(arr, at, value, 8)   
}

/**
 * Read a byte from the array
 * @param arr 
 * @param at 
 * @param value 
 * @returns 
 */
export function readByte(arr: Uint8Array, at: number): number {
    return read(arr, at, 8);
}

/**
 * Write a word in the array
 * @param arr 
 * @param at the offset as a multiple of 2
 * @param value 
 */
export function writeWord(arr: Uint8Array, at: number, value: number) {
    return write(arr, at, value, 16);
}

/*
* Read a word in the array
* @param arr 
* @param at 
* @param value 
*/
export function readWord(arr: Uint8Array, at: number): number {
   return read(arr, at, 16);
}

/**
 * Write a double word in the array
 * @param arr 
 * @param at the offset as a multiple of 2
 * @param value 
 */
export function writeDWord32(arr: Uint8Array, at: number, value: number) {
    return write(arr, at, value, 32);
}

/*
* Read a double word in the array
* @param arr 
* @param at 
* @param value 
*/
export function readDWord32(arr: Uint8Array, at: number): number {
   return read(arr, at, 32);
}

/**
 * Write a double word in the array
 * @param arr 
 * @param at the offset as a multiple of 2
 * @param value 
 */
export function writeDWord64(arr: Uint8Array, at: number, value: number) {
    return write(arr, at, value, 32);
}

/*
* Read a double word in the array
* @param arr 
* @param at 
* @param value 
*/
export function readDWord64(arr: Uint8Array, at: number): number {
   return read(arr, at, 32);
}