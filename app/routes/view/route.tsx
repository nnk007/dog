import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect, redirectDocument } from "@remix-run/node";
import { Link, useFetcher, useHref, useLoaderData, useLocation, useMatches, useNavigate, useRouteLoaderData, useSearchParams } from "@remix-run/react"
import { createContext, useContext, useEffect, useState } from "react";

import path from "path";
import fs from "fs";
import { FileType, map as getfileTypes } from "config/FileType";

type File = {
    type: FileType,
    name: string,
    path: string
};

export async function action({ request }: ActionFunctionArgs) {
    let _path = new URL(request.url).searchParams.has("path") ? new URL(request.url).searchParams.get("path")! : '/';
    const folder = path.resolve(process.env["DATA_DIR"]!);
    if (path.join(folder, _path).length < folder.length) _path = "/";
    const currentDirectoryPath = path.join(folder, _path);
    try {
        const stat = await fs.promises.stat(currentDirectoryPath);
        // if(stat.isDirectory())
            return redirectDocument("/file?path=" + _path);
    } catch (err) {
    }
}
export async function loader({ params, request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const sp = url.searchParams;
    if(!sp.has("path")) return redirect("/view?path=");
    let base64_path = sp.get("path")!
    let decoded_path = decodeURIComponent(base64_path);
    const folder = path.resolve(process.env["DATA_DIR"]!);
    if (path.join(folder, decoded_path).length < folder.length) decoded_path = "/";
    const currentDirectoryPath = path.join(folder, decoded_path);
    console.log("CDP:",currentDirectoryPath);
    if (!folder) return json([]);
    /*  */
    const fileTypes = await getfileTypes();
    /*  */
    const stat = await fs.promises.stat(currentDirectoryPath)
    if (stat.isDirectory()) {
        const files = await fs.promises.readdir(currentDirectoryPath, { withFileTypes: true });
        const m = files.map(file => {
            const filePath =  path.resolve(file.path, file.name);
            const f: File = {
                name: file.name,
                path: filePath,
                type: FileType.other
            };
            if (file.isDirectory()) {
                f.type = FileType.folder
            } else {
                const extension = file.name.split('.').pop()!.toLowerCase();
                f.type = fileTypes.has(extension) ?
                    fileTypes.get(extension)! :
                    FileType.other
            }
            return f;
        })
        return json(m);
    } else return redirect("/file?path=" + encodeURIComponent(decoded_path));
}
interface IThemeContext {
    icons: Map<FileType,string>
}

const ThemeContext = createContext<IThemeContext>({icons:new Map()});
export default function View() {
    const files = useLoaderData<File[]>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [theme_ctx,setThemeCtx] = useState<IThemeContext>({icons:new Map()});
    useEffect(()=>{
        (async ()=>{
            const res = await fetch("/api/file_icons",{method:"get"});
            const _json = await res.json();
            const icons = new Map<FileType, string>(_json);
           setThemeCtx(_p=>{return {..._p,icons:icons}});
        })()
    },[])
    return (
        <div className="bg-black h-full w-full p-4 flex flex-col gap-2 font-mono">
            <nav></nav>
            <main className="h-full w-full flex">
                <ThemeContext.Provider value={theme_ctx}>
                <FileView files={files} root={!searchParams.has("path") || searchParams.get("path")?.length == 0} />
                </ThemeContext.Provider>
            </main>
        </div>
    )
}

function FileView({ files, root }: { files: File[], root: boolean }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    return (
        <div className="flex flex-col w-full h-full p-2 rounded-md bg-white/5 text-white divide-y-2">
            <div className="text-xl">Files:</div>
            <ul className="text-lg flex flex-col gap-1 overflow-y-scroll h-full pr-2">
                {!root && <FileListRow file={{ name: "..", path: "..", type: FileType.folder }} onClick={() => {
                    navigate("/view?path="+encodeURIComponent(decodeURIComponent(searchParams.get("path")!).split("/").slice(0, -1).join("/")))
                }} />}
                {files.map((file, i) => {
                    const newSP = decodeURIComponent(searchParams.get("path")!).split("/").concat(file.name).join("/");
                    //if folder update view
                    if (file.type == FileType.folder)
                        return <li key={file.name} className="">
                            <FileListRow file={file} onClick={() => {
                                navigate(`/view?path=${encodeURIComponent(newSP)}`);
                            }}/>
                        </li>
                    //else redirect to view
                    else
                        return <li key={file.name} className="">
                            <FileListRow file={file} onClick={() => {
                                navigate(`/open?path=${encodeURIComponent(newSP)}`);
                            }}
                                onDownload={() => {
                                    navigate(`/download?path=${encodeURIComponent(newSP)}`)
                                }}
                                onOpen={() => {
                                    navigate(`/open?path=${encodeURIComponent(newSP)}`);
                                }} />
                        </li>
                })}
            </ul>
        </div>
    )
}


function FileListRow({ file, onClick: handleClick, onDownload:handleDownload, onOpen:handleOpen }: { file: File, onDownload?: ()=>void, onOpen?: ()=>void, onClick?: () => void }) {
    const entries = useRouteLoaderData<string>("routes/api.file_icons/route");
    const [hover, setHover] = useState(false);
    const {icons} = useContext(ThemeContext);
    const icon = icons.has(file.type) ? icons.get(file.type) : "other.png";
    return (
        <div className="flex p-2 gap-2 items-center justify-between bg-black/50 rounded-md group select-none" onMouseOver={() => {
            setHover(true);
        }} onMouseLeave={() => {
            setHover(false);
        }}>
            <div className="grid grid-cols-[32px_auto] grid-rows-1 gap-2 items-center">
                <div className="w-[32px] h-[32px]">
                    {file.type == FileType.folder ?
                        <img src={!hover ? `/icons/folder.png` : `/icons/folder-alt.png`} alt="" className="w-full h-full object-contain" /> :
                        <img src={`/icons/${icon}`} alt={icon} className="w-full h-full object-contain" />}
                </div>
                <div className="break-words overflow-hidden text-ellipsis text-white/50 group-hover:text-white/100 transition-all duration-75 cursor-pointer"
                    onClick={() => {
                        if (document.body.clientWidth > 768) return;
                        handleClick();
                    }}
                    onDoubleClick={() => {
                        handleClick();
                    }}
                >{file.name}</div>
            </div>
            <div className="flex gap-2 items-center">
                {handleOpen && <div className="px-4 py-1 text-white/50 hover:text-white/100 transition-all" onClick={()=>{handleOpen()}}>Open</div>}
                {handleDownload && <div className="px-4 py-1 text-white/50 hover:text-white/100 transition-all" onClick={()=>{handleDownload()}}>Download</div>}
            </div>
        </div>
    )
}