import * as fs from "fs";
import * as path from "path";
import * as canvas from "canvas";
import { PTCMEMFile } from "../src/PTCMEMFile";

test("instantiate PTCMEMFile", () => {
    let file = new PTCMEMFile();
    expect(file).toBeInstanceOf(PTCMEMFile);
});

test("PTCMEMFile round trip", async () => {
    let buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/TESTMEM.PTC"),{encoding:null});
    let file = await PTCMEMFile.FromBuffer(buf);
    let buf2 = await file.ToBuffer();
    // write the output file for inspection
    fs.writeFileSync(path.join(__dirname, "ptc_binaries/out/mem_out.PTC"), buf2, {encoding:null});
    expect(buf.compare(buf2)).toBe(0);
});

test("PTC character table round trip", () => {
    for(let i = 0; i < 256; i++) {
        expect(PTCMEMFile.TABLE.get(PTCMEMFile.TABLEINV.get(i)!!)!!).toBe(i);
    }
});

test("PTCMEMFile decode test", async () => {
    let buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/TESTMEM.PTC"),{encoding:null});
    let file = await PTCMEMFile.FromBuffer(buf);

    let expected = "";
    for(let i = 0; i < 256; i++) {
        expected += String.fromCharCode(i);
    }

    expect(file.Content).toBe(expected);
});
