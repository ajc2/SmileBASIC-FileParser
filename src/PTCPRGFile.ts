import { PTCFile } from "./PTCFile";
import { PTCFileType } from "./PTCFileType";

class PTCPRGFile extends PTCFile {
    public Content: string;

    public Length: number;

    public PackagedFiles: Map<PTCPackageBits, typeof PTCFile>;


    public constructor() {
        super();
        this.Length = 0;
        this.Content = "";
        this.PackagedFiles = new Map();
    }
}


export { PTCPRGFile };
