import { useSearchParams } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

export function loader() {
    return null;
}
export default function Route() {
    const [searchParams, setSearchParams] = useSearchParams();
    const divRef = useRef<HTMLDivElement>(null);
    const [imgH,setImgH] = useState(0);
    const path = decodeURI(searchParams.get("path")!);
    useEffect(()=>{
        if(!divRef.current) return;
        setImgH(divRef.current.getBoundingClientRect().height-16);
    },[divRef])
    return (
        <div className="h-full w-full flex p-2 overflow-hidden" ref={divRef}>
            <img src={`/download?path=${encodeURIComponent(path)}`} alt="" className="w-full object-contain" style={{height:imgH+"px"}}/>
        </div>
    )
}