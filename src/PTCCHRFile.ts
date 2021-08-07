import { PTCFile } from "./PTCFile";
import { PTCCOLFile, PTCColor } from "./PTCCOLFile";
import { PTCFileType } from "./PTCFileType";

class PTCCHRFile extends PTCFile {
    public readonly Type = PTCFileType.CHR;
    
    /**
     * An array of 64-byte `Buffer`s, each byte representing
     * a nybble (0-F) referring to a palette color.
     */
    public Characters: Buffer[];


    public constructor() {
        super();
        this.Characters = new Array<Buffer>(256);
        for(let i = 0; i < 256; i++) {
            this.Characters[i] = Buffer.alloc(64);
        }
    }


    public static async FromFile(file: PTCFile): Promise<PTCCHRFile> {
        if(file.Type !== PTCFileType.CHR) {
            throw new Error("Not a CHR file");
        }

        let self = new PTCCHRFile();
        self.Header = file.Header;
        self.RawContent = file.RawContent;

        // read chars from RawContent
        for(let c = 0; c < 256; c++) {
            let char = self.Characters[c];
            for(let i = 0; i < 32; i++) {
                let byte = self.RawContent[c*32+i];
                char[i*2] = byte & 0xF;
                char[i*2+1] = (byte>>4) & 0xF;
            }
        }

        return self;
    }
    
    public static async FromBuffer(buffer: Buffer, verify: boolean = false): Promise<PTCCHRFile> {
        let file = await super.FromBuffer(buffer, verify);
        return this.FromFile(file);
    }


    public async ToBuffer(sdHeader: boolean = true): Promise<Buffer> {
        let chrs = Buffer.allocUnsafe(8192);

        for(let c = 0; c < 256; c++) {
            let char = this.Characters[c];
            for(let i = 0; i < 64; i += 2) {
                let byte = (char[i+1]<<4) | char[i];
                chrs[c*32+(i/2)] = byte;
            }
        }

        this.RawContent = chrs;
        return super.ToBuffer(sdHeader);
    }


    public Get2D(char: number, x: number, y: number): number {
        if(char < 0 || char > 255) {
            throw new Error(`Character index out of range (${char})`);
        }
        if(x < 0 || x > 63) {
            throw new Error(`X index out of range (${x})`);
        }
        if(y < 0 || y > 63) {
            throw new Error(`Y index out of range (${y})`);
        }

        return this.Characters[char][y*64 + x];
    }

    public Set2D(char: number, x: number, y: number, color: number) {
        if(char < 0 || char > 255) {
            throw new Error(`Character index out of range (${char})`);
        }
        if(x < 0 || x > 63) {
            throw new Error(`X index out of range (${x})`);
        }
        if(y < 0 || y > 63) {
            throw new Error(`Y index out of range (${y})`);
        }
        if(color < 0 || color > 15) {
            throw new Error(`Color index out of range (${color})`);
        }

        this.Characters[char][y*64 + x] = color;
    }

    public CharacterWithPalette(chr: number, col: PTCCOLFile, pal: number): PTCColor[] {
        if(chr < 0 || chr > 255) {
            throw new Error(`Character index out of range (${chr})`);
        }
        if(pal < 0 || pal > 15) {
            throw new Error(`Palette index out of range (${pal})`);
        }
        let char = this.Characters[chr];
        let out = new Array(64);
        const pb = pal * 16;
        for(let i = 0; i < 64; i++) {
            out[i] = col.Colors[char[i]+pb];
        }

        return out;
    }
}


// handle casting

declare module "./PTCFile" {
    interface PTCFile {
        AsCHRFile(): Promise<PTCCHRFile>
    }
}

PTCFile.prototype["AsCHRFile"] = async function() {
    return await PTCCHRFile.FromFile(this);
};

PTCFile.FileTypeMappings.set(PTCFileType.CHR, PTCCHRFile);


export { PTCCHRFile };
