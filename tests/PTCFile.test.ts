import * as fs from "fs";
import * as path from "path";
import { PTCFile } from "../src/PTCFile";

test("instantiate PTCFile", () => {
    let file = new PTCFile();
    expect(file).toBeInstanceOf(PTCFile);
});
