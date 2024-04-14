import { LoaderFunctionArgs, json } from "@remix-run/node";
import path from "path";
import fs from "fs";
import { getMetadata } from "./functions";
import { FileType } from "config/FileType";
export async function loader({ request }: LoaderFunctionArgs) {
    //move metadata load to /api route
    const url = new URL(request.url);
    const _type = url.searchParams.get("type")
    if(!_type) throw new Error("?type not specified");
    const type = Number.parseInt(_type) as FileType;
    const encoded_path = url.searchParams.get("path");
    if(!encoded_path) throw new Error("?path not specified");
    const decoded_path = decodeURIComponent(encoded_path);
    const _t = decoded_path.split("/").pop()!;
    const file_directory = decoded_path.slice(0, -(_t.length + 1));
    const ext = _t.split(".").pop()!
    const name = _t.slice(0, -(ext.length + 1));
    const abs_path = path.join(process.env["DATA_DIR"]!, file_directory, `${name}.${ext}`);
    try {
        const s = await fs.promises.stat(abs_path);
    } catch (err) {
        console.error(err);
        throw new Error("Source file error [ENOENT/EACCESS]");
    }
    /*  */
    switch(type){
        case FileType.video:{
            try{
                const metadata = await getMetadata(abs_path);
                return json(metadata);
            } catch(err) {
                throw new Error("Error getting video metadata [FFPROBE?]");
            }
            break;
        }
        default: {
            return new Response("Server can't provide metadata for chosen filetype",{status:400});
        }
    }
}