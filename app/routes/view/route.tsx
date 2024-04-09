import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect, redirectDocument } from "@remix-run/node";
import { Link, useFetcher, useHref, useLoaderData, useLocation, useMatches, useRouteLoaderData, useSearchParams } from "@remix-run/react"
import { createContext, useContext, useEffect, useState } from "react";

import path from "path";
import fs from "fs";
import { FileType } from "config/FileType";

type File = {
    type: FileType,
    name: string,
    path: string
};

const folder = process.env["DATA_FOLDER"] ? path.resolve(process.env["DATA_FOLDER"]) : path.resolve(process.argv[1].split('/').slice(0, -1).join("/"));
export async function action({ request }: ActionFunctionArgs) {
    let _path = new URL(request.url).searchParams.has("path") ? new URL(request.url).searchParams.get("path")! : '/';
    if (path.join(folder, _path).length < folder.length) _path = "/";
    const currentDirectoryPath = path.join(folder, _path);
    try {
        const stat = await fs.promises.stat(currentDirectoryPath);
        // if(stat.isDirectory())
    } catch (err) {
    }
    return redirectDocument("/file?path=" + _path);
}
export async function loader({ params, request }: LoaderFunctionArgs) {
    let _path = new URL(request.url).searchParams.has("path") ? new URL(request.url).searchParams.get("path")! : '/';
    if (path.join(folder, _path).length < folder.length) _path = "/";
    const currentDirectoryPath = path.join(folder, _path);
    if (!folder) return json([]);
    /*  */
    let fileTypes: Map<string, FileType>;
    try {

        const _ft = await fs.promises.readFile("./config/filetypes.json", "utf8");
        const ft = Object.entries(JSON.parse(_ft)).map((_p) => {
            const key = _p[0] as string;
            const val = _p[1] as string;
            //@ts-expect-error
            const p: [string, FileType] = [key, FileType[val]];
            return p;
        });
        fileTypes = new Map<string, FileType>(ft ? ft : []);
    } catch (err) {
        fileTypes = new Map<string, FileType>([]);
    }
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
    } else return redirect("/file?path=" + _path);
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
    useEffect(() => {
        console.log(files);
    }, [files])
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
    const fetcher = useFetcher();
    return (
        <div className="flex flex-col w-full h-full p-2 rounded-md bg-white/5 text-white divide-y-2">
            <div className="text-xl">Files:</div>
            <ul className="text-lg flex flex-col gap-1 overflow-y-scroll h-full pr-2">
                {!root && <FileListRow file={{ name: "..", path: "..", type: FileType.folder }} onClick={() => {
                    setSearchParams(_prev => {
                        _prev.set("path", _prev.get("path")!.split("/").slice(0, -1).join("/"));
                        return _prev;
                    })
                }} />}
                {files.map((file, i) => {
                    return <li key={file.name} className="">
                        <FileListRow file={file} onClick={(() => {
                            if (file.type == FileType.folder) return () => {
                                setSearchParams(_prev => {
                                    if (!_prev.has("path")) _prev.set("path", "");
                                    _prev.set("path", _prev.get("path")!.split("/").concat(file.name).join("/"));
                                    return _prev;
                                });
                            };
                            return () => {
                                const newSP = searchParams.get("path")!.split("/").concat(file.name).join("/");
                                fetcher.submit("", { method: "POST", action: `${pathname}?path=${newSP}` });
                            }
                        })()}
                            download={file.type !== FileType.folder}
                            view={file.type == FileType.audio || file.type == FileType.video} />
                    </li>
                })}
            </ul>
        </div>
    )
}


function FileListRow({ file, onClick: handleClick, download, view }: { file: File, download?: boolean, view?: boolean, onClick?: () => void }) {
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
                {view && <Link to={""} className="px-4 py-1 text-white/50 hover:text-white/100 transition-all">View</Link>}
                {download && <Link to={""} className="px-4 py-1 text-white/50 hover:text-white/100 transition-all">Download</Link>}
            </div>
        </div>
    )
}