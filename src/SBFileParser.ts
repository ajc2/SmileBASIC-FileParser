import { GenericFile } from "./GenericFile";
import { SmileBASICFile } from "./SmileBASICFile";
import { PTCFile } from "./PTCFile";

/**
 * Start here to parse a `Buffer` to any {@see SmileBASICFile} or {@see PTCFile}.
 * This will call the appropriate {@see GenericFile.ToActualType} method to produce
 * the file type subclass you expect.
 */
async function ParseBuffer(buffer: Buffer, verify: boolean = false): Promise<GenericFile> {
    // detect the correct file type using the magic number
    let magic = buffer.toString('ascii', 0, 4);
    let file;
    switch(magic) {
        case "PX01":
        case "PETC":
            // mk2 SD or internal file
            file = await PTCFile.FromBuffer(buffer, verify);
        default:
            // fallback to SB file
            file = await SmileBASICFile.FromBuffer(buffer, verify);
    }

    return file;
}


export { ParseBuffer };
