import * as fs from "fs";
import * as path from "path";
import * as canvas from "canvas";
import { PTCCOLFile, PTCColor } from "../src/PTCCOLFile";
import { PTCCHRFile } from "../src/PTCCHRFile";

test("instantiate PTCCHRFile", () => {
    let file = new PTCCHRFile();
    expect(file).toBeInstanceOf(PTCCHRFile);
});

test("PTCCHRFile round trip", async () => {
    let buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/SLKFNBG0.PTC"),{encoding:null});
    let file = await PTCCHRFile.FromBuffer(buf);
    let buf2 = await file.ToBuffer();
    // write the output file for inspection
    fs.writeFileSync(path.join(__dirname, "ptc_binaries/out/chr_out.PTC"), buf2, {encoding:null});
    expect(buf.compare(buf2)).toBe(0);
});

test("PTCCHRFile visual inspection", async () => {
    // load palette file
    let buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/DEFCOL.PTC"),{encoding:null});
    let pal = await PTCCOLFile.FromBuffer(buf);
    buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/TESTCHR.PTC"),{encoding:null});
    let chr = await PTCCHRFile.FromBuffer(buf);

    viewchr(chr, pal, path.join(__dirname, "ptc_binaries/out/chr.png"));
});

function viewchr(chr: PTCCHRFile, pal: PTCCOLFile, out: string) {
    // render character bank
    let canv = canvas.createCanvas(256, 32);
    let ctx = canv.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,256,256);
    for(let c = 0; c < 256; c++) {
        let char = chr.CharacterWithPalette(c, pal, 0);
        let drawx, drawy;
        drawx = c%32*8;
        drawy = Math.floor(c/32)*8;
        for(let y = 0; y < 8; y++) {
            for(let x = 0; x < 8; x++) {
                ctx.fillStyle = "#"+char[y*8+x].Hex;
                ctx.fillRect(drawx+x,drawy+y,1,1);
            }
        }
    }

    // output image
    let png = fs.writeFileSync(out, Buffer.from(canv.toDataURL().slice(21), 'base64'));
    console.log(`A CHR bank image has been written to ${out}. Please inspect it.`);
}
