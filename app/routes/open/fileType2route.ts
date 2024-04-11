import { FileType } from "config/FileType";
import json from "config/ft2route.json";

export function map() {
    const map = new Map<FileType,string>(Object.entries(json).map((kv=>{
        //@ts-expect-error
        const k = FileType[kv[0]];
        const v = kv[1];
        return [k,v]
    })));
    return map;
}