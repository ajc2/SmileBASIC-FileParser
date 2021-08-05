import { inflate, deflate } from "zlib";
import { promisify } from "util";
import { createHash, Hash } from "crypto";
import { GenericFile } from "./GenericFile";
import { PTCSDHeader } from "./PTCSDHeader";
import { PTCFileType, typeStringToEnum, typeEnumToString } from "./PTCFileType";

// Promisify these guys so we aren't using callbacks
const inflateAsync = promisify(inflate);
const deflateAsync = promisify(deflate);


class PTCFile implements GenericFile {
    /**
     * A PTCSDHeader, if parsed from or generated to a SD file.
     */
    public Header: PTCSDHeader;

    /**
     * Unparsed file contents, after SD header, PETC magic, and type code
     */
    public RawContent: Buffer;

    /**
     * Corresponding resource type
     */
    public Type: PTCFileType | null;

    
    public static FileTypeMappings: Map<PTCFileType, typeof PTCFile> = new Map();


    public constructor() {
        this.Header = new PTCSDHeader();
        this.RawContent = Buffer.alloc(0);
        this.Type = null;
    }
    
    public static async FromBuffer(buffer: Buffer, verifyHash: boolean = false): Promise<PTCFile> {
        let file = new PTCFile();

        let magic = buffer.toString('latin1', 0, 4);
        if(magic === "PX01") {
            // decode SD header
            file.Header = PTCSDHeader.FromBuffer(buffer);

            // make sure the file magic is here
            magic = buffer.toString('latin1', 36, 40);
            if(magic !== "PETC") {
                throw new Error("File does not appear to be PTC format");
            }

            // decode the rest of the file
            let typecode = buffer.toString('latin1', 40, 48);
            file.Type = typeStringToEnum(typecode);
            file.RawContent = buffer.subarray(48);

            // verify the hash
            if(verifyHash && !file.verifyHash()) {
                throw new Error("SD File hash is invalid!");
            }
        }
        else if(magic === "PETC") {
            let typecode = buffer.toString('latin1', 4, 12);
            file.Type = typeStringToEnum(typecode);
            file.RawContent = buffer.subarray(12);
        }
        else {
            throw new Error("File does not appear to be PTC format");
        }

        return file;
    }

    //public static async FromQRFrames(qrs: Buffer[]): Promise<PTCFile> = TODO();
    
    public static async FromFile(file: PTCFile): Promise<PTCFile> {
        return file;
    }


    public async ToBuffer(sdHeader: boolean = true): Promise<Buffer> {
        let start;

        if(this.Type === null) {
            throw new Error("Cannot generate buffer for unsupported filetype");
        }

        if(sdHeader) {
            // compute hash
            this.Header.Hash = this.createMD5();
            this.Header.HashValid = true;

            // generate buffer
            start = this.Header.ToBuffer();
        }
        else {
            start = Buffer.allocUnsafe(0);
        }

        return Buffer.concat([
            start,
            Buffer.from("PETC", 'latin1'),
            Buffer.from(typeEnumToString(this.Type!), 'latin1'),
            this.RawContent
        ]);
    }

    public async ToActualType(): Promise<PTCFile> {
        if (this.Type !== null && PTCFile.FileTypeMappings.has(this.Type!)) {
            return PTCFile.FileTypeMappings.get(this.Type!)!.FromFile(this);
        }
        else {
            throw new Error("Unimplemented file type");
        }
    }

    //public async ToQRFrames(qrCapacity: number): Promise<Buffer[]> = TODO();

    
    private verifyHash(): boolean {
        let hash = this.createMD5();
        this.Header.HashValid = hash.compare(this.Header.Hash) === 0
        return this.Header.HashValid;
    }
    
    private createMD5(): Buffer {
        let hash = createHash('MD5');
        hash.update("PETITCOM", 'latin1');
        hash.update("PETC", 'latin1');
        hash.update(typeEnumToString(this.Type!), 'latin1');
        hash.update(this.RawContent);
        return hash.digest();
    }
}


export { PTCFile };
