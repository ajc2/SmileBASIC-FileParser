import { PTCFile } from "./PTCFile";
import { PTCFileType } from "./PTCFileType";

class PTCCOLFile extends PTCFile {
    /**
     * An array of 256 {@see PTCColor} wrapper objects.
     */
    public Colors: PTCColor[];

    
    public constructor() {
        super();
        this.Type = PTCFileType.COL;
        this.Colors = new Array<PTCColor>(256)
        for(let i = 0; i < 256; i++) {
            this.Colors[i] = new PTCColor(0,0,0);
        }
    }

    public static async FromFile(file: PTCFile): Promise<PTCCOLFile> {
        if(file.Type !== PTCFileType.COL) {
            throw new Error("Not a COL file");
        }

        let self = new PTCCOLFile();
        self.Header = file.Header;
        self.RawContent = file.RawContent;

        // decode colors
        for(let i = 0; i < 256; i++) {
            let raw = self.RawContent.readUInt16LE(i*2);
            self.Colors[i].Raw = raw;
        }

        return self;
    }
    
    public static async FromBuffer(buffer: Buffer, verify: boolean = false): Promise<PTCCOLFile> {
        let file = await super.FromBuffer(buffer, verify);
        return await this.FromFile(file);
    }


    public async ToBuffer(sdHeader: boolean = true): Promise<Buffer> {
        // write palette
        let buf = Buffer.allocUnsafe(512);
        for(let i = 0; i < 256; i++) {
            buf.writeUInt16LE(this.Colors[i].Raw, i*2);
        }

        this.RawContent = buf;
        return super.ToBuffer(sdHeader);
    }
}


// handle casting

declare module "./PTCFile" {
    interface PTCFile {
        AsCOLFile(): Promise<PTCCOLFile>
    }
}

PTCFile.prototype["AsCOLFile"] = async function() {
    return await PTCCOLFile.FromFile(this);
};

PTCFile.FileTypeMappings.set(PTCFileType.COL, PTCCOLFile);


/**
 * This wrapper class handles PTC color values, both in accordance with `COLSET`/`COLREAD`,
 * but also raw channel values and binary representation in PTC files. This class is
 * responsible for all color decoding and conversion logic.
 *
 * PTC internally uses a RGB565 color format. Red and blue have 5 bits, while green has 6
 * (presumably because of human color sensitivity?) `COLSET` and `COLREAD` use normal 8-bit
 * colors, however, as either ints or hex strings. Thus there is a slight precision loss.
 *
 * This implementation uses a private backing field for each color channel, which represents
 * them as `COLSET` would. To handle this the {@see PTCColor.Red}, {@see PTCColor.Green},
 * and {@see PTCColor.Blue} getters and setters take and return 0-255 channel values.
 * The setter emulates the precision loss in the same way PTC does. This is so setting
 * is more expensive than reading, as the backing fields store the values like this.
 *
 * The {@see PTCColor.RawRed}, {@see PTCColor.RawGreen}, and {@see PTCColor.RawBlue}
 * getters and setters take and return raw channel values. 0-31 for red and blue, and
 * 0-63 for green. Again, the setter is more expensive than the getter, as it left-shifts
 * the color values and then passes them onto the normal setter. The getter is pretty efficient,
 * as all it has to do is right-shift the stored channel values.
 *
 * Also there is a {@see PTCColor.Raw} getter and setter that takes and returns a `number`
 * representing a `UInt16LE` corresponding to the raw color format stored in `COL` files.
 * This is the mechanism used to decode and encode colors for `COL` files.
 *
 * The raw binary representation of a color looks like this as a `UInt16LE`:
 *     GBBBBBGG GGGRRRRR
 * and the bit order in each channel is:
 *     04321054 32143210
 * Thus it's a normal BGR5 with an extra bit on top for green.
 */
class PTCColor {
    // COLREAD-style constructor
    public constructor(r: number, g: number, b: number) {
        this.Red = r;
        this.Green = g;
        this.Blue = b;
    }

    /**
     * Construct PTCColor instance from raw value
     */
    public static FromRaw(raw: number): PTCColor {
        let col = new PTCColor(0,0,0);
        col.Raw = raw;
        return col;
    }

    public static FromHex(h: string): PTCColor {
        let col = new PTCColor(0,0,0);
        col.Hex = h;
        return col;
    }
    

    // backing fields for color channels
    private red: number = 0;
    private green: number = 0;
    private blue: number = 0;


    // COLREAD-style getters/setters
    public get Red(): number {
        return this.red;
    }

    public get Green(): number {
        return this.green;
    }
    
    public get Blue(): number {
        return this.blue;
    }

    public set Red(r: number) {
        if(r < 0 || r > 255) {
            throw new Error(`Color channel out of range (${r})`);
        }
        this.red = r & 0b11111000;
        // remap color values based on COLREAD
        if(r >= 0 && r <= 23) {
            this.red |= 0b000;
        }
        else if(r >= 24 && r <= 55) {
            this.red |= 0b001;
        }
        else if(r >= 56 && r <= 95) {
            this.red |= 0b010;
        }
        else if(r >= 96 && r <= 127) {
            this.red |= 0b011;
        }
        else if(r >= 128 && r <= 159) {
            this.red |= 0b100;
        }
        else if(r >= 160 && r <= 199) {
            this.red |= 0b101;
        }
        else if(r >= 200 && r <= 231) {
            this.red |= 0b110;
        }
        else if(r >= 232 && r <= 255) {
            this.red |= 0b111;
        }
    }

    public set Green(g: number) {
        if(g < 0 || g > 255) {
            throw new Error(`Color channel out of range (${g})`);
        }
        this.green = g & 0b11111100;
        // remap color values based on COLREAD
        if(g >= 0 && g <= 43) {
            this.green |= 0b00;
        }
        else if(g >= 44 && g <= 127) {
            this.green |= 0b01;
        }
        else if(g >= 128 && g <= 211) {
            this.green |= 0b10;
        }
        else if(g >= 212 && g <= 255) {
            this.green |= 0b11;
        }
    }
    
    public set Blue(b: number) {
        if(b < 0 || b > 255) {
            throw new Error(`Color channel out of range (${b})`);
        }
        this.blue = b & 0b11111000;
        // remap color values based on COLREAD
        if(b >= 0 && b <= 23) {
            this.blue |= 0b000;
        }
        else if(b >= 24 && b <= 55) {
            this.blue |= 0b001;
        }
        else if(b >= 56 && b <= 95) {
            this.blue |= 0b010;
        }
        else if(b >= 96 && b <= 127) {
            this.blue |= 0b011;
        }
        else if(b >= 128 && b <= 159) {
            this.blue |= 0b100;
        }
        else if(b >= 160 && b <= 199) {
            this.blue |= 0b101;
        }
        else if(b >= 200 && b <= 231) {
            this.blue |= 0b110;
        }
        else if(b >= 232 && b <= 255) {
            this.blue |= 0b111;
        }
    }


    // getters/setters for raw/internal channel values
    public get RawRed(): number {
        return this.red >> 3;
    }

    public get RawGreen(): number {
        return this.green >> 2;
    }

    public get RawBlue(): number {
        return this.blue >> 3;
    }

    public set RawRed(r: number) {
        if(r < 0 || r > 31) {
            throw new Error(`Raw color channel out of range (${r})`);
        }
        this.Red = r << 3;
    }
    
    public set RawGreen(g: number) {
        if(g < 0 || g > 63) {
            throw new Error(`Raw color channel out of range (${g})`);
        }
        this.Green = g << 2;
    }

    public set RawBlue(b: number) {
        if(b < 0 || b > 31) {
            throw new Error(`Raw color channel out of range (${b})`);
        }
        this.Blue = b << 3;
    }


    // raw getter/setter
    public get Raw(): number {
        let raw = 0;
        raw |= this.RawRed;
        raw |= this.RawBlue << 10;
        raw |= (this.RawGreen & 0b111110) << 4;
        raw |= (this.RawGreen & 0b1) << 15;
        return raw;
    }

    public set Raw(raw: number) {
        this.RawRed = raw & 0b11111;
        this.RawBlue = raw >> 10 & 0b11111;
        this.RawGreen = (raw >> 4 & 0b111110) | (raw >> 15 & 0b1);
    }

    // ToRaw function for symmetry
    public ToRaw(): number {
        return this.Raw;
    }

    public Set(r: number | null, g: number | null, b: number | null) {
        if(r !== null)
            this.Red = r;
        if(g !== null)
            this.Green = g;
        if(b !== null)
            this.Blue = b;
    }

    public SetRaw(r: number | null, g: number | null, b: number | null) {
        if(r !== null)
            this.RawRed = r;
        if(g !== null)
            this.RawGreen = g;
        if(b !== null)
            this.RawBlue = b;
    }

    public get Hex(): string {
        let buf = Buffer.allocUnsafe(3);
        buf.writeUInt8(this.red, 0);
        buf.writeUInt8(this.green, 1);
        buf.writeUInt8(this.blue, 2);
        return buf.toString('hex');
    }

    public set Hex(h: string) {
        let buf = Buffer.from(h, 'hex');
        this.Red = buf.readUInt8(0);
        this.Green = buf.readUInt8(1);
        this.Blue = buf.readUInt8(2);
    }

    public ToHex(): string {
        return this.Hex;
    }
}


export { PTCCOLFile, PTCColor };
