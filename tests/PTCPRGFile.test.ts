import * as fs from "fs";
import * as path from "path";
import { PTCPackageBits, PTCPackageTypes } from "../src/PTCPackageBits";
import { PTCFileType } from "../src/PTCFileType";
import { PTCPRGFile } from "../src/PTCPRGFile";

test("instantiate PTCPRGFile", () => {
    let file = new PTCPRGFile();
    expect(file).toBeInstanceOf(PTCPRGFile);
});

test("PTCPRGFile round trip", async () => {
    let buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/GOAT.PTC"),{encoding:null});
    let file = await PTCPRGFile.FromBuffer(buf);
    let buf2 = await file.ToBuffer();
    // write the output file for inspection
    fs.writeFileSync(path.join(__dirname, "ptc_binaries/out/prg_out.PTC"), buf2, {encoding:null});
    expect(buf.compare(buf2)).toBe(0);
});

test("PTCPRGFile content decoding", async () => {
    let buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/GOAT.PTC"),{encoding:null});
    let file = await PTCPRGFile.FromBuffer(buf);
    expect(file.Content).toBe("'GOAT\r");
});

test("PTCPRGFile package test", async () => {
    let buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/BIGPKG.PTC"),{encoding:null});
    let file = await PTCPRGFile.FromBuffer(buf);
});
