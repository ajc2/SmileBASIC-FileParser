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
    buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/SLKFNBG0.PTC"),{encoding:null});
    let chr = await PTCCHRFile.FromBuffer(buf);

    // render character bank
    let canv = canvas.createCanvas(256, 32);
    let ctx = canv.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,256,256);
    for(let c = 0; c < 256; c++) {
        let char = chr.CharacterWithPalette(c, pal, 0);
        let drawx, drawy;
        switch(c % 4) {
            case 0:
                drawx = Math.floor(c/4)*16;
                drawy = Math.floor(c/32)*16;
                break;
            case 1:
                drawx = Math.floor(c/4)*16+8;
                drawy = Math.floor(c/32)*16;
                break;
            case 2:
                drawx = Math.floor(c/4)*16;
                drawy = Math.floor(c/32)*16+8;
                break;
            case 3:
                drawx = Math.floor(c/4)*16+8;
                drawy = Math.floor(c/32)*16+8;
                break;
            default:
                drawx = 0;
                drawy = 0;
                break;
        }
        for(let y = 0; y < 8; y++) {
            for(let x = 0; x < 8; x++) {
                ctx.fillStyle = "#"+char[y*8+x].Hex;
                ctx.fillRect(drawx+x,drawy+y,1,1);
            }
        }
    }

    // output image
    let p = path.join(__dirname, "ptc_binaries/out/chr.png");
    let png = fs.writeFileSync(p, Buffer.from(canv.toDataURL().slice(21), 'base64'));
    console.log(`A CHR bank image has been written to ${p}. Please inspect it.`);
});
