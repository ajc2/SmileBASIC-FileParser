// -*- coding: utf-8

enum PTCFileType {
    PRG = "0300RPRG",
    CHR = "0100RCHR",
    COL = "0100RCOL",
    MEM = "0200RMEM",
    GRP = "0100RGRP",
    SCR = "0100RSCR"
}

function typeEnumToString(en: PTCFileType): string {
    switch(en) {
        case PTCFileType.PRG:
            return "0300RPRG";
        case PTCFileType.CHR:
            return "0100RCHR";
        case PTCFileType.COL:
            return "0100RCHR";
        case PTCFileType.MEM:
            return "0200RMEM";
        case PTCFileType.GRP:
            return "0100RGRP";
        case PTCFileType.SCR:
            return "0100RSCR";
    }
}

function typeStringToEnum(st: string): PTCFileType | null {
    switch(st) {
        case "0300RPRG":
            return PTCFileType.PRG;
        case "0100RCHR":;
            return PTCFileType.CHR;
        case "0100RCOL":
            return PTCFileType.COL;
        case "0200RMEM":
            return PTCFileType.MEM;
        case "0100RGRP":
            return PTCFileType.GRP;
        case "0100RSCR":
            return PTCFileType.SCR;
        default:
            return null;
    }       
}

export { PTCFileType, typeEnumToString, typeStringToEnum };
