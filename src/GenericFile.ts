import { FileFormat } from "./FileFormat";

/**
 * Generic file top class interface.
 * Implements the root of both SB3+ and PTC file type hierarchies.
 */
interface GenericFile {
    /**
     * The base format of this file: PTC or SmileBASIC.
     */
    Format: FileFormat;
    
    /**
     * The raw contents of this file as a `Buffer` (if parsed from one or previously generated.)
     */
    RawContent: Buffer;


    /**
     * Encode this file to a `Buffer`.
     */
    ToBuffer(): Promise<Buffer>;
    /**
     * Cast this file down to the appropriate subtype.
     * @throws if the file type is invalid.
     * @returns A `Promise` resolving to the specific subclass for this instance's type.
     */
    ToActualType(): Promise<GenericFile>;
}


export { GenericFile };
