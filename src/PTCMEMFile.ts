import { PTCFile } from "./PTCFile";
import { PTCFileType } from "./PTCFileType";

class PTCMEMFile extends PTCFile {
    private _content: string = "";


    public constructor() {
        super();
        this.Content = "";
        this.Type = PTCFileType.MEM;
    }

    
    public static async FromFile(file: PTCFile) {
        if(file.Type !== PTCFileType.MEM) {
            throw new Error("Not a MEM file");
        }
        
        let self = new PTCMEMFile();
        self.Header = file.Header;
        self.RawContent = file.RawContent;

        let len = self.RawContent.readUInt32LE(512) * 2;
        let tmp = "";
        for(let c = 0; c < 512; c+=2) {
            let chr = self.RawContent.readUInt16LE(c);
            if(c >= len) {
                if(chr === 0)
                    continue;
                else
                    throw new Error(`Encoded string is too long (expected ${len/2} chars)`);
            }
            if(PTCMEMFile.TABLE.has(chr)) {
                tmp += String.fromCharCode(PTCMEMFile.TABLE.get(chr)!!);
            }
            else {
                throw new Error(`Encoded string contains invalid character (${chr} at ${c/2})`);
            }
        }

        self.Content = tmp;
        return self;
    }

    public static async FromBuffer(buffer: Buffer, verify: boolean = false): Promise<PTCMEMFile> {
        let file = await super.FromBuffer(buffer, verify);

        return this.FromFile(file);
    }

    public async ToBuffer(sdHeader: boolean = true): Promise<Buffer> {
        let out = Buffer.alloc(516);
        out.writeUInt32LE(this._content.length, 512);
        for(let i = 0; i < this._content.length; i++) {
            let chr = this._content.charCodeAt(i);
            if(chr < 0 || chr > 255) {
                throw new Error(`String contains illegal char (codepoint ${chr} at ${i})`);
            }
            else {
                out.writeUInt16LE(PTCMEMFile.TABLEINV.get(chr)!!, i*2);
            }
        }

        this.RawContent = out;
        return super.ToBuffer(sdHeader);
    }


    public get Content(): string {
        return this._content;
    }

    public set Content(s: string) {
        if(s.length > 256) {
            throw new Error(`String too long (${s.length})`);
        }
        this._content = s;
    }
    
    /**
     * I hate this. I hate everything about this.
     */
    public static readonly TABLE = new Map<number, number>([
        [0,0],[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8],[9,9],[10,10],[11,11],[12,12],[13,13],[14,14],[15,15],
        [16,16],[17,17],[18,18],[19,19],[20,20],[21,21],[22,22],[23,23],[24,24],[25,25],[26,26],[27,27],[28,28],[29,29],[30,30],[31,31],
        [32,32],[65281,33],[8221,34],[65283,35],[65284,36],[65285,37],[65286,38],[8217,39],[65288,40],[65289,41],[65290,42],[65291,43],[65292,44],[65293,45],[65294,46],[65295,47],
        [65296,48],[65297,49],[65298,50],[65299,51],[65300,52],[65301,53],[65302,54],[65303,55],[65304,56],[65305,57],[65306,58],[65307,59],[65308,60],[65309,61],[65310,62],[65311,63],
        [65312,64],[65313,65],[65314,66],[65315,67],[65316,68],[65317,69],[65318,70],[65319,71],[65320,72],[65321,73],[65322,74],[65323,75],[65324,76],[65325,77],[65326,78],[65327,79],
        [65328,80],[65329,81],[65330,82],[65331,83],[65332,84],[65333,85],[65334,86],[65335,87],[65336,88],[65337,89],[65338,90],[65339,91],[65509,92],[65341,93],[65342,94],[65343,95],
        [65344,96],[65345,97],[65346,98],[65347,99],[65348,100],[65349,101],[65350,102],[65351,103],[65352,104],[65353,105],[65354,106],[65355,107],[65356,108],[65357,109],[65358,110],[65359,111],
        [65360,112],[65361,113],[65362,114],[65363,115],[65364,116],[65365,117],[65366,118],[65367,119],[65368,120],[65369,121],[65370,122],[65371,123],[65372,124],[65373,125],[65374,126],[65375,127],
        [128,128],[129,129],[130,130],[131,131],[132,132],[133,133],[134,134],[135,135],[136,136],[137,137],[138,138],[139,139],[140,140],[141,141],[142,142],[143,143],
        [144,144],[145,145],[146,146],[147,147],[148,148],[149,149],[150,150],[151,151],[152,152],[153,153],[154,154],[155,155],[156,156],[157,157],[158,158],[159,159],
        [160,160],[12290,161],[12300,162],[12301,163],[12289,164],[12539,165],[12530,166],[12449,167],[12451,168],[12453,169],[12455,170],[12457,171],[12515,172],[12517,173],[12519,174],[12483,175],
        [65392,176],[12450,177],[12452,178],[12454,179],[12456,180],[12458,181],[12459,182],[12461,183],[12463,184],[12465,185],[12467,186],[12469,187],[12471,188],[12473,189],[12475,190],[12477,191],
        [12479,192],[12481,193],[12484,194],[12486,195],[12488,196],[12490,197],[12491,198],[12492,199],[12493,200],[12494,201],[12495,202],[12498,203],[12501,204],[12504,205],[12507,206],[12510,207],
        [12511,208],[12512,209],[12513,210],[12514,211],[12516,212],[12518,213],[12520,214],[12521,215],[12522,216],[12523,217],[12524,218],[12525,219],[12527,220],[12531,221],[12443,222],[12444,223],
        [224,224],[225,225],[226,226],[227,227],[228,228],[229,229],[230,230],[231,231],[232,232],[233,233],[234,234],[235,235],[236,236],[237,237],[238,238],[239,239],
        [240,240],[241,241],[242,242],[243,243],[244,244],[245,245],[246,246],[247,247],[248,248],[249,249],[250,250],[251,251],[252,252],[253,253],[254,254],[255,255]
    ]);

    public static readonly TABLEINV = new Map<number, number>(
        Array.from(PTCMEMFile.TABLE.entries()).map(v=>[v[1],v[0]])
    );
}


// handle casting

declare module "./PTCFile" {
    interface PTCFile {
        AsMEMFile(): Promise<PTCMEMFile>
    }
}

PTCFile.prototype["AsMEMFile"] = async function() {
    return await PTCMEMFile.FromFile(this);
};

PTCFile.FileTypeMappings.set(PTCFileType.MEM, PTCMEMFile);


export { PTCMEMFile };
