import json from "config/filetypes.json";
export enum FileType {
    app,
    archive,
    audio,
    folder,
    image,
    install,
    lib,
    other,
    text,
    video,
}

export async function map(){
    const fileTypeEntries = Object.entries(json).map((_p) => {
        const key = _p[0] as string;
        const val = _p[1] as string;
        //@ts-expect-error
        const p: [string, FileType] = [key, FileType[val]];
        return p;
    })
    const fileTypes = new Map<string,FileType>(fileTypeEntries);
    return fileTypes;
}