import * as fs from "fs";
import * as path from "path";
import { PTCSDHeader } from "../src/PTCSDHeader";

test("instantiate PTCSDHeader", () => {
    let head = new PTCSDHeader();
    expect(head).toBeInstanceOf(PTCSDHeader);
});

test("PTCSDHeader round trip", async () => {
    let buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/BEFUNGE.PTC"),{encoding:null})
        .subarray(0, 36);
    let file = await PTCSDHeader.FromBuffer(buf);
    let buf2 = await file.ToBuffer();
    expect(buf.compare(buf2)).toBe(0);
});
