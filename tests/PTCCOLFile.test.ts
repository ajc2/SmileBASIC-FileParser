import * as fs from "fs";
import * as path from "path";
import * as canvas from "canvas";
import { PTCCOLFile, PTCColor } from "../src/PTCCOLFile";

test("instantiate PTCCOLFile", () => {
    let file = new PTCCOLFile();
    expect(file).toBeInstanceOf(PTCCOLFile);
});

test("instantiate PTCColor", () => {
    let color = new PTCColor(0,0,0);
    expect(color).toBeInstanceOf(PTCColor);
});

test("PTCColor raw round trip", () => {
    const goat = Math.floor(Math.random() * 65536);
    let color = PTCColor.FromRaw(goat);
    expect(color.Raw).toBe(goat);
});

test("PTCCOLFile round trip", async () => {
    let buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/DEFCOL.PTC"),{encoding:null});
    let file = await PTCCOLFile.FromBuffer(buf);
    let buf2 = await file.ToBuffer();
    // write the output file for inspection
    fs.writeFileSync(path.join(__dirname, "ptc_binaries/out/col_out.PTC"), buf2, {encoding:null});
    expect(buf.compare(buf2)).toBe(0);
});

test("PTCCOLFile palette visual inspection", async () => {
    // load palette file
    let buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/DEFCOL.PTC"),{encoding:null});
    let file = await PTCCOLFile.FromBuffer(buf);

    // render palette
    let canv = canvas.createCanvas(256, 256);
    let ctx = canv.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,256,256);
    for(let y = 0; y < 16; y++) {
        for(let x = 0; x < 16; x++) {
            ctx.fillStyle = '#'+file.Colors[y*16+x].Hex;
            ctx.fillRect(x*16,y*16,16,16);
        }
    }

    // output image
    let p = path.join(__dirname, "ptc_binaries/out/palette.png");
    let png = fs.writeFileSync(p, Buffer.from(canv.toDataURL().slice(21), 'base64'));
    console.log(`A palette image has been written to ${p}. Please inspect it.`);
});
