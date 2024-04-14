import { useRouteError, useSearchParams } from "@remix-run/react";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { FFProbeFormat } from "../api.file.metadata/functions";
import { FileType } from "config/FileType";

export default function Route() {
    const [sp] = useSearchParams();
    const _path = sp.get("path")!;
    // Player height
    const [videoH, setVH] = useState(100);
    {
        useEffect(() => {
            setVH(window.innerHeight * 0.7);
        }, []);
    }
    // HLS
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playlistAvailiable, setPA] = useState(false);
    {
        const filename = _path.split("/").pop()!;
        useEffect(() => {
            const videoEl = videoRef.current;
            if (!videoEl) return;
            //maybe create /hls and /api/hls/* routes for everything streaming related
            const playlistSrc = `/file?path=/hls/${filename}/playlist.m3u8`;
            (async () => {
                const resp = await fetch(playlistSrc);
                if (!resp.ok) { return setPA(false) }
                const hls = new Hls();
                hls.loadSource(playlistSrc)
                setPA(true);
                hls.attachMedia(videoEl);
            })()
        }, [videoRef]);
    }
    /*  */
    return (
        <div className="flex flex-col">
            <figure className="w-full h-full">
                <div className={`w-full border flex items-center justify-center ${playlistAvailiable ? "hidden" : ""}`} style={{ height: `${videoH}px` }}>Streaming not available</div>
                <video ref={videoRef} controls className={`object-contain w-full ${!playlistAvailiable ? "hidden" : ""}`} style={{ height: `${videoH}px` }}>
                    {/* <source src={`/file?path=${_path}`} type="application/mp4" /> */}
                    <a href={`/download?path=${_path}`}>Download original</a>
                </video>
                <figcaption>
                    {_path}
                </figcaption>
            </figure>
            <Metadata file_path={`${_path}`} extra_data={[
                ["Playlist available ?", `${JSON.stringify(playlistAvailiable)}`],
                ["Generating chunks ?", `${JSON.stringify(false)}`],
            ]} />
        </div>
    )
}

export function ErrorBoundary() {
    const error = useRouteError() as Error;
    return (
        <div className="flex flex-col gap-2 items-center justify-center w-full h-full">
            <div className="text-red-500 text-3xl font-semibold">{error.message}</div>
        </div>
    );
}

function Table({ entries }: { entries: [string, string][] }) {
    return (
        <ul className="flex flex-wrap border h-full">
            {entries.map(entry => {
                return (<li className="flex justify-between w-full sm:w-1/2 border p-2 items-center justify-center">
                    <div>{entry[0]}</div>
                    <div>{entry[1]}</div>
                </li>)
            })}
        </ul>
    )
}

function Metadata({file_path,extra_data}:{file_path:string,extra_data:[string,string][]}){
    // Metadata
    const [metadata, setMetadata] = useState<{ format: FFProbeFormat } | null>(null);
    useEffect(() => {
        (async () => {
            const req = await fetch("/api/file/metadata?type="+FileType.video+"&path=" + file_path);
            if (!req.ok) return setMetadata(null);
            const json = await req.json() as { format: FFProbeFormat };
            setMetadata(json);
        })()
    }, []);
    return metadata ? <Table entries={[
            ["Duration", `${(metadata.format.duration).toFixed(2)}s`],
            ["Size", `${(metadata.format.size / 1000000).toFixed(2)}MB`],
            ["Bitrate", `${(metadata.format.bit_rate / 1000).toFixed(2)}kbit`],
            ["Format", `${metadata.format.format_long_name}`],
            ...extra_data
        ]}/> : null;
}
