import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Link, MetaFunction, Outlet, useRouteError } from "@remix-run/react";
import fs from "fs";
import path from "path";
import { FileType } from "config/FileType";
import { map as ft2route} from "./fileType2route";
import { map as getFileTypes } from "config/FileType";
export function action(){
    
}
export async function loader({request}:LoaderFunctionArgs){
    const url = new URL(request.url);
    const pathname = url.pathname.split("/").filter(v=>v.length>0).join("/");
    if(pathname.split("/").length > 1) return null;
    const sp = url.searchParams;
    if(!sp.has("path") || sp.get("path")!.length==0) return redirect("/view",{status:300});
    const base64_path = sp.get("path")!;
    const decoded_path = decodeURIComponent(base64_path);
    console.log("Path:\n",decoded_path);
    let stat:fs.Stats;
    const filepath = `${path.join(process.env["DATA_DIR"]!,decoded_path)}`;
    try {
        stat = await fs.promises.stat(filepath);
        console.log("FS STAT OK");
    } catch(err){
        console.error("FS STAT Error");
        if (err && !!(err as Error & { code: string }).code) {
            switch ((err as Error & { code: string }).code) {
                case "ENOENT": {
                    throw new Error("File does not exsist: "+decoded_path);
                }
                default:{
                    throw err;
                }
            }
        } else throw new Error("Unknown Filesystem error");
    }
    if(stat.isDirectory()) return redirect(`/view?path=${encodeURIComponent(decoded_path)}`,{status:300});
    const filename = decoded_path.split("/").pop()!;
    const extension = filename.split(".").pop()!;
    /*  */
    const fileTypes = await getFileTypes();
    if(!fileTypes.has(extension)) throw new Error("Unknown file extension");
    const fileType = fileTypes.get(extension)!;
    const route = ft2route().get(fileType);
    if(!route) throw new Error("File preview unsupported, download instead");
    return redirect(`${route}?path=${encodeURIComponent(decoded_path)}`,303);
}

export const meta: MetaFunction = () => {
    return [
        { title: "Preview" },
        { name: "description", content: "Preview file" },
    ];
};


export default function Route(){
    return (
        <div className="w-full h-full bg-black text-white flex flex-col font-mono p-2 divide-y">
            <nav className="text-xl flex flex-row justify-between items-center">
                <div>#/open</div>
                <Link to="/view" className="hover:underline text-white/50 hover:text-white">back to /view</Link>
            </nav>
            <main className="w-full h-full">
                <Outlet />
            </main>
        </div>
    )
}

export function ErrorBoundary() {
    const error= useRouteError() as Error;
    return (
          <div className="flex flex-col gap-2 items-center justify-center w-full h-full">
            <div className="text-red-500 text-3xl font-semibold">{error.message}</div>
            <Link to="/" className="text-xl hover:underline">Return to index</Link>
          </div>
    );
  }