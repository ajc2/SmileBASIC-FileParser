import { PTCFile } from "./PTCFile";
import { PTCFileType } from "./PTCFileType";
import { PTCPackageBits, PTCPackageTypes } from "./PTCPackageBits";

class PTCPRGFile extends PTCFile {
    public Content: string;

    public PackagedFiles: Map<PTCPackageBits, PTCFile>;

    private _topbits = 0;


    public constructor() {
        super();
        this.Content = "";
        this.PackagedFiles = new Map();
        this.Type = PTCFileType.PRG;
    }


    public static async FromFile(file: PTCFile): Promise<PTCPRGFile> {
        if(file.Type !== PTCFileType.PRG) {
            throw new Error("Not a PRG file");
        }
        
        let self = new PTCPRGFile();
        self.Header = file.Header;
        self.RawContent = file.RawContent;
        
        // read text content
        let length = self.RawContent.readUInt32LE(8);
        self.Content = self.RawContent.toString('latin1', 12, 12+length);

        // read package string
        let hi = self.RawContent.readUInt32LE(0);
        if((hi & 0xFFFFE000) !== 0) {
            throw new Error(`Invalid package string (hi is ${hi})`);
        }
        let lo = self.RawContent.readUInt32LE(4);
        let packageStr = hi << 32 | lo;
        let pos = 12+length;

        // unpack resources
        for(let i = 0; i < 45; i++) {
            let bit = packageStr >> i & 1;
            if(!bit) continue;
            let expectType = PTCPackageTypes.get(i)!!
            let size = PTCPRGFile.TYPESIZES.get(expectType)!!;
            let fbuf = self.RawContent.subarray(pos, pos+size+12);
            let file = await PTCFile.FromBuffer(fbuf);
            if(file.Type !== expectType) {
                throw new Error(`Invalid package format (got ${file.Type} at ${i})`);
            }
            self.PackagedFiles.set(i, await file.ToActualType());
            pos += size+12;
        }

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
        let packageStr = this.RawContent.subarray(0, 8)

        // build the header
        let head = Buffer.allocUnsafe(12);
        packageStr.copy(head, 0);
        head.writeUInt32LE(this.Content.length, 8);

        // concat contents
        this.RawContent = Buffer.concat([
            head,
            Buffer.from(this.Content, 'latin1'),
            packageBuf
        ]);

        return super.ToBuffer(sdHeader);
    }

    public static readonly TYPESIZES = new Map<PTCFileType, number>([
        [PTCFileType.CHR, 8192],
        [PTCFileType.COL, 512],
        [PTCFileType.MEM, 516],
        [PTCFileType.GRP, 49152],
        [PTCFileType.SCR, 8192]
    ]);
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
