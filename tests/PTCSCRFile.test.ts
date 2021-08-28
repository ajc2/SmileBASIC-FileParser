import * as fs from "fs";
import * as path from "path";
import * as canvas from "canvas";
import { PTCCOLFile, PTCColor } from "../src/PTCCOLFile";
import { PTCSCRFile, PTCTile } from "../src/PTCSCRFile";
import { PTCCHRFile } from "../src/PTCCHRFile";

test("instantiate PTCSCRFile", () => {
    let file = new PTCSCRFile();
    expect(file).toBeInstanceOf(PTCSCRFile);
});

test("PTCSCRFile round trip", async () => {
    let buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/TESTSCR.PTC"),{encoding:null});
    let file = await PTCSCRFile.FromBuffer(buf);
    let buf2 = await file.ToBuffer();
    // write the output file for inspection
    fs.writeFileSync(path.join(__dirname, "ptc_binaries/out/scr_out.PTC"), buf2, {encoding:null});
    expect(buf.compare(buf2)).toBe(0);
});

test("PTCSCRFile visual inspection", async () => {
    // load palette file
    let buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/DEFCOL.PTC"),{encoding:null});
    let pal = await PTCCOLFile.FromBuffer(buf);
    buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/TESTSCR.PTC"),{encoding:null});
    let scr = await PTCSCRFile.FromBuffer(buf);
    buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/TESTCHR.PTC"),{encoding:null});
    let chr = await PTCCHRFile.FromBuffer(buf);

    // render character bank
    let canv = canvas.createCanvas(512,512);
    let ctx = canv.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,512,512);
    for(let y = 0; y < 64; y++) {
        for(let x = 0; x < 64; x++) {
            let tile = scr.Get2D(x,y)
            let char = chr.CharacterWithPalette(tile.Character, pal, tile.Palette);
            let drawx, drawy;
            drawx = x*8;
            drawy = y*8;
            for(let y = 0; y < 8; y++) {
                for(let x = 0; x < 8; x++) {
                    ctx.fillStyle = "#"+char[y*8+x].Hex;
                    ctx.fillRect(drawx+x,drawy+y,1,1);
                }
            }
        }
    }

    // output image
    let p = path.join(__dirname, "ptc_binaries/out/scr.png");
    let png = fs.writeFileSync(p, Buffer.from(canv.toDataURL().slice(21), 'base64'));
    console.log(`A SCR image has been written to ${p}. Please inspect it.`);
});
