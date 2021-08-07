import { PTCFile } from "./PTCFile";
import { PTCFileType } from "./PTCFileType";
import { PTCPackageBits } from "./PTCPackageBits";

class PTCPRGFile extends PTCFile {
    public readonly Type = PTCFileType.PRG;
    
    public Content: string;

    public PackagedFiles: Map<PTCPackageBits, typeof PTCFile>;

    public MysteryBytes: Buffer;


    public constructor() {
        super();
        this.Content = "";
        this.PackagedFiles = new Map();
        this.MysteryBytes = Buffer.alloc(4);
    }


    public static async FromFile(file: PTCFile): Promise<PTCPRGFile> {
        if(file.Type !== PTCFileType.PRG) {
            throw new Error("Not a PRG file");
        }
        
        let self = new PTCPRGFile();
        self.Header = file.Header;
        self.RawContent = file.RawContent;

        self.RawContent.copy(self.MysteryBytes, 0, 0, 4);
        
        // read text content
        let length = self.RawContent.readUInt32LE(8);
        self.Content = self.RawContent.toString('latin1', 12, 12+length);

        // TODO: package format

        return self;
    }
    
    public static async FromBuffer(buffer: Buffer, verify: boolean = false): Promise<PTCPRGFile> {
        let file = await super.FromBuffer(buffer, verify);

        return this.FromFile(file);
    }


    public async ToBuffer(sdHeader: boolean = true): Promise<Buffer> {
        // monkeypatch: copy the package contents out of RawContent so
        // we pass round trip before implementing package format
        let packageBuf = this.RawContent.subarray(12+this.Content.length)
        let packageStr = this.RawContent.subarray(4, 8)

        // build the header
        let head = Buffer.allocUnsafe(12);
        this.MysteryBytes.copy(head, 0);
        packageStr.copy(head, 4);
        head.writeUInt32LE(this.Content.length, 8);

        // concat contents
        this.RawContent = Buffer.concat([
            head,
            Buffer.from(this.Content, 'latin1'),
            packageBuf
        ]);

        return super.ToBuffer(sdHeader);
    }
}


// handle conversions

declare module "./PTCFile" {
    interface PTCFile {
        AsPRGFile(): Promise<PTCPRGFile>;
    }
}

PTCFile.prototype["AsPRGFile"] = async function() {
    return await PTCPRGFile.FromFile(this);
};

PTCFile.FileTypeMappings.set(PTCFileType.PRG, PTCPRGFile);


export { PTCPRGFile };
