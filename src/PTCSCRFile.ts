import { PTCFile } from "./PTCFile";
import { PTCFileType } from "./PTCFileType";
import { PTCCHRFile } from "./PTCCHRFile";
import { PTCCOLFile, PTCColor } from "./PTCCOLFile";

class PTCSCRFile extends PTCFile {
    public readonly Type = PTCFileType.SCR;

    public Tiles: PTCTile[];


    public constructor() {
        super();
        this.Tiles = new Array<PTCTile>(4096);
        for(let i = 0; i < 4096; i++) {
            this.Tiles[i] = new PTCTile(0,0,false,false);
        }
    }


    public static async FromFile(file: PTCFile): Promise<PTCSCRFile> {
        if(file.Type !== PTCFileType.SCR) {
            throw new Error("Not a SCR file");
        }

        let self = new PTCSCRFile();
        self.Header = file.Header;
        self.RawContent = file.RawContent;

        // read tile map
        for(let j = 0; j < 2; j++) {
            for(let i = 0; i < 2; i++) {
                for(let y = 0; y < 32; y++) {
                    for(let x = 0; x < 32; x++) {
                        let readIdx = j*4096 + i*2048 + y*64 + x*2;
                        let writeIdx = j*2048 + y*64 + i*32 + x;
                        self.Tiles[writeIdx].Raw = self.RawContent.readUInt16LE(readIdx);
                    }
                }
            }
        }

        return self;
    }
    
    public static async FromBuffer(buffer: Buffer, verify: boolean = false): Promise<PTCSCRFile> {
        let file = await super.FromBuffer(buffer, verify);
        return await this.FromFile(file);
    }


    public async ToBuffer(sdHeader: boolean = true): Promise<Buffer> {
        let buf = Buffer.allocUnsafe(8192);
        // write tile map
        for(let j = 0; j < 2; j++) {
            for(let i = 0; i < 2; i++) {
                for(let y = 0; y < 32; y++) {
                    for(let x = 0; x < 32; x++) {
                        let writeIdx = j*4096 + i*2048 + y*64 + x*2;
                        let readIdx = j*2048 + y*64 + i*32 + x;
                        buf.writeUInt16LE(this.Tiles[readIdx].Raw, writeIdx);
                    }
                }
            }
        }

        this.RawContent = buf;
        return super.ToBuffer(sdHeader);
    }


    public Get2D(x: number, y: number): PTCTile {
        if(x < 0 || x > 63) {
            throw new Error(`X index out of range (${x})`);
        }
        if(y < 0 || y > 63) {
            throw new Error(`Y index out of range (${y})`);
        }

        return this.Tiles[y*64+x];
    }

    public Set2D(x: number, y: number, tile: PTCTile) {
        if(x < 0 || x > 63) {
            throw new Error(`X index out of range (${x})`);
        }
        if(y < 0 || y > 63) {
            throw new Error(`Y index out of range (${y})`);
        }

        this.Tiles[y*64+x] = tile;
    }
}


// handle conversions

declare module "./PTCFile" {
    interface PTCFile {
        AsSCRFile(): Promise<PTCSCRFile>;
    }
}

PTCFile.prototype["AsSCRFile"] = async function() {
    return await PTCSCRFile.FromFile(this);
};

PTCFile.FileTypeMappings.set(PTCFileType.SCR, PTCSCRFile);


class PTCTile {
    public FlipH: boolean;
    public FlipV: boolean;

    private character: number = 0;
    private palette: number = 0;

    
    public constructor(char: number, pal: number, fliph: boolean, flipv: boolean) {
        this.Character = char;
        this.Palette = pal;
        this.FlipH = fliph;
        this.FlipV = flipv;
    }


    public static FromRaw(raw: number): PTCTile {
        let tile = new PTCTile(0,0,false,false);
        tile.Raw = raw;
        return tile;
    }

    public static FromHex(hex: string): PTCTile {
        let tile = new PTCTile(0,0,false,false);
        tile.Hex = hex;
        return tile;
    }

    
    public set Character(char: number) {
        if(char < 0 || char > 1023) {
            throw new Error(`Tile character index out of range (${char})`);
        }

        this.character = char;
    }

    public set Palette(pal: number) {
        if(pal < 0 || pal > 1023) {
            throw new Error(`Tile palette index out of range (${pal})`);
        }

        this.palette = pal;
    }

    public get Character(): number {
        return this.character;
    }

    public get Palette(): number {
        return this.palette;
    }

    public set Raw(raw: number) {
        this.character = raw & 0b0000001111111111;
        this.palette = raw >> 12 & 0b1111000000000000;
        this.FlipH = (raw & 0b0000010000000000) === 1024;
        this.FlipV = (raw & 0b0000100000000000) === 2048;
    }

    public get Raw(): number {
        let raw = 0;
        raw |= this.character;
        raw |= this.palette << 12;
        if(this.FlipH) raw |= 1024;
        if(this.FlipV) raw |= 2048;
        return raw;
    }

    public ToRaw(): number {
        return this.Raw;
    }

    public get Hex(): string {
        let buf = Buffer.allocUnsafe(2);
        buf.writeUInt16BE(this.Raw);
        return buf.toString('hex');
    }

    public set Hex(hex: string) {
        let buf = Buffer.from(hex, 'hex');
        this.Raw = buf.readUInt16BE();
    }

    public ToHex(): string {
        return this.Hex;
    }
}


export { PTCSCRFile, PTCTile };
