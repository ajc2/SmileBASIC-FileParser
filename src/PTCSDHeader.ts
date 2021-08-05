class PTCSDHeader {
    /**
     * The size of the contents following this header, in bytes. 4 bytes.
     */
    FileSize: number;
    
    /**
     * Internal filename. 8 bytes, ASCII, [A-Z0-9]{0,8}
     */
    FileName: string;

    /**
     * I don't know what these are for yet. 4 bytes.
     * This could be part of file size, but 8 bytes for file size seems pretty large for PTC.
     */
    MysteryBytes: Buffer;

    /**
     * MD5 hash of "PETITCOM" + raw file contents.
     */
    Hash: Buffer;

    /**
     * Indicates if the hash has been validated.
     */
    HashValid: boolean | null;

    
    public constructor() {
        this.FileName = "";
        this.MysteryBytes = Buffer.alloc(4);
        this.Hash = Buffer.allocUnsafe(16);
        this.HashValid = null;
        this.FileSize = 0;
    }

    public static FromBuffer(buffer: Buffer): PTCSDHeader {
        let header = new PTCSDHeader();

        // verify file magic
        let magic = buffer.toString('latin1', 0, 4);
        if(magic !== "PX01") {
            throw new Error("Buffer does not contain a SD File or SD Header");
        }

        // get file size
        header.FileSize = buffer.readUInt32LE(4);

        // get the mystery bytes
        buffer.copy(header.MysteryBytes, 0, 8, 12);

        // get the file name
        header.FileName = buffer.toString('latin1', 12, 20);

        // get the MD5 hash
        buffer.copy(header.Hash, 0, 20, 36);

        return header;
    }

    public ToBuffer(): Buffer {
        let buffer = Buffer.allocUnsafe(36);
        buffer.write("PX01", 0, 4, 'latin1');
        buffer.writeUInt32LE(this.FileSize, 4);
        this.MysteryBytes.copy(buffer, 8);
        buffer.write(this.FileName, 12, 8, 'latin1');
        this.Hash.copy(buffer, 20);
        return buffer;
    }
}


export { PTCSDHeader };
