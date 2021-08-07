import { PTCFile } from "./PTCFile";
import { PTCFileType } from "./PTCFileType";
import { PTCCOLFile, PTCColor } from "./PTCCOLFile";

class PTCGRPFile extends PTCFile {
    public readonly Type = PTCFileType.GRP;

    public Image: Buffer;


    public constructor() {
        super();
        this.Image = Buffer.alloc(49152);
    }

    
    public static async FromFile(file: PTCFile): Promise<PTCGRPFile> {
        if(file.Type !== PTCFileType.GRP) {
            throw new Error("Not a GRP file");
        }

        let self = new PTCGRPFile();
        self.Header = file.Header;
        self.RawContent = file.RawContent;

        // adapted from https://petitcomputer.fandom.com/wiki/GRP_File_Format_(External)
        for(let l = 0; l < 3; l++) {
            for(let k = 0; k < 4; k++) {
                for(let j = 0; j < 8; j++) {
                    for(let i = 0; i < 8; i++) {
                        for(let y = 0; y < 8; y++) {
                            for(let x = 0; x < 8; x++) {
                                let readIdx =  l*16384 + k*4096 + j*512 + i*64 + y*8 + x;
                                let writeIdx = l*16384 + k*64 + j*2048 + i*8 + y*256 + x;
                                self.Image[writeIdx] = self.RawContent[readIdx];
                            }
                        }
                    }
                }
            }
        }

        return self;
    }
    
    public static async FromBuffer(buffer: Buffer, verify: boolean = false): Promise<PTCGRPFile> {
        let file = await super.FromBuffer(buffer, verify);
        return await this.FromFile(file);
    }


    public async ToBuffer(sdHeader: boolean = true): Promise<Buffer> {
        let buf = Buffer.allocUnsafe(49152);

        // adapted from https://petitcomputer.fandom.com/wiki/GRP_File_Format_(External)
        for(let l = 0; l < 3; l++) {
            for(let k = 0; k < 4; k++) {
                for(let j = 0; j < 8; j++) {
                    for(let i = 0; i < 8; i++) {
                        for(let y = 0; y < 8; y++) {
                            for(let x = 0; x < 8; x++) {
                                let writeIdx =  l*16384 + k*4096 + j*512 + i*64 + y*8 + x;
                                let readIdx = l*16384 + k*64 + j*2048 + i*8 + y*256 + x;
                                buf[writeIdx] = this.Image[readIdx];
                            }
                        }
                    }
                }
            }
        }

        this.RawContent = buf;
        return super.ToBuffer(sdHeader);
    }

    public Get2D(x: number, y: number) {
        if(x < 0 || x > 255) {
            throw new Error(`Pixel x index out of range (${x})`)
        }
        if(y < 0 || y > 191) {
            throw new Error(`Pixel y index out of range (${y})`)
        }

        return this.Image[y*256+x];
    }

    public Set2D(x: number, y: number, col: number) {
        if(x < 0 || x > 255) {
            throw new Error(`Pixel x index out of range (${x})`)
        }
        if(y < 0 || y > 191) {
            throw new Error(`Pixel y index out of range (${y})`)
        }
        if(col < 0 || col > 255) {
            throw new Error(`Color index out of range (${col})`)
        }

        this.Image[y*256+x] = col;
    }

    public ImageWithPalette(col: PTCCOLFile): PTCColor[] {
        let out = new Array<PTCColor>(49152);
        for(let i = 0; i < 49152; i++) {
            out[i] = col.Colors[this.Image[i]];
        }

        return out;
    }
}


// handle casting

declare module "./PTCFile" {
    interface PTCFile {
        AsGRPFile(): Promise<PTCGRPFile>
    }
}

PTCFile.prototype["AsGRPFile"] = async function() {
    return await PTCGRPFile.FromFile(this);
};

PTCFile.FileTypeMappings.set(PTCFileType.GRP, PTCGRPFile);


export { PTCGRPFile };
