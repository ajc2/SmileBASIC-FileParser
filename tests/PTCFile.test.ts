import * as fs from "fs";
import * as path from "path";
import { PTCFile } from "../src/PTCFile";

test("instantiate PTCFile", () => {
    let file = new PTCFile();
    expect(file).toBeInstanceOf(PTCFile);
});

test("PTCFile round trip", async () => {
    let buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/BEFUNGE.PTC"),{encoding:null});
    let file = await PTCFile.FromBuffer(buf);
    let buf2 = await file.ToBuffer();
    // write the output file for inspection
    fs.writeFileSync(path.join(__dirname, "ptc_binaries/out/round_out.PTC"), buf2, {encoding:null});
    expect(buf.compare(buf2)).toBe(0);
});
