import * as fs from "fs";
import * as path from "path";
import * as canvas from "canvas";
import { PTCCOLFile, PTCColor } from "../src/PTCCOLFile";
import { PTCGRPFile } from "../src/PTCGRPFile";

test("instantiate PTCGRPFile", () => {
    let file = new PTCGRPFile();
    expect(file).toBeInstanceOf(PTCGRPFile);
});

test("PTCGRPFile round trip", async () => {
    let buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/TESTGRP.PTC"),{encoding:null});
    let file = await PTCGRPFile.FromBuffer(buf);
    let buf2 = await file.ToBuffer();
    // write the output file for inspection
    fs.writeFileSync(path.join(__dirname, "ptc_binaries/out/grp_out.PTC"), buf2, {encoding:null});
    expect(buf.compare(buf2)).toBe(0);
});

test("PTCGRPFile visual inspection", async () => {
    // load palette file
    let buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/DEFCOL.PTC"),{encoding:null});
    let pal = await PTCCOLFile.FromBuffer(buf);
    buf = fs.readFileSync(path.join(__dirname, "ptc_binaries/TESTGRP.PTC"),{encoding:null});
    let grp = await PTCGRPFile.FromBuffer(buf);

    // render character bank
    let canv = canvas.createCanvas(256, 192);
    let ctx = canv.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,256,192);
    for(let y = 0; y < 192; y++) {
        for(let x = 0; x < 256; x++) {
            ctx.fillStyle = "#"+pal.Colors[grp.Get2D(x, y)].Hex;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    // output image
    let p = path.join(__dirname, "ptc_binaries/out/grp.png");
    let png = fs.writeFileSync(p, Buffer.from(canv.toDataURL().slice(21), 'base64'));
    console.log(`A GRP image has been written to ${p}. Please inspect it.`);
});
