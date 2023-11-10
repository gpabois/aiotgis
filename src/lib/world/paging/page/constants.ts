/**
 * Size of a page
 */
export const PAGE_SIZE = 16000;

/**
 * Size of the page metadata
 */
export const PAGE_META_SIZE = 72;
/**
 * Size of an entry metadata
 */
export const ENTRY_META_SIZE = 112;
/**
 * Size to store an entry offset in a page
 */
export const ENTRY_OFFSET_SIZE = 2;
/**
 *  Minimum required space to enter a row is 114 octets (entry offset + meta)
 */
export const MIN_REQUIRED_ENTRY_SIZE = ENTRY_META_SIZE + ENTRY_OFFSET_SIZE;